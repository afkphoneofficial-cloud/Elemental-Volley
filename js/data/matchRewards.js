/** Match payouts from score + mode. Hits are ignored on purpose. */

export function matchRewards(opts) {
  const mode = opts && opts.mode;
  const win = opts && opts.win === true;
  const you = Math.max(0, (opts && opts.youScore) | 0);
  const foe = Math.max(0, (opts && opts.foeScore) | 0);
  const margin = Math.max(0, you - foe);
  const out = { stones: 0, shards: 0, xp: 0, firstWinEligible: false };
  if (mode === "exhibit") return out;
  if (mode === "bot") {
    const diff = opts && opts.difficulty === "easy" ? "easy" : opts && opts.difficulty === "hard" ? "hard" : "normal";
    if (win) {
      if (diff === "easy") out.stones = Math.min(24, 6 + you + Math.floor(margin / 4));
      else if (diff === "hard") out.stones = Math.min(40, 14 + you + Math.floor(margin * 0.75));
      else out.stones = Math.min(32, 10 + you + Math.floor(margin / 2));
      out.firstWinEligible = out.stones > 0;
    }
    let raw = 0;
    if (win) {
      if (diff === "easy") raw = 14 + you + Math.floor(margin / 3);
      else if (diff === "hard") raw = 36 + you + margin;
      else raw = 22 + you + Math.floor(margin / 2);
    } else if (diff === "easy") raw = Math.min(18, 6 + you);
    else if (diff === "hard") raw = Math.min(26, 10 + you);
    else raw = Math.min(22, 8 + you);
    out.xp = raw * 4;
    return out;
  }
  if (mode === "pvp") {
    if (win) out.shards = Math.min(3, 2 + (margin >= 4 ? 1 : 0));
    return out;
  }
  if (mode === "special") {
    if (win) out.xp = Math.min(32, 12 + you + Math.floor(margin / 3)) * 4;
    else out.xp = Math.min(16, 5 + you) * 4;
    return out;
  }
  return out;
}

export function hasMatchLoot(row) {
  return ((row && row.stones) | 0) > 0 || ((row && row.shards) | 0) > 0 || ((row && row.xp) | 0) > 0;
}
