export const ELEMENT_FX = {
  ignis: { tints: [0xff5a1f, 0xffd24a, 0xfff4e8], smash: [0xff3300, 0xffee88] },
  aqua: { tints: [0x3ad6ff, 0xffffff, 0x6ee7ff], smash: [0x2aa0ff, 0xe8ffff] },
  volt: { tints: [0xc8ff3a, 0xffffaa, 0xffffff], smash: [0xe8ff00, 0xffffff] },
  terra: { tints: [0xe0a24a, 0xfff0d0, 0xc87830], smash: [0xffc070, 0xffffff] }
};

export class HitFx {
  constructor(scene) {
    this.scene = scene;
    this.punch = scene.add.circle(0, 0, 8, 0xffffff, 0).setStrokeStyle(3, 0xffffff, 0.9).setDepth(8);
    this.punch.setVisible(false);
    this.burst = null;
    try {
      this.burst = scene.add.particles(0, 0, "dot", {
        lifespan: 420,
        speed: { min: 40, max: 220 },
        scale: { start: 0.85, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 90,
        blendMode: "ADD",
        emitting: false
      });
      if (this.burst && this.burst.setDepth) this.burst.setDepth(7);
    } catch (e) {
      this.burst = null;
    }
  }

  pop(x, y, charId, power) {
    const pal = ELEMENT_FX[charId] || ELEMENT_FX.ignis;
    const tints = power ? pal.smash : pal.tints;
    if (this.burst) {
      try {
        this.burst.setParticleTint(tints[0]);
      } catch (e) { /* tint optional */ }
      try {
        this.burst.emitParticleAt(x, y, power ? 22 : 10);
      } catch (e) { /* burst optional */ }
    }
    this.punch.setPosition(x, y);
    this.punch.setRadius(power ? 18 : 10);
    this.punch.setStrokeStyle(power ? 4 : 2, tints[0], 1);
    this.punch.setVisible(true);
    this.punch.setAlpha(1);
    this.scene.tweens.add({
      targets: this.punch,
      radius: power ? 54 : 32,
      alpha: 0,
      duration: power ? 280 : 180,
      onComplete: () => this.punch.setVisible(false)
    });
  }

  ultPop(x, y, charId) {
    this.pop(x, y, charId, true);
    if (this.burst) {
      try { this.burst.emitParticleAt(x, y, 36); } catch (e) {}
    }
  }
}
