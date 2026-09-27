import { GAME, MATCH } from "../config/gameConfig.js";

export function hasMatchWinner(p1, p2) {
  if (p1 >= GAME.winScore) return 1;
  if (p2 >= GAME.winScore) return 2;
  return 0;
}

export function courtSide(x) {
  return x < GAME.netX ? 1 : 2;
}

export function isOut(x) {
  return x < GAME.courtLeft || x > GAME.courtRight;
}

export function isInCourt(x) {
  return x >= GAME.courtLeft && x <= GAME.courtRight;
}

export function nextTouchFault(touches) {
  return touches + 1 > MATCH.maxTouches;
}
