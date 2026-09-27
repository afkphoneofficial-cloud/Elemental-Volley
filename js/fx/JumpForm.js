import { WORLD, toScreenX, toScreenY } from "../gameplay/ArcadeEngine.js";

function airborne(p) {
  return p.state === 1 || p.state === 2;
}

function zigzag(g, x0, y0, x1, y1, segs, amp, color, width, alpha, phase) {
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
  const x = toScreenX(player.x);
  const y = toScreenY(player.y);
  const groundY = toScreenY(WORLD.playerGroundY);
  gfx.clear();
  form.setVisible(false);

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
      burst(scene, spark, x, y + 8, 0xff6a22, 3);
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
      burst(scene, spark, x, y + 10, 0x66e8ff, 3);
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
      burst(scene, spark, x, y, 0xe8ff3a, 5);
      burst(scene, spark, ox, oy, 0xffffff, 2);
    } else {
      const top = Math.min(y, groundY - 10);
      const h = Math.max(18, groundY - top);
      gfx.fillStyle(0x3a2210, 0.55);
      gfx.fillEllipse(x, groundY + 4, 70, 16);
      gfx.fillStyle(0x6b3e1e, 1);
      gfx.fillRect(x - 26, top, 52, h);
      gfx.fillStyle(0xa06a32, 1);
      gfx.fillRect(x - 16, top + 6, 32, h - 6);
      gfx.fillStyle(0x4e8a32, 1);
      gfx.fillCircle(x - 16, top + 2, 12);
      gfx.fillCircle(x + 16, top, 14);
      gfx.fillCircle(x, top - 8, 13);
      gfx.fillStyle(0x8fd35a, 0.85);
      gfx.fillCircle(x + 6, top + 4, 7);
      sparkles(gfx, x, top, now, 8, 0xc8ff3a, 26);
      burst(scene, spark, x, top, 0xc07830, 3);
      burst(scene, spark, x, groundY - 4, 0x8a5a2a, 2);
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
    gfx.fillEllipse(x - spread, y - 6, size * 0.5, size * 0.2);
    gfx.fillEllipse(x + spread, y - 6, size * 0.5, size * 0.2);
    sparkles(gfx, x, y, now, 8, 0xffe08a, 28);
    burst(scene, spark, x, y + 6, 0xffd24a, 1);
  } else {
    sprite.setAngle(0);
    if (charId === "aqua") sparkles(gfx, x, y, now, 6, 0x9af6ff, 24);
    if (charId === "volt") sparkles(gfx, x, y, now, 8, 0xe8ff3a, 26);
    if (charId === "terra") sparkles(gfx, x, y + 10, now, 5, 0xc8ff3a, 20);
  }
}
