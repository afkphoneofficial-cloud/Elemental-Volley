import { drawGrid } from "../ui/Ui.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";

export class StarterScene extends Phaser.Scene {
  constructor() { super("starter"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    this.add.text(W / 2, 64, t("starter.title"), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "36px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 108, t("starter.sub"), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "16px", color: "#7a4a30",
      wordWrap: { width: 1000 }, align: "center"
    }).setOrigin(0.5);

    ROSTER_IDS.forEach((id, i) => {
      const data = ROSTER[id];
      const x = 190 + i * 300;
      const y = 380;
      const card = this.add.rectangle(x, y, 250, 380, 0x161022, 0.94)
        .setStrokeStyle(2, data.colors.main, 0.85)
        .setInteractive({ useHandCursor: true });
      this.add.image(x, y - 80, "vis_" + id).setDisplaySize(140, 140).setDepth(6);
      this.add.text(x, y + 48, I18n.charName(id), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "24px", fontStyle: "800",
        color: "#" + data.colors.main.toString(16).padStart(6, "0")
      }).setOrigin(0.5);
      this.add.text(x, y + 84, I18n.charBlurb(id), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "14px", color: "#b8a8d0",
        wordWrap: { width: 220 }, align: "center"
      }).setOrigin(0.5);
      this.add.text(x, y + 128, t("starter.free"), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "14px", color: "#c8ff3a"
      }).setOrigin(0.5);
      card.on("pointerdown", () => {
        AudioSystem.ui();
        SaveSystem.chooseStarter(id);
        this.scene.start("hub");
      });
    });
  }
}
