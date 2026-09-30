/** Visual-only serve-ball cosmetics. No physics. Compact twinkle glints, not auras. */

export const BALL_FX = [
  { id: "ball_ember", char: "ignis", price: 45, color: 0xff6a22, ring: 0xffb14a, kind: "ember", tex: "vis_ball_ember", art: "ball-ember-art", src: "assets/sprites/balls/ball_ember.png" },
  { id: "ball_mist", char: "aqua", price: 45, color: 0x3ad6ff, ring: 0x7ae8ff, kind: "mist", tex: "vis_ball_mist", art: "ball-mist-art", src: "assets/sprites/balls/ball_mist.png" },
  { id: "ball_volt", char: "volt", price: 45, color: 0xffe08a, ring: 0x7d5cff, kind: "volt", tex: "vis_ball_volt", art: "ball-volt-art", src: "assets/sprites/balls/ball_volt.png" },
  { id: "ball_terra", char: "terra", price: 45, color: 0x7ad06a, ring: 0xc07830, kind: "terra", tex: "vis_ball_terra", art: "ball-terra-art", src: "assets/sprites/balls/ball_terra.png" },
  { id: "ball_star", char: "", price: 70, color: 0xfff6ea, ring: 0xff8ab8, kind: "star", tex: "vis_ball_star", art: "ball-star-art", src: "assets/sprites/balls/ball_star.png" }
];

export const BALL_FX_ITEMS = {};
BALL_FX.forEach((row) => {
  BALL_FX_ITEMS[row.id] = {
    id: row.id,
    kind: "use",
    icon: row.tex,
    effect: "ballFx",
    ballFx: row.id,
    char: row.char || ""
  };
});

export function ballFxOf(id) {
  return BALL_FX.find((row) => row.id === id) || null;
}

export function ballFxTex(id) {
  const row = ballFxOf(id);
  return row ? row.tex : "";
}

export function ballFxFitsChar(row, charId) {
  if (!row) return false;
  if (!row.char) return true;
  return row.char === charId;
}

export function drawArmedBallFx(g, x, y, r, row, now, style) {
  if (!g) return;
  g.clear();
  if (!row) return;
  const t = now || 0;
  const pow = style === "ult" ? 1.35 : style === "smash" ? 1.18 : 1;
  const n = row.kind;
  if (n === "ember") drawEmber(g, x, y, r, t, pow);
  else if (n === "mist") drawMist(g, x, y, r, t, pow);
  else if (n === "volt") drawVolt(g, x, y, r, t, pow);
  else if (n === "terra") drawTerra(g, x, y, r, t, pow);
  else drawStarFx(g, x, y, r, t, pow);
}

/** Sharp on/off flash — mostly dark, brief pop. */
function flash(t, i, period) {
  const u = ((t / period + i * 0.271) % 1 + 1) % 1;
  return Math.max(0, 1 - Math.abs(u - 0.06) * 18);
}

function rim(x, y, r, i, t, spin) {
  const ang = i * 2.399 + t * spin;
  const d = r * (0.62 + (i % 4) * 0.09);
  return { x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, ang };
}

/** Four-point glint used in pickup / sparkle packs. */
function glint(g, x, y, s, col, a) {
  if (a < 0.08) return;
  g.fillStyle(col, a * 0.85);
  g.fillTriangle(x, y - s, x + s * 0.22, y, x - s * 0.22, y);
  g.fillTriangle(x, y + s, x + s * 0.22, y, x - s * 0.22, y);
  g.fillTriangle(x - s * 0.72, y, x, y + s * 0.18, x, y - s * 0.18);
  g.fillTriangle(x + s * 0.72, y, x, y + s * 0.18, x, y - s * 0.18);
  g.fillStyle(0xffffff, a);
  g.fillCircle(x, y, Math.max(0.7, s * 0.12));
}

function speckle(g, x, y, col, a) {
  g.fillStyle(col, a);
  g.fillCircle(x, y, 1.15);
}

function drawEmber(g, x, y, r, t, pow) {
  g.fillStyle(0xff7a28, 0.14 + 0.08 * flash(t, 0, 220));
  g.fillCircle(x, y + r * 0.06, r * 0.42);
  const n = Math.round(5 + pow * 2);
  for (let i = 0; i < n; i++) {
    const p = rim(x, y, r, i, t, 0.0011);
    const a = flash(t, i, 160 + i * 11);
    glint(g, p.x, p.y, 3.2 + pow * 1.1, i % 2 ? 0xffb14a : 0xfff4e0, a);
  }
  for (let i = 0; i < 3; i++) {
    const a = flash(t, i + 9, 90);
    if (a < 0.2) continue;
    const sx = x + (i - 1) * r * 0.22;
    g.fillStyle(0xffe08a, a * 0.9);
    g.fillTriangle(sx - 1.4, y - r * 0.15, sx + 1.4, y - r * 0.15, sx, y - r * (0.55 + a * 0.25 * pow));
  }
}

function drawMist(g, x, y, r, t, pow) {
  g.fillStyle(0xffffff, 0.22);
  g.fillEllipse(x - r * 0.22, y - r * 0.28, r * 0.38, r * 0.2);
  const n = Math.round(5 + pow);
  for (let i = 0; i < n; i++) {
    const p = rim(x, y, r, i + 2, t, 0.0007);
    glint(g, p.x, p.y, 2.8 + pow, 0xffffff, flash(t, i, 190));
    speckle(g, p.x + 2, p.y + 1, 0x7ae8ff, flash(t, i + 4, 140) * 0.85);
  }
  for (let i = 0; i < 2; i++) {
    const a = flash(t, i + 12, 280);
    if (a < 0.15) continue;
    g.fillStyle(0x3ad6ff, 0.55 * a);
    g.fillEllipse(x + (i ? 6 : -5), y + r * 0.38, 2.6, 4.2);
  }
}

function drawVolt(g, x, y, r, t, pow) {
  const pop = flash(t, 1, 110);
  if (pop > 0.35) {
    g.fillStyle(0xffffee, 0.18 * pop);
    g.fillCircle(x, y, r * 0.38);
  }
  const n = Math.round(4 + pow);
  for (let i = 0; i < n; i++) {
    const p = rim(x, y, r, i, t, 0.0024);
    glint(g, p.x, p.y, 3 + pow, 0xe8ff3a, flash(t, i, 95));
  }
  for (let i = 0; i < 2; i++) {
    const a = flash(t, i + 20, 70);
    if (a < 0.45) continue;
    const ang = t * 0.01 + i * 1.9;
    const len = r * (0.38 + 0.12 * pow);
    const zig = 2.2 * (i ? -1 : 1);
    g.lineStyle(1.6, 0xffffff, a);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(ang) * len * 0.5 + zig, y + Math.sin(ang) * len * 0.5);
    g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.strokePath();
  }
}

function drawTerra(g, x, y, r, t, pow) {
  const n = Math.round(4 + pow);
  for (let i = 0; i < n; i++) {
    const p = rim(x, y, r, i + 1, t, 0.0005);
    const a = flash(t, i, 210);
    glint(g, p.x, p.y, 2.6 + pow, 0xc8ff9a, a * 0.9);
    if (a > 0.4) {
      g.fillStyle(0x7ad06a, a * 0.8);
      g.fillTriangle(p.x, p.y, p.x + 3.2, p.y - 1.2, p.x + 1.4, p.y - 4.5);
    }
  }
  speckle(g, x + r * 0.18, y - r * 0.12, 0xffe08a, flash(t, 8, 160));
  speckle(g, x - r * 0.2, y + r * 0.1, 0xc07830, flash(t, 9, 180));
}

function drawStarFx(g, x, y, r, t, pow) {
  const n = Math.round(7 + pow * 3);
  for (let i = 0; i < n; i++) {
    const p = rim(x, y, r, i, t, 0.0016);
    const a = flash(t, i, 120 + (i % 3) * 25);
    glint(g, p.x, p.y, 2.4 + (i % 3) + pow, i % 2 ? 0xff8ab8 : 0xfff6ea, a);
  }
}
