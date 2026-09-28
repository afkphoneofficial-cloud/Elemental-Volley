import { WORLD, SCALE } from "../gameplay/ArcadeEngine.js";

export const GAME = {
  width: 1280,
  height: 720,
  sx: SCALE,
  sy: SCALE,
  ox: (1280 - WORLD.width * SCALE) / 2,
  netX: (1280 - WORLD.width * SCALE) / 2 + WORLD.half * SCALE,
  groundY: WORLD.ballGroundY * SCALE,
  netTop: 176 * SCALE,
  courtLeft: (1280 - WORLD.width * SCALE) / 2,
  courtRight: (1280 - WORLD.width * SCALE) / 2 + WORLD.width * SCALE,
  winScore: 15,
  pauseMs: 20000,
  forfeitMs: 30000
};

export const PHYSICS = {
  fps: 25
};

export const CONTROLS = {
  left: "LEFT",
  right: "RIGHT",
  jump: "UP",
  down: "DOWN",
  hit: "ENTER"
};

export const MATCH = {
  maxTouches: 99
};

export function seasonId(date = new Date()) {
  const m = date.getMonth() + 1;
  if (m === 12 || m <= 2) return "winter";
  if (m <= 5) return "spring";
  if (m <= 8) return "summer";
  return "autumn";
}
