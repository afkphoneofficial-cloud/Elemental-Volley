import { AuthSystem } from "./AuthSystem.js";
import { MatchLive } from "./MatchLive.js?v=local280";

const HEART_MS = 25000;
const POLL_MS = 15000;

export const Presence = {
  n: 0,
  at: 0,
  heartAt: 0,
  listeners: [],

  on(fn) {
    this.listeners.push(fn);
  },

  emit() {
    this.listeners.forEach((fn) => {
      try { fn(this.shown()); } catch (e) {}
    });
  },

  shown() {
    return Math.max(0, this.n | 0);
  },

  async beat() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    const me = AuthSystem.session && AuthSystem.session();
    if (!sb || !me || !me.id || me.guest) return;
    await sb.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", me.id);
  },

  async poll() {
    let rpc = 0;
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (sb) {
      try {
        const { data, error } = await sb.rpc("online_count");
        if (!error && data != null) rpc = Math.max(0, data | 0);
      } catch (e) {}
    }
    try { await MatchLive.pull(); } catch (e) {}
    const live = Math.max(0,
      ((MatchLive.exhibit) | 0) +
      ((MatchLive.ranked) | 0) +
      ((MatchLive.matches) | 0) * 2
    );
    this.n = Math.max(rpc, live);
    this.emit();
    return this.shown();
  },

  tick() {
    const now = Date.now();
    if (AuthSystem.canPlay && AuthSystem.canPlay() && now - this.heartAt > HEART_MS) {
      this.heartAt = now;
      this.beat();
    }
    if (now - this.at > POLL_MS) {
      this.at = now;
      this.poll();
    }
  }
};
