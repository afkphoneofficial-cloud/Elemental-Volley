import { GROUND_HALF_WIDTH } from "./physics.js?v=local206";

export { PikaPhysics, PikaUserInput, GROUND_HALF_WIDTH } from "./physics.js?v=local206";

export const WORLD = {
  width: 432,
  height: 304,
  half: GROUND_HALF_WIDTH,
  playerGroundY: 244,
  ballGroundY: 257,
  ballR: 15,
  playerLen: 64
};

export const SCALE = 720 / WORLD.height;
export const OX = (1280 - WORLD.width * SCALE) / 2;
export const OY = 0;

export function toScreenX(x) {
  return OX + x * SCALE;
}

export function toScreenY(y) {
  return OY + y * SCALE;
}
