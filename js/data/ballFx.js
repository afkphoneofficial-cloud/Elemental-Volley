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
  const count = Math.round(9 * pow);
  for (let i = 0; i < count; i++) {
    const sway = Math.sin(t / 90 + i) * 0.35;
    const ang = -Math.PI / 2 + sway + (i - count / 2) * 0.42;
    const len = (r * (1.1 + flicker(t, i, 70) * 1.15)) * pow;
    tongue(g, x, y - r * 0.15, ang, len, 5 + pow * 3, 0xff3a12, 0.42 + flicker(t, i, 80) * 0.28);
    tongue(g, x, y - r * 0.1, ang, len * 0.72, 3.2 + pow * 2, 0xffb14a, 0.55);
    tongue(g, x, y - r * 0.05, ang, len * 0.42, 2, 0xfff4e8, 0.7);
  }
  for (let i = 0; i < 5 + pow * 3; i++) {
    const a = t / 80 + i * 1.1;
    const lift = (t / 18 + i * 13) % (r * 1.8 + 18);
    g.fillStyle(0xffe08a, 0.75 - lift / 80);
    g.fillCircle(x + Math.sin(a) * (r * 0.35), y - r * 0.2 - lift, 1.6 + (i % 3) * 0.8);
  }
}

function drawMist(g, x, y, r, t, pow) {
  for (let i = 0; i < 7; i++) {
    const a = t / 160 + i * 0.9;
    const wob = Math.sin(t / 110 + i) * r * 0.18;
    g.fillStyle(0x9af6ff, 0.16 + (i % 3) * 0.06);
    g.fillEllipse(x + Math.cos(a) * (r * 0.55 + wob), y + Math.sin(a * 0.8) * (r * 0.35), 18 * pow, 10 * pow);
  }
  const drops = Math.round(6 * pow);
  for (let i = 0; i < drops; i++) {
    const fall = (t / 14 + i * 17) % (r * 1.6 + 22);
    const dx = Math.sin(i * 1.8 + t / 200) * r * 0.7;
    g.fillStyle(0x3ad6ff, 0.7);
    g.fillEllipse(x + dx, y + r * 0.15 + fall, 4.5, 7 + pow);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(x + dx - 1, y + r * 0.1 + fall - 1, 1.4);
  }
  g.lineStyle(2.5, 0x7ae8ff, 0.7);
  for (let i = 0; i < 3; i++) {
    const a0 = t / 180 + i * 2.1;
    g.beginPath();
    g.arc(x, y, r + 6 + i * 5, a0, a0 + 1.1, false);
    g.strokePath();
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
  const n = Math.round(6 * pow);
  for (let i = 0; i < n; i++) {
    const ang = t / 240 + i * ((Math.PI * 2) / n);
    const ox = Math.cos(ang) * r * 0.85;
    const oy = Math.sin(ang) * r * 0.85;
    leaf(g, x + ox, y + oy, ang - 0.4, r * (0.55 + flicker(t, i, 160) * 0.2) * pow, i % 2 ? 0x5aa84a : 0x8fd06a, 0.8);
    g.fillStyle(0x3d6b28, 0.55);
    g.fillCircle(x + ox * 0.92, y + oy * 0.92, 3 + (i % 3));
  }
  for (let i = 0; i < 4; i++) {
    const fall = (t / 22 + i * 19) % (r + 16);
    g.fillStyle(0xc07830, 0.7);
    g.fillCircle(x + Math.sin(i * 2.2) * r * 0.5, y + r * 0.4 + fall * 0.4, 2);
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
  const n = Math.round(5 * pow);
  for (let i = 0; i < n; i++) {
    const ang = t / 180 + i * ((Math.PI * 2) / n);
    const dist = r * (0.85 + 0.2 * Math.sin(t / 90 + i));
    starPoly(g, x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, 5 + pow * 2, t / 200 + i, i % 2 ? 0xff8ab8 : 0xffe08a, 0.9);
  }
  for (let i = 0; i < 8; i++) {
    const a = t / 50 + i * 0.7;
    g.fillStyle(0xfff6ea, 0.35 + flicker(t, i, 60) * 0.5);
    g.fillCircle(x + Math.cos(a) * r * 0.4, y + Math.sin(a * 1.3) * r * 0.4, 1.4);
  }
}
