import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { COURTS } from "../data/courts.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { t, I18n } from "../i18n/I18n.js";

export class LuckScene extends Phaser.Scene {
  constructor() { super("luck"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    this.input.setTopOnly(false);
    drawGrid(this);
    const W = this.scale.width;
    const f = UI_FONT;
    const dark = { stroke: "#fff6ea", strokeThickness: 7 };

    this.add.text(W / 2, 42, t("luck.title"), {
      fontFamily: f, fontSize: "36px", fontStyle: "900", color: "#3a2418",
      stroke: "#fff6ea", strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(W / 2, 88, t("luck.sub"), {
      fontFamily: f, fontSize: "18px", fontStyle: "700", color: "#5a3828",
      stroke: "#fff6ea", strokeThickness: 5
    }).setOrigin(0.5);

    this.youRoll = this.add.text(W / 2 - 220, 190, "00", {
      fontFamily: f, fontSize: "88px", fontStyle: "900", color: "#c45a16", ...dark
    }).setOrigin(0.5);
    this.botRoll = this.add.text(W / 2 + 220, 190, "00", {
      fontFamily: f, fontSize: "88px", fontStyle: "900", color: "#1a6aa8", ...dark
    }).setOrigin(0.5);
    this.add.text(W / 2 - 220, 258, t("play.you"), {
      fontFamily: f, fontSize: "20px", fontStyle: "800", color: "#2a7a18",
      stroke: "#fff6ea", strokeThickness: 5
    }).setOrigin(0.5);
    const foeLab = (Session.mode === "pvp" || Session.mode === "exhibit") ? t("play.rival") : t("play.bot");
    this.add.text(W / 2 + 220, 258, foeLab, {
      fontFamily: f, fontSize: "20px", fontStyle: "800", color: "#c45a16",
      stroke: "#fff6ea", strokeThickness: 5
    }).setOrigin(0.5);

    const pill = this.add.graphics();
    pill.fillStyle(0xfff6ea, 0.96);
    pill.fillRoundedRect(W / 2 - 360, 288, 720, 56, 18);
    pill.lineStyle(3, 0xc45a16, 0.55);
    pill.strokeRoundedRect(W / 2 - 360, 288, 720, 56, 18);
    this.status = this.add.text(W / 2, 316, t("luck.rolling"), {
      fontFamily: f, fontSize: "22px", fontStyle: "800", color: "#3a2418",
      align: "center", wordWrap: { width: 680 }
    }).setOrigin(0.5);

    this.pickBits = [];
    COURTS.forEach((c, i) => {
      const x = 170 + i * 310;
      const y = 520;
      const card = this.add.rectangle(x, y, 280, 250, 0x161022, 0.94)
        .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(c.color).color, 0.9)
        .setInteractive({ useHandCursor: true })
        .setDepth(5)
        .setVisible(false);
      let img = null;
      if (this.textures.exists("court-" + c.id)) {
        img = this.add.image(x, y - 46, "court-" + c.id).setDisplaySize(250, 140).setDepth(6).setVisible(false);
      }
      const t1 = this.add.text(x, y + 48, I18n.courtName(c.id), {
        fontFamily: f, fontSize: "20px", fontStyle: "800", color: c.color
      }).setOrigin(0.5).setDepth(7).setVisible(false);
      const t2 = this.add.text(x, y + 80, I18n.courtFlavor(c.id), {
        fontFamily: f, fontSize: "13px", color: "#d8c8f0", wordWrap: { width: 250 }, align: "center"
      }).setOrigin(0.5).setDepth(7).setVisible(false);
      card.on("pointerdown", () => this.chooseCourt(c.id));
      this.pickBits.push(card, t1, t2);
      if (img) this.pickBits.push(img);
    });

    this.rollUntilWinner();
    makeButton(this, 120, 40, 140, 40, t("nav.back"), () => this.scene.start("select"), 0x7d5cff);
  }

  showPicks() {
    this.pickBits.forEach((o) => o.setVisible(true));
  }

  rollUntilWinner() {
    this.status.setText(t("luck.rolling"));
    this.rollTween(0, () => {
      let you = Phaser.Math.Between(1, 99);
      let bot = Phaser.Math.Between(1, 99);
      if (you === bot) bot = you === 99 ? 98 : you + 1;
      this.youRoll.setText(String(you).padStart(2, "0"));
      this.botRoll.setText(String(bot).padStart(2, "0"));
      const youWin = you > bot;
      Session.youServe = !youWin;
      AudioSystem.ui();
      if (youWin) {
        this.status.setText(t("luck.youWin"));
        this.showPicks();
      } else {
        const pick = Phaser.Utils.Array.GetRandom(COURTS);
        this.status.setText(t("luck.botWin", { court: I18n.courtName(pick.id) }));
        this.time.delayedCall(1100, () => this.chooseCourt(pick.id));
      }
    });
  }

  rollTween(step, done) {
    if (step > 18) {
      done();
      return;
    }
    this.youRoll.setText(String(Phaser.Math.Between(1, 99)).padStart(2, "0"));
    this.botRoll.setText(String(Phaser.Math.Between(1, 99)).padStart(2, "0"));
    this.time.delayedCall(40, () => this.rollTween(step + 1, done));
  }

  chooseCourt(id) {
    Session.courtId = id;
    AudioSystem.ui();
    this.scene.start("play");
  }
}
