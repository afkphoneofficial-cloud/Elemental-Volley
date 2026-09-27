import { GAME } from "../config/gameConfig.js";
import { t } from "../i18n/I18n.js";

export class ServeMeter {
  constructor(scene) {
    this.scene = scene;
    this.value = 0;
    this.dir = 1;
    this.visible = false;
    const x = GAME.width / 2;
    const y = 148;
    this.bg = scene.add.rectangle(x, y, 280, 22, 0x1a1018, 0.92).setStrokeStyle(2, 0xffd24a, 0.7).setDepth(22).setVisible(false);
    this.redL = scene.add.rectangle(x - 95, y, 70, 14, 0x8a2030, 0.95).setDepth(23).setVisible(false);
    this.yellowL = scene.add.rectangle(x - 42, y, 36, 14, 0xc8a020, 0.95).setDepth(23).setVisible(false);
    this.green = scene.add.rectangle(x, y, 48, 14, 0x2ecc71, 0.95).setDepth(23).setVisible(false);
    this.yellowR = scene.add.rectangle(x + 42, y, 36, 14, 0xc8a020, 0.95).setDepth(23).setVisible(false);
    this.redR = scene.add.rectangle(x + 95, y, 70, 14, 0x8a2030, 0.95).setDepth(23).setVisible(false);
    this.needle = scene.add.rectangle(x - 130, y, 6, 26, 0xffffff, 1).setDepth(24).setVisible(false);
    this.label = scene.add.text(x, y - 26, t("play.hudHint"), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "14px", color: "#ffd24a"
    }).setOrigin(0.5).setDepth(24).setVisible(false);
    this.parts = [this.bg, this.redL, this.yellowL, this.green, this.yellowR, this.redR, this.needle, this.label];
  }

  show() {
    this.visible = true;
    this.value = 0;
    this.dir = 1;
    this.parts.forEach((p) => p.setVisible(true));
  }

  hide() {
    this.visible = false;
    this.parts.forEach((p) => p.setVisible(false));
  }

  update(dt) {
    if (!this.visible) return;
    this.value += this.dir * dt * 0.00135;
    if (this.value >= 1) { this.value = 1; this.dir = -1; }
    if (this.value <= 0) { this.value = 0; this.dir = 1; }
    this.needle.x = GAME.width / 2 - 130 + this.value * 260;
  }

  quality() {
    const v = this.value;
    if (v >= 0.42 && v <= 0.58) return "perfect";
    if (v >= 0.28 && v <= 0.72) return "good";
    if (v < 0.28) return "early";
    return "late";
  }
}
