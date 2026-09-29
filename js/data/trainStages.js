import { MAP_LOCS } from "./worldMap.js";

export const TRAIN_DIFFS = ["easy", "normal", "hard"];
export const TRAIN_CHARS = ["ignis", "aqua", "volt", "terra"];

const OFFSETS = {
  ignis: [
    { dx: -0.08, dy: -0.10 },
    { dx: 0.08, dy: -0.09 },
    { dx: 0.00, dy: 0.08 }
  ],
  aqua: [
    { dx: 0.09, dy: -0.10 },
    { dx: 0.10, dy: 0.08 },
    { dx: -0.05, dy: 0.11 }
  ],
  volt: [
    { dx: -0.09, dy: -0.09 },
    { dx: -0.09, dy: 0.10 },
    { dx: 0.07, dy: 0.07 }
  ],
  terra: [
    { dx: -0.08, dy: -0.10 },
    { dx: 0.09, dy: -0.08 },
    { dx: 0.01, dy: 0.11 }
  ]
};

export const TRAIN_STAGES = TRAIN_CHARS.flatMap((char) => TRAIN_DIFFS.map((diff, i) => ({
  id: char + "-" + diff,
  char,
  diff,
  rank: i + 1,
  dx: OFFSETS[char][i].dx,
  dy: OFFSETS[char][i].dy
})));

export function trainStageById(id) {
  return TRAIN_STAGES.find((row) => row.id === id) || null;
}

export function trainMapXY(stage) {
  const loc = MAP_LOCS.find((row) => row.char === stage.char);
  const x = loc ? loc.x + stage.dx : 0.5;
  const y = loc ? loc.y + stage.dy : 0.5;
  return {
    x: Math.max(0.05, Math.min(0.95, x)),
    y: Math.max(0.08, Math.min(0.92, y))
  };
}

export function isTrainOpen(cleared, id) {
  const i = TRAIN_STAGES.findIndex((row) => row.id === id);
  if (i < 0) return false;
  if (i === 0) return true;
  const have = cleared || [];
  return have.includes(TRAIN_STAGES[i - 1].id);
}

export function isTrainCleared(cleared, id) {
  return (cleared || []).includes(id);
}
