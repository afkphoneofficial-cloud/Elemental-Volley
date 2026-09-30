import { dayKey, monthId, monthIndex, monthParts, passPool } from "./monthPass.js";
import { bangkokWall } from "./rankWindows.js";

export const DAILY_CYCLE = [
  { coins: 8 },
  { coins: 12 },
  { vial: 1 },
  { coins: 16 },
  { shards: 2 },
  { coins: 22 },
  { coins: 30, powder: 1 }
];

export const DAILY_LOOK_NEED = 20;
export const DAILY_DUP_POWDER = 30;

export function emptyDaily() {
  return { lastClaim: "", lastSeen: "", claimed: {}, costumeMonth: "", costumeKind: "" };
}

export function daysInMonthId(id) {
  const { y, m } = monthParts(id || monthId());
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function dailyMonthPad(id) {
  const { y, m } = monthParts(id || monthId());
  return bangkokWall(new Date(Date.UTC(y, m - 1, 1, 5, 0, 0))).dow;
}

function seedOf(id) {
  let h = 2166136261;
  const s = "daily-table|" + String(id || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function dailyMonthTable(id) {
  const mid = id || monthId();
  const n = daysInMonthId(mid);
  const bag = [];
  for (let i = 0; i < n; i++) {
    const src = DAILY_CYCLE[i % DAILY_CYCLE.length];
    bag.push({ ...src });
  }
  const rng = mulberry32(seedOf(mid));
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  return bag;
}

export function dailyGiftOn(date = new Date()) {
  const key = dayKey(date);
  const mid = key.slice(0, 7);
  const d = Math.max(1, +key.slice(8) || 1);
  const table = dailyMonthTable(mid);
  return table[Math.min(table.length, d) - 1] || DAILY_CYCLE[0];
}

export function dailyLookOf(id) {
  const pool = passPool();
  if (!pool.length) return null;
  const n = pool.length;
  const i = (((monthIndex(id) + 7) % n) + n) % n;
  return pool[i];
}

export function claimedDaysOf(row, id) {
  const mid = id || monthId();
  const d = row || emptyDaily();
  const map = d.claimed && typeof d.claimed === "object" && !Array.isArray(d.claimed) ? d.claimed : {};
  let n = 0;
  Object.keys(map).forEach((key) => {
    if (map[key] && String(key).slice(0, 7) === mid) n += 1;
  });
  if (d.lastClaim && String(d.lastClaim).slice(0, 7) === mid && !map[d.lastClaim]) n += 1;
  return n;
}

export { dayKey, monthId };
