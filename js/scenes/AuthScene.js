import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";

export class AuthScene extends Phaser.Scene {
  constructor() { super("auth"); }

  create() {
    drawGrid(this);
    const W = this.scale.width;
    this.add.text(W / 2, 150, t("menu.kicker"), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "700", color: "#ffb56a"
    }).setOrigin(0.5);
    this.add.text(W / 2, 210, t("menu.title"), {
      fontFamily: UI_FONT, fontSize: "64px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 280, t("auth.login"), {
      fontFamily: UI_FONT, fontSize: "22px", color: "#7a4a30"
    }).setOrigin(0.5);
    AudioSystem.playMenu();
    AuthSystem.showOverlay();
    if (AuthSystem.canPlay()) {
      this.enterGame();
      return;
    }
    makeButton(this, W / 2, 620, 280, 44, t("auth.wikiFirst"), () => {
      AuthSystem.hideOverlay();
      this.scene.start("wiki", { from: "auth" });
    }, 0x7d5cff);
  }

  enterGame() {
    if (!AuthSystem.canPlay()) {
      AuthSystem.showOverlay();
      return;
    }
    AuthSystem.hideOverlay();
    AudioSystem.unlock();
    this.scene.start(SaveSystem.hasStarter() ? "hub" : "starter");
  }

  shutdown() {
    AuthSystem.hideOverlay();
  }
}
