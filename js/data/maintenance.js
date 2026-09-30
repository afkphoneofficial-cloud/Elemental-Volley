import { BETA } from "./beta.js";
import { bangkokWall } from "./rankWindows.js";
import { dayKey } from "./monthPass.js?v=local190";

/** After live launch: every Wednesday 05:00–11:00 Asia/Bangkok. Off during beta. */
export const MAINT = {
  weekday: 3,
  startMin: 5 * 60,
  endMin: 11 * 60
};

export function liveLaunched(date = new Date()) {
  return dayKey(date) >= BETA.live;
}

export function maintenanceNow(date = new Date()) {
  if (!liveLaunched(date)) return false;
  const w = bangkokWall(date);
  if ((w.dow | 0) !== MAINT.weekday) return false;
  const mins = (w.h | 0) * 60 + (w.min | 0);
  return mins >= MAINT.startMin && mins < MAINT.endMin;
}

export function maintenanceUntil(date = new Date()) {
  if (!maintenanceNow(date)) return 0;
  const w = bangkokWall(date);
  const left = MAINT.endMin - ((w.h | 0) * 60 + (w.min | 0));
  const sec = Math.max(0, left * 60 - (w.s | 0));
  return sec * 1000;
}
