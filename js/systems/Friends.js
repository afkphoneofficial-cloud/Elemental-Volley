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
    return this.addPacked(pal);
  },

  addPacked(pal) {
    if (!pal || !pal.id) return { ok: false, reason: "missing" };
    const me = AuthSystem.session && AuthSystem.session();
    if (me && pal.id === me.id) return { ok: false, reason: "self" };
    if (this.count() >= this.cap()) return { ok: false, reason: "full" };
    if (this.has(pal.id)) return { ok: false, reason: "dup" };
    if (!pal.name) return { ok: false, reason: "missing" };
    SaveSystem.data.friends.push(pal);
    SaveSystem.persist();
    return { ok: true, pal };
  },

  async suggestFromServer() {
    const me = AuthSystem.session && AuthSystem.session();
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud", list: [] };
    const { data, error } = await sb.from("profiles")
      .select("id, display_name, save_data, last_seen_at")
      .not("display_name", "is", null)
      .neq("display_name", "")
      .order("last_seen_at", { ascending: false })
      .limit(40);
    if (error) return { ok: false, reason: "cloud", list: [], detail: error.message };
    const mine = me && me.id;
    const pool = (data || [])
      .map(pack)
      .filter((p) => p.id && p.name && p.id !== mine && !this.has(p.id));
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = pool[i];
      pool[i] = pool[j];
      pool[j] = t;
    }
    const n = Math.min(pool.length, 3 + Math.floor(Math.random() * 3));
    return { ok: true, list: pool.slice(0, n) };
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
