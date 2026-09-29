import { ROSTER, ROSTER_IDS } from "./roster.js";

export const GROWTH_MAX_LV = 50;
export const GROWTH_SPECIAL_LV = 40;
export const STAT_IDS = ["spike", "touch", "aim", "spring"];

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
  return mode === "bot" || mode === "special";
}

export function emptyCharGrowth() {
  return {
    xp: 0,
    spent: { spike: 0, touch: 0, aim: 0, spring: 0 },
    freeRespec: true
  };
}

export function emptyGrowth() {
  const out = {};
  ROSTER_IDS.forEach((id) => { out[id] = emptyCharGrowth(); });
  return out;
}

export function clampGrowth(raw) {
  const base = emptyCharGrowth();
  const row = raw && typeof raw === "object" ? raw : {};
  const spent = { ...base.spent, ...(row.spent || {}) };
  STAT_IDS.forEach((id) => { spent[id] = Math.max(0, spent[id] | 0); });
  return {
    xp: Math.max(0, row.xp | 0),
    spent,
    freeRespec: row.freeRespec !== false
  };
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

export function giftPoints(level) {
  return Math.floor(Math.max(1, level | 0) / 10);
}

export function spendCap(level) {
  const pool = Math.max(0, (level | 0) - 1);
  return Math.max(6, Math.ceil(pool * 0.62));
}

export function sheetFromRow(charId, row) {
  const id = ROSTER[charId] ? charId : "ignis";
  const g = clampGrowth(row);
  const prog = levelFromXp(g.xp);
  const pool = Math.max(0, prog.level - 1);
  let spentSum = 0;
  STAT_IDS.forEach((s) => { spentSum += g.spent[s]; });
  if (spentSum > pool) {
    const scale = pool / spentSum;
    STAT_IDS.forEach((s) => { g.spent[s] = Math.floor(g.spent[s] * scale); });
    spentSum = STAT_IDS.reduce((n, s) => n + g.spent[s], 0);
  }
  const gift = giftPoints(prog.level);
  const sig = ELEMENT_GIFT[id];
  const totals = {};
  STAT_IDS.forEach((s) => {
    totals[s] = g.spent[s] + (s === sig ? gift : 0);
  });
  return {
    id,
    xp: g.xp,
    level: prog.level,
    into: prog.into,
    need: prog.need,
    spent: g.spent,
    totals,
    unspent: pool - spentSum,
    gift,
    giftStat: sig,
    freeRespec: g.freeRespec,
    cap: spendCap(prog.level),
    specialReady: prog.level >= GROWTH_SPECIAL_LV
  };
}

export function spendNpc(charId, level) {
  const lv = Math.max(1, Math.min(GROWTH_MAX_LV, level | 0));
  const pool = lv - 1;
  const spent = { spike: 0, touch: 0, aim: 0, spring: 0 };
  const sig = ELEMENT_GIFT[ROSTER[charId] ? charId : "ignis"];
  const cap = spendCap(lv);
  const intoGift = Math.min(cap, Math.floor(pool * 0.5));
  spent[sig] = intoGift;
  let left = pool - intoGift;
  const rest = STAT_IDS.filter((s) => s !== sig);
  rest.forEach((s, i) => {
    const n = i === rest.length - 1 ? left : Math.floor(left / rest.length);
    spent[s] = Math.min(cap, n);
    left -= spent[s];
  });
  if (left > 0) spent[sig] = Math.min(cap, spent[sig] + left);
  return { xp: xpAtLevel(lv), spent, freeRespec: false };
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

export function xpForBotMatch(win, difficulty) {
  if (difficulty === "easy") return win ? 28 : 12;
  if (difficulty === "hard") return win ? 64 : 22;
  return win ? 42 : 16;
}

export function modsFromTotals(totals) {
  const n = (id) => Math.max(0, (totals && totals[id]) | 0);
  return {
    jumpMul: 1 + n("spring") * 0.012,
    walkMul: 1 + n("touch") * 0.005,
    diveMul: 1 + n("spring") * 0.01 + n("touch") * 0.004,
    lieMul: 1 / (1 + n("touch") * 0.022),
    spikeMul: 1 + n("spike") * 0.014,
    aimJitter: Math.max(0.15, 1 - n("aim") * 0.028)
  };
}

export function applyGrowthFx(youSide, youMods, foeMods) {
  resetGrowthFx();
  const iYou = youSide === 2 ? 1 : 0;
  const iFoe = 1 - iYou;
  const put = (i, m) => {
    GROWTH_FX.jumpMul[i] = m.jumpMul;
    GROWTH_FX.walkMul[i] = m.walkMul;
    GROWTH_FX.diveMul[i] = m.diveMul;
    GROWTH_FX.lieMul[i] = m.lieMul;
    GROWTH_FX.spikeMul[i] = m.spikeMul;
    GROWTH_FX.aimJitter[i] = m.aimJitter;
  };
  put(iYou, youMods);
  put(iFoe, foeMods);
}
