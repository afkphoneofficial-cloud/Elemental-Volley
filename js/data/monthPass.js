import { bangkokWall } from "./rankWindows.js";
import { SHOP_LOOKS } from "./costumeShop.js";

export const PASS = {
  thb: 59,
  instantPowder: 40,
  dailyPowder: 1,
  dailyStone: 2,
  ownedLookPowder: 30,
  dupBuyPowder: 20,
  vialDays: [7, 15, 23],
  vialN: 1,
  epochYear: 2026,
  epochMonth: 1
};

const BKK_MS = 7 * 60 * 60 * 1000;

function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

export function monthId(date = new Date()) {
  const w = bangkokWall(date);
  return w.y + "-" + pad(w.m);
}

export function dayKey(date = new Date()) {
  const w = bangkokWall(date);
  return w.y + "-" + pad(w.m) + "-" + pad(w.d);
}

export function monthParts(id) {
  const p = String(id || "").split("-");
  return { y: +p[0] || 2026, m: +p[1] || 1 };
}

export function monthIndex(id) {
  const { y, m } = monthParts(id || monthId());
  return (y - PASS.epochYear) * 12 + (m - PASS.epochMonth);
}

export function bangkokMidnightMs(y, m, d) {
  return Date.UTC(y, m - 1, d, 0, 0, 0) - BKK_MS;
}

export function monthEndMs(id) {
  const { y, m } = monthParts(id || monthId());
  let ny = y;
  let nm = m + 1;
  if (nm > 12) {
    nm = 1;
    ny += 1;
  }
  return bangkokMidnightMs(ny, nm, 1);
}

export function msUntilMonthEnd(date = new Date()) {
  return monthEndMs(monthId(date)) - date.getTime();
}

export function formatRemain(ms) {
  const n = Math.max(0, Number(ms) || 0);
  const s = Math.floor(n / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (v) => (v < 10 ? "0" + v : String(v));
  if (d > 0) return d + "d  " + p(h) + ":" + p(m) + ":" + p(sec);
  return p(h) + ":" + p(m) + ":" + p(sec);
}

export function passPool() {
  return SHOP_LOOKS.filter((row) => row.open && row.tier === "mist");
}

export function passLookOf(id) {
  const pool = passPool();
  if (!pool.length) return null;
  const i = ((monthIndex(id) % pool.length) + pool.length) % pool.length;
  return pool[i];
}

export function vialDayOn(date = new Date()) {
  const w = bangkokWall(date);
  return PASS.vialDays.indexOf(w.d) >= 0;
}

export function vialDaysLabel() {
  return PASS.vialDays.join(" · ");
}

export function passInstantGift() {
  return { powder: PASS.instantPowder };
}

export function passDailyGift(date = new Date()) {
  const gift = { powder: PASS.dailyPowder, stones: PASS.dailyStone };
  if (vialDayOn(date)) gift.vial = PASS.vialN;
  return gift;
}

export function daysInMonthId(id) {
  const { y, m } = monthParts(id || monthId());
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function elapsedDayInMonth(id, date = new Date()) {
  const mid = id || monthId(date);
  if (monthId(date) !== mid) return daysInMonthId(mid);
  return bangkokWall(date).d;
}

export function passDailyGiftForDay(d) {
  const gift = { powder: PASS.dailyPowder, stones: PASS.dailyStone };
  if (PASS.vialDays.indexOf(d | 0) >= 0) gift.vial = PASS.vialN;
  return gift;
}

export function passDayKey(id, d) {
  return String(id || monthId()) + "-" + pad(d | 0);
}

export const PASS_SKU = "pass";
