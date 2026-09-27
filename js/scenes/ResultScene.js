import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { pickRefVerdict } from "../data/refVerdicts.js";
import { formatMatchClock, pickStatTalk } from "../gameplay/MatchStats.js";

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
    this.refSeason = this.payload.refSeason || this.courtId;
    this.refChar = this.payload.refChar || null;
    this.verdict = pickRefVerdict(this.win);
    this.page = "verdict";
    this.bits = { verdict: [], stats: [] };
  }

  create() {
    drawGrid(this);
    const W = this.scale.width;
    const H = this.scale.height;
    const pal = SEASON_FX[this.courtId] || SEASON_FX.summer;
    this.pal = pal;

    let pvp = this.win ? ECONOMY.pvpWin : ECONOMY.pvpLoss;
    SaveSystem.addPvp(pvp);
    this.bonus = 0;
    if (this.win) this.bonus = SaveSystem.takeFirstWinBonus(ECONOMY.firstWinBonus);
    this.pvpGain = pvp;

    this.buildVerdict(W, H, pal);
    this.buildStats(W, H, pal);
    this.againBtn = makeButton(this, W / 2 - 300, 640, 260, 52, t("result.again"), () => this.scene.start("select"));
    this.shopBtn = makeButton(this, W / 2, 640, 260, 52, t("result.shop"), () => this.scene.start("shop"), 0xc8ff3a);
    this.hubBtn = makeButton(this, W / 2 + 300, 640, 260, 52, t("result.hub"), () => this.scene.start("hub"), 0x7d5cff);
    this.showPage("verdict");
    this.applyLang();
    this.playOutcomeFx(pal);
    AudioSystem.score();
    AudioSystem.playMenu();
    this.cameras.main.fadeIn(220, 8, 6, 10);
  }

  keep(page, obj) {
    this.bits[page].push(obj);
    return obj;
  }

  buildVerdict(W, H, pal) {
    const v = "verdict";
    this.keep(v, this.add.rectangle(W / 2, H / 2, W, H, this.win ? 0x1a1008 : 0x0c1018, 0.28).setDepth(5));
    const card = this.add.graphics().setDepth(6);
    card.fillStyle(0x120c14, 0.94);
    card.fillRoundedRect(W / 2 - 430, 72, 860, 400, 28);
    card.lineStyle(3, pal.glow, 0.9);
    card.strokeRoundedRect(W / 2 - 430, 72, 860, 400, 28);
    this.keep(v, card);

    const refKey = this.textures.exists("vis_ref_" + this.refSeason) ? "vis_ref_" + this.refSeason : "vis_ignis";
    this.keep(v, this.add.circle(W / 2 - 248, 250, 128, pal.glow, 0.22).setDepth(7));
    this.keep(v, this.add.image(W / 2 - 248, 250, refKey).setDisplaySize(248, 248).setDepth(8));
    this.keep(v, this.add.circle(W / 2 - 248, 250, 118, 0x000000, 0).setStrokeStyle(6, pal.glow, 0.95).setDepth(8));

    this.mark = this.keep(v, this.add.text(W / 2 + 150, 128, "", {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: this.win ? "#c8ff3a" : "#ffb0c8"
    }).setOrigin(0.5).setDepth(8));
    this.head = this.keep(v, this.add.text(W / 2 + 150, 176, "", {
      fontFamily: UI_FONT, fontSize: "34px", fontStyle: "900", color: "#fff6ea",
      stroke: "#12080e", strokeThickness: 6, align: "center", wordWrap: { width: 460 }
    }).setOrigin(0.5).setDepth(8));
    this.quote = this.keep(v, this.add.text(W / 2 + 150, 268, "", {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "700", color: "#fff6ea",
      align: "center", wordWrap: { width: 460 }, stroke: "#12080e", strokeThickness: 4
    }).setOrigin(0.5).setDepth(8));
    this.refBy = this.keep(v, this.add.text(W / 2 + 150, 348, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#ffe08a"
    }).setOrigin(0.5).setDepth(8));
    this.scoreLine = this.keep(v, this.add.text(W / 2 + 150, 390, "", {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#fff4e8"
    }).setOrigin(0.5).setDepth(8));
    this.names = this.keep(v, this.add.text(W / 2 + 150, 428, "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#c8bdd8"
    }).setOrigin(0.5).setDepth(8));
    this.pvpText = this.keep(v, this.add.text(W / 2, 500, "", {
      fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(8));

    this.statsBtn = makeButton(this, W / 2, 548, 340, 50, t("result.statsBtn"), () => this.showPage("stats"), 0xff6a22);
    this.keep(v, this.statsBtn.gfx);
    this.keep(v, this.statsBtn.text);
    this.keep(v, this.statsBtn.bg);
  }

  buildStats(W, H, pal) {
    const g = "stats";
    const card = this.add.graphics().setDepth(6);
    card.fillStyle(0xfff6ea, 0.96);
    card.fillRoundedRect(56, 56, W - 112, 520, 28);
    card.lineStyle(4, pal.glow, 0.85);
    card.strokeRoundedRect(56, 56, W - 112, 520, 28);
    this.keep(g, card);

    const refKey = this.textures.exists("vis_ref_" + this.refSeason) ? "vis_ref_" + this.refSeason : "vis_ignis";
    this.keep(g, this.add.circle(168, 168, 90, pal.glow, 0.28).setDepth(7));
    this.keep(g, this.add.image(168, 168, refKey).setDisplaySize(168, 168).setDepth(8));
    this.keep(g, this.add.circle(168, 168, 84, 0x000000, 0).setStrokeStyle(5, pal.glow, 0.95).setDepth(8));
    this.statsRef = this.keep(g, this.add.text(168, 258, "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5).setDepth(8));

    this.statsTitle = this.keep(g, this.add.text(W / 2 + 80, 92, "", {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(8));
    this.statsTalk = this.keep(g, this.add.text(W / 2 + 90, 168, "", {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "700", color: "#5a3828",
      align: "left", wordWrap: { width: 760 }
    }).setOrigin(0.5, 0).setDepth(8));

    this.statLines = [];
    const keys = ["statsTime", "statsHits", "statsPower", "statsUlt", "statsStreak", "statsRally", "statsAce", "statsError"];
    keys.forEach((key, i) => {
      const col = i < 4 ? 0 : 1;
      const row = i % 4;
      const x = 360 + col * 420;
      const y = 300 + row * 52;
      const lab = this.add.text(x, y, "", {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
      }).setOrigin(0, 0.5).setDepth(8);
      const val = this.add.text(x + 280, y, "", {
        fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
      }).setOrigin(1, 0.5).setDepth(8);
      this.keep(g, lab);
      this.keep(g, val);
      this.statLines.push({ key, lab, val });
    });

    this.statsBackBtn = makeButton(this, W / 2, 548, 280, 44, t("result.statsBack"), () => this.showPage("verdict"), 0x7d5cff);
    this.keep(g, this.statsBackBtn.gfx);
    this.keep(g, this.statsBackBtn.text);
    this.keep(g, this.statsBackBtn.bg);
  }

  showPage(page) {
    this.page = page;
    this.bits.verdict.forEach((o) => { if (o && o.setVisible) o.setVisible(page === "verdict"); });
    this.bits.stats.forEach((o) => { if (o && o.setVisible) o.setVisible(page === "stats"); });
    const showNav = true;
    if (this.againBtn && this.againBtn.bg) {
      [this.againBtn, this.shopBtn, this.hubBtn].forEach((b) => {
        if (!b) return;
        b.bg.setVisible(showNav);
        b.text.setVisible(showNav);
        b.gfx.setVisible(showNav);
      });
    }
  }

  applyLang() {
    const v = this.verdict;
    const en = I18n.lang === "en";
    const youId = this.payload.youId || "ignis";
    const botId = this.payload.botId || "volt";
    const score = this.payload.score || { p1: 0, p2: 0 };
    const st = this.payload.stats || {};
    if (this.mark) this.mark.setText(this.win ? t("result.winMark") : t("result.loseMark"));
    if (this.head) this.head.setText(en ? v.titleEn : v.titleTh);
    if (this.quote) this.quote.setText(en ? v.en : v.th);
    if (this.refBy) {
      const who = this.refChar ? charName(this.refChar) : t("court." + this.courtId + "Ref");
      this.refBy.setText(t("result.refLabel", { name: who }));
    }
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
      }) + "   ·   " + t("result.total", {
        pvp: SaveSystem.data.currencies.pvp,
        tokens: SaveSystem.data.currencies.tokens
      }));
    }
    if (this.statsBtn && this.statsBtn.text) this.statsBtn.text.setText(t("result.statsBtn"));
    if (this.statsBackBtn && this.statsBackBtn.text) this.statsBackBtn.text.setText(t("result.statsBack"));
    if (this.statsTitle) this.statsTitle.setText(t("result.statsTitle"));
    if (this.statsRef) {
      this.statsRef.setText(this.refChar ? charName(this.refChar) : t("court." + this.courtId + "Ref"));
    }
    const talk = pickStatTalk(st);
    const goodVar = talk.good === "talkAce" ? { n: st.aces } : talk.good === "talkStreak" ? { n: st.bestStreak } : talk.good === "talkRally" ? { n: st.longestRally } : talk.good === "talkUlt" ? { n: st.ults } : { n: st.hits };
    const badVar = talk.bad === "talkError" ? { n: st.errors } : {};
    if (this.statsTalk) {
      this.statsTalk.setText(t("result." + talk.good, goodVar) + "\n" + t("result." + talk.bad, badVar));
    }
    const values = {
      statsTime: formatMatchClock(st.ms),
      statsHits: String(st.hits || 0),
      statsPower: String(st.powerHits || 0),
      statsUlt: String(st.ults || 0),
      statsStreak: String(st.bestStreak || 0),
      statsRally: String(st.longestRally || 0),
      statsAce: String(st.aces || 0),
      statsError: String(st.errors || 0)
    };
    (this.statLines || []).forEach((row) => {
      row.lab.setText(t("result." + row.key));
      row.val.setText(values[row.key] || "0");
    });
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
        const lift = this.add.particles(W / 2 - 248, 250, "dot", {
          lifespan: { min: 900, max: 1800 },
          speed: { min: 20, max: 70 },
          gravityY: -40,
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.9, end: 0 },
          tint: [0xffe08a, 0xffffff, pal.burst[0]],
          emitting: false
        }).setDepth(20);
        lift.explode(12, W / 2 - 248, 220);
      }
    } catch (e) { /* optional */ }
  }
}
