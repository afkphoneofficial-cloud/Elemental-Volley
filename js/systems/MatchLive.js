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

  label(t) {
    return t("queue.exhibitWait", { n: this.exhibit | 0 });
  },

  async pull() {
    const base = matchHttpUrl();
    if (!base) return this;
    try {
      const res = await fetch(base + "/live", { cache: "no-store" });
      if (!res.ok) return this;
      const data = await res.json();
      this.exhibit = Math.max(0, data.exhibit | 0);
      this.ranked = Math.max(0, data.ranked | 0);
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
