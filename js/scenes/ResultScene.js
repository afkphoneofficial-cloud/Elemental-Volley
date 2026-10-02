import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js?v=local240";
import { pickRefVerdict } from "../data/refVerdicts.js";
import { formatMatchClock, pickStatTalk } from "../gameplay/MatchStats.js";
import { TitleSystem } from "../systems/TitleSystem.js?v=local267";
import { titleById } from "../data/titles.js";
import { applyRankedMatch, isCalibrating, RANK_CAL_GAMES } from "../data/ranks.js";
import { matchRewards, hasMatchLoot } from "../data/matchRewards.js";
import { isRankWindowOpen } from "../data/rankWindows.js";
import { NetPlay } from "../systems/NetPlay.js?v=local267";
import { Leaderboard } from "../systems/Leaderboard.js?v=local268";
import { paintGiftIcons } from "../ui/giftIcons.js?v=local216";
import { TouchControls } from "../ui/TouchControls.js";
import { xpToNext, GROWTH_MAX_LV } from "../data/growth.js?v=local206";
import { texHeroSelect } from "../data/seasonLooks.js";

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
    this.bits = { verdict: [], stats: [], loot: [] };
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const H = this.scale.height;
    const pal = SEASON_FX[this.courtId] || SEASON_FX.summer;
    this.pal = pal;

    const sc = this.payload.score || {};
    const youScore = sc.p1 | 0;
    const foeScore = sc.p2 | 0;
    this.pvpMode = Session.mode === "pvp";
    this.exhibitMode = Session.mode === "exhibit";
    this.specialMode = Session.mode === "special";
    this.botMode = Session.mode === "bot";
    const pay = matchRewards({
      mode: Session.mode,
      win: this.win,
      youScore,
      foeScore,
      difficulty: Session.difficulty || "normal"
    });
    this.pvpGain = pay.stones;
    this.shardGain = pay.shards;
    this.coinGain = pay.coins | 0;
    this.xpGain = pay.xp;
    this.etherBar = 0;
    this.etherVial = 0;
    this.bonus = 0;
    if (pay.stones) SaveSystem.addPvp(pay.stones);
    if (pay.firstWinEligible) this.bonus = SaveSystem.takeFirstWinBonus(ECONOMY.firstWinBonus);
    if (pay.shards) SaveSystem.addTokens(pay.shards);
    if (pay.coins) SaveSystem.addCoins(pay.coins);
    if (pay.ether) {
      const got = SaveSystem.grantEther(pay.ether);
      this.etherBar = got.bar | 0;
      this.etherVial = got.vial | 0;
    }
    this.xpLevel = 0;
    this.xpBefore = null;
    this.xpShow = { lv: 1, into: 0, need: 1 };
    this.xpLeft = 0;
    this.xpPlayed = false;
    this.xpSlide = null;
    this.xpUpHold = 0;
    const youId = this.payload.youId || Session.playerId;
    this.youId = youId;
    if (pay.xp) {
      const pre = SaveSystem.growthOf(youId);
      this.xpBefore = { level: pre.level | 0, into: pre.into | 0, need: pre.need | 0 };
      const sheet = SaveSystem.addGrowthXp(youId, pay.xp);
      this.xpLevel = sheet.level;
      this.xpShow = { lv: this.xpBefore.level, into: this.xpBefore.into, need: this.xpBefore.need };
    }
    this.hasLoot = hasMatchLoot(pay) || this.bonus > 0 || this.etherBar > 0 || this.etherVial > 0 || this.coinGain > 0;
    if (this.botMode && this.win && Session.trainStage) SaveSystem.clearTrainStage(Session.trainStage);
    if (Session.net) NetPlay.send({ t: "done" });
    Session.net = false;
    Session.netHost = false;
    try {
      NetPlay.settled = true;
      NetPlay.stopPing();
    } catch (e) {}
    this.rankDelta = 0;
    this.rankAfter = null;
    this.rankCal = false;
    if (this.pvpMode) {
      const opp = (Session.rival && Session.rival.mmr) || 1000;
      const gap = Math.abs(youScore - foeScore);
      const applied = applyRankedMatch(SaveSystem.data.rank, opp, this.win, gap);
      SaveSystem.setRank(applied.rank);
      this.rankDelta = applied.delta;
      this.rankAfter = applied.after;
      this.rankCal = isCalibrating(applied.rank);
    }
    const rival = Session.rival;
    const foeName = rival ? (I18n.lang === "en" ? rival.nameEn : rival.nameTh) : "";
    SaveSystem.recordMatch({
      win: this.win,
      mode: this.pvpMode ? "pvp" : this.exhibitMode ? "exhibit" : this.specialMode ? "special" : "bot",
      youId: this.payload.youId,
      foeId: this.payload.botId,
      foeName,
      youScore,
      foeScore,
      diff: Session.difficulty,
      mmrDelta: this.rankDelta,
      stats: this.payload.stats || {}
    });
    this.newTitles = (TitleSystem.lastNew || []).slice();
    if (this.pvpMode || this.specialMode) {
      const board = this.pvpMode ? "pvp" : "special";
      SaveSystem.touchSeasonSnap(board, 0);
      if (this.pvpMode) {
        Leaderboard.load("pvp").then(() => {
          const place = Leaderboard.me && Leaderboard.me.place | 0;
          SaveSystem.touchSeasonSnap("pvp", place);
        });
      }
    }

    this.buildVerdict(W, H, pal);
    this.buildStats(W, H, pal);
    this.buildLoot(W, H, pal);
    this.guestPlay = AuthSystem.isGuest();
    if (this.guestPlay) {
      this.againBtn = makeButton(this, W / 2 - 190, 640, 300, 52, t("result.again"), () => {
        Session.mode = "exhibit";
        Session.exhibitCasual = true;
        Session.exhibitFriendId = null;
        Session.rival = null;
        this.leaveTo("select");
      });
      this.shopBtn = makeButton(this, W / 2 + 190, 640, 300, 52, t("auth.register"), () => {
        AuthSystem.endGuestForRegister().then(() => this.leaveTo("auth"));
      }, 0xffb14a);
      this.hubBtn = null;
    } else {
      this.againBtn = makeButton(this, W / 2 - 300, 640, 260, 52, t("result.again"), () => {
        const kind = Session.mode;
        if ((kind === "pvp" || kind === "special") && !isRankWindowOpen(kind)) {
          this.leaveTo("mode");
          return;
        }
        if (Session.trainStage) {
          this.leaveTo("explore", { from: "select" });
          return;
        }
        this.leaveTo("select");
      });
      this.shopBtn = makeButton(this, W / 2, 640, 260, 52, t("result.shop"), () => this.leaveTo("shop"), 0xc8ff3a);
      this.hubBtn = makeButton(this, W / 2 + 300, 640, 260, 52, t("result.hub"), () => this.leaveTo("hub"), 0x7d5cff);
    }
    this.showPage(this.hasLoot ? "loot" : "verdict");
    this.applyLang();
    this.playOutcomeFx(pal);
    AudioSystem.score();
    AudioSystem.playMenu();
    this.cameras.main.fadeIn(220, 8, 6, 10);
  }

  leaveTo(key, data) {
    try {
      NetPlay.settled = true;
      Session.net = false;
      Session.netHost = false;
      NetPlay.stopPing();
      NetPlay.ticks.length = 0;
      NetPlay.snap = null;
    } catch (e) {}
    try { TouchControls.setPlayActive(false); } catch (e) {}
    ["exhibit-overlay", "friend-overlay"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = true;
    });
    ["play", "luck", "queue"].forEach((name) => {
      try { this.scene.stop(name); } catch (e) {}
    });
    this.scene.start(key, data);
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
      fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30", align: "center", wordWrap: { width: 880 }
    }).setOrigin(0.5).setDepth(8));

    if (this.hasLoot) {
      this.lootBtn = makeButton(this, W / 2 - 190, 548, 280, 50, t("result.lootOpen"), () => this.showPage("loot"), 0xffb14a);
      this.keep(v, this.lootBtn.gfx);
      this.keep(v, this.lootBtn.text);
      this.keep(v, this.lootBtn.bg);
      this.statsBtn = makeButton(this, W / 2 + 190, 548, 280, 50, t("result.statsBtn"), () => this.showPage("stats"), 0xff6a22);
    } else {
      this.statsBtn = makeButton(this, W / 2, 548, 340, 50, t("result.statsBtn"), () => this.showPage("stats"), 0xff6a22);
    }
    this.keep(v, this.statsBtn.gfx);
    this.keep(v, this.statsBtn.text);
    this.keep(v, this.statsBtn.bg);
  }

  buildLoot(W, H, pal) {
    const g = "loot";
    this.keep(g, this.add.rectangle(W / 2, H / 2, W, H, 0x12080e, 0.28).setDepth(5));
    const card = this.add.graphics().setDepth(6);
    card.fillStyle(0xfff6ea, 0.98);
    card.fillRoundedRect(W / 2 - 360, 88, 720, 430, 28);
    card.lineStyle(4, pal.glow, 0.9);
    card.strokeRoundedRect(W / 2 - 360, 88, 720, 430, 28);
    this.keep(g, card);
    this.lootTitle = this.keep(g, this.add.text(W / 2, 128, "", {
      fontFamily: UI_FONT, fontSize: "36px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(8));
    this.lootSub = this.keep(g, this.add.text(W / 2, 168, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#7a4a30", align: "center", wordWrap: { width: 620 }
    }).setOrigin(0.5).setDepth(8));
    const gift = {
      stones: (this.pvpGain | 0) + (this.bonus | 0),
      shards: this.shardGain | 0,
      coins: this.coinGain | 0,
      vial: (this.etherVial | 0) + (this.etherBar | 0)
    };
    paintGiftIcons(this, W / 2, 232, gift, { size: 52, gap: 84, depth: 8, fontSize: "16px" }).forEach((o) => this.keep(g, o));

    this.xpRowY = 392;
    const heroKey = texHeroSelect(this, this.youId || "ignis");
    this.xpHero = this.keep(g, this.add.image(W / 2 - 248, this.xpRowY, heroKey).setDisplaySize(72, 72).setDepth(8));
    this.xpLvTx = this.keep(g, this.add.text(W / 2 - 188, this.xpRowY - 22, "", {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#1a1008"
    }).setOrigin(0, 0.5).setDepth(8));
    this.xpPlusTx = this.keep(g, this.add.text(W / 2 + 248, this.xpRowY - 22, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#146b32"
    }).setOrigin(1, 0.5).setDepth(8));
    this.xpBarX = W / 2 - 188;
    this.xpBarY = this.xpRowY + 14;
    this.xpBarW = 436;
    this.xpBarH = 22;
    this.xpTrack = this.keep(g, this.add.graphics().setDepth(8));
    this.xpFill = this.keep(g, this.add.rectangle(this.xpBarX + 3, this.xpBarY, 4, this.xpBarH - 6, 0x3ad6ff).setOrigin(0, 0.5).setDepth(9));
    this.xpBarTx = this.keep(g, this.add.text(W / 2 + 30, this.xpBarY, "", {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#1a1008"
    }).setOrigin(0.5).setDepth(10));
    this.xpUpTx = this.keep(g, this.add.text(W / 2, 318, "", {
      fontFamily: UI_FONT, fontSize: "34px", fontStyle: "900", color: "#ff6a22",
      stroke: "#fff6ea", strokeThickness: 8
    }).setOrigin(0.5).setDepth(12).setAlpha(0));
    const showXp = (this.xpGain | 0) > 0;
    [this.xpHero, this.xpLvTx, this.xpPlusTx, this.xpTrack, this.xpFill, this.xpBarTx, this.xpUpTx].forEach((o) => {
      if (o && o.setVisible) o.setVisible(showXp);
    });
    this.paintXpBar();
    this.lootBackBtn = makeButton(this, W / 2, 548, 300, 50, t("result.lootToVerdict"), () => this.showPage("verdict"), 0xff6a22);
    this.keep(g, this.lootBackBtn.gfx);
    this.keep(g, this.lootBackBtn.text);
    this.keep(g, this.lootBackBtn.bg);
  }

  paintXpBar() {
    if (!this.xpTrack || !this.xpFill) return;
    const need = Math.max(0, this.xpShow.need | 0);
    const into = Math.max(0, this.xpShow.into);
    const ratio = need > 0 ? Math.max(0, Math.min(1, into / need)) : 1;
    this.xpTrack.clear();
    this.xpTrack.fillStyle(0x3a2418, 0.18);
    this.xpTrack.fillRoundedRect(this.xpBarX, this.xpBarY - this.xpBarH / 2, this.xpBarW, this.xpBarH, 11);
    this.xpTrack.lineStyle(2, 0xc45a16, 0.7);
    this.xpTrack.strokeRoundedRect(this.xpBarX, this.xpBarY - this.xpBarH / 2, this.xpBarW, this.xpBarH, 11);
    this.xpFill.setDisplaySize(Math.max(4, (this.xpBarW - 6) * ratio), this.xpBarH - 6);
    if (this.xpLvTx) this.xpLvTx.setText(t("result.xpLv", { n: this.xpShow.lv }));
    if (this.xpPlusTx) this.xpPlusTx.setText(this.xpGain ? "+" + this.xpGain + " XP" : "");
    if (this.xpBarTx) {
      this.xpBarTx.setText(need > 0 ? Math.floor(into) + " / " + need : t("result.xpLv", { n: this.xpShow.lv }));
    }
  }

  playXpGain() {
    if (this.xpPlayed || !(this.xpGain | 0) || !this.xpBefore) return;
    this.xpPlayed = true;
    this.xpLeft = this.xpGain | 0;
    this.xpShow = { lv: this.xpBefore.level, into: this.xpBefore.into, need: this.xpBefore.need };
    this.xpSlide = null;
    this.xpUpHold = 0;
    this.paintXpBar();
    this.stepXpGain();
  }

  stepXpGain() {
    const need = this.xpShow.need | 0;
    if (this.xpLeft <= 0 || need <= 0 || this.xpShow.lv >= GROWTH_MAX_LV) {
      this.xpSlide = null;
      this.paintXpBar();
      return;
    }
    const room = need - this.xpShow.into;
    const take = Math.min(this.xpLeft, room);
    if (take <= 0) {
      this.xpSlide = null;
      this.paintXpBar();
      return;
    }
    this.xpSlide = {
      from: this.xpShow.into,
      to: this.xpShow.into + take,
      t: 0,
      dur: Math.max(420, Math.min(1100, take * 12)),
      take,
      fillUp: take >= room && this.xpShow.lv < GROWTH_MAX_LV
    };
  }

  flashLevelUp() {
    AudioSystem.ui();
    if (!this.xpUpTx) return;
    this.xpUpTx.setText(t("result.levelUp"));
    this.xpUpTx.setAlpha(1).setScale(1.08);
  }

  update(_time, delta) {
    const dt = (typeof delta === "number" && delta > 0) ? delta : 16.67;
    if (this.xpUpHold > 0) {
      this.xpUpHold -= dt;
      if (this.xpUpTx) this.xpUpTx.setScale(1 + Math.sin(this.xpUpHold / 80) * 0.04);
      if (this.xpUpHold <= 0) {
        if (this.xpUpTx) this.xpUpTx.setAlpha(0);
        this.xpShow.lv += 1;
        this.xpShow.into = 0;
        this.xpShow.need = xpToNext(this.xpShow.lv);
        this.paintXpBar();
        this.stepXpGain();
      }
      return;
    }
    if (!this.xpSlide) return;
    this.xpSlide.t += dt;
    const k = Math.min(1, this.xpSlide.t / this.xpSlide.dur);
    const ease = 0.5 - 0.5 * Math.cos(Math.PI * k);
    this.xpShow.into = this.xpSlide.from + (this.xpSlide.to - this.xpSlide.from) * ease;
    this.paintXpBar();
    if (k < 1) return;
    const slide = this.xpSlide;
    this.xpSlide = null;
    this.xpLeft -= slide.take;
    if (slide.fillUp) {
      this.xpShow.into = slide.to;
      this.paintXpBar();
      this.flashLevelUp();
      this.xpUpHold = 720;
    } else {
      this.xpShow.into = slide.to;
      this.paintXpBar();
      this.stepXpGain();
    }
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
    this.bits.loot.forEach((o) => { if (o && o.setVisible) o.setVisible(page === "loot"); });
    if (page === "loot") this.playXpGain();
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
      const bits = [];
      if (this.exhibitMode) bits.push(t("result.lootFun"));
      else if (!this.hasLoot) bits.push(t("result.lootNone"));
      if (this.pvpMode && this.rankAfter) {
        const delta = (this.rankDelta >= 0 ? "+" : "") + this.rankDelta;
        if (this.rankCal) bits.push(t("result.calLeft", { n: Math.max(0, RANK_CAL_GAMES - SaveSystem.data.rank.games) }));
        else bits.push(t("result.rank", {
          delta,
          name: t("rank.tier." + this.rankAfter.id),
          star: this.rankAfter.star || ""
        }));
      }
      (this.newTitles || []).slice(0, 3).forEach((id) => {
        bits.push(t("career.titleNew", { name: TitleSystem.label(titleById(id)) }));
      });
      this.pvpText.setText(bits.join("\n"));
    }
    if (this.lootTitle) this.lootTitle.setText(t("result.lootTitle"));
    if (this.lootSub) this.lootSub.setText(t("result.lootSub"));
    this.paintXpBar();
    if (this.lootBtn && this.lootBtn.text) this.lootBtn.text.setText(t("result.lootOpen"));
    if (this.lootBackBtn && this.lootBackBtn.text) this.lootBackBtn.text.setText(t("result.lootToVerdict"));
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
    if (this.shopBtn && this.shopBtn.text) {
      this.shopBtn.text.setText(this.guestPlay ? t("auth.register") : t("result.shop"));
    }
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
