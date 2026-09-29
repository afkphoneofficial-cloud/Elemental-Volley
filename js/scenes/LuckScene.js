import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { COURTS } from "../data/courts.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { NetPlay } from "../systems/NetPlay.js";

export class LuckScene extends Phaser.Scene {
  constructor() { super("luck"); }

  init(data) {
    this.bootLuck = data && data.youRoll != null ? data : null;
  }

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

    this.net = Session.net === true;
    this.luckId = null;
    this.rollDone = false;
    this.pendingGo = null;
    this.off = this.net ? NetPlay.on((msg) => {
      if (msg.t === "luck") this.playNetLuck(msg);
      if (msg.t === "go") this.armGo(msg);
    }) : null;
    this.events.once("shutdown", () => {
      if (this.off) this.off();
      this.clearRollTimers();
    });
    if (this.net) {
      this._boot = window.setTimeout(() => {
        this.playNetLuck(this.bootLuck || NetPlay.lastLuck);
      }, 40);
    } else {
      this.rollUntilWinner();
    }
    makeButton(this, 120, 40, 140, 40, t("nav.back"), () => {
      if (this.net) NetPlay.quit();
      this.scene.start("select");
    }, 0x7d5cff);
  }

  showPicks() {
    this.pickBits.forEach((o) => o.setVisible(true));
  }

  clearRollTimers() {
    (this._rollTimers || []).forEach((id) => window.clearTimeout(id));
    this._rollTimers = [];
    if (this._boot) window.clearTimeout(this._boot);
    this._boot = null;
    if (this._retry) window.clearTimeout(this._retry);
    this._retry = null;
  }

  armGo(msg) {
    this.pendingGo = msg || true;
    if (this.rollDone) this.leaveToPlay(500);
  }

  leaveToPlay(delay) {
    this._rollTimers = this._rollTimers || [];
    this._rollTimers.push(window.setTimeout(() => {
      if (this.sys && this.sys.isActive()) this.scene.start("play");
    }, delay || 0));
  }

  goReady(msg) {
    const go = this.pendingGo || NetPlay.lastGo;
    return !!(go && (!msg.roomId || !go.roomId || go.roomId === msg.roomId));
  }

  playNetLuck(msg) {
    if (!msg || msg.youRoll == null) {
      this.status.setText(t("luck.rolling"));
      if (!this._retry) {
        this._retry = window.setTimeout(() => {
          this._retry = null;
          if (this.sys && this.sys.isActive()) this.playNetLuck(NetPlay.lastLuck);
        }, 220);
      }
      return;
    }
    const id = msg.roomId || (msg.youRoll + ":" + msg.foeRoll);
    if (this.luckId === id) return;
    this.luckId = id;
    this.rollDone = false;
    Session.netHost = msg.host === true;
    if (msg.mode === "exhibit" || msg.mode === "pvp") Session.mode = msg.mode;
    if (msg.youSide) Session.youSide = msg.youSide === 2 ? 2 : 1;
    if (msg.rival) {
      Session.rival = {
        live: true,
        userId: msg.rival.id,
        nameTh: msg.rival.name,
        nameEn: msg.rival.name,
        mmr: msg.rival.mmr | 0,
        fighter: msg.rival.fighter,
        avatarId: msg.rival.avatarId || "av01",
        wins: msg.rival.wins | 0,
        mostUsed: msg.rival.mostUsed,
        difficulty: "normal",
        skin: msg.rival.skin | 0 || 1
      };
      Session.botId = msg.rival.fighter || Session.botId;
      if (msg.rival.skin) Session.foeSkin = msg.rival.skin | 0;
    }
    this.status.setText(t("luck.rolling"));
    this.rollTween(0, () => {
      if (!this.sys || !this.sys.isActive()) return;
      this.youRoll.setText(String(msg.youRoll | 0).padStart(2, "0"));
      this.botRoll.setText(String(msg.foeRoll | 0).padStart(2, "0"));
      AudioSystem.ui();
      this.rollDone = true;
      if (this.goReady(msg)) {
        this.status.setText(t("luck.waitGo"));
        this.leaveToPlay(550);
        return;
      }
      if (msg.youPick) {
        this.status.setText(t("luck.youWin"));
        this.showPicks();
      } else {
        this.status.setText(t("luck.waitFoe"));
      }
    });
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
        this._rollTimers = this._rollTimers || [];
        this._rollTimers.push(window.setTimeout(() => {
          if (this.sys && this.sys.isActive()) this.chooseCourt(pick.id);
        }, 1100));
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
    this._rollTimers = this._rollTimers || [];
    this._rollTimers.push(window.setTimeout(() => {
      if (!this.sys || !this.sys.isActive()) return;
      this.rollTween(step + 1, done);
    }, 40));
  }

  chooseCourt(id) {
    Session.courtId = id;
    AudioSystem.ui();
    if (this.net) {
      this.pickBits.forEach((o) => { try { o.disableInteractive && o.disableInteractive(); } catch (e) {} });
      this.status.setText(t("luck.waitGo"));
      NetPlay.pickCourt(id);
      return;
    }
    this.scene.start("play");
  }
}
