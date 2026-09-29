import { ELEMENT_FX } from "./HitFx.js";
import { clampSkin } from "../data/skins.js";

export function paintSkinAura(g, x, y, charId, tier, now, radius) {
  if (!g) return;
  g.clear();
  const t = clampSkin(tier);
  const pal = ELEMENT_FX[charId] || ELEMENT_FX.ignis;
  const pulse = Math.sin(now / (420 - t * 28));
  const r = radius + pulse * (2 + t);
  const a0 = 0.1 + t * 0.07;
  g.lineStyle(1.2 + t * 0.35, pal.tints[0], a0 + pulse * 0.06);
  g.strokeCircle(x, y + 6, r);
  if (t >= 3) {
    g.lineStyle(1.4, pal.tints[1], 0.16 + t * 0.04);
    g.strokeCircle(x, y + 6, r * 0.72);
  }
  if (t >= 4) {
    g.fillStyle(pal.tints[0], 0.05 + (t - 3) * 0.03);
    g.fillCircle(x, y + 8, r * 0.55);
  }
  const motes = t <= 1 ? 3 : t === 2 ? 5 : t === 3 ? 7 : t === 4 ? 9 : 12;
  const spin = now / (520 - t * 36);
  for (let i = 0; i < motes; i += 1) {
    const ang = spin + (i / motes) * Math.PI * 2;
    const rr = r * (0.82 + (i % 3) * 0.06);
    const px = x + Math.cos(ang) * rr;
    const py = y + 6 + Math.sin(ang) * rr * 0.72;
    const col = pal.tints[i % pal.tints.length];
    g.fillStyle(col, 0.28 + t * 0.06);
    g.fillCircle(px, py, 1.4 + (i % 2) * 0.8 + (t >= 5 ? 0.6 : 0));
  }
}
