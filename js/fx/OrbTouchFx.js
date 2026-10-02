import { shakeCam, wantFx } from "../systems/GameSettings.js?v=local260";

const MAX_MARKS = 10;
const MAX_BITS = 14;

export function makeOrbTouchFx(scene) {
  const g = scene.add.graphics().setDepth(8);
  return {
    scene,
    g,
    marks: [],
    bits: [],
    lastX: 0,
    lastY: 0,
    lastVx: 0,
    lastVy: 0,
    travel: 0,
    seeded: false
  };
}

export function clearOrbTouchFx(fx) {
  if (!fx) return;
  fx.marks.length = 0;
  fx.bits.length = 0;
  fx.travel = 0;
  fx.seeded = false;
  if (fx.g && fx.g.active) fx.g.clear();
}

export function destroyOrbTouchFx(fx) {
  if (!fx) return;
  clearOrbTouchFx(fx);
  try { if (fx.g) fx.g.destroy(); } catch (e) { /* */ }
}

function pushMark(fx, x, y, now) {
  const last = fx.marks[fx.marks.length - 1];
  if (last) {
    const dx = x - last.x;
    const dy = y - last.y;
    if (dx * dx + dy * dy < 900) return false;
  }
  fx.marks.push({ x, y, t: now });
  if (fx.marks.length > MAX_MARKS) fx.marks.shift();
  return true;
}

function pushBit(fx, bit) {
  fx.bits.push(bit);
  if (fx.bits.length > MAX_BITS) fx.bits.shift();
}

export function noteOrbContact(fx, x, y, kind, now, cam) {
  if (!fx || !wantFx()) return;
  if (!pushMark(fx, x, y, now)) return;
  if (kind === "aqua") {
    pushBit(fx, { kind: "drop", x: x + (Math.random() - 0.5) * 10, y, vy: 0.4 + Math.random() * 0.5, life: 1 });
    if (Math.random() < 0.55) {
      pushBit(fx, { kind: "drop", x: x + (Math.random() - 0.5) * 18, y: y - 6, vy: 0.3, life: 1 });
    }
  } else if (kind === "terra") {
    for (let i = 0; i < 4; i += 1) {
      const ang = -1.15 + i * 0.55 + (Math.random() - 0.5) * 0.2;
      pushBit(fx, {
        kind: "shard",
        x,
        y,
        vx: Math.cos(ang) * (1.6 + Math.random()),
        vy: Math.sin(ang) * (2.4 + Math.random()) - 1.2,
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 0.25,
        life: 1
      });
    }
    if (cam) shakeCam(cam, 220, 0.018);
  }
}

export function noteOrbTravel(fx, x, y, kind, now) {
  if (!fx || kind !== "aqua" || !wantFx()) return;
  if (!fx.seeded) {
    fx.lastX = x;
    fx.lastY = y;
    fx.seeded = true;
    return;
  }
  const dx = x - fx.lastX;
  const dy = y - fx.lastY;
  fx.travel += Math.sqrt(dx * dx + dy * dy);
  if (fx.travel < 52) return;
  fx.travel = 0;
  const n = fx.bits.filter((b) => b.kind === "drop").length;
  if (n >= 8) return;
  pushBit(fx, { kind: "drop", x: x + (Math.random() - 0.5) * 8, y, vy: 0.35, life: 1 });
}

export function scanOrbContact(fx, ball, sx, sy, kind, now, cam) {
  if (!fx || !ball) return;
  let hit = Boolean(ball.sound && ball.sound.ballTouchesGround);
  if (fx.lastVx * ball.xVelocity < 0 && Math.abs(ball.xVelocity) > 5) hit = true;
  if (fx.lastVy > 2.2 && ball.yVelocity < -1.2) hit = true;
  fx.lastVx = ball.xVelocity;
  fx.lastVy = ball.yVelocity;
  if (hit) noteOrbContact(fx, sx, sy, kind, now, cam);
}

export function tickOrbTouchFx(fx, kind, now, floorY) {
  if (!fx || !fx.g || !fx.g.active) return;
  const g = fx.g;
  g.clear();
  if (!kind) return;
  const dt = 1;
  fx.bits.forEach((b) => {
    if (b.kind === "drop") {
      b.vy += 0.18 * dt;
      b.y += b.vy * 6;
      if (b.y >= floorY) {
        b.y = floorY;
        b.vy *= -0.12;
        b.life -= 0.08;
      }
      b.life -= 0.012;
    } else if (b.kind === "shard") {
      b.vy += 0.22 * dt;
      b.x += b.vx * 4;
      b.y += b.vy * 4;
      b.rot += b.spin;
      if (b.y >= floorY) {
        b.y = floorY;
        b.vx *= 0.55;
        b.vy *= -0.18;
        b.life -= 0.1;
      }
      b.life -= 0.016;
    }
  });
  fx.bits = fx.bits.filter((b) => b.life > 0);

  fx.marks.forEach((m, i) => {
    const age = Math.max(0, 1 - (now - m.t) / 2800);
    if (kind === "ignis") drawFire(g, m.x, m.y, age, now + i * 90);
    else if (kind === "volt") drawCharge(g, m.x, m.y, age, now + i * 70);
    else if (kind === "terra") drawCrack(g, m.x, m.y, age);
  });
  fx.bits.forEach((b) => {
    if (b.kind === "drop") drawDrop(g, b.x, b.y, b.life);
    else drawShard(g, b.x, b.y, b.rot, b.life);
  });
}

function drawFire(g, x, y, a, now) {
  const flicker = 0.75 + Math.sin(now / 70) * 0.25;
  const s = 10 + a * 10;
  g.fillStyle(0xff3300, 0.22 * a * flicker);
  g.fillCircle(x, y + 4, s * 1.35);
  g.fillStyle(0xff6a22, 0.55 * a);
  g.fillCircle(x, y, s);
  g.fillStyle(0xffe08a, 0.7 * a * flicker);
  g.fillCircle(x, y - 4, s * 0.45);
  g.fillStyle(0xfff4e8, 0.85 * a);
  g.fillCircle(x + Math.sin(now / 50) * 2, y - 8, 3.2);
}

function drawCharge(g, x, y, a, now) {
  const pulse = 0.55 + Math.sin(now / 55) * 0.45;
  g.fillStyle(0xe8ff3a, 0.28 * a);
  g.fillCircle(x, y, 11 * pulse);
  g.fillStyle(0xffffff, 0.8 * a * pulse);
  g.fillCircle(x, y, 3.2);
  g.lineStyle(1.6, 0xffffff, 0.75 * a);
  for (let i = 0; i < 3; i += 1) {
    const ang = now / 90 + i * 2.1;
    g.lineBetween(x, y, x + Math.cos(ang) * 14, y + Math.sin(ang) * 14);
  }
}

function drawCrack(g, x, y, a) {
  g.fillStyle(0xc8e8ff, 0.12 * a);
  g.fillCircle(x, y, 22);
  g.lineStyle(2.2, 0xffffff, 0.92 * a);
  for (let i = 0; i < 6; i += 1) {
    const ang = i * 1.047;
    const x2 = x + Math.cos(ang) * 26;
    const y2 = y + Math.sin(ang) * 18;
    const mx = x + Math.cos(ang + 0.25) * 12;
    const my = y + Math.sin(ang + 0.25) * 9;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(mx, my);
    g.lineTo(x2, y2);
    g.strokePath();
  }
  g.lineStyle(1.2, 0x8ab4d8, 0.7 * a);
  g.strokeCircle(x, y, 8);
}

function drawDrop(g, x, y, a) {
  g.fillStyle(0x7ae8ff, 0.55 * a);
  g.fillCircle(x, y, 3.2);
  g.fillStyle(0xffffff, 0.45 * a);
  g.fillCircle(x - 0.8, y - 1, 1.2);
}

function drawShard(g, x, y, rot, a) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  g.fillStyle(0xd8f0ff, 0.8 * a);
  g.beginPath();
  g.moveTo(x + c * 7, y + s * 7);
  g.lineTo(x - s * 4, y + c * 4);
  g.lineTo(x - c * 5, y - s * 5);
  g.closePath();
  g.fillPath();
  g.lineStyle(1, 0xffffff, 0.7 * a);
  g.strokePath();
}
