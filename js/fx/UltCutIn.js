import { GAME } from "../config/gameConfig.js";
import { UI_FONT } from "../ui/Ui.js";
import { ELEMENT_FX } from "./HitFx.js";

const NAMES = { ignis: "BLAZE SPIKE", aqua: "TIDAL BREAK", volt: "THUNDER GHOST", terra: "QUAKE SMASH" };

function shardPoly(g, pts, fill, fillA, stroke, strokeA) {
  g.fillStyle(fill, fillA);
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath();
  g.fillPath();
  g.lineStyle(2, stroke, strokeA);
  g.strokePath();
}

export class UltCutIn {
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(21).setVisible(false);
    this.bits = [];
  }

  clear() {
    this.bits.forEach((o) => {
      try { o.destroy(); } catch (e) {}
    });
    this.bits = [];
    this.root.removeAll(true);
    this.scene.tweens.killTweensOf(this.root);
  }

  show(side, charId, faceKey) {
    this.clear();
    const pal = ELEMENT_FX[charId] || ELEMENT_FX.ignis;
    const left = side === 1;
    const x = left
      ? (GAME.courtLeft + GAME.netX) * 0.5
      : (GAME.netX + GAME.courtRight) * 0.5;
    const y = 348;
    this.root.setPosition(x, y);
    this.root.setVisible(true);
    this.root.setAlpha(1);
    this.root.setScale(0.55);
    this.root.setAngle(left ? -6 : 6);

    const glass = this.scene.add.graphics();
    const tint = pal.tints[0];
    const lite = pal.tints[1];
    shardPoly(glass, [-18, -128, 92, -70, 38, 18, -70, -8], 0x140c14, 0.72, tint, 0.95);
    shardPoly(glass, [-110, -40, -8, -118, 22, -12, -88, 70], 0x1a1018, 0.55, lite, 0.7);
    shardPoly(glass, [48, -20, 128, 8, 86, 110, 4, 62], 0x100818, 0.5, tint, 0.8);
    shardPoly(glass, [-40, 40, 30, 24, 12, 132, -96, 88], 0x181018, 0.48, lite, 0.65);
    glass.lineStyle(2, 0xffffff, 0.55);
    glass.beginPath();
    glass.moveTo(-70, -8);
    glass.lineTo(12, -40);
    glass.lineTo(86, 20);
    glass.moveTo(12, -40);
    glass.lineTo(-20, 90);
    glass.moveTo(12, -40);
    glass.lineTo(40, -110);
    glass.strokePath();

    const glow = this.scene.add.circle(0, 8, 88, tint, 0.28);
    const face = this.scene.add.image(left ? -8 : 8, 4, faceKey).setDisplaySize(168, 168);
    if (!left) face.setFlipX(false);

    const beam = this.scene.add.graphics();
    const dir = left ? 1 : -1;
    beam.fillStyle(lite, 0.35);
    beam.fillTriangle(dir * 40, -12, dir * 40, 28, dir * 160, 8);
    beam.fillStyle(0xffffff, 0.45);
    beam.fillTriangle(dir * 48, -4, dir * 48, 16, dir * 130, 6);

    const title = this.scene.add.text(0, -118, NAMES[charId] || "ULTIMATE", {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#fff6ea",
      stroke: "#120810", strokeThickness: 6
    }).setOrigin(0.5);

    this.root.add([glow, glass, beam, face, title]);

    for (let i = 0; i < 7; i += 1) {
      const chip = this.scene.add.triangle(
        x + (left ? -1 : 1) * (20 + i * 12),
        y + (i % 2 === 0 ? -40 : 36),
        0, 10, 14, -8, -10, -6,
        lite, 0.95
      ).setDepth(22);
      this.scene.tweens.add({
        targets: chip,
        x: chip.x + dir * (70 + i * 18),
        y: chip.y + (i % 2 === 0 ? -50 : 70),
        alpha: 0,
        angle: dir * (40 + i * 20),
        duration: 420 + i * 30,
        onComplete: () => chip.destroy()
      });
      this.bits.push(chip);
    }

    this.scene.tweens.add({
      targets: this.root,
      scale: 1.06,
      angle: 0,
      duration: 90,
      ease: "Cubic.out"
    });
    this.scene.tweens.add({
      targets: face,
      x: face.x + dir * 10,
      duration: 160,
      yoyo: true
    });
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      delay: 380,
      duration: 140,
      onComplete: () => this.root.setVisible(false)
    });
  }

  destroy() {
    this.clear();
    this.root.destroy();
  }
}
