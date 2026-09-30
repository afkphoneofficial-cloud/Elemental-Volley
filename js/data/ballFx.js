/** Visual-only serve-ball cosmetics. No physics. */

export const BALL_FX = [
  { id: "ball_ember", price: 45, color: 0xff6a22, ring: 0xffb14a, kind: "ember", tex: "vis_ball_ember", art: "ball-ember-art", src: "assets/sprites/balls/ball_ember.png" },
  { id: "ball_mist", price: 45, color: 0x3ad6ff, ring: 0x7ae8ff, kind: "mist", tex: "vis_ball_mist", art: "ball-mist-art", src: "assets/sprites/balls/ball_mist.png" },
  { id: "ball_volt", price: 45, color: 0xffe08a, ring: 0x7d5cff, kind: "volt", tex: "vis_ball_volt", art: "ball-volt-art", src: "assets/sprites/balls/ball_volt.png" },
  { id: "ball_terra", price: 45, color: 0x7ad06a, ring: 0xc07830, kind: "terra", tex: "vis_ball_terra", art: "ball-terra-art", src: "assets/sprites/balls/ball_terra.png" },
  { id: "ball_star", price: 70, color: 0xfff6ea, ring: 0xff8ab8, kind: "star", tex: "vis_ball_star", art: "ball-star-art", src: "assets/sprites/balls/ball_star.png" }
];

export const BALL_FX_ITEMS = {};
BALL_FX.forEach((row) => {
  BALL_FX_ITEMS[row.id] = {
    id: row.id,
    kind: "use",
    icon: row.tex,
    effect: "ballFx",
    ballFx: row.id
  };
});

export function ballFxOf(id) {
  return BALL_FX.find((row) => row.id === id) || null;
}

export function ballFxTex(id) {
  const row = ballFxOf(id);
  return row ? row.tex : "";
}

export function drawArmedBallFx(g, x, y, r, row, now, style) {
  if (!g) return;
  g.clear();
  if (!row) return;
  const t = now || 0;
  const pow = style === "ult" ? 1.55 : style === "smash" ? 1.22 : 1;
  const n = row.kind;
  if (n === "ember") drawEmber(g, x, y, r, t, pow);
  else if (n === "mist") drawMist(g, x, y, r, t, pow);
  else if (n === "volt") drawVolt(g, x, y, r, t, pow);
  else if (n === "terra") drawTerra(g, x, y, r, t, pow);
  else drawStarFx(g, x, y, r, t, pow);
}

function flicker(t, i, spd) {
  return 0.55 + 0.45 * Math.sin(t / spd + i * 1.7);
}

function tongue(g, x, y, ang, len, half, col, a) {
  const tx = x + Math.cos(ang) * len;
  const ty = y + Math.sin(ang) * len;
  const ox = Math.cos(ang + Math.PI / 2) * half;
  const oy = Math.sin(ang + Math.PI / 2) * half;
  g.fillStyle(col, a);
  g.fillTriangle(x + ox, y + oy, x - ox, y - oy, tx, ty);
}

function drawEmber(g, x, y, r, t, pow) {
  g.fillStyle(0xff4a12, 0.28);
  g.fillEllipse(x, y + r * 0.12, r * 1.7 * pow, r * 1.15);
  g.fillStyle(0xff9a2a, 0.32);
  g.fillEllipse(x, y + r * 0.05, r * 1.15, r * 0.85);
  const count = Math.round(8 * pow);
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const sx = x + (u - 0.5) * r * 1.55;
    const sy = y + r * (0.35 - Math.abs(u - 0.5) * 0.35);
    const sway = Math.sin(t / 70 + i * 1.4) * 0.38;
    const ang = -Math.PI / 2 + sway + (u - 0.5) * 0.55;
    const len = r * (1.35 + flicker(t, i, 55) * 1.1) * pow;
    tongue(g, sx, sy, ang, len, 6 + pow * 3.2, 0xff2a08, 0.5 + flicker(t, i, 80) * 0.25);
    tongue(g, sx, sy - 2, ang, len * 0.72, 3.6 + pow * 2, 0xffb14a, 0.7);
    tongue(g, sx, sy - 4, ang, len * 0.4, 2, 0xfff6e8, 0.85);
  }
  for (let i = 0; i < 7 + pow * 4; i++) {
    const lift = (t / 16 + i * 11) % (r * 2.2 + 24);
    const drift = Math.sin(t / 90 + i) * r * 0.55;
    g.fillStyle(0xffe08a, Math.max(0, 0.8 - lift / 70));
    g.fillCircle(x + drift, y - r * 0.15 - lift, 1.4 + (i % 3) * 0.7);
  }
}

function drawMist(g, x, y, r, t, pow) {
  g.fillStyle(0x6ad8ff, 0.18);
  g.fillEllipse(x, y + r * 0.08, r * 2.1 * pow, r * 1.35);
  for (let i = 0; i < 8; i++) {
    const drift = Math.sin(t / 140 + i * 0.8) * r * 0.7;
    const bob = Math.cos(t / 110 + i) * r * 0.22;
    g.fillStyle(0xb8f6ff, 0.12 + (i % 3) * 0.07);
    g.fillEllipse(x + drift, y + bob - r * 0.05, 22 * pow + (i % 4) * 5, 12 * pow + (i % 3) * 4);
  }
  const drops = Math.round(7 * pow);
  for (let i = 0; i < drops; i++) {
    const fall = (t / 14 + i * 17) % (r * 1.8 + 26);
    const dx = Math.sin(i * 1.8 + t / 200) * r * 0.75;
    g.fillStyle(0x3ad6ff, 0.75);
    g.fillEllipse(x + dx, y + r * 0.2 + fall, 4.2, 8 + pow * 1.5);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(x + dx - 1.2, y + r * 0.14 + fall - 1.5, 1.3);
  }
}

function bolt(g, x, y, ang, len, t, i) {
  const steps = 5;
  g.beginPath();
  g.moveTo(x, y);
  for (let s = 1; s <= steps; s++) {
    const u = s / steps;
    const zig = ((s % 2) ? 1 : -1) * (3 + ((t / 20 + i * 5 + s * 9) % 6));
    g.lineTo(
      x + Math.cos(ang) * len * u + Math.cos(ang + Math.PI / 2) * zig,
      y + Math.sin(ang) * len * u + Math.sin(ang + Math.PI / 2) * zig
    );
  }
  g.strokePath();
}

function drawVolt(g, x, y, r, t, pow) {
  const n = Math.round(5 * pow);
  for (let i = 0; i < n; i++) {
    const ang = t / 70 + i * ((Math.PI * 2) / n);
    const len = (r * 1.35 + flicker(t, i, 40) * r * 0.7) * pow;
    g.lineStyle(4 * pow, 0x7d5cff, 0.35);
    bolt(g, x, y, ang, len, t, i);
    g.lineStyle(2.2, 0xe8ff3a, 0.95);
    bolt(g, x, y, ang, len, t, i + 3);
    g.lineStyle(1.2, 0xffffff, 1);
    bolt(g, x, y, ang, len * 0.86, t, i + 1);
  }
  g.fillStyle(0xffffcc, 0.85);
  g.fillCircle(x, y, 4 + pow * 2);
}

function leaf(g, x, y, ang, len, col, a) {
  const tx = x + Math.cos(ang) * len;
  const ty = y + Math.sin(ang) * len;
  const ox = Math.cos(ang + Math.PI / 2) * (len * 0.28);
  const oy = Math.sin(ang + Math.PI / 2) * (len * 0.28);
  g.fillStyle(col, a);
  g.fillTriangle(x, y, tx + ox, ty + oy, tx - ox, ty - oy);
}

function drawTerra(g, x, y, r, t, pow) {
  g.fillStyle(0x3d6b28, 0.22);
  g.fillEllipse(x, y + r * 0.25, r * 1.6, r * 0.7);
  for (let i = 0; i < 4; i++) {
    const a0 = 0.4 + i * 0.7 + Math.sin(t / 220 + i) * 0.2;
    g.lineStyle(2.4, 0x5a3a18, 0.75);
    g.beginPath();
    g.moveTo(x + Math.cos(a0) * r * 0.2, y + r * 0.55);
    g.lineTo(x + Math.cos(a0) * r * 0.95, y - r * (0.15 + (i % 2) * 0.25));
    g.strokePath();
  }
  const n = Math.round(7 * pow);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const ox = side * r * (0.35 + (i % 3) * 0.22);
    const oy = r * 0.15 - (i % 4) * r * 0.22 + Math.sin(t / 180 + i) * 4;
    leaf(g, x + ox, y + oy, -Math.PI / 2 + side * 0.55 + Math.sin(t / 160 + i) * 0.2, r * (0.5 + flicker(t, i, 160) * 0.18) * pow, i % 2 ? 0x5aa84a : 0x8fd06a, 0.85);
  }
  for (let i = 0; i < 5; i++) {
    const fall = (t / 22 + i * 19) % (r + 18);
    g.fillStyle(0xc07830, 0.75);
    g.fillCircle(x + Math.sin(i * 2.2) * r * 0.45, y + r * 0.45 + fall * 0.35, 2);
  }
}

function starPoly(g, x, y, r, rot, col, a) {
  g.fillStyle(col, a);
  for (let i = 0; i < 5; i++) {
    const a0 = rot + i * Math.PI * 2 / 5 - Math.PI / 2;
    const a1 = a0 + Math.PI / 5;
    const a2 = a0 - Math.PI / 5;
    g.fillTriangle(
      x + Math.cos(a0) * r,
      y + Math.sin(a0) * r,
      x + Math.cos(a1) * r * 0.38,
      y + Math.sin(a1) * r * 0.38,
      x + Math.cos(a2) * r * 0.38,
      y + Math.sin(a2) * r * 0.38
    );
  }
}

function drawStarFx(g, x, y, r, t, pow) {
  g.fillStyle(0xfff6ea, 0.16 + 0.08 * flicker(t, 0, 90));
  g.fillEllipse(x, y, r * 1.4 * pow, r * 1.15);
  const n = Math.round(4 * pow);
  for (let i = 0; i < n; i++) {
    const px = x + Math.sin(t / 160 + i * 1.7) * r * 0.55;
    const py = y + Math.cos(t / 140 + i * 1.1) * r * 0.4;
    starPoly(g, px, py, 6 + pow * 2.4, t / 180 + i, i % 2 ? 0xff8ab8 : 0xffe08a, 0.92);
  }
  for (let i = 0; i < 10; i++) {
    const lift = (t / 28 + i * 9) % (r * 1.6 + 16);
    const dx = Math.sin(i * 2.1 + t / 80) * r * 0.7;
    g.fillStyle(0xfff6ea, 0.3 + flicker(t, i, 50) * 0.55);
    g.fillCircle(x + dx, y + r * 0.1 - lift, 1.2 + (i % 3) * 0.6);
  }
}
