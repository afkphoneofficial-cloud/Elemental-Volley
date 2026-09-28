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
const OFFER_MS = Number(process.env.OFFER_MS || 15000);
const TICK_MS = 40;
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
    mostUsed: p.mostUsed || p.fighter
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

function applyCooldown(p) {
  cooldownUntil.set(p.id, Date.now() + COOLDOWN_MS);
  p.state = "idle";
  dropFromQueue(p.id);
  send(p.ws, { t: "cooldown", ms: COOLDOWN_MS });
}

function pairTick() {
  if (!canOpenMore()) return;
  const now = Date.now();
  for (let i = 0; i < queue.length; i += 1) {
    const a = queue[i];
    if (!a || a.state !== "queue") continue;
    const win = searchWindow(now - a.waitAt);
    for (let j = i + 1; j < queue.length; j += 1) {
      const b = queue[j];
      if (!b || b.state !== "queue") continue;
      if (Math.abs((a.mmr | 0) - (b.mmr | 0)) > Math.max(win, searchWindow(now - b.waitAt))) continue;
      if (!canOpenMore()) return;
      startOffer(a, b);
      return;
    }
  }
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
  const va = of.votes[of.a.id];
  const vb = of.votes[of.b.id];
  if (va === true && vb !== true) requeue(of.a, false);
  else if (vb === true && va !== true) requeue(of.b, false);
  else {
    requeue(of.a, false);
    requeue(of.b, false);
  }
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
    beginLuck(of.a, of.b);
  }
}

function beginLuck(a, b) {
  const roomId = randomUUID();
  const youSideA = Math.random() < 0.5 ? 1 : 2;
  let rollA = 1 + Math.floor(Math.random() * 99);
  let rollB = 1 + Math.floor(Math.random() * 99);
  if (rollA === rollB) rollB = rollA === 99 ? 98 : rollA + 1;
  const aPicks = rollA > rollB;
  const room = {
    id: roomId,
    phase: "luck",
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
    timer: null
  };
  a.state = "luck";
  b.state = "luck";
  a.roomId = roomId;
  b.roomId = roomId;
  rooms.set(roomId, room);
  send(a.ws, { t: "luck", roomId, youSide: youSideA, youRoll: rollA, foeRoll: rollB, youPick: aPicks, host: true, rival: preview(b) });
  send(b.ws, { t: "luck", roomId, youSide: youSideA === 1 ? 2 : 1, youRoll: rollB, foeRoll: rollA, youPick: !aPicks, host: false, rival: preview(a) });
  if (!aPicks) {
    room.courtId = COURTS[Math.floor(Math.random() * COURTS.length)];
    setTimeout(() => startPlay(room), 1100);
  }
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
    rival: preview(room.b),
    host: true
  });
  send(room.b.ws, {
    t: "go",
    roomId: room.id,
    youSide: room.sideA === 1 ? 2 : 1,
    courtId: room.courtId,
    youServe: !aServe,
    fighter: room.b.fighter,
    foeFighter: room.a.fighter,
    rival: preview(room.a),
    host: false
  });
  room.timer = setInterval(() => tickRoom(room), TICK_MS);
}

function tickRoom(room) {
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
}

function pauseRoom(p, kind) {
  const room = rooms.get(p.roomId);
  if (!room || room.phase !== "play" || room.paused) return;
  if (kind === "system") {
    if (room.pauses.system <= 0) return;
    room.pauses.system -= 1;
  } else {
    if ((room.pauses[p.id] | 0) <= 0) {
      send(p.ws, { t: "pauseDenied" });
      return;
    }
    room.pauses[p.id] -= 1;
  }
  room.paused = true;
  room.pauseLeft = 20000;
  const msg = { t: "pause", kind: kind === "system" ? "system" : "player", ms: 20000 };
  send(room.a.ws, msg);
  send(room.b.ws, msg);
}

function closeRoom(room, reason, loserId) {
  if (!room) return;
  if (room.timer) clearInterval(room.timer);
  rooms.delete(room.id);
  const payload = { t: "end", reason, loserId: loserId || null };
  send(room.a.ws, payload);
  send(room.b.ws, payload);
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
        beginLuck(from, to);
      }
    }, 400);
    return;
  }
  beginLuck(from, to);
}

function onHello(ws, user, body) {
  const prev = byUser.get(user.id);
  if (prev && prev.ws !== ws) {
    try { prev.ws.close(); } catch (e) {}
  }
  const p = {
    ws,
    id: user.id,
    name: String(body.name || "player").slice(0, 12),
    avatar: body.avatar || "av01",
    fighter: body.fighter || "ignis",
    mmr: body.mmr | 0,
    wins: body.wins | 0,
    mostUsed: body.mostUsed || body.fighter || "ignis",
    state: "idle",
    offerId: null,
    roomId: null,
    waitAt: 0
  };
  clients.set(ws, p);
  byUser.set(user.id, p);
  send(ws, { t: "ready", maxLive: MAX_LIVE });
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
    if (room && room.a && room.a.id === p.id) send(room.b.ws, msg);
  }
  if (msg.t === "ping") send(ws, { t: "pong", at: msg.at | 0 });
  if (msg.t === "pause") pauseRoom(p, msg.kind === "system" ? "system" : "player");
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
    voteExhibit(p, msg.fromId, msg.accept === true);
  }
}

function onClose(ws) {
  const p = clients.get(ws);
  clients.delete(ws);
  if (!p) return;
  if (byUser.get(p.id) === p) byUser.delete(p.id);
  dropFromQueue(p.id);
  if (p.offerId) {
    const of = offers.get(p.offerId);
    if (of) {
      const other = of.a.id === p.id ? of.b : of.a;
      clearOffer(p.offerId);
      requeue(other, false);
    }
  }
  if (p.roomId) {
    const room = rooms.get(p.roomId);
    if (room && room.phase === "play") pauseRoom(p, "system");
    else if (room) closeRoom(room, "drop", p.id);
  }
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("evolley-match ok " + liveCount() + "/" + MAX_LIVE + "\n");
});

const wss = new WebSocketServer({ server });
wss.on("connection", (ws, req) => {
  const origin = req.headers.origin || "";
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
