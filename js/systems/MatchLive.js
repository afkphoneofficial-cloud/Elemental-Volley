import { BACKEND } from "../config/backend.js";
import { SaveSystem } from "./SaveSystem.js";
import { Session } from "./Session.js";
import { ROSTER_IDS } from "../data/roster.js";
import { botSheet } from "../data/growth.js?v=local206";
import { champSetOf } from "../data/seasonLooks.js";

export function matchHttpUrl() {
  const q = new URLSearchParams(location.search).get("match");
  const ws = q || BACKEND.matchWsUrl || "";
  if (!ws) return "";
  return ws.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:").replace(/\/$/, "");
}

export const MatchLive = {
  exhibit: 0,
  ranked: 0,
  matches: 0,
  max: 12,
  maxQueue: 48,

  apply(data) {
    if (!data) return this;
    if (data.exhibit != null) this.exhibit = Math.max(0, data.exhibit | 0);
    if (data.ranked != null) this.ranked = Math.max(0, data.ranked | 0);
    if (data.matches != null) this.matches = Math.max(0, data.matches | 0);
    if (data.max != null) this.max = Math.max(1, data.max | 0);
    if (data.maxLive != null) this.max = Math.max(1, data.maxLive | 0);
    if (data.maxQueue != null) this.maxQueue = Math.max(1, data.maxQueue | 0);
    return this;
  },

  exhibitShown(self) {
    const n = Math.max(0, this.exhibit | 0);
    return self && n < 1 ? 1 : n;
  },

  rankedShown(self) {
    const n = Math.max(0, this.ranked | 0);
    return self && n < 1 ? 1 : n;
  },

  waitOf(mode) {
    if (mode === "exhibit") return this.exhibitShown();
    return this.rankedShown();
  },

  slotsFull() {
    return this.max > 0 && this.matches >= this.max;
  },

  label(t, mode) {
    if (mode === "special") return t("queue.specialWait", { n: this.rankedShown() });
    if (mode === "pvp" || mode === "ranked") return t("queue.rankedWait", { n: this.rankedShown() });
    return t("queue.exhibitWait", { n: this.exhibitShown() });
  },

  async pull() {
    const base = matchHttpUrl();
    if (!base) return this;
    try {
      const res = await fetch(base + "/live", { cache: "no-store" });
      if (!res.ok) return this;
      this.apply(await res.json());
    } catch (e) {}
    return this;
  }
};

export function startLocalBot(scene, youId) {
  const id = youId || Session.playerId || "ignis";
  const foes = ROSTER_IDS.filter((fid) => fid !== id);
  const botId = foes[Math.floor(Math.random() * foes.length)] || "volt";
  Session.mode = "bot";
  Session.exhibitCasual = false;
  Session.exhibitFriendId = null;
  Session.exhibitIncoming = false;
  Session.rival = null;
  Session.net = false;
  Session.playerId = id;
  Session.botId = botId;
  Session.difficulty = "normal";
  Session.botSheet = botSheet(botId, "normal");
  Session.trainStage = null;
  Session.youSkin = SaveSystem.skinOf(id);
  Session.youChamp = champSetOf(id);
  Session.foeSkin = 1;
  Session.foeChamp = 0;
  Session.youSide = Math.random() < 0.5 ? 1 : 2;
  scene.scene.start("luck");
}
