import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js?v=local261";
import { AuthSystem } from "../systems/AuthSystem.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { MatchLive } from "../systems/MatchLive.js?v=local272";
import { Presence } from "../systems/Presence.js?v=local272";
import { t } from "../i18n/I18n.js?v=local279";

export class AuthScene extends Phaser.Scene {
  constructor() { super("auth"); }

  create() {
    this.busy = false;
    drawGrid(this);
    const W = this.scale.width;
    this.add.text(W / 2, 108, t("menu.kicker"), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "700", color: "#ffb56a"
    }).setOrigin(0.5);
    this.add.text(W / 2, 164, t("menu.title"), {
      fontFamily: UI_FONT, fontSize: "54px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 226, t("auth.login"), {
      fontFamily: UI_FONT, fontSize: "22px", color: "#7a4a30"
    }).setOrigin(0.5);
    this.note = this.add.text(W / 2, 268, t("auth.playNowHint"), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#8a5a38", align: "center", wordWrap: { width: 720 }
    }).setOrigin(0.5);
    this.onlineLine = this.add.text(W / 2, 300, t("queue.onlineNow", { n: Presence.shown() }), {
      fontFamily: UI_FONT, fontSize: "20px", fontStyle: "800", color: "#2a7a18"
    }).setOrigin(0.5);
    this.waitLine = this.add.text(W / 2, 332, t("queue.exhibitWait", { n: MatchLive.exhibitShown() }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#c45a16"
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

    makeButton(this, W / 2, 380, 360, 58, t("auth.playNow"), () => {
      this.enterGuest("exhibit");
    }, 0xff6a22);
    makeButton(this, W / 2, 458, 360, 52, t("auth.playBot"), () => {
      this.enterGuest("bot");
    }, 0x3ad6ff);
    makeButton(this, W / 2, 532, 360, 48, t("auth.haveId"), () => {
      AuthSystem.showOverlay();
    }, 0xffb14a);
    makeButton(this, W / 2, 620, 280, 44, t("auth.wikiFirst"), () => {
      AuthSystem.hideOverlay();
      this.scene.start("wiki", { from: "auth" });
    }, 0x7d5cff);

    this.refreshWait();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.paintWaitLine() });
    this.time.addEvent({ delay: 4000, loop: true, callback: () => this.refreshWait() });
  }

  paintWaitLine() {
    if (!this.sys || !this.sys.isActive() || !this.waitLine) return;
    this.waitLine.setText(t("queue.exhibitWait", { n: MatchLive.exhibitShown() }));
  }

  refreshWait() {
    Presence.poll().then((n) => {
      if (!this.sys || !this.sys.isActive()) return;
      if (this.onlineLine) this.onlineLine.setText(t("queue.onlineNow", { n: n }));
      this.paintWaitLine();
    });
  }

  enterGuest(kind) {
    if (this.busy) return;
    this.busy = true;
    this.note.setText("...");
    AuthSystem.startGuestPlay().then(() => {
      this.startGuestMatch(kind);
    }).catch((err) => {
      this.busy = false;
      this.note.setText((err && err.message) || t("auth.guestFail"));
    });
  }

  startGuestMatch(kind) {
    Session.exhibitFriendId = null;
    Session.exhibitIncoming = false;
    Session.rival = null;
    Session.net = false;
    if (kind === "bot") {
      Session.mode = "bot";
      Session.exhibitCasual = false;
    } else {
      Session.mode = "exhibit";
      Session.exhibitCasual = true;
    }
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
    this.busy = false;
    AuthSystem.hideOverlay();
  }
}
