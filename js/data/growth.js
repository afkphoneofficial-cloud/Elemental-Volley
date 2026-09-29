import { ROSTER, ROSTER_IDS } from "./roster.js";
import { matchRewards } from "./matchRewards.js";

export const GROWTH_MAX_LV = 50;
export const GROWTH_SPECIAL_LV = 40;
export const STAT_IDS = ["spike", "touch", "aim", "spring"];
export const STAT_CAP = 50;
export const START_POINTS = 50;
export const MAX_POINTS = 100;

export const ELEMENT_GIFT = {
  ignis: "spring",
  aqua: "touch",
  volt: "aim",
  terra: "spike"
};

export const GROWTH_FX = {
  jumpMul: [1, 1],
  walkMul: [1, 1],
  diveMul: [1, 1],
  lieMul: [1, 1],
  spikeMul: [1, 1],
  aimJitter: [1, 1]
};

export function resetGrowthFx() {
  GROWTH_FX.jumpMul = [1, 1];
  GROWTH_FX.walkMul = [1, 1];
  GROWTH_FX.diveMul = [1, 1];
  GROWTH_FX.lieMul = [1, 1];
  GROWTH_FX.spikeMul = [1, 1];
  GROWTH_FX.aimJitter = [1, 1];
}

export function statsLive(mode) {
  return mode === "bot" || mode === "special" || mode === "exhibit";
}

export function zeroSpent() {
  return { spike: 0, touch: 0, aim: 0, spring: 0 };
}

export function defaultSpent() {
  return { spike: 13, touch: 13, aim: 12, spring: 12 };
}

export function emptyCharGrowth() {
  return {
    xp: 0,
    spentStart: defaultSpent(),
    spentLevel: zeroSpent(),
    freeLevelRespec: true
  };
}

export function emptyGrowth() {
  const out = {};
  ROSTER_IDS.forEach((id) => { out[id] = emptyCharGrowth(); });
  return out;
}

export function giftPoints(level) {
  return Math.floor(Math.max(1, level | 0) / 10);
}

export function pointPool(level) {
  const lv = Math.max(1, Math.min(GROWTH_MAX_LV, level | 0));
  return START_POINTS + (lv - 1) + (lv >= GROWTH_MAX_LV ? 1 : 0);
}

export function spendCapFor(charId, stat, level) {
  const sig = ELEMENT_GIFT[ROSTER[charId] ? charId : "ignis"];
  const gift = stat === sig ? giftPoints(level) : 0;
  return STAT_CAP - gift;
}

export function levelPool(level) {
  return Math.max(0, pointPool(level) - START_POINTS);
}

function copySpent(src, fallback) {
  const spent = zeroSpent();
  const from = src && typeof src === "object" ? src : fallback;
  STAT_IDS.forEach((id) => { spent[id] = Math.max(0, (from && from[id]) | 0); });
  return spent;
}

function splitLegacySpent(spent) {
  const start = zeroSpent();
  const level = zeroSpent();
  let remain = START_POINTS;
  STAT_IDS.forEach((s) => {
    const n = Math.max(0, spent[s] | 0);
    const toStart = Math.min(n, remain);
    start[s] = toStart;
    level[s] = n - toStart;
    remain -= toStart;
  });
  return { spentStart: start, spentLevel: level };
}

export function clampGrowth(raw) {
  const row = raw && typeof raw === "object" ? raw : {};
  let spentStart;
  let spentLevel;
  if (row.spentStart || row.spentLevel) {
    spentStart = copySpent(row.spentStart, zeroSpent());
    spentLevel = copySpent(row.spentLevel, zeroSpent());
  } else if (row.spent) {
    const split = splitLegacySpent(row.spent);
    spentStart = split.spentStart;
    spentLevel = split.spentLevel;
  } else {
    spentStart = defaultSpent();
    spentLevel = zeroSpent();
  }
  return {
    xp: Math.max(0, row.xp | 0),
    spentStart,
    spentLevel,
    freeLevelRespec: row.freeLevelRespec !== false
  };
}

export function copyGrowth(raw) {
  const g = clampGrowth(raw);
  return {
    xp: g.xp,
    spentStart: copySpent(g.spentStart, zeroSpent()),
    spentLevel: copySpent(g.spentLevel, zeroSpent()),
    freeLevelRespec: g.freeLevelRespec
  };
}

export function growthEqual(a, b) {
  const A = clampGrowth(a);
  const B = clampGrowth(b);
  return STAT_IDS.every((s) => A.spentStart[s] === B.spentStart[s] && A.spentLevel[s] === B.spentLevel[s]);
}

export function trySpend(charId, row, stat) {
  if (!STAT_IDS.includes(stat)) return null;
  const sheet = sheetFromRow(charId, row);
  if ((sheet.spent[stat] | 0) >= (sheet.caps[stat] | 0)) return null;
  const next = copyGrowth(row);
  if (sheet.unspentStart > 0) next.spentStart[stat] += 1;
  else if (sheet.unspentLevel > 0) next.spentLevel[stat] += 1;
  else return null;
  return normalizeRow(charId, next);
}

export function tryUnspend(charId, row, saved, stat) {
  if (!STAT_IDS.includes(stat)) return null;
  const draft = copyGrowth(row);
  const base = copyGrowth(saved);
  if (draft.spentLevel[stat] > base.spentLevel[stat]) draft.spentLevel[stat] -= 1;
  else if (draft.spentStart[stat] > base.spentStart[stat]) draft.spentStart[stat] -= 1;
  else return null;
  return normalizeRow(charId, draft);
}

export function combinedSpent(g) {
  const spent = zeroSpent();
  STAT_IDS.forEach((s) => {
    spent[s] = (g.spentStart[s] | 0) + (g.spentLevel[s] | 0);
  });
  return spent;
}

function peel(spent, over) {
  const order = STAT_IDS.slice().sort((a, b) => spent[b] - spent[a]);
  order.forEach((s) => {
    if (over <= 0) return;
    const cut = Math.min(spent[s], over);
    spent[s] -= cut;
    over -= cut;
  });
}

export function xpToNext(level) {
  const lv = Math.max(1, Math.min(GROWTH_MAX_LV, level | 0));
  if (lv >= GROWTH_MAX_LV) return 0;
  return 64 + (lv - 1) * 20;
}

export function levelFromXp(xp) {
  let lv = 1;
  let rest = Math.max(0, xp | 0);
  while (lv < GROWTH_MAX_LV) {
    const need = xpToNext(lv);
    if (rest < need) return { level: lv, into: rest, need };
    rest -= need;
    lv += 1;
  }
  return { level: GROWTH_MAX_LV, into: 0, need: 0 };
}

export function normalizeRow(charId, row) {
  const id = ROSTER[charId] ? charId : "ignis";
  const g = clampGrowth(row);
  const level = levelFromXp(g.xp).level;
  const poolLv = levelPool(level);
  STAT_IDS.forEach((s) => {
    const cap = spendCapFor(id, s, level);
    let extra = g.spentStart[s] + g.spentLevel[s] - cap;
    if (extra > 0) {
      const cutLv = Math.min(g.spentLevel[s], extra);
      g.spentLevel[s] -= cutLv;
      extra -= cutLv;
      if (extra > 0) g.spentStart[s] -= extra;
    }
  });
  let sumStart = STAT_IDS.reduce((n, s) => n + g.spentStart[s], 0);
  if (sumStart > START_POINTS) peel(g.spentStart, sumStart - START_POINTS);
  let sumLv = STAT_IDS.reduce((n, s) => n + g.spentLevel[s], 0);
  if (sumLv > poolLv) peel(g.spentLevel, sumLv - poolLv);
  return g;
}

export function sheetFromRow(charId, row) {
  const id = ROSTER[charId] ? charId : "ignis";
  const g = normalizeRow(id, row);
  const prog = levelFromXp(g.xp);
  const pool = pointPool(prog.level);
  const poolLv = levelPool(prog.level);
  const gift = giftPoints(prog.level);
  const sig = ELEMENT_GIFT[id];
  const spent = combinedSpent(g);
  const sumStart = STAT_IDS.reduce((n, s) => n + g.spentStart[s], 0);
  const sumLv = STAT_IDS.reduce((n, s) => n + g.spentLevel[s], 0);
  const totals = {};
  const caps = {};
  STAT_IDS.forEach((s) => {
    const gft = s === sig ? gift : 0;
    caps[s] = STAT_CAP - gft;
    totals[s] = Math.min(STAT_CAP, spent[s] + gft);
  });
  return {
    id,
    xp: g.xp,
    level: prog.level,
    into: prog.into,
    need: prog.need,
    spent,
    spentStart: g.spentStart,
    spentLevel: g.spentLevel,
    totals,
    caps,
    unspent: (START_POINTS - sumStart) + (poolLv - sumLv),
    unspentStart: START_POINTS - sumStart,
    unspentLevel: poolLv - sumLv,
    gift,
    giftStat: sig,
    pool,
    freeLevelRespec: g.freeLevelRespec === true,
    specialReady: prog.level >= GROWTH_SPECIAL_LV
  };
}

export function spendNpc(charId, level) {
  const lv = Math.max(1, Math.min(GROWTH_MAX_LV, level | 0));
  const start = defaultSpent();
  const spentLevel = zeroSpent();
  const poolLv = levelPool(lv);
  const sig = ELEMENT_GIFT[ROSTER[charId] ? charId : "ignis"];
  let left = poolLv;
  const intoGift = Math.min(spendCapFor(charId, sig, lv) - start[sig], Math.floor(left * 0.5));
  spentLevel[sig] = Math.max(0, intoGift);
  left -= spentLevel[sig];
  const rest = STAT_IDS.filter((s) => s !== sig);
  rest.forEach((s, i) => {
    const room = spendCapFor(charId, s, lv) - start[s] - spentLevel[s];
    const n = i === rest.length - 1 ? left : Math.floor(left / rest.length);
    spentLevel[s] = Math.max(0, Math.min(room, n));
    left -= spentLevel[s];
  });
  return { xp: xpAtLevel(lv), spentStart: start, spentLevel, freeLevelRespec: false };
}

export function xpAtLevel(level) {
  let xp = 0;
  for (let lv = 1; lv < level; lv += 1) xp += xpToNext(lv);
  return xp;
}

export function botSheet(charId, difficulty) {
  const lv = difficulty === "easy" ? 8 : difficulty === "hard" ? 32 : 18;
  return sheetFromRow(charId, spendNpc(charId, lv));
}

export function xpForBotMatch(win, difficulty, youScore, foeScore) {
  const you = youScore == null ? (win ? 15 : 10) : youScore;
  const foe = foeScore == null ? (win ? 10 : 15) : foeScore;
  return matchRewards({
    mode: "bot",
    win: win === true,
    difficulty,
    youScore: you,
    foeScore: foe
  }).xp;
}

function t01(n) {
  return Math.max(0, Math.min(1, (n | 0) / STAT_CAP));
}

export function modsFromTotals(totals) {
  const n = (id) => Math.max(0, (totals && totals[id]) | 0);
  const spring = t01(n("spring"));
  const touch = t01(n("touch"));
  return {
    jumpMul: 0.72 + 0.28 * spring,
    walkMul: 0.84 + 0.16 * touch,
    diveMul: 0.74 + 0.26 * ((spring + touch) * 0.5),
    lieMul: 1.5 - 0.5 * touch,
    spikeMul: 0.78 + 0.22 * t01(n("spike")),
    aimJitter: 1.4 - 0.4 * t01(n("aim"))
  };
}

export function applyGrowthFx(youSide, youMods, foeMods) {
  resetGrowthFx();
  const iYou = youSide === 2 ? 1 : 0;
  const iFoe = 1 - iYou;
  const put = (i, m) => {
    const n = (v, d) => {
      const x = Number(v);
      if (!Number.isFinite(x)) return d;
      return Math.max(0.35, Math.min(1.6, x));
    };
    GROWTH_FX.jumpMul[i] = n(m && m.jumpMul, 1);
    GROWTH_FX.walkMul[i] = n(m && m.walkMul, 1);
    GROWTH_FX.diveMul[i] = n(m && m.diveMul, 1);
    GROWTH_FX.lieMul[i] = n(m && m.lieMul, 1);
    GROWTH_FX.spikeMul[i] = n(m && m.spikeMul, 1);
    GROWTH_FX.aimJitter[i] = n(m && m.aimJitter, 1);
  };
  put(iYou, youMods);
  put(iFoe, foeMods);
}
