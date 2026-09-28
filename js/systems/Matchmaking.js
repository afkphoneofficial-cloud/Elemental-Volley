import { difficultyFromMmr } from "../data/ranks.js";
import { AuthSystem } from "./AuthSystem.js";

export const Matchmaking = {
  async enterQueue() {},
  async leaveQueue() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    const user = AuthSystem.session && AuthSystem.session();
    if (!sb || !user || !user.id) return;
    try {
      await sb.from("pvp_queue").update({ looking: false, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    } catch (e) { /* optional leftover table */ }
  }
};

export function packRival(row) {
  if (!row) return null;
  return {
    live: true,
    nameTh: row.name || row.display_name,
    nameEn: row.name || row.display_name,
    mmr: row.mmr | 0,
    fighter: row.fighter || row.fighter_id || "volt",
    avatarId: row.avatarId || row.avatar_id || "av01",
    difficulty: difficultyFromMmr(row.mmr | 0),
    userId: row.id || row.user_id
  };
}
