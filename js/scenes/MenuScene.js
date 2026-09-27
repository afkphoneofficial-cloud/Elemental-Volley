import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";

export class MenuScene extends Phaser.Scene {
  constructor() { super("menu"); }

  create() {
    drawGrid(this);
    const W = this.scale.width;
    this.add.text(W / 2, 128, t("menu.kicker"), {
      fontFamily: UI_FONT,
      fontSize: "18px",
      fontStyle: "700",
      color: "#ffb56a",
      letterSpacing: 10
    }).setOrigin(0.5);

    this.add.text(W / 2, 188, t("menu.title"), {
      fontFamily: UI_FONT,
      fontSize: "72px",
      fontStyle: "900",
      color: "#fff6ea",
      stroke: "#ff6a22",
      strokeThickness: 1
    }).setOrigin(0.5).setShadow(0, 10, "#ff6a2288", 24, true, true);

    this.add.text(W / 2, 268, t("menu.tag"), {
      fontFamily: UI_FONT,
      fontSize: "20px",
      color: "#cbb8e8"
    }).setOrigin(0.5);
    AudioSystem.playMenu();

    makeButton(this, W / 2, 430, 340, 58, t("menu.enter"), () => {
      AudioSystem.unlock();
      AudioSystem.playMenu();
      AudioSystem.ui();
      this.scene.start(SaveSystem.hasStarter() ? "hub" : "starter");
    });
    makeButton(this, W / 2, 510, 340, 50, t("menu.wiki"), () => {
      AudioSystem.unlock();
      AudioSystem.playMenu();
      AudioSystem.ui();
      this.scene.start("wiki", { from: "menu" });
    }, 0x7d5cff);
    makeButton(this, W / 2, 580, 340, 50, t("menu.settings"), () => {
      AudioSystem.unlock();
      AudioSystem.ui();
      this.scene.start("settings", { from: "menu" });
    }, 0xffe08a);
  }
}
