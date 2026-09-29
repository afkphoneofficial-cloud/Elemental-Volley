import { ROSTER, ROSTER_IDS } from "./roster.js";

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
  return mode === "bot" || mode === "special";
}

export function defaultSpent() {
  return { spike: 13, touch: 13, aim: 12, spring: 12 };
}

export function emptyCharGrowth() {
  return {
    xp: 0,
    spent: defaultSpent()
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

export function clampGrowth(raw) {
  const row = raw && typeof raw === "object" ? raw : {};
  const fallback = defaultSpent();
  const spentIn = row.spent && typeof row.spent === "object" ? row.spent : fallback;
  const spent = {};
  STAT_IDS.forEach((id) => { spent[id] = Math.max(0, spentIn[id] | 0); });
  return {
    xp: Math.max(0, row.xp | 0),
    spent
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

export function normalizeRow(charId, row) {
  const id = ROSTER[charId] ? charId : "ignis";
  const g = clampGrowth(row);
  const level = levelFromXp(g.xp).level;
  const sig = ELEMENT_GIFT[id];
  const gift = giftPoints(level);
  const pool = pointPool(level);
  STAT_IDS.forEach((s) => {
    const cap = spendCapFor(id, s, level);
    if (g.spent[s] > cap) g.spent[s] = cap;
  });
  let sum = STAT_IDS.reduce((n, s) => n + g.spent[s], 0);
  if (sum > pool) {
    let over = sum - pool;
    const order = STAT_IDS.slice().sort((a, b) => g.spent[b] - g.spent[a]);
    order.forEach((s) => {
      if (over <= 0) return;
      const cut = Math.min(g.spent[s], over);
      g.spent[s] -= cut;
      over -= cut;
    });
  }
  return g;
}

export function sheetFromRow(charId, row) {
  const id = ROSTER[charId] ? charId : "ignis";
  const g = normalizeRow(id, row);
  const prog = levelFromXp(g.xp);
  const pool = pointPool(prog.level);
  const gift = giftPoints(prog.level);
  const sig = ELEMENT_GIFT[id];
  const spentSum = STAT_IDS.reduce((n, s) => n + g.spent[s], 0);
  const totals = {};
  const caps = {};
  STAT_IDS.forEach((s) => {
    const gft = s === sig ? gift : 0;
    caps[s] = STAT_CAP - gft;
    totals[s] = Math.min(STAT_CAP, g.spent[s] + gft);
  });
  return {
    id,
    xp: g.xp,
    level: prog.level,
    into: prog.into,
    need: prog.need,
    spent: g.spent,
    totals,
    caps,
    unspent: pool - spentSum,
    gift,
    giftStat: sig,
    pool,
    specialReady: prog.level >= GROWTH_SPECIAL_LV
  };
}

export function spendNpc(charId, level) {
  const lv = Math.max(1, Math.min(GROWTH_MAX_LV, level | 0));
  const pool = pointPool(lv);
  const spent = { spike: 0, touch: 0, aim: 0, spring: 0 };
  const sig = ELEMENT_GIFT[ROSTER[charId] ? charId : "ignis"];
  const intoGift = Math.min(spendCapFor(charId, sig, lv), Math.floor(pool * 0.45));
  spent[sig] = intoGift;
  let left = pool - intoGift;
  const rest = STAT_IDS.filter((s) => s !== sig);
  rest.forEach((s, i) => {
    const cap = spendCapFor(charId, s, lv);
    const n = i === rest.length - 1 ? left : Math.floor(left / rest.length);
    spent[s] = Math.min(cap, n);
    left -= spent[s];
  });
  if (left > 0) spent[sig] = Math.min(spendCapFor(charId, sig, lv), spent[sig] + left);
  return { xp: xpAtLevel(lv), spent };
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
