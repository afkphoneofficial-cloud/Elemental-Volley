import { BACKEND } from "../config/backend.js";
import { AuthSystem } from "./AuthSystem.js";
import { SaveSystem } from "./SaveSystem.js";
import { Session } from "./Session.js";
import { t } from "../i18n/I18n.js";
import { clampSkin } from "../data/skins.js";

const listeners = new Set();

function wsUrl() {
  const q = new URLSearchParams(location.search).get("match");
  return q || BACKEND.matchWsUrl || "";
}

function mostUsed() {
  const counts = {};
  for (const row of SaveSystem.data.matchLog || []) {
    const id = row.you;
    if (id) counts[id] = (counts[id] | 0) + 1;
  }
  let best = Session.playerId || SaveSystem.data.starterId || "ignis";
  let n = -1;
  Object.keys(counts).forEach((id) => {
    if (counts[id] > n) {
      n = counts[id];
      best = id;
    }
  });
  return best;
}

function fighterSkin() {
  const id = Session.playerId || SaveSystem.data.showcaseId || SaveSystem.data.starterId;
  return SaveSystem.skinOf(id);
}

function applyNetFighters(msg) {
  if (msg.fighter) Session.playerId = msg.fighter;
  if (msg.foeFighter) Session.botId = msg.foeFighter;
  Session.youSkin = clampSkin(msg.youSkin || SaveSystem.skinOf(Session.playerId));
  Session.foeSkin = clampSkin(msg.foeSkin || (msg.rival && msg.rival.skin) || 1);
  if (msg.rival && Session.rival) Session.rival.skin = Session.foeSkin;
}

export const NetPlay = {
  ws: null,
  ready: false,
  ticks: [],
  lastIn: 0,
  pending: { x: 0, y: 0, p: 0 },
  cooldownUntil: 0,
  lastOffer: null,
  lastLuck: null,
  lastInvite: null,
  pingMs: 0,
  pingLive: false,
  pingSent: 0,
  snap: null,
  pingTimer: null,
  reconnectTimer: null,

  on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  emit(msg) {
    listeners.forEach((fn) => {
      try { fn(msg); } catch (e) {}
    });
  },

  configured() {
    return Boolean(wsUrl());
  },

  ensure() {
    if (!this.configured()) return;
    const sess = AuthSystem.session && AuthSystem.session();
    if (!sess || !sess.access_token) return;
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return;
    const url = wsUrl();
    let ws;
    try { ws = new WebSocket(url); } catch (e) { return; }
    this.ws = ws;
    this.ready = false;
    ws.onopen = () => {
      const rank = SaveSystem.data.rank || {};
      ws.send(JSON.stringify({
        t: "hello",
        token: sess.access_token,
        name: AuthSystem.displayName() || "player",
        avatar: SaveSystem.data.avatarId || "av01",
        fighter: Session.playerId,
        skin: fighterSkin(),
        mmr: rank.mmr | 0,
        wins: rank.wins | 0,
        mostUsed: mostUsed()
      }));
    };
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (!msg || !msg.t) return;
      if (msg.t === "ready") {
        this.ready = true;
        this.flushWant();
        this.startPing();
      }
      if (msg.t === "pong") {
        const at = Number(msg.at);
        const now = performance.now();
        let rtt = now - at;
        if (!Number.isFinite(rtt) || rtt < 0 || rtt > 8000) rtt = now - this.pingSent;
        if (Number.isFinite(rtt) && rtt >= 0 && rtt < 8000) {
          this.pingMs = rtt;
          this.pingLive = true;
        }
      }
      if (msg.t === "snap") this.snap = msg;
      if (msg.t === "tick") {
        this.ticks.push(msg);
        if (this.ticks.length > 24) this.ticks.splice(0, this.ticks.length - 24);
      }
      if (msg.t === "offer") this.lastOffer = msg;
      if (msg.t === "luck") this.lastLuck = msg;
      if (msg.t === "invite") this.lastInvite = msg;
      if (msg.t === "cooldown") this.cooldownUntil = Date.now() + (msg.ms | 0);
      if (msg.t === "go" || msg.t === "rejoin") {
        Session.net = true;
        Session.netHost = msg.host === true;
        if (msg.mode === "exhibit" || msg.mode === "pvp") Session.mode = msg.mode;
        Session.youSide = msg.youSide === 2 ? 2 : 1;
        Session.courtId = msg.courtId || "summer";
        Session.youServe = Boolean(msg.youServe);
        applyNetFighters(msg);
        if (msg.rival) {
          Session.rival = {
            live: true,
            userId: msg.rival.id,
            nameTh: msg.rival.name,
            nameEn: msg.rival.name,
            mmr: msg.rival.mmr | 0,
            fighter: msg.foeFighter || msg.rival.fighter,
            avatarId: msg.rival.avatarId || "av01",
            wins: msg.rival.wins | 0,
            mostUsed: msg.rival.mostUsed,
            difficulty: "normal",
            skin: clampSkin(msg.foeSkin || msg.rival.skin || 1)
          };
        }
      }
      if (msg.t === "end") {
        if (msg.mode === "exhibit" || msg.mode === "pvp") Session.mode = msg.mode;
        if (msg.courtId) Session.courtId = msg.courtId;
        if (msg.youSide === 1 || msg.youSide === 2) Session.youSide = msg.youSide;
        applyNetFighters(msg);
        if (msg.rival) {
          Session.rival = {
            live: true,
            userId: msg.rival.id,
            nameTh: msg.rival.name,
            nameEn: msg.rival.name,
            mmr: msg.rival.mmr | 0,
            fighter: msg.foeFighter || msg.rival.fighter,
            avatarId: msg.rival.avatarId || "av01",
            wins: msg.rival.wins | 0,
            mostUsed: msg.rival.mostUsed,
            difficulty: "normal",
            skin: clampSkin(msg.foeSkin || msg.rival.skin || 1)
          };
        }
      }
      this.emit(msg);
    };
    ws.onclose = () => {
      this.ready = false;
      this.stopPing();
      this.pingLive = false;
      if (this.ws === ws) this.ws = null;
      this.emit({ t: "closed" });
      if (Session.net) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.ensure(), 350);
      }
    };
  },

  send(msg) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(msg));
  },

  queueRanked() {
    this.ticks = [];
    this.want = "ranked";
    this.flushWant();
  },

  exhibit(friendId) {
    this.want = { exhibit: friendId };
    this.flushWant();
  },

  flushWant() {
    if (!this.ready) {
      this.ensure();
      return;
    }
    if (this.want === "ranked") {
      const rank = SaveSystem.data.rank || {};
      this.send({
        t: "queue",
        fighter: Session.playerId,
        skin: fighterSkin(),
        mmr: rank.mmr | 0,
        wins: rank.wins | 0,
        avatar: SaveSystem.data.avatarId || "av01",
        mostUsed: mostUsed()
      });
      this.want = null;
    } else if (this.want && this.want.exhibit) {
      this.send({ t: "exhibit", friendId: this.want.exhibit });
      this.want = null;
    }
  },

  vote(offerId, accept) {
    this.send({ t: "vote", offerId, accept: Boolean(accept) });
  },

  exhibitVote(fromId, accept) {
    this.send({
      t: "exhibitVote",
      fromId,
      accept: Boolean(accept),
      fighter: Session.playerId || SaveSystem.data.showcaseId || SaveSystem.data.starterId,
      skin: fighterSkin()
    });
  },

  pickCourt(id) {
    this.send({ t: "court", id });
  },

  cancel() {
    this.send({ t: "cancel" });
  },

  sendInput(input) {
    this.pending = {
      x: input.xDirection | 0,
      y: input.yDirection | 0,
      p: input.powerHit | 0
    };
    const now = Date.now();
    if (now - this.lastIn < 36) return;
    this.lastIn = now;
    this.send({ t: "in", ...this.pending });
  },

  takeTick() {
    return this.ticks.shift() || null;
  },

  takeSnap() {
    const s = this.snap;
    this.snap = null;
    return s;
  },

  startPing() {
    this.stopPing();
    const beat = () => {
      this.pingSent = performance.now();
      this.send({ t: "ping", at: this.pingSent });
    };
    this.pingTimer = setInterval(beat, 1000);
    beat();
  },

  stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  },

  pause(kind) {
    this.send({ t: "pause", kind: kind || "player" });
  },

  resume() {
    this.send({ t: "resume" });
  },

  quit() {
    Session.net = false;
    this.send({ t: "quit" });
  },

  yieldHost() {
    this.send({ t: "yield" });
  },

  stop() {
    Session.net = false;
    this.cancel();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }
    this.ws = null;
    this.ready = false;
    this.stopPing();
  }
};

export function mountExhibitInvite() {
  const root = document.getElementById("exhibit-overlay");
  const msg = document.getElementById("exhibit-msg");
  const yes = document.getElementById("exhibit-yes");
  const no = document.getElementById("exhibit-no");
  if (!root || !yes || !no) return;
  const hide = () => { root.hidden = true; };
  NetPlay.on((m) => {
    if (m.t !== "invite" || !m.from) return;
    root.hidden = false;
    if (msg) msg.textContent = t("queue.invite", { name: m.from.name || "" });
    yes.textContent = t("queue.accept");
    no.textContent = t("queue.decline");
    yes.onclick = () => {
      Session.mode = "exhibit";
      Session.net = true;
      Session.playerId = SaveSystem.data.showcaseId || SaveSystem.data.starterId || Session.playerId;
      NetPlay.exhibitVote(m.from.id, true);
      hide();
    };
    no.onclick = () => {
      NetPlay.exhibitVote(m.from.id, false);
      hide();
    };
  });
}
