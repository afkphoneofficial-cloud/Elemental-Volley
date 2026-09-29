import { SERVER_TZ } from "./timeZones.js";

const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function part(parts, type) {
  const row = parts.find((p) => p.type === type);
  return row ? row.value : "";
}

export function bangkokWall(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SERVER_TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  return {
    y: +part(parts, "year"),
    m: +part(parts, "month"),
    d: +part(parts, "day"),
    h: +part(parts, "hour"),
    min: +part(parts, "minute"),
    s: +part(parts, "second"),
    dow: WD[part(parts, "weekday")] | 0
  };
}

export function addYmd(y, m, d, n) {
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function mondayOf(wall) {
  const back = wall.dow === 0 ? 6 : wall.dow - 1;
  return addYmd(wall.y, wall.m, wall.d, -back);
}

export function weekFromStart(start) {
  const end = addYmd(start.y, start.m, start.d, 6);
  const id = start.y + "-" + String(start.m).padStart(2, "0") + "-" + String(start.d).padStart(2, "0");
  return { id, start, end };
}

export function rankingWeek(date = new Date()) {
  return weekFromStart(mondayOf(bangkokWall(date)));
}

export function previousRankingWeek(date = new Date()) {
  const cur = rankingWeek(date);
  return weekFromStart(addYmd(cur.start.y, cur.start.m, cur.start.d, -7));
}

export function isRankWindowOpen(kind, date = new Date()) {
  const dow = bangkokWall(date).dow;
  if (kind === "pvp") return dow >= 1 && dow <= 4;
  if (kind === "special") return dow === 5 || dow === 6 || dow === 0;
  return true;
}

function daysUntilDow(dow, target) {
  const add = (target - dow + 7) % 7;
  return add === 0 ? 7 : add;
}

export function nextRankOpenYmd(kind, date = new Date()) {
  const wall = bangkokWall(date);
  if (isRankWindowOpen(kind, date)) return { y: wall.y, m: wall.m, d: wall.d };
  const target = kind === "pvp" ? 1 : 5;
  return addYmd(wall.y, wall.m, wall.d, daysUntilDow(wall.dow, target));
}

export function formatYmd(ymd, lang) {
  const locale = lang === "en" ? "en-GB" : "th-TH";
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 12, 0, 0));
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(dt);
  } catch (e) {
    return ymd.d + "/" + ymd.m + "/" + ymd.y;
  }
}

export function formatYmdShort(ymd, lang) {
  const locale = lang === "en" ? "en-GB" : "th-TH";
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 12, 0, 0));
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      day: "numeric",
      month: "short"
    }).format(dt);
  } catch (e) {
    return ymd.d + "/" + ymd.m;
  }
}

export function rankWindow(kind, date = new Date()) {
  const open = isRankWindowOpen(kind, date);
  const week = rankingWeek(date);
  const next = nextRankOpenYmd(kind, date);
  return { open, week, next };
}
