import { GAME } from "../config/gameConfig.js";
import { UI_FONT } from "../ui/Ui.js";
import { I18n } from "../i18n/I18n.js";
import { pickCheer, getCheerTheme } from "../data/cheers.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { texCheer, clampSkin } from "../data/skins.js";

const COURT_LOOK = {
  summer: { stroke: 0xffb14a, fill: 0xfff6ea, ink: "#3a2418", name: "#c45a16", spark: [0xffe08a, 0xff6a22, 0xffffff] },
  rain: { stroke: 0x3ad6ff, fill: 0xeffbff, ink: "#1a4a68", name: "#1a7a98", spark: [0x9af6ff, 0x3ad6ff, 0xffffff] },
  spring: { stroke: 0xff8ab8, fill: 0xfff3f8, ink: "#5a2840", name: "#c45a78", spark: [0xffc8dc, 0xff8ab8, 0xffffff] },
  winter: { stroke: 0x9ec8e8, fill: 0xf4fbff, ink: "#2a4060", name: "#4a6a88", spark: [0xffffff, 0xc8e8ff, 0x8eb8e8] }
};

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

  show(side, charId, opts) {
    this.clear();
    const you = opts && opts.you === true;
    if (!you) return;
    const skin = clampSkin(opts && opts.skin);
    const look = COURT_LOOK[(opts && opts.season) || "summer"] || COURT_LOOK.summer;
    const theme = getCheerTheme("classic");
    const cheer = pickCheer(charId);
    const left = side === 1;
    const x = left ? GAME.courtLeft + 196 : GAME.courtRight - 196;
    const y = 428;
    this.root.setPosition(x, y);
    this.root.setVisible(true);
    this.root.setAlpha(1);
    this.root.setScale(0.82);

    const faceKey = texCheer(this.scene, charId, skin);
    const halo = this.scene.add.circle(0, -28, 128, look.stroke, 0.22);
    const plate = this.scene.add.circle(0, -28, 118, look.fill, 0.96)
      .setStrokeStyle(5, look.stroke, 0.95);
    const face = this.scene.add.image(0, -34, faceKey).setDisplaySize(228, 228);
    if (!left) face.setFlipX(true);

    const boxW = 268;
    const boxH = 86;
    const boxY = 118;
    const box = this.scene.add.graphics();
    box.fillStyle(look.fill, 0.96);
    box.fillRoundedRect(-boxW / 2, boxY - boxH / 2, boxW, boxH, 18);
    box.lineStyle(3, look.stroke, 0.95);
    box.strokeRoundedRect(-boxW / 2, boxY - boxH / 2, boxW, boxH, 18);

    const name = this.scene.add.text(-boxW / 2 + 16, boxY - 28, I18n.charName(charId), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: look.name
    }).setOrigin(0, 0.5);
    const line = this.scene.add.text(0, boxY + 10, cheer.line, {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "700", color: look.ink,
      align: "center", wordWrap: { width: 236 }
    }).setOrigin(0.5);

    this.root.add([halo, plate, face, box, name, line]);

    const sparks = theme.bits && theme.bits.length ? theme.bits : look.spark;
    sparks.slice(0, 6).forEach((c, i) => {
      const sx = x + (left ? -70 : 70) + (i % 3) * 18;
      const sy = y + 40;
      let bit;
      try {
        bit = this.scene.add.star(sx, sy, 5, 3, 8, c, 1).setDepth(23);
      } catch (e) {
        bit = this.scene.add.circle(sx, sy, 5, c, 1).setDepth(23);
      }
      this.scene.tweens.add({
        targets: bit,
        y: sy - 70 - i * 8,
        x: sx + (left ? -16 : 16),
        alpha: 0,
        angle: 120,
        duration: 680 + i * 40,
        onComplete: () => bit.destroy()
      });
      this.bits.push(bit);
    });

    this.scene.tweens.add({
      targets: this.root,
      scale: 1,
      duration: 180,
      ease: "Back.out"
    });
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      delay: 1520,
      duration: 220,
      onComplete: () => this.root.setVisible(false)
    });
  }

  destroy() {
    this.clear();
    this.root.destroy();
  }
}
