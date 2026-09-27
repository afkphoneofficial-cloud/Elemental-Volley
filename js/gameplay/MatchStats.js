export function emptyMatchStats() {
  return {
    ms: 0,
    hits: 0,
    powerHits: 0,
    ults: 0,
    bestStreak: 0,
    rallyTouches: 0,
    longestRally: 0,
    aces: 0,
    errors: 0,
    rallyBySide: [0, 0]
  };
}

export function formatMatchClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ":" + String(s).padStart(2, "0");
}

export function pickStatTalk(stats) {
  const s = stats || {};
  let good = "talkKeep";
  if ((s.aces | 0) >= 2) good = "talkAce";
  else if ((s.bestStreak | 0) >= 3) good = "talkStreak";
  else if ((s.longestRally | 0) >= 8) good = "talkRally";
  else if ((s.ults | 0) >= 1) good = "talkUlt";
  else if ((s.hits | 0) >= 12) good = "talkHits";
  let bad = "talkNext";
  if ((s.errors | 0) >= 3) bad = "talkError";
  else if ((s.powerHits | 0) <= 1 && (s.hits | 0) >= 8) bad = "talkNeedPower";
  else if ((s.aces | 0) === 0 && (s.hits | 0) >= 8) bad = "talkNoAce";
  return { good, bad };
}

export function snapshotMatchStats(raw) {
  const s = raw || emptyMatchStats();
  return {
    ms: Math.round(s.ms || 0),
    hits: s.hits | 0,
    powerHits: s.powerHits | 0,
    ults: s.ults | 0,
    bestStreak: s.bestStreak | 0,
    longestRally: s.longestRally | 0,
    aces: s.aces | 0,
    errors: s.errors | 0
  };
}
