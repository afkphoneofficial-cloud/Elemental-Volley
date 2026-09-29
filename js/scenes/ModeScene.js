import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { Session } from "../systems/Session.js";
import { t } from "../i18n/I18n.js";
import { formatEtherWait } from "../systems/Ether.js";

export class ModeScene extends Phaser.Scene {
  constructor() { super("mode"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const st = SaveSystem.etherNow();
    const wait = st.full ? t("hub.etherFull") : t("hub.etherWait", { t: formatEtherWait(st.nextMs) });

    this.add.text(W / 2, 44, t("hub.modeTitle"), {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 80, t("hub.playHint"), {
      fontFamily: UI_FONT, fontSize: "15px", color: "#7a4a30", align: "center", wordWrap: { width: 1000 }
    }).setOrigin(0.5);

    this.card(W / 2 - 390, 330, 0xffb14a, t("hub.playBot"), t("hub.modeBotBody"), () => {
      Session.mode = "bot";
      Session.rival = null;
      AudioSystem.ui();
      this.scene.start("select");
    });
    this.card(W / 2, 330, 0x7d5cff, t("hub.playPvp"), t("hub.modePvpBody", {
      n: st.n, max: ECONOMY.etherMax, wait
    }), () => {
      Session.mode = "pvp";
      AudioSystem.ui();
      this.scene.start("select");
    });
    this.card(W / 2 + 390, 330, 0xff8ab8, t("hub.playExhibit"), t("hub.modeExhibitBody"), () => {
      Session.mode = "exhibit";
      AudioSystem.ui();
      this.scene.start("friends", { pick: true });
    });
    makeButton(this, W / 2, 580, 420, 48, t("hub.playSpecial"), () => {
      Session.mode = "special";
      AudioSystem.ui();
      this.scene.start("select");
    }, 0x3ad6ff);
    this.add.text(W / 2, 624, t("hub.modeSpecialBody"), {
      fontFamily: UI_FONT, fontSize: "13px", color: "#5a3828", align: "center", wordWrap: { width: 720 }
    }).setOrigin(0.5);

    makeButton(this, 120, 44, 140, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start("hub");
    }, 0x7d5cff);
    makeButton(this, W - 140, 44, 200, 40, t("queue.how"), () => {
      AudioSystem.ui();
      this.scene.start("rankinfo", { from: "mode" });
    }, 0x3ad6ff);
    AudioSystem.playMenu();
  }

  card(x, y, color, title, body, onClick) {
    roundPanel(this, x, y, 360, 280, color, 0xfff6ea);
    this.add.text(x, y - 90, title, {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418", align: "center", wordWrap: { width: 320 }
    }).setOrigin(0.5).setDepth(8);
    this.add.text(x, y + 8, body, {
      fontFamily: UI_FONT, fontSize: "14px", color: "#5a3828", align: "center", wordWrap: { width: 300 }
    }).setOrigin(0.5).setDepth(8);
    makeButton(this, x, y + 100, 220, 44, title, () => onClick(), color);
  }
}
