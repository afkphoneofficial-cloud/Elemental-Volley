export const GAUGE_MAX = 4;
export const HOLD_FRAMES = 5;

export const MATCH_FX = {
  walkMul: [1, 1],
  jumpMul: [1, 1],
  skipReceive: [false, false],
  slippery: [false, false],
  stone: false,
  stuck: false,
  stuckFrames: 0,
  hideBall: false,
  volt: false,
  fire: false
};

export const UltState = {
  gauge: [0, 0],
  burn: [0, 0],
  para: [0, 0],
  wetVictim: -1,
  wetPoints: 0,
  filled: [false, false],
  holdTick: false
};

export function resetMatchUlt() {
  UltState.gauge = [0, 0];
  UltState.burn = [0, 0];
  UltState.para = [0, 0];
  UltState.wetVictim = -1;
  UltState.wetPoints = 0;
  UltState.filled = [false, false];
  UltState.holdTick = false;
  resetRallyFx();
}

export function resetRallyFx() {
  MATCH_FX.skipReceive = [false, false];
  MATCH_FX.stone = false;
  MATCH_FX.stuck = false;
  MATCH_FX.stuckFrames = 0;
  MATCH_FX.hideBall = false;
  MATCH_FX.volt = false;
  MATCH_FX.fire = false;
  syncStatusFx();
}

export function syncStatusFx() {
  MATCH_FX.walkMul = [
    UltState.para[0] > 0 ? 0.58 : 1,
    UltState.para[1] > 0 ? 0.58 : 1
  ];
  MATCH_FX.jumpMul = [
    UltState.para[0] > 0 ? 0.78 : 1,
    UltState.para[1] > 0 ? 0.78 : 1
  ];
  MATCH_FX.slippery = [false, false];
  if (UltState.wetVictim >= 0 && UltState.wetPoints > 0) {
    MATCH_FX.slippery[UltState.wetVictim] = true;
  }
}

export const BURN_FILL = 0.5;

export function addGauge(side, amount) {
  const before = UltState.gauge[side];
  const mul = UltState.burn[side] > 0 ? BURN_FILL : 1;
  UltState.gauge[side] = Math.min(GAUGE_MAX, UltState.gauge[side] + amount * mul);
  const justFull = before < GAUGE_MAX && UltState.gauge[side] >= GAUGE_MAX;
  if (justFull) UltState.filled[side] = true;
  return justFull;
}

export function isFull(side) {
  return UltState.gauge[side] >= GAUGE_MAX;
}

export function hasDebuff(side) {
  return UltState.burn[side] > 0
    || UltState.para[side] > 0
    || (UltState.wetVictim === side && UltState.wetPoints > 0);
}

export function fireUlt(side, charId) {
  if (!isFull(side)) return null;
  UltState.gauge[side] = 0;
  UltState.filled[side] = false;
  const other = 1 - side;
  const blocked = hasDebuff(other);
  const result = { id: charId, side, other, pierce: false, para: false, stone: false, statusBlocked: blocked };
  if (charId === "ignis") {
    result.pierce = true;
    MATCH_FX.skipReceive[other] = true;
    MATCH_FX.fire = true;
    if (!blocked) {
      UltState.burn[other] = 2;
      UltState.holdTick = true;
    }
  } else if (charId === "aqua") {
    if (!blocked) {
      UltState.wetVictim = other;
      UltState.wetPoints = 2;
      MATCH_FX.slippery[other] = true;
      UltState.holdTick = true;
    }
  } else if (charId === "volt") {
    MATCH_FX.volt = true;
    MATCH_FX.hideBall = true;
    if (!blocked) {
      result.para = true;
      UltState.para[other] = 2;
      UltState.holdTick = true;
      syncStatusFx();
    }
  } else if (charId === "terra") {
    result.stone = true;
    MATCH_FX.stone = true;
  }
  return result;
}

export function tickPointStatuses() {
  if (UltState.holdTick) {
    UltState.holdTick = false;
    resetRallyFx();
    return;
  }
  UltState.burn[0] = Math.max(0, UltState.burn[0] - 1);
  UltState.burn[1] = Math.max(0, UltState.burn[1] - 1);
  UltState.para[0] = Math.max(0, UltState.para[0] - 1);
  UltState.para[1] = Math.max(0, UltState.para[1] - 1);
  if (UltState.wetPoints > 0) UltState.wetPoints -= 1;
  if (UltState.wetPoints <= 0) UltState.wetVictim = -1;
  resetRallyFx();
}

export function stickBall(ball) {
  MATCH_FX.stuck = true;
  MATCH_FX.stuckFrames = 12;
  ball.xVelocity = 0;
  ball.yVelocity = 0;
  ball.punchEffectX = ball.x;
  ball.punchEffectY = ball.y;
}
