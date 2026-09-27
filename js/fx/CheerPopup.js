import { GAME } from "../config/gameConfig.js";
import { UI_FONT } from "../ui/Ui.js";
import { I18n } from "../i18n/I18n.js";
import { pickCheer, getCheerTheme } from "../data/cheers.js";
import { SaveSystem } from "../systems/SaveSystem.js";

function drawBurst(g, color, glow) {
  const spikes = 11;
  const outer = 118;
  const inner = 78;
  g.fillStyle(color, 0.96);
  g.beginPath();
  for (let i = 0; i <= spikes * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
  g.lineStyle(4, glow, 0.95);
  g.strokePath();
  g.lineStyle(8, glow, 0.16);
  g.strokePath();
}

function pill(scene, w, h, fill, stroke) {
  const g = scene.add.graphics();
  g.fillStyle(fill, 0.92);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, Math.min(18, h / 2));
  g.lineStyle(3, stroke, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, Math.min(18, h / 2));
  return g;
}

export class CheerPopup {
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(22).setVisible(false);
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

  show(side, charId) {
    this.clear();
    const theme = getCheerTheme(SaveSystem.equippedCheer());
    const cheer = pickCheer(charId);
    const left = side === 1;
    const x = left ? GAME.courtLeft + 250 : GAME.courtRight - 250;
    const y = 378;
    this.root.setPosition(x, y);
    this.root.setVisible(true);
    this.root.setAlpha(1);
    this.root.setScale(0.88);
    this.root.setAngle(0);

    const stamp = this.scene.add.container(0, -36);
    const glow = this.scene.add.circle(0, 0, 108, theme.glow, 0.3);
    const burst = this.scene.add.graphics();
    drawBurst(burst, theme.panel, theme.stroke);
    const ring = this.scene.add.circle(0, 0, 62, 0x000000, 0).setStrokeStyle(5, theme.glow, 0.9);
    const key = this.scene.textures.exists("vis_" + charId) ? "vis_" + charId : "vis_ignis";
    const face = this.scene.add.image(0, 0, key).setDisplaySize(108, 108);
    stamp.add([glow, burst, ring, face]);

    const titleBg = pill(this.scene, 210, 42, 0x12080e, theme.stroke);
    titleBg.setPosition(0, -168);
    const title = this.scene.add.text(0, -168, cheer.title, {
      fontFamily: UI_FONT, fontSize: "24px", fontStyle: "900", color: "#fff6ea",
      stroke: "#12080e", strokeThickness: 5
    }).setOrigin(0.5);

    const quote = "“" + cheer.line + "”";
    const captionBg = pill(this.scene, 268, 92, 0x140a10, theme.stroke);
    captionBg.setPosition(0, 118);
    const name = this.scene.add.text(0, 90, I18n.charName(charId), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#ffe08a",
      stroke: "#12080e", strokeThickness: 4
    }).setOrigin(0.5);
    const line = this.scene.add.text(0, 128, quote, {
      fontFamily: UI_FONT, fontSize: "20px", fontStyle: "700", color: "#fff6ea",
      align: "center", wordWrap: { width: 240 },
      stroke: "#12080e", strokeThickness: 5
    }).setOrigin(0.5);

    this.root.add([stamp, titleBg, title, captionBg, name, line]);

    theme.bits.forEach((c, i) => {
      let sparkle;
      try {
        sparkle = this.scene.add.star(
          x + (i % 2 === 0 ? -78 : 78) + i * 5,
          y - 20,
          5, 4, 9, c, 1
        ).setDepth(23);
      } catch (e) {
        sparkle = this.scene.add.circle(
          x + (i % 2 === 0 ? -78 : 78) + i * 5,
          y - 20,
          6, c, 1
        ).setDepth(23);
      }
      this.scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - 90 - i * 8,
        x: sparkle.x + (left ? -24 : 24) + i * 5,
        alpha: 0,
        angle: 160,
        duration: 720 + i * 40,
        onComplete: () => sparkle.destroy()
      });
      this.bits.push(sparkle);
    });

    this.scene.tweens.add({
      targets: this.root,
      scale: 1,
      duration: 160,
      ease: "Back.out"
    });
    this.scene.tweens.add({
      targets: stamp,
      angle: left ? -5 : 5,
      duration: 110,
      yoyo: true,
      repeat: 1
    });
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      delay: 1480,
      duration: 220,
      onComplete: () => this.root.setVisible(false)
    });
  }

  destroy() {
    this.clear();
    this.root.destroy();
  }
}
