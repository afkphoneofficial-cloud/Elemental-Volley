import { ELEMENT_FX } from "./HitFx.js";

export const SELECT_PLATE = {
  ignis: 0xe07028,
  aqua: 0x1a9ab8,
  volt: 0x7aad22,
  terra: 0xb06a28
};

export function drawOrbit(g, x, y, baseR, now, charId) {
  const pal = ELEMENT_FX[charId] || ELEMENT_FX.ignis;
  const pulse = Math.sin(now / 220);
  const r = baseR + pulse * 16;
  const r2 = baseR - pulse * 12;
  const spin = now / 380;
  g.lineStyle(3, pal.tints[0], 0.35 + pulse * 0.2);
  g.strokeCircle(x, y, r);
  g.lineStyle(2, pal.tints[1], 0.45 - pulse * 0.15);
  g.strokeCircle(x, y, r2);
  const n = 14;
  for (let i = 0; i < n; i += 1) {
    const a = spin + (i / n) * Math.PI * 2;
    const rr = r + Math.sin(now / 90 + i) * 4;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    const col = pal.tints[i % pal.tints.length];
    g.fillStyle(col, 0.75);
    g.fillCircle(px, py, 3 + (i % 3));
  }
}

export function drawLock(g, x, y) {
  g.fillStyle(0x1a1018, 0.88);
  g.fillCircle(x, y + 6, 36);
  g.lineStyle(3, 0xfff6ea, 0.95);
  g.strokeCircle(x, y + 6, 36);
  g.lineStyle(7, 0xfff6ea, 1);
  g.beginPath();
  g.arc(x, y - 8, 12, Math.PI * 1.05, -0.05, false);
  g.strokePath();
  g.fillStyle(0xfff6ea, 1);
  g.fillRoundedRect(x - 16, y - 2, 32, 26, 6);
  g.fillStyle(0x3a2418, 1);
  g.fillCircle(x, y + 10, 4);
}

export function paintHopFx(g, form, spark, x, y, groundY, charId, now, size, rising) {
  g.clear();
  if (form) form.setVisible(false);
  if (!rising) {
    if (form) form.setVisible(false);
    return;
  }
  if (charId === "ignis") {
    if (form) {
      form.setTexture("jump-fire").setVisible(true).setPosition(x, y);
      const pulse = 1 + Math.sin(now / 40) * 0.18;
      form.setDisplaySize(size * 0.55 * pulse, size * 0.72 * pulse);
      form.setAngle((now / 4) % 360);
    }
    g.fillStyle(0xff3300, 0.2);
    g.fillCircle(x, y, 28);
    g.fillStyle(0xffe08a, 0.5);
    g.fillCircle(x, y, 12);
  } else if (charId === "aqua") {
    if (form) {
      form.setTexture("jump-water").setVisible(true).setPosition(x, y);
      const wob = 1 + Math.sin(now / 55) * 0.18;
      form.setDisplaySize(size * 0.5 * wob, size * 0.7 / wob);
    }
    g.fillStyle(0x3ad6ff, 0.22);
    g.fillCircle(x, y, 26);
    for (let i = 0; i < 5; i += 1) {
      g.fillStyle(0x9af6ff, 0.5);
      g.fillCircle(x + Math.cos(now / 90 + i) * 14, y + 10 + i * 5, 3);
    }
  } else if (charId === "volt") {
    g.lineStyle(4, 0xe8ff3a, 0.7);
    g.lineBetween(x, groundY, x, y);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(x, y, 10);
    g.fillStyle(0xc8ff3a, 0.4);
    g.fillCircle(x, y, 20);
  } else {
    g.fillStyle(0x6b3e1e, 0.85);
    g.fillRect(x - 14, y, 28, groundY - y);
    g.fillStyle(0x4e8a32, 1);
    g.fillCircle(x, y, 12);
  }
  if (spark) {
    try {
      const tint = charId === "aqua" ? 0x66e8ff : charId === "volt" ? 0xe8ff3a : charId === "terra" ? 0xc07830 : 0xff6a22;
      if (spark.setParticleTint) spark.setParticleTint(tint);
      spark.emitParticleAt(x, y + 6, 2);
    } catch (e) { /* optional */ }
  }
}
