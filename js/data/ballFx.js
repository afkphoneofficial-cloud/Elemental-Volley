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

export function drawArmedBallFx(g, x, y, r, row, now) {
  if (!g) return;
  g.clear();
  if (!row) return;
  const pulse = 1 + Math.sin((now || 0) / 140) * 0.12;
  g.lineStyle(3, row.ring, 0.88);
  g.strokeCircle(x, y, (r + 8) * pulse);
  g.lineStyle(2, row.color, 0.5);
  g.strokeCircle(x, y, (r + 16) * pulse);
  if (row.kind === "volt") {
    g.lineStyle(2, 0xfff6ea, 0.75);
    const a = ((now || 0) / 40) % (Math.PI * 2);
    g.strokeCircle(x + Math.cos(a) * (r + 20), y + Math.sin(a) * (r + 20), 3);
    g.strokeCircle(x + Math.cos(a + 2.1) * (r + 20), y + Math.sin(a + 2.1) * (r + 20), 3);
  }
  if (row.kind === "star") {
    g.fillStyle(0xffe08a, 0.6);
    for (let i = 0; i < 5; i++) {
      const a = ((now || 0) / 180) + i * 1.256;
      g.fillCircle(x + Math.cos(a) * (r + 18), y + Math.sin(a) * (r + 18), 2.4);
    }
  }
}
