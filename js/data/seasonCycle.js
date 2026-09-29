import { previousRankingWeek, rankingWeek } from "./rankWindows.js";

export const SEASON_CYCLE_LEN = 12;
export const SEASON_ELEMENTS = ["ignis", "aqua", "volt", "terra"];

export function seasonCycleIndex(week) {
  const w = week || rankingWeek();
  const t = Date.UTC(w.start.y, w.start.m - 1, w.start.d);
  const epoch = Date.UTC(2026, 0, 5);
  const n = Math.floor((t - epoch) / 604800000);
  return ((n % SEASON_CYCLE_LEN) + SEASON_CYCLE_LEN) % SEASON_CYCLE_LEN;
}

export function seasonCycleOf(index) {
  const i = ((index | 0) % SEASON_CYCLE_LEN + SEASON_CYCLE_LEN) % SEASON_CYCLE_LEN;
  const element = SEASON_ELEMENTS[i % 4];
  const set = (Math.floor(i / 4) | 0) + 1;
  return {
    index: i,
    element,
    set,
    champItem: "champ-" + element + "-" + set,
    champPlate: "plate-champ-" + element + "-" + set,
    runnerPlate: "plate-runner-" + element + "-" + set,
    framePlate: "plate-frame-" + element + "-" + set,
    selectSrc: "select-champ-" + element + "-" + set,
    selectKey: "vis_select_champ_" + element + "_" + set
  };
}

export function plateKindForPlace(place) {
  const p = place | 0;
  if (p === 1) return "champ";
  if (p >= 2 && p <= 3) return "runner";
  if (p >= 4 && p <= 10) return "frame";
  return "";
}

export function plateKey(kind, cycle) {
  if (!cycle) return "";
  if (kind === "champ") return cycle.champPlate;
  if (kind === "runner") return cycle.runnerPlate;
  if (kind === "frame") return cycle.framePlate;
  return "";
}

export function liveSeasonMark(mark, date) {
  if (!mark || !mark.week) return null;
  if (previousRankingWeek(date).id !== mark.week) return null;
  return mark;
}

export const CHAMP_ITEMS = {};
SEASON_ELEMENTS.forEach((el) => {
  [1, 2, 3].forEach((set) => {
    const id = "champ-" + el + "-" + set;
    CHAMP_ITEMS[id] = {
      id,
      kind: "use",
      icon: "vis_select_champ_" + el + "_" + set,
      effect: "champSkin",
      charId: el,
      set
    };
  });
});

export const SEASON_ART = [];
SEASON_ELEMENTS.forEach((el) => {
  [1, 2, 3].forEach((set) => {
    SEASON_ART.push("select-champ-" + el + "-" + set);
    SEASON_ART.push("champ-" + el + "-" + set + "-left");
    SEASON_ART.push("champ-" + el + "-" + set + "-cheer");
    SEASON_ART.push("champ-" + el + "-" + set + "-dive-left");
    SEASON_ART.push("plate-champ-" + el + "-" + set);
    SEASON_ART.push("plate-runner-" + el + "-" + set);
    SEASON_ART.push("plate-frame-" + el + "-" + set);
  });
});
