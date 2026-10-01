import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js?v=local240";

export class AuthScene extends Phaser.Scene {
  constructor() { super("auth"); }

  create() {
    drawGrid(this);
    const W = this.scale.width;
    this.add.text(W / 2, 118, t("menu.kicker"), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "700", color: "#ffb56a"
    }).setOrigin(0.5);
    this.add.text(W / 2, 176, t("menu.title"), {
      fontFamily: UI_FONT, fontSize: "58px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 240, t("auth.login"), {
      fontFamily: UI_FONT, fontSize: "22px", color: "#7a4a30"
    }).setOrigin(0.5);
    this.note = this.add.text(W / 2, 292, t("auth.playNowHint"), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#8a5a38", align: "center", wordWrap: { width: 720 }
    }).setOrigin(0.5);
    AudioSystem.playMenu();
    if (AuthSystem.canPlay()) {
      this.enterGame();
      return;
    }
    if (AuthSystem.wantRegister || AuthSystem.needsName()) {
      AuthSystem.wantRegister = false;
      AuthSystem.showOverlay();
    } else {
      AuthSystem.hideOverlay();
    }

    makeButton(this, W / 2, 400, 360, 64, t("auth.playNow"), () => {
      if (this.busy) return;
      this.busy = true;
      this.note.setText("...");
      AuthSystem.startGuestPlay().then(() => {
        this.startGuestMatch();
      }).catch((err) => {
        this.busy = false;
        this.note.setText((err && err.message) || t("auth.guestFail"));
      });
    }, 0xff6a22);
    makeButton(this, W / 2, 492, 360, 52, t("auth.haveId"), () => {
      AuthSystem.showOverlay();
    }, 0xffb14a);
    makeButton(this, W / 2, 620, 280, 44, t("auth.wikiFirst"), () => {
      AuthSystem.hideOverlay();
      this.scene.start("wiki", { from: "auth" });
    }, 0x7d5cff);
  }

  startGuestMatch() {
    Session.mode = "exhibit";
    Session.exhibitCasual = true;
    Session.exhibitFriendId = null;
    Session.exhibitIncoming = false;
    Session.rival = null;
    Session.net = false;
    AuthSystem.hideOverlay();
    AudioSystem.unlock();
    this.scene.start("select");
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
