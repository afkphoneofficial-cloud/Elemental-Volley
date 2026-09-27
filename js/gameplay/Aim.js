import { GAME, PHYSICS } from "../config/gameConfig.js";

export function zoneTargetX(side, aim) {
  const shortX = side === 1 ? GAME.netX + 168 : GAME.netX - 168;
  const midX = side === 1 ? GAME.netX + 268 : GAME.netX - 268;
  const deepX = side === 1 ? GAME.courtRight - 70 : GAME.courtLeft + 70;
  const dumpX = side === 1 ? GAME.netX + 120 : GAME.netX - 120;

  if (aim && aim.aimLeft && aim.aimDown) return dumpX;
  if (aim && aim.aimRight && aim.aimDown) return deepX;
  if (aim && aim.aimDown) return midX;
  if (aim && aim.aimLeft) return shortX;
  if (aim && aim.aimRight) return deepX;
  return midX;
}

export function applyQuality(side, targetX, quality, kind) {
  if (quality === "perfect") return targetX;
  if (quality === "good") {
    const wobble = side === 1 ? 36 : -36;
    return targetX + wobble * (Math.random() > 0.5 ? 0.7 : -0.5);
  }
  if (quality === "early") {
    const minOver = kind === "serve" ? 150 : 130;
    return side === 1 ? GAME.netX + minOver : GAME.netX - minOver;
  }
  return side === 1 ? GAME.courtRight + 36 : GAME.courtLeft - 36;
}

export function netClearY() {
  return GAME.netTop - 40;
}

export function velocityToLand(fromX, fromY, targetX, flightTime, opts = {}) {
  const g = PHYSICS.ballGravity;
  const yLand = opts.yLand ?? (GAME.groundY - 24);
  let t = Math.max(0.34, flightTime);
  const crosses = (fromX - GAME.netX) * (targetX - GAME.netX) < 0;

  const velAt = (time) => {
    const vx = (targetX - fromX) / time;
    const vy = (yLand - fromY - 0.5 * g * time * time) / time;
    return { vx, vy };
  };

  const yAtNet = (time) => {
    const { vx, vy } = velAt(time);
    if (Math.abs(vx) < 8) return 9999;
    const tNet = (GAME.netX - fromX) / vx;
    if (tNet <= 0.02 || tNet >= time) return -999;
    return fromY + vy * tNet + 0.5 * g * tNet * tNet;
  };

  if (opts.clearNet !== false && crosses) {
    const need = netClearY();
    for (let i = 0; i < 16 && yAtNet(t) > need; i += 1) t += 0.07;
    let { vx, vy } = velAt(t);
    if (yAtNet(t) > need) {
      const tNet = (GAME.netX - fromX) / vx;
      vy = Math.min(vy, (need - fromY - 0.5 * g * tNet * tNet) / tNet);
    }
    return clampVel(vx, vy);
  }

  const { vx, vy } = velAt(t);
  return clampVel(vx, vy);
}

function clampVel(vx, vy) {
  return {
    vx: Phaser.Math.Clamp(vx, -PHYSICS.maxBallSpeed, PHYSICS.maxBallSpeed),
    vy: Phaser.Math.Clamp(vy, -PHYSICS.maxBallSpeed, PHYSICS.maxBallSpeed)
  };
}

export function setBallVelocity(side, fromX, fromY, aim, quality) {
  let destX = side === 1 ? GAME.netX - 108 : GAME.netX + 108;
  if (aim && aim.aimLeft) destX += side === 1 ? -54 : -54;
  if (aim && aim.aimRight) destX += 54;
  if (side === 1) destX = Phaser.Math.Clamp(destX, GAME.courtLeft + 40, GAME.netX - 70);
  else destX = Phaser.Math.Clamp(destX, GAME.netX + 70, GAME.courtRight - 40);

  const hangY = quality === "perfect" ? 348 : quality === "good" ? 368 : 392;
  const t = quality === "perfect" ? 0.92 : quality === "good" ? 0.84 : 0.74;
  return velocityToLand(fromX, fromY, destX, t, { yLand: hangY, clearNet: false });
}

export function shotVelocity(side, aim, fromX, fromY, kind, quality) {
  if (kind === "set" || kind === "highReceive") {
    return setBallVelocity(side, fromX, fromY, aim, quality);
  }

  const target = applyQuality(side, zoneTargetX(side, aim), quality, kind);
  let t = 0.86;
  if (kind === "dump") t = 0.52;
  else if (kind === "spike") t = quality === "perfect" ? 0.58 : quality === "good" ? 0.66 : 0.78;
  else if (kind === "serve") t = quality === "perfect" ? 1.18 : quality === "good" ? 1.24 : 1.32;

  if (quality === "early" && kind === "serve") t = 1.3;
  if (quality === "late" && kind === "serve") t = 1.12;
  if (quality === "early" && kind === "spike") t *= 1.08;
  if (quality === "late" && kind === "spike") t *= 0.86;

  return velocityToLand(fromX, fromY, target, t, { clearNet: true });
}

export function shotKind(grounded, touches, aim) {
  if (aim && aim.aimLeft && aim.aimDown) return "dump";
  if (!grounded && touches >= 1) return "spike";
  if (!grounded && touches === 0) return "highReceive";
  return "set";
}
