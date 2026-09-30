import { dayKey } from "./monthPass.js";

export const DAILY_GIFTS = [
  { coins: 8 },
  { coins: 12 },
  { vial: 1 },
  { coins: 16 },
  { shards: 2 },
  { coins: 22 },
  { coins: 30, powder: 1 }
];

export function emptyDaily() {
  return { streak: 0, lastClaim: "", lastSeen: "" };
}

export function dailyIndex(streak) {
  const n = Math.max(1, streak | 0);
  return (n - 1) % DAILY_GIFTS.length;
}

export function dailyGiftOf(streak) {
  return DAILY_GIFTS[dailyIndex(streak)];
}

export function nextDailyStreak(row) {
  const today = dayKey();
  const d = row || emptyDaily();
  if (d.lastClaim === today) return Math.max(1, d.streak | 0);
  return Math.max(1, (d.streak | 0) + 1);
}

export { dayKey };
