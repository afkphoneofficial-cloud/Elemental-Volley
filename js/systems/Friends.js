import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "./SaveSystem.js";
import { AuthSystem } from "./AuthSystem.js";

function pack(row) {
  const save = (row && row.save_data) || {};
  return {
    id: row.id,
    name: row.display_name || "",
    avatarId: save.avatarId || "av01",
    fighterId: save.showcaseId || save.starterId || "ignis",
    mmr: (save.rank && save.rank.mmr) || 1000,
    at: Date.now()
  };
}

export const Friends = {
  list() {
    return SaveSystem.data.friends || [];
  },

  count() {
    return this.list().length;
  },

  cap() {
    return ECONOMY.friendMax;
  },

  has(id) {
    return this.list().some((f) => f.id === id);
  },

  remove(id) {
    SaveSystem.data.friends = this.list().filter((f) => f.id !== id);
    SaveSystem.persist();
    return true;
  },

  async addByName(raw) {
    const name = String(raw || "").trim();
    const me = AuthSystem.session && AuthSystem.session();
    if (name.length < 2) return { ok: false, reason: "len" };
    if (this.count() >= this.cap()) return { ok: false, reason: "full" };
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const { data, error } = await sb.from("profiles")
      .select("id, display_name, save_data")
      .eq("display_name", name)
      .maybeSingle();
    if (error) return { ok: false, reason: "cloud", detail: error.message };
    if (!data) return { ok: false, reason: "missing" };
    if (me && data.id === me.id) return { ok: false, reason: "self" };
    if (this.has(data.id)) return { ok: false, reason: "dup" };
    const pal = pack(data);
    SaveSystem.data.friends.push(pal);
    SaveSystem.persist();
    return { ok: true, pal };
  },

  toRival(pal) {
    return {
      live: false,
      nameTh: pal.name,
      nameEn: pal.name,
      mmr: pal.mmr | 0,
      fighter: pal.fighterId || "volt",
      avatarId: pal.avatarId || "av01",
      difficulty: "normal"
    };
  }
};
