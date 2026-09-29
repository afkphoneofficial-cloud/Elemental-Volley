import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { WebSocketServer } from "ws";

try {
  const raw = readFileSync(new URL("./.env", import.meta.url), "utf8");
  raw.split(/\n/).forEach((line) => {
    const row = line.trim();
    if (!row || row.startsWith("#")) return;
    const i = row.indexOf("=");
    if (i < 1) return;
    const k = row.slice(0, i).trim();
    const v = row.slice(i + 1).trim();
    if (k && !process.env[k]) process.env[k] = v;
  });
} catch (e) { /* optional .env */ }

const PORT = Number(process.env.PORT || 8787);
const MAX_LIVE = Math.max(1, Number(process.env.MAX_LIVE_MATCHES || 12));
const COOLDOWN_MS = Number(process.env.DECLINE_COOLDOWN_MS || 5 * 60 * 1000);
const OFFER_MS = Number(process.env.OFFER_MS || 30000);
const SKIP_COOLDOWN_MS = Number(process.env.SKIP_COOLDOWN_MS || 2 * 60 * 1000);
const TICK_MS = 40;
const FORFEIT_MS = Number(process.env.FORFEIT_MS || 30000);
const HOST_YIELD_MS = 900;
const REMATCH_MS = Number(process.env.REMATCH_MS || 15 * 60 * 1000);
const REPEAT_WINDOW_MS = Number(process.env.REPEAT_WINDOW_MS || 60 * 60 * 1000);
const REPEAT_MAX = Math.max(1, Number(process.env.REPEAT_MAX || 3));
const RECENT_N = Math.max(1, Number(process.env.RECENT_FOES || 3));
const STUCK_MS = Number(process.env.REMATCH_STUCK_MS || 90 * 1000);
const IP_STUCK_MS = Number(process.env.IP_STUCK_MS || 120 * 1000);
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || "";
const ORIGINS = String(process.env.ALLOWED_ORIGINS || "https://evolley.dev,https://www.evolley.dev")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const COURTS = ["summer", "rain", "spring", "winter"];

const clients = new Map();
const byUser = new Map();
const queue = [];
const offers = new Map();
const rooms = new Map();
const cooldownUntil = new Map();
const pendingEnd = new Map();
const lastOpp = new Map();
const recentOpp = new Map();
const pairHits = new Map();

function clampSkin(n) {
  n = n | 0;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}

function send(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function preview(p) {
  return {
    id: p.id,
    name: p.name,
    avatarId: p.avatar,
    fighter: p.fighter,
    mmr: p.mmr | 0,
    wins: p.wins | 0,
    mostUsed: p.mostUsed || p.fighter,
    skin: clampSkin(p.skin)
  };
}

function searchWindow(elapsedMs) {
  const steps = Math.floor(Math.max(0, elapsedMs) / 1800);
  return Math.min(720, 120 + steps * 80);
}

function liveCount() {
  let n = 0;
  for (const r of rooms.values()) {
    if (r.phase === "play" || r.phase === "luck") n += 1;
  }
  return n;
}

function pendingOfferCount() {
  return offers.size;
}

function canOpenMore() {
  return liveCount() + pendingOfferCount() < MAX_LIVE;
}

async function verifyToken(token) {
  if (!token || !SUPABASE_URL || !SUPABASE_ANON) return null;
  const res = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: "Bearer " + token
    }
  });
  if (!res.ok) return null;
  const user = await res.json();
  if (!user || !user.id) return null;
  return user;
}

function dropFromQueue(id) {
  const i = queue.findIndex((q) => q.id === id);
  if (i >= 0) queue.splice(i, 1);
}

function clearOffer(offerId) {
  const of = offers.get(offerId);
  if (!of) return;
  offers.delete(offerId);
  if (of.timer) clearTimeout(of.timer);
}

function requeue(p, silent) {
  if (!p || !p.ws || p.ws.readyState !== 1) return;
  p.state = "queue";
  p.offerId = null;
  p.roomId = null;
  p.waitAt = Date.now();
  dropFromQueue(p.id);
  queue.push(p);
  if (!silent) send(p.ws, { t: "searching" });
}

function applyCooldown(p, ms) {
  const wait = ms > 0 ? ms : COOLDOWN_MS;
  cooldownUntil.set(p.id, Date.now() + wait);
  p.state = "idle";
  p.offerId = null;
  dropFromQueue(p.id);
  send(p.ws, { t: "cooldown", ms: wait });
}

function pairKey(aId, bId) {
  return aId < bId ? aId + ":" + bId : bId + ":" + aId;
}

function pushRecent(id, foeId, at) {
  const list = (recentOpp.get(id) || []).filter((row) => at - row.at < REPEAT_WINDOW_MS);
  list.unshift({ id: foeId, at });
  recentOpp.set(id, list.slice(0, RECENT_N));
}

function noteRankedPair(aId, bId) {
  if (!aId || !bId || aId === bId) return;
  const at = Date.now();
  lastOpp.set(aId, { foeId: bId, at });
  lastOpp.set(bId, { foeId: aId, at });
  pushRecent(aId, bId, at);
  pushRecent(bId, aId, at);
  const k = pairKey(aId, bId);
  const row = pairHits.get(k) || { at: [] };
  row.at = (row.at || []).filter((t) => at - t < REPEAT_WINDOW_MS);
  row.at.push(at);
  pairHits.set(k, row);
}

function pairHitCount(aId, bId, now) {
  const row = pairHits.get(pairKey(aId, bId));
  if (!row || !row.at) return 0;
  row.at = row.at.filter((t) => now - t < REPEAT_WINDOW_MS);
  return row.at.length;
}

function isLastFoe(aId, bId) {
  const a = lastOpp.get(aId);
  const b = lastOpp.get(bId);
  return Boolean((a && a.foeId === bId) || (b && b.foeId === aId));
}

function isRecentFoe(aId, bId, now) {
  const list = recentOpp.get(aId) || [];
  return list.some((row) => row.id === bId && now - row.at < REMATCH_MS);
}

function sameIp(a, b) {
  return Boolean(a.ip && b.ip && a.ip === b.ip && a.ip !== "127.0.0.1" && a.ip !== "::1");
}

function canPair(a, b, now, hasAlt) {
  if (!a || !b || a.id === b.id) return false;
  const waited = Math.min(now - (a.waitAt || now), now - (b.waitAt || now));
  if (pairHitCount(a.id, b.id, now) >= REPEAT_MAX) return false;
  if (isLastFoe(a.id, b.id)) {
    if (hasAlt) return false;
    if (waited < STUCK_MS) return false;
  } else if (isRecentFoe(a.id, b.id, now) || isRecentFoe(b.id, a.id, now)) {
    if (hasAlt) return false;
    if (waited < STUCK_MS) return false;
  }
  if (sameIp(a, b)) {
    if (hasAlt) return false;
    if (waited < IP_STUCK_MS) return false;
  }
  return true;
}

function pairScore(a, b, now) {
  const gap = Math.abs((a.mmr | 0) - (b.mmr | 0));
  let n = gap;
  if (isLastFoe(a.id, b.id)) n += 400;
  else if (isRecentFoe(a.id, b.id, now) || isRecentFoe(b.id, a.id, now)) n += 180;
  if (sameIp(a, b)) n += 250;
  n += pairHitCount(a.id, b.id, now) * 90;
  return n;
}

function pairTick() {
  if (!canOpenMore()) return;
  const now = Date.now();
  const live = queue.filter((p) => p && p.state === "queue" && p.ws && p.ws.readyState === 1);
  if (live.length < 2) return;
  const hasAlt = live.length > 2;
  let pick = null;
  let best = Infinity;
  for (let i = 0; i < live.length; i += 1) {
    const a = live[i];
    const winA = searchWindow(now - a.waitAt);
    for (let j = i + 1; j < live.length; j += 1) {
      const b = live[j];
      const gap = Math.abs((a.mmr | 0) - (b.mmr | 0));
      const win = Math.max(winA, searchWindow(now - b.waitAt));
      if (gap > win) continue;
      if (!canPair(a, b, now, hasAlt)) continue;
      const score = pairScore(a, b, now);
      if (score < best) {
        best = score;
        pick = [a, b];
      }
    }
  }
  if (pick) startOffer(pick[0], pick[1]);
}

function startOffer(a, b) {
  dropFromQueue(a.id);
  dropFromQueue(b.id);
  const id = randomUUID();
  a.state = "offer";
  b.state = "offer";
  a.offerId = id;
  b.offerId = id;
  const of = {
    id,
    a,
    b,
    votes: {},
    timer: setTimeout(() => expireOffer(id), OFFER_MS)
  };
  offers.set(id, of);
  const deadline = Date.now() + OFFER_MS;
  send(a.ws, { t: "offer", offerId: id, deadline, rival: preview(b) });
  send(b.ws, { t: "offer", offerId: id, deadline, rival: preview(a) });
}

function expireOffer(id) {
  const of = offers.get(id);
  if (!of) return;
  clearOffer(id);
  const settle = (p) => {
    if (of.votes[p.id] === true) requeue(p, false);
    else applyCooldown(p, SKIP_COOLDOWN_MS);
  };
  settle(of.a);
  settle(of.b);
}

function voteOffer(p, offerId, accept) {
  const of = offers.get(offerId);
  if (!of || (of.a.id !== p.id && of.b.id !== p.id)) return;
  of.votes[p.id] = Boolean(accept);
  if (!accept) {
    const other = of.a.id === p.id ? of.b : of.a;
    clearOffer(offerId);
    applyCooldown(p);
    requeue(other, false);
    return;
  }
  if (of.votes[of.a.id] === true && of.votes[of.b.id] === true) {
    clearOffer(offerId);
    beginLuck(of.a, of.b, "pvp");
  }
}

function beginLuck(a, b, mode) {
  const roomId = randomUUID();
  const youSideA = Math.random() < 0.5 ? 1 : 2;
  let rollA = 1 + Math.floor(Math.random() * 99);
  let rollB = 1 + Math.floor(Math.random() * 99);
  if (rollA === rollB) rollB = rollA === 99 ? 98 : rollA + 1;
  const aPicks = rollA > rollB;
  const room = {
    id: roomId,
    phase: "luck",
    mode: mode === "exhibit" ? "exhibit" : "pvp",
    a,
    b,
    sideA: youSideA,
    rollA,
    rollB,
    aPicks,
    courtId: null,
    paused: false,
    pauseLeft: 0,
    pauses: { [a.id]: 1, [b.id]: 1, system: 1 },
    inputs: { [a.id]: { x: 0, y: 0, p: 0 }, [b.id]: { x: 0, y: 0, p: 0 } },
    n: 0,
    ready: 25,
    timer: null,
    hostId: a.id,
    lastSnapAt: Date.now(),
    lastSnap: null,
    roundEnded: false,
    pauseQueued: null,
    droppedId: null,
    dropAt: 0
  };
  a.state = "luck";
  b.state = "luck";
  a.roomId = roomId;
  b.roomId = roomId;
  rooms.set(roomId, room);
  if (room.mode === "pvp") noteRankedPair(a.id, b.id);
  send(a.ws, { t: "luck", roomId, mode: room.mode, youSide: youSideA, youRoll: rollA, foeRoll: rollB, youPick: aPicks, host: true, rival: preview(b) });
  send(b.ws, { t: "luck", roomId, mode: room.mode, youSide: youSideA === 1 ? 2 : 1, youRoll: rollB, foeRoll: rollA, youPick: !aPicks, host: false, rival: preview(a) });
  room.luckTimer = setTimeout(() => {
    if (!rooms.has(roomId) || room.phase !== "luck") return;
    if (!room.courtId) room.courtId = COURTS[Math.floor(Math.random() * COURTS.length)];
    startPlay(room);
  }, 20000);
}

function pickCourt(p, courtId) {
  const room = rooms.get(p.roomId);
  if (!room || room.phase !== "luck") return;
  const picker = room.aPicks ? room.a : room.b;
  if (picker.id !== p.id) return;
  room.courtId = COURTS.includes(courtId) ? courtId : "summer";
  startPlay(room);
}

function startPlay(room) {
  if (!room || room.phase === "play") return;
  if (room.luckTimer) {
    clearTimeout(room.luckTimer);
    room.luckTimer = null;
  }
  room.phase = "play";
  room.courtId = room.courtId || "summer";
  const aServe = room.rollA <= room.rollB;
  send(room.a.ws, {
    t: "go",
    roomId: room.id,
    youSide: room.sideA,
    courtId: room.courtId,
    youServe: aServe,
    fighter: room.a.fighter,
    foeFighter: room.b.fighter,
    youSkin: clampSkin(room.a.skin),
    foeSkin: clampSkin(room.b.skin),
    rival: preview(room.b),
    host: true,
    mode: room.mode || "pvp"
  });
  send(room.b.ws, {
    t: "go",
    roomId: room.id,
    youSide: room.sideA === 1 ? 2 : 1,
    courtId: room.courtId,
    youServe: !aServe,
    fighter: room.b.fighter,
    foeFighter: room.a.fighter,
    youSkin: clampSkin(room.b.skin),
    foeSkin: clampSkin(room.a.skin),
    rival: preview(room.a),
    host: false,
    mode: room.mode || "pvp"
  });
  room.hostId = room.a.id;
  room.lastSnapAt = Date.now();
  room.timer = setInterval(() => tickRoom(room), TICK_MS);
}

function mate(room, p) {
  if (!room || !p) return null;
  return room.a && room.a.id === p.id ? room.b : room.a;
}

function scoreFor(room, you) {
  const snap = room.lastSnap;
  const left = (snap && snap.score && snap.score[0]) | 0;
  const right = (snap && snap.score && snap.score[1]) | 0;
  const youLeft = you.id === room.a.id ? room.sideA === 1 : room.sideA === 2;
  return youLeft ? { p1: left, p2: right } : { p1: right, p2: left };
}

function endPayload(room, you, foe, reason, loserId) {
  return {
    t: "end",
    reason,
    loserId: loserId || null,
    mode: room.mode || "pvp",
    courtId: room.courtId || "summer",
    youSide: you.id === room.a.id ? room.sideA : (room.sideA === 1 ? 2 : 1),
    fighter: you.fighter,
    foeFighter: foe && foe.fighter,
    rival: foe ? preview(foe) : null,
    score: scoreFor(room, you)
  };
}

function rememberEnd(room, reason, loserId) {
  const until = Date.now() + 120000;
  pendingEnd.set(room.a.id, { until, msg: endPayload(room, room.a, room.b, reason, loserId) });
  pendingEnd.set(room.b.id, { until, msg: endPayload(room, room.b, room.a, reason, loserId) });
}

function findRoomForUser(id) {
  for (const r of rooms.values()) {
    if (r.a && r.a.id === id) return r;
    if (r.b && r.b.id === id) return r;
  }
  return null;
}

function yieldHost(room, fromId) {
  if (!room || room.hostId !== fromId) return;
  const cur = room.hostId === room.a.id ? room.a : room.b;
  const next = mate(room, cur);
  if (!next || next.id === room.droppedId || !next.ws || next.ws.readyState !== 1) return;
  room.hostId = next.id;
  room.lastSnapAt = Date.now();
  send(next.ws, { t: "youHost", on: true });
  send(cur.ws, { t: "youHost", on: false });
}
function tickRoom(room) {
  if (room.droppedId) {
    const gone = Date.now() - (room.dropAt || 0);
    if (gone >= FORFEIT_MS) {
      closeRoom(room, "forfeit", room.droppedId);
      return;
    }
    if (room.n % 25 === 0) {
      const live = room.a.id === room.droppedId ? room.b : room.a;
      send(live.ws, { t: "waitRival", ms: Math.max(0, FORFEIT_MS - gone) });
    }
  }
  if (room.phase !== "play") return;
  if (room.paused) {
    room.pauseLeft -= TICK_MS;
    if (room.pauseLeft <= 0) {
      room.paused = false;
      send(room.a.ws, { t: "resume" });
      send(room.b.ws, { t: "resume" });
    }
    return;
  }
  if (room.ready > 0) {
    room.ready -= 1;
    room.n += 1;
    const zero = { x: 0, y: 0, p: 0 };
    const payload = { t: "tick", n: room.n, a: zero, b: zero };
    send(room.a.ws, payload);
    send(room.b.ws, payload);
    return;
  }
  room.n += 1;
  const left = room.sideA === 1 ? room.a : room.b;
  const right = room.sideA === 1 ? room.b : room.a;
  const payload = {
    t: "tick",
    n: room.n,
    a: room.inputs[left.id] || { x: 0, y: 0, p: 0 },
    b: room.inputs[right.id] || { x: 0, y: 0, p: 0 }
  };
  send(room.a.ws, payload);
  send(room.b.ws, payload);
  if (room.droppedId) return;
  if (Date.now() - (room.lastSnapAt || 0) > HOST_YIELD_MS) yieldHost(room, room.hostId);
}

function pauseRoom(p) {
  const room = rooms.get(p.roomId);
  if (!room || room.phase !== "play" || room.paused) return;
  if ((room.pauses[p.id] | 0) <= 0) {
    send(p.ws, { t: "pauseDenied" });
    return;
  }
  if (!room.roundEnded) {
    room.pauseQueued = p.id;
    return;
  }
  room.pauses[p.id] -= 1;
  room.pauseQueued = null;
  room.paused = true;
  room.pauseLeft = 20000;
  const msg = { t: "pause", kind: "player", ms: 20000 };
  send(room.a.ws, msg);
  send(room.b.ws, msg);
}

function resumeRoom(p) {
  const room = rooms.get(p.roomId);
  if (!room || !room.paused) return;
  room.paused = false;
  room.pauseLeft = 0;
  send(room.a.ws, { t: "resume" });
  send(room.b.ws, { t: "resume" });
}

function goPayload(room, you, foe, host) {
  const youIsA = you.id === room.a.id;
  const aServe = room.rollA <= room.rollB;
  return {
    t: "rejoin",
    roomId: room.id,
    youSide: youIsA ? room.sideA : (room.sideA === 1 ? 2 : 1),
    courtId: room.courtId,
    youServe: youIsA ? aServe : !aServe,
    fighter: you.fighter,
    foeFighter: foe.fighter,
    youSkin: clampSkin(you.skin),
    foeSkin: clampSkin(foe.skin),
    rival: preview(foe),
    host: Boolean(host),
    mode: room.mode || "pvp"
  };
}

function closeRoom(room, reason, loserId) {
  if (!room) return;
  if (room.timer) clearInterval(room.timer);
  if (room.luckTimer) clearTimeout(room.luckTimer);
  rooms.delete(room.id);
  rememberEnd(room, reason, loserId);
  send(room.a.ws, pendingEnd.get(room.a.id).msg);
  send(room.b.ws, pendingEnd.get(room.b.id).msg);
  room.a.state = "idle";
  room.b.state = "idle";
  room.a.roomId = null;
  room.b.roomId = null;
}

function inviteExhibit(from, friendId) {
  const to = byUser.get(friendId);
  if (!to || to.ws.readyState !== 1) {
    send(from.ws, { t: "offline" });
    return;
  }
  if (to.state === "play" || to.state === "luck" || to.state === "offer") {
    send(from.ws, { t: "busy" });
    return;
  }
  from.state = "exhibitWait";
  from.exhibitTo = friendId;
  send(to.ws, { t: "invite", from: preview(from) });
  send(from.ws, { t: "searching" });
}

function voteExhibit(to, fromId, accept) {
  const from = byUser.get(fromId);
  if (!from || from.exhibitTo !== to.id) return;
  from.exhibitTo = null;
  if (!accept) {
    from.state = "idle";
    send(from.ws, { t: "declined" });
    return;
  }
  if (!canOpenMore()) {
    send(to.ws, { t: "searching" });
    send(from.ws, { t: "searching" });
    const wait = setInterval(() => {
      if (!byUser.has(from.id) || !byUser.has(to.id)) {
        clearInterval(wait);
        return;
      }
      if (canOpenMore()) {
        clearInterval(wait);
        beginLuck(from, to, "exhibit");
      }
    }, 400);
    return;
  }
  beginLuck(from, to, "exhibit");
}

function onHello(ws, user, body) {
  const prev = byUser.get(user.id);
  const p = {
    ws,
    id: user.id,
    name: String(body.name || "player").slice(0, 12),
    avatar: body.avatar || "av01",
    fighter: (body.fighter || (prev && prev.fighter) || "ignis"),
    mmr: body.mmr | 0,
    wins: body.wins | 0,
    mostUsed: body.mostUsed || body.fighter || "ignis",
    skin: clampSkin(body.skin || (prev && prev.skin) || 1),
    state: "idle",
    offerId: null,
    roomId: null,
    waitAt: 0,
    ip: ws.clientIp || (prev && prev.ip) || ""
  };
  clients.set(ws, p);
  byUser.set(user.id, p);
  send(ws, { t: "ready", maxLive: MAX_LIVE });
  const late = pendingEnd.get(user.id);
  if (late && late.until > Date.now()) {
    pendingEnd.delete(user.id);
    send(ws, late.msg);
  } else {
    pendingEnd.delete(user.id);
    const liveRoom = findRoomForUser(user.id) || (prev && prev.roomId ? rooms.get(prev.roomId) : null);
    if (liveRoom && (liveRoom.a.id === user.id || liveRoom.b.id === user.id)) {
      const oldSeat = liveRoom.a.id === user.id ? liveRoom.a : liveRoom.b;
      p.fighter = oldSeat.fighter || p.fighter;
      p.skin = clampSkin(oldSeat.skin || p.skin);
      if (liveRoom.a.id === user.id) liveRoom.a = p;
      else liveRoom.b = p;
      p.roomId = liveRoom.id;
      p.state = liveRoom.phase === "luck" ? "luck" : "play";
      liveRoom.inputs[p.id] = liveRoom.inputs[p.id] || { x: 0, y: 0, p: 0 };
      if (liveRoom.droppedId === user.id) {
        liveRoom.droppedId = null;
        liveRoom.dropAt = 0;
      }
      const foe = mate(liveRoom, p);
      if (liveRoom.phase === "luck") {
        const youIsA = p.id === liveRoom.a.id;
        send(ws, {
          t: "luck",
          roomId: liveRoom.id,
          mode: liveRoom.mode || "pvp",
          youSide: youIsA ? liveRoom.sideA : (liveRoom.sideA === 1 ? 2 : 1),
          youRoll: youIsA ? liveRoom.rollA : liveRoom.rollB,
          foeRoll: youIsA ? liveRoom.rollB : liveRoom.rollA,
          youPick: youIsA ? liveRoom.aPicks : !liveRoom.aPicks,
          host: liveRoom.hostId === p.id,
          rival: preview(foe)
        });
      } else {
        send(ws, goPayload(liveRoom, p, foe, liveRoom.hostId === p.id));
        if (liveRoom.lastSnap) send(ws, liveRoom.lastSnap);
        if (liveRoom.paused) send(ws, { t: "pause", kind: "player", ms: liveRoom.pauseLeft || 20000 });
      }
      if (foe) send(foe.ws, { t: "rivalBack" });
    }
  }
  if (prev && prev.ws && prev.ws !== ws) {
    try { prev.ws.close(); } catch (e) {}
  }
}

function onMsg(ws, raw) {
  const p = clients.get(ws);
  let msg;
  try { msg = JSON.parse(raw); } catch (e) { return; }
  if (!p || !msg || !msg.t) return;
  if (msg.t === "hello") return;
  if (msg.t === "queue") {
    const until = cooldownUntil.get(p.id) || 0;
    if (until > Date.now()) {
      send(ws, { t: "cooldown", ms: until - Date.now() });
      return;
    }
    p.fighter = msg.fighter || p.fighter;
    p.skin = clampSkin(msg.skin || p.skin);
    p.mmr = msg.mmr | 0;
    p.wins = msg.wins | 0;
    p.avatar = msg.avatar || p.avatar;
    p.mostUsed = msg.mostUsed || p.mostUsed;
    p.state = "queue";
    p.waitAt = Date.now();
    dropFromQueue(p.id);
    queue.push(p);
    send(ws, { t: "searching" });
    return;
  }
  if (msg.t === "cancel") {
    dropFromQueue(p.id);
    if (p.offerId) {
      const of = offers.get(p.offerId);
      if (of) voteOffer(p, p.offerId, false);
    }
    p.state = "idle";
    return;
  }
  if (msg.t === "vote") voteOffer(p, msg.offerId, msg.accept === true);
  if (msg.t === "court") pickCourt(p, msg.id);
  if (msg.t === "in" && p.roomId) {
    const room = rooms.get(p.roomId);
    if (room) room.inputs[p.id] = {
      x: msg.x === -1 || msg.x === 1 ? msg.x : 0,
      y: msg.y === -1 || msg.y === 1 ? msg.y : 0,
      p: msg.p ? 1 : 0
    };
  }
  if (msg.t === "snap" && p.roomId) {
    const room = rooms.get(p.roomId);
    if (room && room.hostId === p.id) {
      room.lastSnapAt = Date.now();
      room.lastSnap = msg;
      room.roundEnded = msg.re === 1;
      const other = mate(room, p);
      if (other) send(other.ws, msg);
      if (room.pauseQueued && room.roundEnded && !room.paused) {
        const who = room.a.id === room.pauseQueued ? room.a : room.b;
        room.pauseQueued = null;
        if (who) pauseRoom(who);
      }
    }
  }
  if (msg.t === "ping") send(ws, { t: "pong", at: msg.at });
  if (msg.t === "pause") pauseRoom(p);
  if (msg.t === "resume") resumeRoom(p);
  if (msg.t === "yield" && p.roomId) yieldHost(rooms.get(p.roomId), p.id);
  if (msg.t === "quit") {
    const room = rooms.get(p.roomId);
    if (room) closeRoom(room, "quit", p.id);
  }
  if (msg.t === "done") {
    const room = rooms.get(p.roomId);
    if (room) {
      if (room.timer) clearInterval(room.timer);
      rooms.delete(room.id);
      room.a.state = "idle";
      room.b.state = "idle";
      room.a.roomId = null;
      room.b.roomId = null;
    }
  }
  if (msg.t === "exhibit") inviteExhibit(p, msg.friendId);
  if (msg.t === "exhibitVote") {
    if (msg.fighter) p.fighter = msg.fighter;
    if (msg.skin) p.skin = clampSkin(msg.skin);
    voteExhibit(p, msg.fromId, msg.accept === true);
  }
}

function onClose(ws) {
  const p = clients.get(ws);
  clients.delete(ws);
  if (!p) return;
  if (byUser.get(p.id) !== p) return;
  dropFromQueue(p.id);
  if (p.offerId) {
    const of = offers.get(p.offerId);
    if (of) {
      const other = of.a.id === p.id ? of.b : of.a;
      clearOffer(p.offerId);
      requeue(other, false);
    }
  }
  const room = p.roomId ? rooms.get(p.roomId) : null;
  if (room && (room.phase === "play" || room.phase === "luck")) {
    room.droppedId = p.id;
    room.dropAt = Date.now();
    room.inputs[p.id] = { x: 0, y: 0, p: 0 };
    const other = mate(room, p);
    if (other) send(other.ws, { t: "waitRival", ms: FORFEIT_MS });
    if (room.hostId === p.id && other) yieldHost(room, p.id);
    if (!room.timer) room.timer = setInterval(() => tickRoom(room), TICK_MS);
    return;
  }
  byUser.delete(p.id);
  if (room) closeRoom(room, "drop", p.id);
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("evolley-match ok " + liveCount() + "/" + MAX_LIVE + "\n");
});

const wss = new WebSocketServer({ server });
wss.on("connection", (ws, req) => {
  const origin = req.headers.origin || "";
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  ws.clientIp = fwd || (req.socket && req.socket.remoteAddress) || "";
  if (ORIGINS.length && origin && !ORIGINS.includes(origin) && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    ws.close();
    return;
  }
  ws.on("message", async (buf) => {
    let msg;
    try { msg = JSON.parse(String(buf)); } catch (e) { return; }
    if (msg.t === "hello") {
      const user = await verifyToken(msg.token);
      if (!user) {
        send(ws, { t: "authFail" });
        ws.close();
        return;
      }
      onHello(ws, user, msg);
      return;
    }
    onMsg(ws, String(buf));
  });
  ws.on("close", () => onClose(ws));
});

setInterval(pairTick, 400);

server.listen(PORT, () => {
  console.log("match ws :" + PORT + " maxLive=" + MAX_LIVE);
});
