import { GAME } from "../config/gameConfig.js";
import { UI_FONT } from "../ui/Ui.js";
import { I18n } from "../i18n/I18n.js";
import { pickCheer, getCheerTheme } from "../data/cheers.js";
import { SaveSystem } from "../systems/SaveSystem.js";

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
    const y = 390;
    this.root.setPosition(x, y);
    this.root.setVisible(true);
    this.root.setAlpha(1);
    this.root.setScale(0.42);
    this.root.setAngle(left ? -8 : 8);

    const glow = this.scene.add.circle(0, 0, 130, theme.glow, 0.28);
    const panel = this.scene.add.graphics();
    panel.fillStyle(theme.panel, 0.92);
    panel.fillRoundedRect(-150, -168, 300, 336, 22);
    panel.lineStyle(3, theme.stroke, 0.95);
    panel.strokeRoundedRect(-150, -168, 300, 336, 22);
    panel.lineStyle(8, theme.glow, 0.22);
    panel.strokeRoundedRect(-158, -176, 316, 352, 26);

    const key = this.scene.textures.exists("vis_" + charId) ? "vis_" + charId : "vis_ignis";
    const face = this.scene.add.image(0, -28, key).setDisplaySize(176, 176);
    const stamp = this.scene.add.text(0, -148, cheer.title, {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#fff6ea",
      stroke: "#000000", strokeThickness: 5
    }).setOrigin(0.5);
    const name = this.scene.add.text(0, 78, I18n.charName(charId), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#ffe08a"
    }).setOrigin(0.5);
    const line = this.scene.add.text(0, 112, "“" + cheer.line + "”", {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "700", color: "#fff6ea",
      align: "center", wordWrap: { width: 250 }
    }).setOrigin(0.5, 0);

    this.root.add([glow, panel, face, stamp, name, line]);

    theme.bits.forEach((c, i) => {
      const bit = this.scene.add.circle(
        x + (i % 2 === 0 ? -1 : 1) * (48 + i * 14),
        y - 30 + (i % 3) * 24,
        5 + (i % 3),
        c,
        1
      ).setDepth(23);
      this.scene.tweens.add({
        targets: bit,
        y: bit.y - 90 - i * 12,
        x: bit.x + (left ? -40 : 40) + i * 8,
        alpha: 0,
        duration: 920 + i * 70,
        onComplete: () => bit.destroy()
      });
      this.bits.push(bit);
    });

    this.scene.tweens.add({
      targets: this.root,
      scale: 1.08,
      angle: 0,
      duration: 220,
      ease: "Back.out"
    });
    this.scene.tweens.add({
      targets: this.root,
      scale: 1,
      duration: 120,
      delay: 220
    });
    this.scene.tweens.add({
      targets: face,
      y: -36,
      duration: 160,
      yoyo: true,
      repeat: 2
    });
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      delay: 1100,
      duration: 220,
      onComplete: () => this.root.setVisible(false)
    });
  }

  destroy() {
    this.clear();
    this.root.destroy();
  }
}
