import { WORLD, toScreenX, toScreenY } from "../gameplay/ArcadeEngine.js";

function airborne(p) {
  return p.state === 1 || p.state === 2;
}

function fin(n, fallback) {
  return Number.isFinite(n) ? n : fallback;
}

function zigzag(g, x0, y0, x1, y1, segs, amp, color, width, alpha, phase) {
  if (![x0, y0, x1, y1].every(Number.isFinite)) return;
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(x0, y0);
  const dx = x1 - x0;
  const dy = y1 - y0;
  for (let i = 1; i < segs; i += 1) {
    const t = i / segs;
    const nx = -dy;
    const ny = dx;
    const len = Math.hypot(nx, ny) || 1;
    const side = (i + phase) % 2 === 0 ? 1 : -1;
    g.lineTo(
      x0 + dx * t + (nx / len) * amp * side,
      y0 + dy * t + (ny / len) * amp * side
    );
  }
  g.lineTo(x1, y1);
  g.strokePath();
}

function sparkles(g, x, y, now, n, color, radius) {
  for (let i = 0; i < n; i += 1) {
    const a = now / 70 + i * ((Math.PI * 2) / n);
    const r = radius + Math.sin(now / 45 + i * 1.7) * (radius * 0.28);
    const tw = 0.35 + (Math.sin(now / 30 + i) * 0.5 + 0.5) * 0.65;
    g.fillStyle(color, tw);
    g.fillCircle(x + Math.cos(a) * r, y + Math.sin(a * 1.15) * r * 0.72, 2 + (i % 3));
  }
}

function burst(scene, spark, x, y, tint, count) {
  if (!spark) return;
  try {
    if (spark.setParticleTint) spark.setParticleTint(tint);
    spark.emitParticleAt(x, y, count);
  } catch (e) { /* optional */ }
}

function popReveal(scene, x, y, color) {
  [1, 1.6, 2.3].forEach((s, i) => {
    const ring = scene.add.circle(x, y, 10, color, 0).setStrokeStyle(3 - i, color, 0.95).setDepth(9);
    scene.tweens.add({
      targets: ring,
      scale: s * 2.2,
      alpha: 0,
      duration: 280 + i * 80,
      onComplete: () => ring.destroy()
    });
  });
  const flash = scene.add.circle(x, y, 22, 0xffffff, 0.7).setDepth(9);
  scene.tweens.add({ targets: flash, alpha: 0, scale: 2.4, duration: 180, onComplete: () => flash.destroy() });
}

export function syncJumpForm(scene, slot, player, sprite, form, gfx, charId, now, size, spark) {
  const jumping = airborne(player);
  const rising = jumping && player.yVelocity < 0;
  const x = fin(toScreenX(player.x), 640);
  const y = fin(toScreenY(player.y), 400);
  const groundY = fin(toScreenY(WORLD.playerGroundY), 580);
  gfx.clear();
  form.setVisible(false);

  if (!Number.isFinite(player.x) || !Number.isFinite(player.y)) {
    slot.rising = false;
    sprite.setAlpha(1);
    sprite.setAngle(0);
    return;
  }

  if (!jumping) {
    slot.origin = { x, y: groundY };
    slot.rising = false;
    slot.didPop = false;
    sprite.setAlpha(1);
    sprite.setAngle(0);
    return;
  }

  if (rising && !slot.rising) {
    slot.origin = { x, y: groundY };
    const takeoff = charId === "aqua" ? 0x66e8ff : charId === "volt" ? 0xe8ff3a : charId === "terra" ? 0xc07830 : 0xff6a22;
    burst(scene, spark, x, groundY - 8, takeoff, 28);
    popReveal(scene, x, groundY - 12, takeoff);
  }
  slot.rising = rising;

  if (rising) {
    sprite.setAlpha(0);
    sprite.setAngle(0);
    if (charId === "ignis") {
      form.setTexture("jump-fire");
      form.setVisible(true);
      form.setPosition(x, y);
      const pulse = 1 + Math.sin(now / 40) * 0.18;
      form.setDisplaySize(size * 0.62 * pulse, size * 0.82 * pulse);
      form.setAngle((now / 4) % 360);
      form.setAlpha(1);
      gfx.fillStyle(0xff3300, 0.22);
      gfx.fillCircle(x, y, 38 + Math.sin(now / 50) * 8);
      gfx.fillStyle(0xff9a22, 0.4);
      gfx.fillCircle(x, y, 22);
      sparkles(gfx, x, y, now, 10, 0xffe08a, 34);
      for (let i = 1; i <= 5; i += 1) {
        gfx.fillStyle(0xff6a22, 0.18);
        gfx.fillCircle(x, y + i * 14, 12 - i);
      }
    } else if (charId === "aqua") {
      form.setTexture("jump-water");
      form.setVisible(true);
      form.setPosition(x, y);
      const wob = 1 + Math.sin(now / 55) * 0.2;
      form.setDisplaySize(size * 0.55 * wob, size * 0.78 / wob);
      form.setAngle(Math.sin(now / 80) * 14);
      form.setAlpha(1);
      gfx.fillStyle(0x3ad6ff, 0.2);
      gfx.fillCircle(x, y, 36);
      sparkles(gfx, x, y, now, 12, 0xffffff, 32);
      for (let i = 0; i < 6; i += 1) {
        const a = now / 90 + i;
        gfx.fillStyle(0x9af6ff, 0.55);
        gfx.fillCircle(x + Math.cos(a) * 18, y + 16 + i * 7, 4);
      }
    } else if (charId === "volt") {
      const ox = slot.origin.x;
      const oy = slot.origin.y - 6;
      const ph = ((now / 40) | 0);
      zigzag(gfx, ox, oy, x, y, 10, 22, 0x88ff3a, 14, 0.28, ph);
      zigzag(gfx, ox, oy, x, y, 10, 16, 0xe8ff3a, 8, 0.7, ph + 1);
      zigzag(gfx, ox, oy, x, y, 10, 9, 0xffffff, 3, 1, ph);
      gfx.fillStyle(0xffffff, 0.85);
      gfx.fillCircle(x, y, 14 + Math.sin(now / 25) * 4);
      gfx.fillStyle(0xe8ff3a, 0.45);
      gfx.fillCircle(x, y, 28);
      sparkles(gfx, x, y, now, 14, 0xffffaa, 40);
    } else if (charId === "terra") {
      form.setTexture("jump-earth");
      form.setVisible(true);
      form.setPosition(x, y);
      const pulse = 1 + Math.sin(now / 48) * 0.16;
      form.setDisplaySize(size * 0.58 * pulse, size * 0.78 * pulse);
      form.setAngle(Math.sin(now / 90) * 10);
      form.setAlpha(1);
      gfx.fillStyle(0xc07830, 0.2);
      gfx.fillCircle(x, y, 36 + Math.sin(now / 50) * 6);
      gfx.fillStyle(0x7ad06a, 0.35);
      gfx.fillCircle(x, y, 20);
      sparkles(gfx, x, y, now, 10, 0xc8ff3a, 32);
    }
    return;
  }

  sprite.setAlpha(1);
  if (!slot.didPop) {
    slot.didPop = true;
    const pal = charId === "aqua" ? 0x7ae8ff : charId === "volt" ? 0xe8ff3a : charId === "terra" ? 0xc07830 : 0xff8a3a;
    popReveal(scene, x, y, pal);
    burst(scene, spark, x, y, pal, 42);
  }
  if (charId === "ignis") {
    const flap = Math.sin(now / 50);
    sprite.setDisplaySize(size * (1 + flap * 0.18), size * (1 - flap * 0.1));
    sprite.setAngle(flap * 9);
    gfx.fillStyle(0xff6a22, 0.38);
    const spread = size * 0.36 + flap * 18;
    gfx.fillCircle(x - spread, y - 6, 10);
    gfx.fillCircle(x + spread, y - 6, 10);
    sparkles(gfx, x, y, now, 8, 0xffe08a, 28);
  } else {
    sprite.setAngle(0);
    if (charId === "aqua") sparkles(gfx, x, y, now, 6, 0x9af6ff, 24);
    if (charId === "volt") sparkles(gfx, x, y, now, 8, 0xe8ff3a, 26);
    if (charId === "terra") sparkles(gfx, x, y + 10, now, 5, 0xc8ff3a, 20);
  }
}
