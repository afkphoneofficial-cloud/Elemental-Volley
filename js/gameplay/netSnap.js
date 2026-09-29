import { MATCH_FX, UltState } from "./UltSystem.js";

function packPlayer(p) {
  return {
    x: p.x, y: p.y, yv: p.yVelocity, st: p.state, fr: p.frameNumber,
    dv: p.divingDirection, ly: p.lyingDownDurationLeft, col: p.isCollisionWithBallHappened,
    df: p.delayBeforeNextFrame, arm: p.normalStatusArmSwingDirection
  };
}

function unpackPlayer(p, d) {
  if (!p || !d) return;
  p.x = d.x; p.y = d.y; p.yVelocity = d.yv; p.state = d.st; p.frameNumber = d.fr;
  p.divingDirection = d.dv; p.lyingDownDurationLeft = d.ly;
  p.isCollisionWithBallHappened = Boolean(d.col);
  p.delayBeforeNextFrame = d.df; p.normalStatusArmSwingDirection = d.arm;
}

function packBall(b) {
  return {
    x: b.x, y: b.y, xv: b.xVelocity, yv: b.yVelocity, ph: b.isPowerHit,
    px: b.punchEffectX, py: b.punchEffectY, pr: b.punchEffectRadius,
    x1: b.previousX, y1: b.previousY, x2: b.previousPreviousX, y2: b.previousPreviousY
  };
}

function unpackBall(b, d) {
  if (!b || !d) return;
  b.x = d.x; b.y = d.y; b.xVelocity = d.xv; b.yVelocity = d.yv; b.isPowerHit = Boolean(d.ph);
  b.punchEffectX = d.px; b.punchEffectY = d.py; b.punchEffectRadius = d.pr;
  b.previousX = d.x1; b.previousY = d.y1; b.previousPreviousX = d.x2; b.previousPreviousY = d.y2;
}

export function packMatchSnap(scene) {
  const pack = scene.physicsPack;
  return {
    t: "snap",
    score: [scene.score[0] | 0, scene.score[1] | 0],
    p2: scene.p2Serves ? 1 : 0,
    re: scene.roundEnded ? 1 : 0,
    mo: scene.matchOver ? 1 : 0,
    p1: packPlayer(pack.player1),
    p2p: packPlayer(pack.player2),
    b: packBall(pack.ball),
    g: UltState.gauge.slice(),
    br: UltState.burn.slice(),
    pa: UltState.para.slice(),
    wv: UltState.wetVictim,
    wp: UltState.wetPoints,
    fx: {
      w: MATCH_FX.walkMul.slice(),
      j: MATCH_FX.jumpMul.slice(),
      sk: MATCH_FX.skipReceive.slice(),
      sl: MATCH_FX.slippery.slice(),
      st: MATCH_FX.stone ? 1 : 0,
      su: MATCH_FX.stuck ? 1 : 0,
      sf: MATCH_FX.stuckFrames | 0,
      hb: MATCH_FX.hideBall ? 1 : 0,
      v: MATCH_FX.volt ? 1 : 0,
      f: MATCH_FX.fire ? 1 : 0
    },
    skins: [scene.skinForSide(1), scene.skinForSide(2)],
    champs: [scene.champForSide(1), scene.champForSide(2)]
  };
}

export function applyMatchSnap(scene, snap) {
  if (!snap) return { scoreChanged: false, justOver: false };
  const prev0 = scene.score[0] | 0;
  const prev1 = scene.score[1] | 0;
  const wasOver = scene.matchOver;
  unpackPlayer(scene.physicsPack.player1, snap.p1);
  unpackPlayer(scene.physicsPack.player2, snap.p2p);
  unpackBall(scene.physicsPack.ball, snap.b);
  scene.score[0] = snap.score[0] | 0;
  scene.score[1] = snap.score[1] | 0;
  scene.p2Serves = snap.p2 === 1;
  scene.roundEnded = snap.re === 1;
  scene.matchOver = snap.mo === 1;
  if (Array.isArray(snap.g)) UltState.gauge = [snap.g[0] | 0, snap.g[1] | 0];
  if (Array.isArray(snap.br)) UltState.burn = [snap.br[0] | 0, snap.br[1] | 0];
  if (Array.isArray(snap.pa)) UltState.para = [snap.pa[0] | 0, snap.pa[1] | 0];
  if (snap.wv !== undefined) UltState.wetVictim = snap.wv;
  if (snap.wp !== undefined) UltState.wetPoints = snap.wp | 0;
  const fx = snap.fx || {};
  if (fx.w) MATCH_FX.walkMul = fx.w.slice();
  if (fx.j) MATCH_FX.jumpMul = fx.j.slice();
  if (fx.sk) MATCH_FX.skipReceive = [Boolean(fx.sk[0]), Boolean(fx.sk[1])];
  if (fx.sl) MATCH_FX.slippery = [Boolean(fx.sl[0]), Boolean(fx.sl[1])];
  MATCH_FX.stone = fx.st === 1;
  MATCH_FX.stuck = fx.su === 1;
  MATCH_FX.stuckFrames = fx.sf | 0;
  MATCH_FX.hideBall = fx.hb === 1;
  MATCH_FX.volt = fx.v === 1;
  MATCH_FX.fire = fx.f === 1;
  if (Array.isArray(snap.skins) && snap.skins.length >= 2 && typeof scene.skinForSide === "function") {
    const leftS = Math.max(1, Math.min(5, snap.skins[0] | 0));
    const rightS = Math.max(1, Math.min(5, snap.skins[1] | 0));
    if (scene.youSide === 1) {
      scene.youSkin = leftS;
      scene.foeSkin = rightS;
    } else {
      scene.youSkin = rightS;
      scene.foeSkin = leftS;
    }
  }
  if (Array.isArray(snap.champs) && snap.champs.length >= 2 && typeof scene.champForSide === "function") {
    const leftC = Math.max(0, Math.min(3, snap.champs[0] | 0));
    const rightC = Math.max(0, Math.min(3, snap.champs[1] | 0));
    if (scene.youSide === 1) {
      scene.youChamp = leftC;
      scene.foeChamp = rightC;
    } else {
      scene.youChamp = rightC;
      scene.foeChamp = leftC;
    }
  }
  return {
    scoreChanged: prev0 !== scene.score[0] || prev1 !== scene.score[1],
    justOver: scene.matchOver && !wasOver
  };
}
