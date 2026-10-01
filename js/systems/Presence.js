import { AuthSystem } from "./AuthSystem.js";

const HEART_MS = 25000;
const POLL_MS = 15000;

export const Presence = {
  n: 1,
  at: 0,
  heartAt: 0,
  listeners: [],

  on(fn) {
    this.listeners.push(fn);
  },

  emit() {
    this.listeners.forEach((fn) => {
      try { fn(this.n); } catch (e) {}
    });
  },

  async beat() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    const me = AuthSystem.session && AuthSystem.session();
    if (!sb || !me || !me.id || me.guest) return;
    await sb.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", me.id);
  },

  async poll() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    let n = 1;
    if (sb && AuthSystem.isLoggedIn && AuthSystem.isLoggedIn()) {
      const { data, error } = await sb.rpc("online_count");
      if (!error && data != null) n = Math.max(1, data | 0);
    }
    this.n = n;
    this.emit();
    return this.n;
  },

  tick() {
    if (!AuthSystem.canPlay || !AuthSystem.canPlay()) return;
    const now = Date.now();
    if (now - this.heartAt > HEART_MS) {
      this.heartAt = now;
      this.beat();
    }
    if (now - this.at > POLL_MS) {
      this.at = now;
      this.poll();
    }
  }
};
