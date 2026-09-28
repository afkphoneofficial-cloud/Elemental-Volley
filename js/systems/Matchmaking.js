import { ROSTER_IDS } from "../data/roster.js";
import { FREE_AVATARS } from "../data/avatars.js";
import { difficultyFromMmr, searchWindow } from "../data/ranks.js";
import { AuthSystem } from "./AuthSystem.js";

const RIVALS_TH = ["นวลทราย", "ใบเมฆ", "ก้อนมอส", "หยดน้ำค้าง", "สายฟ้าอ่อน", "เปลวเล็ก", "หอยจ๋อ", "กวางเกาะ", "นกไออุ่น", "ปูฟอง"];
const RIVALS_EN = ["Sandveil", "Dewkit", "Mossdot", "Tidepup", "Sparkwisp", "Emberling", "Shelljot", "Isledeer", "Warmfinch", "Foamcrab"];

function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

function pickPool(list, seed) {
  return list[hash(seed) % list.length];
}

export function makeIslandRival(youMmr, youFighter, window, seed) {
  const span = Math.max(80, window | 0);
  const jitter = (hash(seed + 11) % (span * 2 + 1)) - span;
  const mmr = Math.max(0, (youMmr | 0) + jitter);
  const pool = ROSTER_IDS.filter((id) => id !== youFighter);
  const fighter = pool[hash(seed + 3) % pool.length] || "volt";
  const av = FREE_AVATARS[hash(seed + 7) % FREE_AVATARS.length];
  return {
    live: false,
    nameTh: pickPool(RIVALS_TH, seed),
    nameEn: pickPool(RIVALS_EN, seed + 1),
    mmr,
    fighter,
    avatarId: av.id,
    difficulty: difficultyFromMmr(mmr)
  };
}

export const Matchmaking = {
  async enterQueue(payload) {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    const user = AuthSystem.session && AuthSystem.session();
    if (!sb || !user || !user.id) return;
    try {
      await sb.from("pvp_queue").upsert({
        user_id: user.id,
        display_name: AuthSystem.displayName() || "player",
        mmr: payload.mmr | 0,
        fighter_id: payload.fighter,
        avatar_id: payload.avatar,
        looking: true,
        updated_at: new Date().toISOString()
      });
    } catch (e) { /* table optional until live netcode */ }
  },

  async leaveQueue() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    const user = AuthSystem.session && AuthSystem.session();
    if (!sb || !user || !user.id) return;
    try {
      await sb.from("pvp_queue").update({ looking: false, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    } catch (e) { /* optional */ }
  },

  async pollLive(youMmr, windowMs, elapsedMs) {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    const user = AuthSystem.session && AuthSystem.session();
    if (!sb || !user || !user.id) return null;
    const win = searchWindow(elapsedMs);
    try {
      const { data, error } = await sb.from("pvp_queue")
        .select("user_id, display_name, mmr, fighter_id, avatar_id")
        .eq("looking", true)
        .neq("user_id", user.id)
        .gte("mmr", (youMmr | 0) - win)
        .lte("mmr", (youMmr | 0) + win)
        .limit(8);
      if (error || !data || !data.length) return null;
      const pick = data[hash(Date.now()) % data.length];
      return {
        live: true,
        nameTh: pick.display_name,
        nameEn: pick.display_name,
        mmr: pick.mmr | 0,
        fighter: pick.fighter_id || "volt",
        avatarId: pick.avatar_id || "av01",
        difficulty: difficultyFromMmr(pick.mmr | 0),
        userId: pick.user_id
      };
    } catch (e) {
      return null;
    }
  }
};
