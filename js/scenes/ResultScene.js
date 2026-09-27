import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { pickRefVerdict } from "../data/refVerdicts.js";

const SEASON_FX = {
  summer: { burst: [0xffe08a, 0xff6a22, 0xffffff], glow: 0xff8a3a },
  rain: { burst: [0x7ae8ff, 0x3ad6ff, 0xffffff], glow: 0x4ec8ff },
  spring: { burst: [0xff8ab8, 0xffe08a, 0xffffff], glow: 0xff8ab8 },
  winter: { burst: [0xe8f4ff, 0xa8d4ff, 0xffffff], glow: 0xc8e8ff }
};

export class ResultScene extends Phaser.Scene {
  constructor() { super("result"); }

  init(data) {
    this.payload = data || {};
    this.win = this.payload.winner === 1;
    this.courtId = this.payload.courtId || "summer";
    this.verdict = pickRefVerdict(this.win);
  }

  create() {
    drawGrid(this);
    const W = this.scale.width;
    const H = this.scale.height;
    const pal = SEASON_FX[this.courtId] || SEASON_FX.summer;

    let pvp = this.win ? ECONOMY.pvpWin : ECONOMY.pvpLoss;
    SaveSystem.addPvp(pvp);
    this.bonus = 0;
    if (this.win) this.bonus = SaveSystem.takeFirstWinBonus(ECONOMY.firstWinBonus);
    this.pvpGain = pvp;

    this.add.rectangle(W / 2, H / 2, W, H, this.win ? 0x1a1008 : 0x0c1018, 0.35);

    const card = this.add.graphics().setDepth(6);
    card.fillStyle(0x120c14, 0.94);
    card.fillRoundedRect(W / 2 - 430, 86, 860, 430, 28);
    card.lineStyle(3, pal.glow, 0.9);
    card.strokeRoundedRect(W / 2 - 430, 86, 860, 430, 28);
    card.lineStyle(10, pal.glow, 0.14);
    card.strokeRoundedRect(W / 2 - 436, 80, 872, 442, 32);

    const refKey = this.textures.exists("vis_ref_" + this.courtId) ? "vis_ref_" + this.courtId : "vis_ignis";
    this.add.circle(W / 2 - 248, 268, 118, pal.glow, 0.22).setDepth(7);
    this.add.image(W / 2 - 248, 268, refKey).setDisplaySize(210, 210).setDepth(8);
    this.add.circle(W / 2 - 248, 268, 108, 0x000000, 0).setStrokeStyle(6, pal.glow, 0.95).setDepth(8);

    this.mark = this.add.text(W / 2 + 150, 148, "", {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: this.win ? "#c8ff3a" : "#ffb0c8"
    }).setOrigin(0.5).setDepth(8);

    this.head = this.add.text(W / 2 + 150, 196, "", {
      fontFamily: UI_FONT, fontSize: "36px", fontStyle: "900", color: "#fff6ea",
      stroke: "#12080e", strokeThickness: 6, align: "center", wordWrap: { width: 460 }
    }).setOrigin(0.5).setDepth(8);

    this.quote = this.add.text(W / 2 + 150, 286, "", {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "700", color: "#fff6ea",
      align: "center", wordWrap: { width: 460 }, stroke: "#12080e", strokeThickness: 4
    }).setOrigin(0.5).setDepth(8);

    this.refBy = this.add.text(W / 2 + 150, 362, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#ffe08a"
    }).setOrigin(0.5).setDepth(8);

    this.scoreLine = this.add.text(W / 2 + 150, 398, "", {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#fff4e8"
    }).setOrigin(0.5).setDepth(8);

    this.names = this.add.text(W / 2 + 150, 438, "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#c8bdd8",
      align: "center"
    }).setOrigin(0.5).setDepth(8);

    this.pvpText = this.add.text(W / 2, 540, "", {
      fontFamily: UI_FONT, fontSize: "18px", color: "#c8bdd8"
    }).setOrigin(0.5).setDepth(8);

    this.totalText = this.add.text(W / 2, 568, "", {
      fontFamily: UI_FONT, fontSize: "15px", color: "#8e82a8"
    }).setOrigin(0.5).setDepth(8);

    this.againBtn = makeButton(this, W / 2 - 300, 640, 260, 52, t("result.again"), () => this.scene.start("select"));
    this.shopBtn = makeButton(this, W / 2, 640, 260, 52, t("result.shop"), () => this.scene.start("shop"), 0xc8ff3a);
    this.hubBtn = makeButton(this, W / 2 + 300, 640, 260, 52, t("result.hub"), () => this.scene.start("hub"), 0x7d5cff);

    this.applyLang();
    this.playOutcomeFx(pal);

    AudioSystem.score();
    AudioSystem.playMenu();
    this.cameras.main.fadeIn(220, 8, 6, 10);
  }

  applyLang() {
    const v = this.verdict;
    const en = I18n.lang === "en";
    const youId = this.payload.youId || "ignis";
    const botId = this.payload.botId || "volt";
    const score = this.payload.score || { p1: 0, p2: 0 };
    if (this.mark) this.mark.setText(this.win ? t("result.winMark") : t("result.loseMark"));
    if (this.head) this.head.setText(en ? v.titleEn : v.titleTh);
    if (this.quote) this.quote.setText(en ? v.en : v.th);
    if (this.refBy) this.refBy.setText(t("result.refLabel", { name: t("court." + this.courtId + "Ref") }));
    if (this.scoreLine) this.scoreLine.setText(score.p1 + "  -  " + score.p2);
    if (this.names) {
      this.names.setText(
        t("result.youTag", { name: charName(youId) }) + "     " +
        t("result.botTag", { name: charName(botId) })
      );
    }
    if (this.pvpText) {
      this.pvpText.setText(t("result.pvp", {
        pvp: this.pvpGain,
        bonus: this.bonus ? t("result.firstWin", { n: this.bonus }) : ""
      }));
    }
    if (this.totalText) {
      this.totalText.setText(t("result.total", {
        pvp: SaveSystem.data.currencies.pvp,
        tokens: SaveSystem.data.currencies.tokens
      }));
    }
    if (this.againBtn && this.againBtn.text) this.againBtn.text.setText(t("result.again"));
    if (this.shopBtn && this.shopBtn.text) this.shopBtn.text.setText(t("result.shop"));
    if (this.hubBtn && this.hubBtn.text) this.hubBtn.text.setText(t("result.hub"));
  }

  playOutcomeFx(pal) {
    const W = this.scale.width;
    const H = this.scale.height;
    try {
      if (this.win) {
        const boom = this.add.particles(0, 0, "dot", {
          lifespan: { min: 700, max: 1400 },
          speed: { min: 120, max: 420 },
          gravityY: 280,
          scale: { start: 1.2, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: pal.burst,
          blendMode: "ADD",
          emitting: false
        }).setDepth(20);
        const launch = () => {
          const x = 180 + Math.random() * (W - 360);
          boom.explode(18, x, H - 40);
        };
        launch();
        this.time.addEvent({ delay: 220, repeat: 8, callback: launch });
      } else {
        const lift = this.add.particles(W / 2 - 248, 268, "dot", {
          lifespan: { min: 900, max: 1800 },
          speed: { min: 20, max: 70 },
          gravityY: -40,
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.9, end: 0 },
          tint: [0xffe08a, 0xffffff, pal.burst[0]],
          emitting: false
        }).setDepth(20);
        lift.explode(16, W / 2 - 248, 200);
        this.time.addEvent({
          delay: 280,
          repeat: 6,
          callback: () => lift.explode(6, W / 2 - 248 + (Math.random() * 40 - 20), 220)
        });
      }
    } catch (e) { /* particles optional */ }
  }
}
