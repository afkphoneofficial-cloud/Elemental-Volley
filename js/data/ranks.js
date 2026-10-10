/** Court rank ladder: medals, sparks, and hidden court score. */
export const RANK_STAR_MMR = 154;
export const RANK_CAL_GAMES = 10;
export const RANK_CAL_ID = "calibrating";
export const RANK_START_MMR = 1000;

export const RANK_TIERS = [
  { id: "sandling", color: 0xc4a070, stars: 5 },
  { id: "netling", color: 0x6db37a, stars: 5 },
  { id: "server", color: 0x4aa8d8, stars: 5 },
  { id: "setter", color: 0x7d6cff, stars: 5 },
  { id: "ace", color: 0xff8a3a, stars: 5 },
  { id: "island", color: 0xe04a6a, stars: 5 },
  { id: "primal", color: 0x3ad6ff, stars: 5 },
  { id: "eternal", color: 0xffd24a, stars: 0 }
];

export const RANK_IMMORTAL_MMR = RANK_TIERS.slice(0, 7).reduce((n, t) => n + t.stars * RANK_STAR_MMR, 0);

export function emptyRank() {
  return { mmr: RANK_START_MMR, games: 0, wins: 0, losses: 0, week: "" };
}

export function medalFromMmr(mmr) {
  const v = Math.max(0, mmr | 0);
  if (v >= RANK_IMMORTAL_MMR) {
    return { tier: RANK_TIERS.length - 1, star: 0, mmr: v, id: "eternal" };
  }
  const starIndex = Math.min(34, Math.floor(v / RANK_STAR_MMR));
  const tier = Math.floor(starIndex / 5);
  const star = (starIndex % 5) + 1;
  const row = RANK_TIERS[tier] || RANK_TIERS[0];
  return { tier, star, mmr: v, id: row.id };
}

export function kFactor(rank) {
  const games = (rank && rank.games) | 0;
  const mmr = (rank && rank.mmr) | 0;
  if (games < RANK_CAL_GAMES) return 50;
  if (mmr >= RANK_IMMORTAL_MMR) return 20;
  if (mmr >= 3850) return 24;
  return 32;
}

export function expectedScore(youMmr, oppMmr) {
  return 1 / (1 + Math.pow(10, ((oppMmr - youMmr) / 400)));
}

export function mmrDelta(rank, oppMmr, win, scoreGap) {
  const k = kFactor(rank);
  const exp = expectedScore(rank.mmr || RANK_START_MMR, oppMmr);
  const score = win ? 1 : 0;
  let d = Math.round(k * (score - exp));
  const gap = Math.max(0, Math.min(6, (scoreGap | 0)));
  if (win) d += Math.floor(gap / 2);
  else d -= Math.floor(gap / 3);
  if (d === 0) d = win ? 1 : -1;
  return d;
}

export function applyRankedMatch(rank, oppMmr, win, scoreGap) {
  const next = { ...emptyRank(), ...(rank || {}) };
  const delta = mmrDelta(next, oppMmr, win, scoreGap);
  next.mmr = Math.max(0, (next.mmr | 0) + delta);
  next.games += 1;
  if (win) next.wins += 1;
  else next.losses += 1;
  return { rank: next, delta, before: medalFromMmr((rank && rank.mmr) || RANK_START_MMR), after: medalFromMmr(next.mmr) };
}

export function isCalibrating(rank) {
  return ((rank && rank.games) | 0) < RANK_CAL_GAMES;
}

export function difficultyFromMmr(mmr) {
  if (mmr < 900) return "easy";
  if (mmr < 2800) return "normal";
  return "hard";
}

export function searchWindow(elapsedMs) {
  const steps = Math.floor(Math.max(0, elapsedMs) / 1800);
  return Math.min(720, 120 + steps * 80);
}

export function badgeKey(id) {
  return "vis_rank_" + id;
}

export function displayBadgeId(rank) {
  if (isCalibrating(rank)) return RANK_CAL_ID;
  return medalFromMmr((rank && rank.mmr) | 0).id;
}
