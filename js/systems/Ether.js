import { ECONOMY } from "../data/economy.js";

export function emptyCareer() {
  return {
    matches: 0,
    wins: 0,
    losses: 0,
    aces: 0,
    ults: 0,
    hits: 0,
    powerHits: 0,
    errors: 0,
    playMs: 0,
    bestStreak: 0,
    longestRally: 0
  };
}

export function tickEther(data, now) {
  const max = ECONOMY.etherMax;
  const step = ECONOMY.etherRegenMs;
  const t = now || Date.now();
  let n = data.ether;
  if (n == null || n < 0) n = max;
  let at = data.etherAt || t;
  if (n >= max) {
    data.ether = max;
    data.etherAt = t;
    return { n: max, nextMs: 0, full: true };
  }
  const gained = Math.max(0, Math.floor((t - at) / step));
  if (gained > 0) {
    n = Math.min(max, n + gained);
    at += gained * step;
  }
  if (n >= max) {
    n = max;
    at = t;
  }
  data.ether = n;
  data.etherAt = at;
  const nextMs = n >= max ? 0 : Math.max(0, step - (t - at));
  return { n, nextMs, full: n >= max, room: Math.max(0, max - n) };
}

export function canTakeEther(data, amount, now) {
  const add = Math.max(0, amount | 0);
  if (!add) return true;
  const status = tickEther(data, now || Date.now());
  if (status.full) return false;
  return (status.n | 0) + add <= ECONOMY.etherMax;
}

export function formatEtherWait(nextMs) {
  const sec = Math.max(0, Math.ceil((nextMs || 0) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}
