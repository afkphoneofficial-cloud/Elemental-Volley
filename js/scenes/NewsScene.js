import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { I18n, t } from "../i18n/I18n.js";
import { NEWS_POSTS } from "../data/news.js?v=local216";

export class NewsScene extends Phaser.Scene {
  constructor() { super("news"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    makeButton(this, 96, 40, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start("hub");
    }, 0x7d5cff);
    this.add.text(W / 2, 42, t("hub.navNews"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);

    NEWS_POSTS.forEach((row, i) => {
      const y = 128 + i * 132;
      const g = this.add.graphics();
      g.fillStyle(0xfff6ea, 0.98);
      g.fillRoundedRect(W / 2 - 420, y - 48, 840, 112, 18);
      g.lineStyle(2, 0x3ad6ff, 0.8);
      g.strokeRoundedRect(W / 2 - 420, y - 48, 840, 112, 18);
      this.add.text(W / 2 - 392, y - 28, I18n.lang === "en" ? row.dateEn : row.dateTh, {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#c45a16"
      }).setOrigin(0, 0.5);
      this.add.text(W / 2 - 392, y + 12, I18n.lang === "en" ? row.en : row.th, {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#3a2418",
        wordWrap: { width: 784 }
      }).setOrigin(0, 0.5);
    });
    AudioSystem.playMenu();
  }
}
