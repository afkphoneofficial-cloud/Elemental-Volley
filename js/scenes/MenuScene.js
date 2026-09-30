import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";
import { TitleSystem } from "../systems/TitleSystem.js?v=local216";

export class MenuScene extends Phaser.Scene {
  constructor() { super("menu"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    this.add.text(W / 2, 128, t("menu.kicker"), {
      fontFamily: UI_FONT,
      fontSize: "18px",
      fontStyle: "700",
      color: "#c45a16",
      letterSpacing: 10
    }).setOrigin(0.5);

    this.add.text(W / 2, 188, t("menu.title"), {
      fontFamily: UI_FONT,
      fontSize: "72px",
      fontStyle: "900",
      color: "#3a2418",
      stroke: "#ff6a22",
      strokeThickness: 1
    }).setOrigin(0.5).setShadow(0, 10, "#ff6a2288", 24, true, true);

    this.add.text(W / 2, 268, t("menu.tag"), {
      fontFamily: UI_FONT,
      fontSize: "20px",
      color: "#7a4a30"
    }).setOrigin(0.5);
    this.add.text(W / 2, 308, t("menu.signedIn", { name: TitleSystem.named(SaveSystem.data, AuthSystem.displayName()) }), {
      fontFamily: UI_FONT,
      fontSize: "16px",
      fontStyle: "700",
      color: "#c45a16"
    }).setOrigin(0.5);
    AudioSystem.playMenu();

    makeButton(this, W / 2, 400, 380, 64, t("menu.enter"), () => {
      AudioSystem.unlock();
      AudioSystem.playMenu();
      AudioSystem.ui();
      this.scene.start(SaveSystem.hasStarter() ? "hub" : "starter");
    });
    makeButton(this, W / 2 - 170, 490, 200, 48, t("menu.wiki"), () => {
      AudioSystem.unlock();
      AudioSystem.playMenu();
      AudioSystem.ui();
      this.scene.start("wiki", { from: "menu" });
    }, 0x7d5cff);
    makeButton(this, W / 2 + 170, 490, 200, 48, t("menu.settings"), () => {
      AudioSystem.unlock();
      AudioSystem.ui();
      this.scene.start("settings", { from: "menu" });
    }, 0xffe08a);
  }
}
