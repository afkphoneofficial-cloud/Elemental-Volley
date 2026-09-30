/** Visual-only serve-ball cosmetics. No physics. */

export const BALL_FX = [
  { id: "ball_ember", price: 45, color: 0xff6a22, ring: 0xffb14a, kind: "ember" },
  { id: "ball_mist", price: 45, color: 0x3ad6ff, ring: 0x7ae8ff, kind: "mist" },
  { id: "ball_volt", price: 45, color: 0xffe08a, ring: 0x7d5cff, kind: "volt" },
  { id: "ball_terra", price: 45, color: 0x7ad06a, ring: 0xc07830, kind: "terra" },
  { id: "ball_star", price: 70, color: 0xfff6ea, ring: 0xff8ab8, kind: "star" }
];

export const BALL_FX_ITEMS = {};
BALL_FX.forEach((row) => {
  BALL_FX_ITEMS[row.id] = {
    id: row.id,
    kind: "use",
    icon: "ball",
    effect: "ballFx",
    ballFx: row.id
  };
});

export function ballFxOf(id) {
  return BALL_FX.find((row) => row.id === id) || null;
}

export function drawArmedBallFx(g, x, y, r, row, now) {
  if (!g) return;
  g.clear();
  if (!row) return;
  const pulse = 1 + Math.sin((now || 0) / 140) * 0.12;
  g.lineStyle(3, row.ring, 0.88);
  g.strokeCircle(x, y, (r + 7) * pulse);
  g.lineStyle(2, row.color, 0.55);
  g.strokeCircle(x, y, (r + 14) * pulse);
  if (row.kind === "volt") {
    g.lineStyle(2, 0xfff6ea, 0.7);
    const a = ((now || 0) / 40) % (Math.PI * 2);
    g.strokeCircle(x + Math.cos(a) * (r + 18), y + Math.sin(a) * (r + 18), 3);
    g.strokeCircle(x + Math.cos(a + 2.1) * (r + 18), y + Math.sin(a + 2.1) * (r + 18), 3);
  }
  if (row.kind === "star") {
    g.fillStyle(0xffe08a, 0.55);
    for (let i = 0; i < 5; i++) {
      const a = ((now || 0) / 180) + i * 1.256;
      g.fillCircle(x + Math.cos(a) * (r + 16), y + Math.sin(a) * (r + 16), 2.4);
    }
  }
}
