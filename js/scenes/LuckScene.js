import { drawGrid, makeButton } from "../ui/Ui.js";
import { COURTS } from "../data/courts.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";

export class LuckScene extends Phaser.Scene {
  constructor() { super("luck"); }

  create() {
    this.input.setTopOnly(false);
    drawGrid(this);
    const W = this.scale.width;
    const f = "Segoe UI, Kanit, sans-serif";

    this.add.text(W / 2, 42, t("luck.title"), {
      fontFamily: f, fontSize: "36px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    this.add.text(W / 2, 88, t("luck.sub"), {
      fontFamily: f, fontSize: "18px", color: "#7a4a30"
    }).setOrigin(0.5);

    this.youRoll = this.add.text(W / 2 - 220, 190, "00", {
      fontFamily: f, fontSize: "88px", fontStyle: "800", color: "#ffe08a"
    }).setOrigin(0.5);
    this.botRoll = this.add.text(W / 2 + 220, 190, "00", {
      fontFamily: f, fontSize: "88px", fontStyle: "800", color: "#d8e8ff"
    }).setOrigin(0.5);
    this.add.text(W / 2 - 220, 258, t("play.you"), {
      fontFamily: f, fontSize: "18px", fontStyle: "800", color: "#c8ff3a"
    }).setOrigin(0.5);
    this.add.text(W / 2 + 220, 258, t("play.bot"), {
      fontFamily: f, fontSize: "18px", fontStyle: "800", color: "#ff8a6a"
    }).setOrigin(0.5);

    this.status = this.add.text(W / 2, 310, t("luck.rolling"), {
      fontFamily: f, fontSize: "22px", fontStyle: "800", color: "#fff4e8"
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
