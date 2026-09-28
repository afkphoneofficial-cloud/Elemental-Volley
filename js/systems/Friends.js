import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "./SaveSystem.js";
import { AuthSystem } from "./AuthSystem.js";

function packRpc(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.display_name || "",
    avatarId: row.avatar_id || "av01",
    fighterId: row.fighter_id || "ignis",
    mmr: row.mmr | 0,
    at: Date.now()
  };
}

function shuffle(list) {
  const pool = list.slice();
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  return pool;
}

function parseRpc(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) return data;
  return { ok: false, reason: "cloud" };
}

export const Friends = {
  pendingOut: [],

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

  pendingHas(id) {
    return this.pendingOut.some((p) => p.id === id);
  },

  async sync() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const [friends, pending] = await Promise.all([
      sb.rpc("list_my_friends"),
      sb.rpc("list_pending_out")
    ]);
    if (!friends.error && Array.isArray(friends.data)) {
      SaveSystem.data.friends = friends.data.map(packRpc).filter((p) => p && p.id);
      SaveSystem.persist();
    }
    this.pendingOut = !pending.error && Array.isArray(pending.data)
      ? pending.data.map((row) => ({
        id: row.id,
        name: row.display_name || "",
        avatarId: row.avatar_id || "av01"
      }))
      : [];
    return { ok: !friends.error };
  },

  async remove(id) {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (sb) await sb.rpc("unfriend", { p_id: id });
    SaveSystem.data.friends = this.list().filter((f) => f.id !== id);
    SaveSystem.persist();
    return true;
  },

  async inviteByName(raw) {
    const name = String(raw || "").trim();
    if (name.length < 2) return { ok: false, reason: "len" };
    if (this.count() >= this.cap()) return { ok: false, reason: "full" };
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const { data, error } = await sb.rpc("lookup_player_by_name", { raw_name: name });
    if (error) return { ok: false, reason: "cloud", detail: error.message };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { ok: false, reason: "missing" };
    return this.invitePacked(packRpc(row));
  },

  async invitePacked(pal) {
    if (!pal || !pal.id) return { ok: false, reason: "missing" };
    const me = AuthSystem.session && AuthSystem.session();
    if (me && pal.id === me.id) return { ok: false, reason: "self" };
    if (this.count() >= this.cap()) return { ok: false, reason: "full" };
    if (this.has(pal.id)) return { ok: false, reason: "dup" };
    if (this.pendingHas(pal.id)) return { ok: false, reason: "pending" };
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const { data, error } = await sb.rpc("send_friend_invite", { p_to: pal.id });
    if (error) return { ok: false, reason: "cloud", detail: error.message };
    const row = parseRpc(data);
    if (row.ok) await this.sync();
    return { ...row, pal };
  },

  async suggestFromServer() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud", list: [] };
    const { data, error } = await sb.rpc("suggest_players", { p_limit: 40 });
    if (error) return { ok: false, reason: "cloud", list: [], detail: error.message };
    const pool = shuffle((data || []).map(packRpc).filter((p) => (
      p && p.id && p.name && !this.has(p.id) && !this.pendingHas(p.id)
    )));
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
