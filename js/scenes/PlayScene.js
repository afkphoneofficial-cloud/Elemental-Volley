import { GAME, PHYSICS } from "../config/gameConfig.js";
import { COURTS } from "../data/courts.js";
import { getCharacter, pickMatchRef } from "../data/roster.js";
import { botSheet, statsLive, modsFromTotals, applyGrowthFx, resetGrowthFx } from "../data/growth.js?v=local206";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { maintenanceNow } from "../data/maintenance.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { shakeCam, wantFx, phaserKeyCode } from "../systems/GameSettings.js";
import {
  PikaPhysics,
  PikaUserInput,
  GROUND_HALF_WIDTH,
  WORLD,
  SCALE,
  OX,
  toScreenX,
  toScreenY
} from "../gameplay/ArcadeEngine.js?v=local206";
import { HitFx, ELEMENT_FX } from "../fx/HitFx.js?v=local198";
import { syncJumpForm } from "../fx/JumpForm.js?v=local196";
import { paintSkinAura } from "../fx/SkinAura.js";
import { CheerPopup } from "../fx/CheerPopup.js";
import { UltCutIn } from "../fx/UltCutIn.js?v=local198";
import {
  makeOrbTouchFx,
  clearOrbTouchFx,
  destroyOrbTouchFx,
  noteOrbContact,
  noteOrbTravel,
  scanOrbContact,
  tickOrbTouchFx
} from "../fx/OrbTouchFx.js?v=local201";
import { makeButton, makeChibiPlate, paintChibiPips, UI_FONT } from "../ui/Ui.js";
import { TouchControls, preferTouch } from "../ui/TouchControls.js";
import { PauseOverlay } from "../ui/PauseOverlay.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { TitleSystem } from "../systems/TitleSystem.js?v=local217";
import { emptyMatchStats, snapshotMatchStats } from "../gameplay/MatchStats.js";
import { avatarKey } from "../data/avatars.js";
import { NetPlay } from "../systems/NetPlay.js";
import { packMatchSnap, applyMatchSnap } from "../gameplay/netSnap.js";
import { clampSkin } from "../data/skins.js";
import { champSetOf, texHeroFace, texHeroDive, champAuraTier } from "../data/seasonLooks.js";
import { ballFxOf, ballFxFitsChar, drawArmedBallFx } from "../data/ballFx.js?v=local196";
import {
  GAUGE_MAX,
  MATCH_FX,
  UltState,
  resetMatchUlt,
  addGauge,
  isFull,
  fireUlt,
  tickPointStatuses
} from "../gameplay/UltSystem.js";

const SIZE = WORLD.playerLen * SCALE;
const CHAR = SIZE * 1.15 * 0.75;
const BALL = WORLD.ballR * 2 * SCALE;

export class PlayScene extends Phaser.Scene {
  constructor() { super("play"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    if (maintenanceNow()) {
      this.scene.start("hub");
      return;
    }
    SaveSystem.notePlayDay();
    this.youSide = Session.youSide === 2 ? 2 : 1;
    this.youData = getCharacter(Session.playerId);
    this.botData = getCharacter(Session.botId);
    this.leftData = this.youSide === 1 ? this.youData : this.botData;
    this.rightData = this.youSide === 1 ? this.botData : this.youData;
    this.youSkin = clampSkin(this.net ? (Session.youSkin || SaveSystem.skinOf(this.youData.id)) : SaveSystem.skinOf(this.youData.id));
    this.foeSkin = clampSkin(this.net ? (Session.foeSkin || (Session.rival && Session.rival.skin) || 1) : 1);
    this.youChamp = this.net ? (Session.youChamp | 0) : champSetOf(this.youData.id);
    this.foeChamp = this.net ? (Session.foeChamp | 0) : 0;
    this.score = [0, 0];
    this.p2Serves = this.firstServeIsP2();
    this.matchOver = false;
    this.roundEnded = false;
    this.slowMoLeft = 0;
    this.pointSlowMs = 0;
    this.roundHoldMs = 0;
    this.worldRate = 1;
    this.ultFreezeLeft = 0;
    this.justUlted = false;
    this.ultGrand = false;
    this.net = Session.net === true;
    this.netHost = this.net && Session.netHost === true;
    this.readyFrames = this.net ? 0 : 25;
    this.physAcc = 0;
    this.stepMs = 1000 / PHYSICS.fps;
    this.physicsPack = new PikaPhysics(this.net ? false : this.youSide !== 1, this.net ? false : this.youSide !== 2);
    resetGrowthFx();
    if (statsLive(Session.mode)) {
      const youMods = modsFromTotals(SaveSystem.growthOf(this.youData.id).totals);
      const foeRow = Session.botSheet || botSheet(this.botData.id, Session.difficulty || "normal");
      applyGrowthFx(this.youSide, youMods, modsFromTotals(foeRow.totals));
    }
    this.p1In = new PikaUserInput();
    this.p2In = new PikaUserInput();
    this.enterWasDown = false;
    this.prevHit = [false, false];
    this.lastHitter = 0;
    this.season = Session.courtId || "summer";
    this.enterHold = 0;
    this.enterDownAt = 0;
    this.ultArmed = false;
    this.streak = 0;
    this.streakSide = 0;
    this.hadMatchPoint = false;
    this.paused = false;
    this.pauseWanted = false;
    this.holdForPause = false;
    this.rankedMatch = Session.mode === "pvp" || Session.mode === "exhibit";
    this.playerPauses = this.rankedMatch ? 1 : 99;
    this.systemPauses = this.rankedMatch ? 1 : 0;
    this.pauseKind = null;
    this.pauseLeftMs = 0;
    this.matchStats = emptyMatchStats();
    resetMatchUlt();

    this.buildCourt();
    this.spawnWeather();

    const shadow = (x) => this.add.ellipse(x, 0, CHAR * 0.62, 14, 0x000000, 0.28).setDepth(4);
    this.sh1 = shadow(200);
    this.sh2 = shadow(900);
    this.aura1 = this.add.graphics().setDepth(5);
    this.aura2 = this.add.graphics().setDepth(5);
    this.p1 = this.add.image(200, 400, this.faceKey(this.leftData.id, 1)).setDisplaySize(CHAR, CHAR).setDepth(6);
    this.p2 = this.add.image(900, 400, this.faceKey(this.rightData.id, 2)).setDisplaySize(CHAR, CHAR).setDepth(6);
    this.jform1 = this.add.image(200, 400, "jump-fire").setDepth(6).setVisible(false);
    this.jform2 = this.add.image(900, 400, "jump-fire").setDepth(6).setVisible(false);
    this.jfx1 = this.add.graphics().setDepth(6);
    this.jfx2 = this.add.graphics().setDepth(6);
    this.jslot1 = { origin: null, rising: false, didPop: false };
    this.jslot2 = { origin: null, rising: false, didPop: false };
    const spark = () => {
      if (!wantFx()) return null;
      try {
        const p = this.add.particles(0, 0, "dot", {
          lifespan: { min: 260, max: 560 },
          speed: { min: 40, max: 240 },
          scale: { start: 0.9, end: 0 },
          alpha: { start: 1, end: 0 },
          gravityY: 110,
          blendMode: "ADD",
          emitting: false
        });
        p.setDepth(7);
        return p;
      } catch (e) {
        return null;
      }
    };
    this.jspark1 = spark();
    this.jspark2 = spark();
    this.ball = this.add.image(200, 80, "ball").setDisplaySize(BALL, BALL).setDepth(7);
    this.trail1 = this.add.image(200, 80, "ball").setDisplaySize(BALL * 0.72, BALL * 0.72).setAlpha(0.35).setDepth(5);
    this.trail2 = this.add.image(200, 80, "ball").setDisplaySize(BALL * 0.5, BALL * 0.5).setAlpha(0.18).setDepth(5);
    this.ballFxG = this.add.graphics().setDepth(8);
    this.wetRing = this.add.circle(200, 80, BALL * 0.95, 0x3ad6ff, 0.18).setStrokeStyle(4, 0x9af6ff, 0.95).setDepth(6).setVisible(false);
    this.drops = [0, 1, 2, 3, 4].map((i) => this.add.circle(0, 0, 6 + (i % 2) * 3, 0x7ae8ff, 0.85).setDepth(8).setVisible(false));
    this.bolt = this.add.graphics().setDepth(8);
    this.boltTrail = [];
    this.flame = this.add.graphics().setDepth(8);
    this.flameTrail = [];
    this.orbFx = makeOrbTouchFx(this);
    this.orbKind = "";
    this.spark1 = this.add.circle(0, 0, 14, 0xe8ff3a, 1).setDepth(9).setVisible(false);
    this.spark2 = this.add.circle(0, 0, 14, 0xe8ff3a, 1).setDepth(9).setVisible(false);
    this.spark1b = this.add.circle(0, 0, 8, 0xffffff, 1).setDepth(9).setVisible(false);
    this.spark2b = this.add.circle(0, 0, 8, 0xffffff, 1).setDepth(9).setVisible(false);
    this.ember1 = this.add.circle(0, 0, 16, 0xff6a22, 1).setDepth(9).setVisible(false);
    this.ember2 = this.add.circle(0, 0, 16, 0xff6a22, 1).setDepth(9).setVisible(false);
    this.ember1b = this.add.circle(0, 0, 9, 0xffe08a, 1).setDepth(9).setVisible(false);
    this.ember2b = this.add.circle(0, 0, 9, 0xffe08a, 1).setDepth(9).setVisible(false);
    this.statusTag1 = this.add.text(0, 0, "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418",
      stroke: "#fff6ea", strokeThickness: 5
    }).setOrigin(0.5).setDepth(12);
    this.statusTag2 = this.add.text(0, 0, "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#3a2418",
      stroke: "#fff6ea", strokeThickness: 5
    }).setOrigin(0.5).setDepth(12);
    try { this.fx = new HitFx(this); } catch (e) { this.fx = { pop() {}, ultPop() {} }; }
    this.cheer = new CheerPopup(this);
    this.ultCut = new UltCutIn(this);
    this.events.once("shutdown", () => {
      window.removeEventListener("ev-lang", this._onLang);
      try { this.cheer.destroy(); } catch (e) {}
      try { this.ultCut.destroy(); } catch (e) {}
      try { destroyOrbTouchFx(this.orbFx); } catch (e) {}
      try { this.pauseUi.destroy(); } catch (e) {}
      this.unbindPauseWatch();
      if (this.offNet) this.offNet();
      TouchControls.setPlayActive(false);
      this.tweens.timeScale = 1;
      if (this.cameras && this.cameras.main) this.cameras.main.setZoom(1);
      AudioSystem.playMenu();
    });
    this.buildHud();
    this._onLang = () => this.applyLang();
    window.addEventListener("ev-lang", this._onLang);
    this.bindKeys();
    this.pauseUi = new PauseOverlay(this, {
      onResume: () => {
        if (this.net) NetPlay.resume();
        else this.setPaused(false);
      },
      onQuit: () => {
        if (this.net) NetPlay.quit();
        this.scene.start("hub");
      }
    });
    this.bindPauseWatch();
    this.offNet = this.net ? NetPlay.on((msg) => this.onNet(msg)) : null;
    if (this.net) NetPlay.startPing();
    TouchControls.setPlayActive(true);
    this.layoutHudMode();
    this.syncSprites();
    this.resetRound();
    AudioSystem.playCourt(this.season);
    this.cameras.main.fadeIn(160, 8, 6, 10);
  }

  firstServeIsP2() {
    const youServe = Session.youServe === true;
    if (youServe) return this.youSide === 2;
    return this.youSide === 1;
  }

  skinForSide(courtSide) {
    const youOnLeft = this.youSide === 1;
    if (courtSide === 1) return youOnLeft ? this.youSkin : this.foeSkin;
    return youOnLeft ? this.foeSkin : this.youSkin;
  }

  champForSide(courtSide) {
    const youOnLeft = this.youSide === 1;
    if (courtSide === 1) return youOnLeft ? this.youChamp : this.foeChamp;
    return youOnLeft ? this.foeChamp : this.youChamp;
  }

  faceKey(id, courtSide) {
    return texHeroFace(this, id, courtSide, this.skinForSide(courtSide), this.champForSide(courtSide));
  }

  poseKey(id, courtSide, player) {
    const diving = player.state === 3 || player.state === 4;
    if (!diving) return this.faceKey(id, courtSide);
    const dir = player.divingDirection | 0;
    const side = dir === 1 ? 1 : dir === -1 ? 2 : courtSide;
    return texHeroDive(this, id, side, this.skinForSide(courtSide), this.champForSide(courtSide));
  }

  buildCourt() {
    const W = GAME.width, H = GAME.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0xffc38a);
    const left = OX;
    const cw = WORLD.width * SCALE;
    const ch = WORLD.height * SCALE;
    const courtKey = "court-" + this.season;
    if (this.textures.exists(courtKey)) {
      this.add.image(left, 0, courtKey).setOrigin(0, 0).setDisplaySize(cw, ch).setDepth(0);
    } else {
      const sky = this.add.graphics().setDepth(0);
      sky.fillStyle(0xff8a4a, 1);
      sky.fillRect(left, 0, cw, GAME.groundY * 0.62);
      sky.fillStyle(0xf2d39a, 1);
      sky.fillRect(left, GAME.groundY * 0.78, cw, H - GAME.groundY * 0.78);
    }
    this.drawNet();
    this.placeReferee();
  }

  drawNet() {
    const x = GAME.netX;
    const top = GAME.netTop;
    const bot = toScreenY(WORLD.playerGroundY) + CHAR * 0.52;
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0xfff0d8, 0.55);
    g.fillRoundedRect(x - 18, top + 10, 36, bot - top - 12, 10);
    g.lineStyle(2, 0xffffff, 0.45);
    for (let y = top + 16; y < bot - 8; y += 11) g.lineBetween(x - 14, y, x + 14, y);
    g.fillStyle(0xffd6e8, 1);
    g.fillRoundedRect(x - 22, top - 2, 44, 14, 7);
    g.fillStyle(0xf2b24a, 1);
    g.fillRoundedRect(x - 26, top - 6, 12, bot - top + 8, 6);
    g.fillRoundedRect(x + 14, top - 6, 12, bot - top + 8, 6);
    g.fillStyle(0xff8ab8, 1);
    g.fillCircle(x - 20, top - 4, 6);
    g.fillCircle(x + 20, top - 4, 6);
    g.fillStyle(0xffe08a, 1);
    g.fillCircle(x, top + 5, 9);
    g.lineStyle(2, 0xfff6d0, 0.9);
    g.strokeCircle(x, top + 5, 9);
  }

  placeReferee() {
    const pick = pickMatchRef(this.youData.id, this.botData.id, this.season);
    this.refChar = pick.char;
    this.refSeason = pick.season;
    const key = this.textures.exists("vis_ref_" + this.refSeason) ? "vis_ref_" + this.refSeason : "vis_ignis";
    const x = GAME.netX;
    const y = GAME.netTop + 6;
    this.ref = this.add.image(x, y, key).setDisplaySize(CHAR * 1.12, CHAR * 1.12).setOrigin(0.5, 1).setDepth(6);
    this.tweens.add({
      targets: this.ref,
      y: y - 5,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  spawnWeather() {
    this.wx = [];
    const W = GAME.width;
    const H = GAME.height;
    const kind = this.season === "rain" ? "wx-drop"
      : this.season === "winter" ? "wx-flake"
      : this.season === "spring" ? "wx-petal"
      : this.season === "summer" ? "wx-heat"
      : null;
    if (!kind || !this.textures.exists(kind)) return;
    const n = this.season === "rain" ? 55 : this.season === "summer" ? 14 : 36;
    for (let i = 0; i < n; i += 1) {
      const s = this.add.image(Math.random() * W, Math.random() * H, kind).setDepth(3);
      if (this.season === "rain") s.setAlpha(0.45).setScale(1, 1.4);
      else if (this.season === "winter") s.setAlpha(0.7 + Math.random() * 0.3).setScale(0.6 + Math.random());
      else if (this.season === "spring") s.setAlpha(0.75).setAngle(Math.random() * 360);
      else s.setAlpha(0.22).setScale(0.8 + Math.random());
      this.wx.push({
        s,
        vx: this.season === "rain" ? -1.4 : this.season === "winter" ? (Math.random() - 0.5) * 0.8 : this.season === "spring" ? (Math.random() - 0.5) * 1.4 : 0.3,
        vy: this.season === "rain" ? 9 + Math.random() * 6 : this.season === "winter" ? 1.1 + Math.random() : this.season === "spring" ? 1.4 + Math.random() : -0.7,
        spin: this.season === "spring" ? 2 + Math.random() * 3 : 0
      });
    }
  }

  tickWeather() {
    const W = GAME.width;
    const H = GAME.height;
    this.wx.forEach((p) => {
      p.s.x += p.vx;
      p.s.y += p.vy;
      if (p.spin) p.s.angle += p.spin;
      if (p.s.y > H + 12 || p.s.y < -24 || p.s.x < -20 || p.s.x > W + 20) {
        p.s.x = Math.random() * W;
        p.s.y = this.season === "summer" ? H - 40 : -10;
      }
    });
  }

  buildHud() {
    const f = UI_FONT;
    const court = COURTS.find((c) => c.id === this.season);
    const leftYou = this.youSide === 1;
    const palL = ELEMENT_FX[this.leftData.id] || ELEMENT_FX.ignis;
    const palR = ELEMENT_FX[this.rightData.id] || ELEMENT_FX.ignis;
    this.plateL = makeChibiPlate(this, OX + 168, 92, {
      faceKey: this.hudFace(leftYou, this.leftData.id, 1),
      tag: this.sideTag(leftYou, this.leftData.id),
      you: leftYou,
      fill: 0xfff4e8,
      stroke: leftYou ? 0xffb14a : 0x8eb8e8,
      pip: palL.tints[0]
    });
    this.plateR = makeChibiPlate(this, GAME.courtRight - 168, 92, {
      faceKey: this.hudFace(!leftYou, this.rightData.id, 2),
      tag: this.sideTag(!leftYou, this.rightData.id),
      you: !leftYou,
      fill: 0xfff4e8,
      stroke: !leftYou ? 0xffb14a : 0x8eb8e8,
      pip: palR.tints[0]
    });
    this.s1 = this.plateL.score;
    this.s2 = this.plateR.score;

    if (court) {
      const ribbon = this.add.graphics().setDepth(11);
      ribbon.fillStyle(0xfff4e8, 0.94);
      ribbon.fillRoundedRect(GAME.width / 2 - 170, 10, 340, 62, 24);
      ribbon.lineStyle(4, 0xffb14a, 0.8);
      ribbon.strokeRoundedRect(GAME.width / 2 - 170, 10, 340, 62, 24);
      this.modeTag = this.add.text(GAME.width / 2, 24, this.modeLabel(), {
        fontFamily: f, fontSize: "13px", fontStyle: "900", color: "#c45a16"
      }).setOrigin(0.5).setDepth(12);
      this.courtTitle = this.add.text(GAME.width / 2, 42, I18n.courtName(court.id), {
        fontFamily: f, fontSize: "16px", fontStyle: "800", color: court.color
      }).setOrigin(0.5).setDepth(12);
      this.courtFlavor = this.add.text(GAME.width / 2, 58, I18n.courtFlavor(court.id), {
        fontFamily: f, fontSize: "12px", color: "#7a5a40"
      }).setOrigin(0.5).setDepth(12);
    }
    this.banner = this.add.text(GAME.width / 2, 138, "", {
      fontFamily: f, fontSize: "34px", fontStyle: "900", color: "#fff6ea",
      stroke: "#c45a16", strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setDepth(15);
    this.noticeBg = this.add.graphics().setDepth(18).setAlpha(0);
    this.notice = this.add.text(GAME.width / 2, 168, "", {
      fontFamily: f, fontSize: "17px", fontStyle: "700", color: "#4a2c18",
      align: "center", wordWrap: { width: 560 }
    }).setOrigin(0.5).setAlpha(0).setDepth(19);
    this.ultPop = this.add.text(GAME.width / 2, 186, "", {
      fontFamily: f, fontSize: "18px", fontStyle: "800", color: "#c45a16",
      stroke: "#fff6ea", strokeThickness: 5, align: "center"
    }).setOrigin(0.5).setAlpha(0).setDepth(16);
    this.callout = this.add.text(GAME.width / 2, 214, "", {
      fontFamily: f, fontSize: "40px", fontStyle: "900", color: "#fff6ea",
      stroke: "#c45a16", strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0).setDepth(17);
    this.calloutSub = this.add.text(GAME.width / 2, 256, "", {
      fontFamily: f, fontSize: "18px", fontStyle: "800", color: "#c45a16",
      stroke: "#fff6ea", strokeThickness: 5
    }).setOrigin(0.5).setAlpha(0).setDepth(17);
    this.mpL = this.add.text(OX + 168, 158, "", {
      fontFamily: f, fontSize: "13px", fontStyle: "900", color: "#ff4a6a",
      stroke: "#fff6ea", strokeThickness: 4
    }).setOrigin(0.5).setDepth(14);
    this.mpR = this.add.text(GAME.courtRight - 168, 158, "", {
      fontFamily: f, fontSize: "13px", fontStyle: "900", color: "#ff4a6a",
      stroke: "#fff6ea", strokeThickness: 4
    }).setOrigin(0.5).setDepth(14);

    const hint = this.add.graphics().setDepth(11);
    hint.fillStyle(0xfff4e8, 0.9);
    hint.fillRoundedRect(GAME.width / 2 - 310, GAME.height - 40, 620, 32, 16);
    this.hintBg = hint;
    this.hintHud = this.add.text(GAME.width / 2, GAME.height - 24, t("play.hudHint"), {
      fontFamily: f, fontSize: "14px", fontStyle: "700", color: "#6a4a30"
    }).setOrigin(0.5).setDepth(12);

    this.exitBtn = makeButton(this, 86, 36, 108, 36, t("play.pause"), () => {
      this.requestPlayerPause();
    }, 0xff8ab8);
    if (this.net) this.buildLinkBadge();
  }

  buildLinkBadge() {
    const x = GAME.width - 92;
    const y = 44;
    const w = 156;
    const h = 56;
    const g = this.add.graphics().setDepth(19);
    g.fillStyle(0xfff4e8, 0.96);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    g.lineStyle(3, 0xffb14a, 0.85);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    this.linkOrbs = [];
    const cols = [0xff8ab8, 0xffb14a, 0xffe08a, 0x7af3c2];
    const gap = 22;
    const start = x - ((cols.length - 1) * gap) / 2;
    for (let i = 0; i < cols.length; i += 1) {
      const ox = start + i * gap;
      const oy = y - 7;
      const shell = this.add.circle(ox, oy, 9, 0xfff6ea, 1).setStrokeStyle(2, 0xffb14a, 0.55).setDepth(20);
      const core = this.add.circle(ox, oy, 6, cols[i], 1).setDepth(21).setAlpha(0.18);
      const shine = this.add.circle(ox - 2, oy - 2, 2, 0xffffff, 0.9).setDepth(22).setAlpha(0.2);
      this.linkOrbs.push({ shell, core, shine, color: cols[i] });
    }
    this.linkText = this.add.text(x, y + 14, t("play.linkWait"), {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "900", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(21);
  }

  hudFace(isYou, fighterId, courtSide) {
    if (isYou) {
      const key = avatarKey(SaveSystem.data.avatarId);
      return this.textures.exists(key) ? key : avatarKey("av01");
    }
    if ((Session.mode === "pvp" || Session.mode === "exhibit") && Session.rival) {
      const key = avatarKey(Session.rival.avatarId);
      if (this.textures.exists(key)) return key;
    }
    return this.faceKey(fighterId, courtSide);
  }

  sideTag(isYou, id) {
    if (isYou) return t("play.you") + " · " + TitleSystem.named(SaveSystem.data, AuthSystem.displayName() || charName(id));
    if ((Session.mode === "pvp" || Session.mode === "exhibit") && Session.rival) {
      const n = I18n.lang === "en" ? Session.rival.nameEn : Session.rival.nameTh;
      return t("play.rival") + " · " + n;
    }
    return t("play.bot") + " · " + charName(id);
  }

  modeLabel() {
    if (Session.mode === "pvp") return t("play.modeRank");
    if (Session.mode === "exhibit") return t("play.modeExhibit");
    return t("play.modeTrain");
  }

  applyLang() {
    const leftYou = this.youSide === 1;
    if (this.plateL && this.plateL.tag) this.plateL.tag.setText(this.sideTag(leftYou, this.leftData.id));
    if (this.plateR && this.plateR.tag) this.plateR.tag.setText(this.sideTag(!leftYou, this.rightData.id));
    if (this.plateL && this.plateL.face) this.plateL.face.setTexture(this.hudFace(leftYou, this.leftData.id, 1)).setDisplaySize(78, 78);
    if (this.plateR && this.plateR.face) this.plateR.face.setTexture(this.hudFace(!leftYou, this.rightData.id, 2)).setDisplaySize(78, 78);
    if (this.modeTag) this.modeTag.setText(this.modeLabel());
    if (this.courtTitle) this.courtTitle.setText(I18n.courtName(this.season));
    if (this.courtFlavor) this.courtFlavor.setText(I18n.courtFlavor(this.season));
    if (this.hintHud) this.hintHud.setText(preferTouch() ? t("play.hudHintTouch") : t("play.hudHint"));
    this.layoutHudMode();
    if (this.exitBtn && this.exitBtn.text) this.exitBtn.text.setText(t("play.pause"));
    if (this.pauseUi) this.pauseUi.applyLang();
    if (this.linkText) this.paintPing();
    if (this.mpL && this.mpL.text) this.mpL.setText(t("play.matchPoint"));
    if (this.mpR && this.mpR.text) this.mpR.setText(t("play.matchPoint"));
  }

  layoutHudMode() {
    const touch = preferTouch();
    if (this.hintBg) this.hintBg.setVisible(!touch);
    if (this.hintHud) {
      this.hintHud.setVisible(!touch);
      this.hintHud.setText(touch ? t("play.hudHintTouch") : t("play.hudHint"));
    }
  }

  requestPlayerPause() {
    if (this.matchOver) return;
    if (this.paused) {
      if (this.net) NetPlay.resume();
      else this.setPaused(false);
      return;
    }
    if (this.net) {
      if (this.roundEnded) NetPlay.pause("player");
      else {
        this.pauseWanted = true;
        this.showNotice(t("pause.waitPoint"));
      }
      return;
    }
    if (!this.rankedMatch) {
      this.pauseKind = null;
      this.pauseLeftMs = 0;
      if (this.pauseUi) this.pauseUi.setTimed(null, 0);
      this.setPaused(true);
      return;
    }
    if (this.playerPauses <= 0) {
      this.showNotice(t("pause.none"));
      return;
    }
    this.playerPauses -= 1;
    this.beginTimedPause("player");
  }

  requestSystemPause() {
    if (this.net) return;
    if (!this.rankedMatch || this.matchOver || this.paused || this.systemPauses <= 0) return;
    this.systemPauses -= 1;
    this.beginTimedPause("system");
  }

  beginTimedPause(kind) {
    this.pauseKind = kind;
    this.pauseLeftMs = GAME.pauseMs;
    if (this.pauseUi) this.pauseUi.setTimed(kind, this.pauseLeftMs);
    this.setPaused(true);
  }

  bindPauseWatch() {
    this._onHide = () => {
      if (document.visibilityState !== "hidden") return;
      if (this.net) {
        if (this.netHost) NetPlay.yieldHost();
        return;
      }
      this.requestSystemPause();
    };
    this._onOffline = () => {
      if (this.net) return;
      this.requestSystemPause();
    };
    document.addEventListener("visibilitychange", this._onHide);
    window.addEventListener("offline", this._onOffline);
  }

  unbindPauseWatch() {
    if (this._onHide) document.removeEventListener("visibilitychange", this._onHide);
    if (this._onOffline) window.removeEventListener("offline", this._onOffline);
  }

  setPaused(on) {
    const was = this.paused;
    this.paused = Boolean(on);
    if (!this.paused) {
      this.pauseKind = null;
      this.pauseLeftMs = 0;
      this.holdForPause = false;
      if (this.pauseUi) this.pauseUi.setTimed(null, 0);
      if (was && this.net && this.roundEnded && !this.matchOver) this.resetRound();
    }
    if (this.pauseUi) this.pauseUi.setOpen(this.paused);
  }

  bindKeys() {
    this.keyLeft = this.input.keyboard.addKey(phaserKeyCode("left"));
    this.keyRight = this.input.keyboard.addKey(phaserKeyCode("right"));
    this.keyJump = this.input.keyboard.addKey(phaserKeyCode("jump"));
    this.keyDown = this.input.keyboard.addKey(phaserKeyCode("down"));
    this.enter = this.input.keyboard.addKey(phaserKeyCode("hit"));
    this.input.keyboard.on("keydown-ESC", () => this.requestPlayerPause());
  }

  readHuman() {
    if (this.paused) {
      this.p1In.xDirection = 0;
      this.p1In.yDirection = 0;
      this.p1In.powerHit = 0;
      this.p2In.xDirection = 0;
      this.p2In.yDirection = 0;
      this.p2In.powerHit = 0;
      return;
    }
    const pad = TouchControls.snapshot();
    const input = this.youSide === 1 ? this.p1In : this.p2In;
    const idle = this.youSide === 1 ? this.p2In : this.p1In;
    const myIdx = this.youSide - 1;
    const keyX = this.keyLeft.isDown ? -1 : this.keyRight.isDown ? 1 : 0;
    const keyY = this.keyJump.isDown ? -1 : this.keyDown.isDown ? 1 : 0;
    input.xDirection = pad.x || keyX;
    input.yDirection = pad.y || keyY;
    const down = this.enter.isDown || pad.hit;
    if (this.roundEnded) {
      this.ultArmed = false;
      this.enterHold = 0;
      this.enterDownAt = 0;
      input.powerHit = 0;
    } else if (down) {
      if (!this.enterDownAt) this.enterDownAt = this.time.now;
      this.enterHold += 1;
      if (isFull(myIdx) && this.time.now - this.enterDownAt >= 200) this.ultArmed = true;
      input.powerHit = 1;
    } else {
      input.powerHit = 0;
      this.enterHold = 0;
      this.enterDownAt = 0;
      if (!isFull(myIdx)) this.ultArmed = false;
    }
    this.enterWasDown = down;
    idle.xDirection = 0;
    idle.yDirection = 0;
    idle.powerHit = 0;
  }

  resetRound() {
    this.physicsPack.player1.initializeForNewRound();
    this.physicsPack.player2.initializeForNewRound();
    this.physicsPack.ball.initializeForNewRound(this.p2Serves);
    this.roundEnded = false;
    this.slowMoLeft = 0;
    this.pointSlowMs = 0;
    this.roundHoldMs = 0;
    this.worldRate = 1;
    this.tweens.timeScale = 1;
    if (this.cameras && this.cameras.main) this.cameras.main.setZoom(1);
    this.readyFrames = this.net ? 0 : 25;
    this.lastHitter = 0;
    this.ultGrand = false;
    this.orbKind = "";
    clearOrbTouchFx(this.orbFx);
    this.showBanner(t("play.ready"), "#fff4e8");
    this.syncSprites();
  }

  onNet(msg) {
    if (msg.t === "pause") {
      this.pauseKind = msg.kind === "system" ? "system" : "player";
      this.pauseLeftMs = msg.ms | 0 || GAME.pauseMs;
      if (this.pauseUi) this.pauseUi.setTimed(this.pauseKind, this.pauseLeftMs);
      this.setPaused(true);
    }
    if (msg.t === "resume") {
      this.holdForPause = false;
      this.setPaused(false);
    }
    if (msg.t === "pong") this.paintPing();
    if (msg.t === "closed") {
      this.showNotice(t("pause.dropWait", { n: Math.max(1, Math.ceil(GAME.forfeitMs / 1000)) }));
      NetPlay.ensure();
    }
    if (msg.t === "pauseDenied") {
      this.holdForPause = false;
      this.pauseWanted = false;
      this.showNotice(t("pause.none"));
    }
    if (msg.t === "youHost") {
      this.netHost = msg.on === true;
      Session.netHost = this.netHost;
    }
    if (msg.t === "waitRival") this.showNotice(t("pause.dropWait", { n: Math.max(1, Math.ceil((msg.ms || 0) / 1000)) }));
    if (msg.t === "rivalBack") this.showNotice(t("pause.rivalBack"));
    if (msg.t === "end" && !this.matchOver) {
      const me = AuthSystem.session && AuthSystem.session();
      const youLost = me && msg.loserId && msg.loserId === me.id;
      const sc = msg.score && typeof msg.score.p1 === "number"
        ? msg.score
        : { p1: this.youSide === 1 ? this.score[0] : this.score[1], p2: this.youSide === 1 ? this.score[1] : this.score[0] };
      this.matchOver = true;
      this.time.delayedCall(400, () => {
        this.scene.start("result", {
          winner: youLost ? 2 : 1,
          score: sc,
          courtId: this.season,
          youId: this.youData.id,
          botId: this.botData.id,
          refChar: this.refChar,
          refSeason: this.refSeason,
          stats: snapshotMatchStats(this.matchStats)
        });
      });
    }
  }

  update(_t, delta) {
    this.tickWeather();
    this.pulseMatchPoint();
    if (this.paused) {
      if (this.rankedMatch && this.pauseLeftMs > 0) {
        this.pauseLeftMs -= delta;
        if (this.pauseUi) this.pauseUi.setRemain(this.pauseLeftMs);
        if (this.pauseLeftMs <= 0 && !this.net) this.setPaused(false);
      }
      return;
    }
    if (!this.matchOver) this.matchStats.ms += delta;
    this.tickPointSlow(delta);
    if (this.matchOver && this.pointSlowMs <= 0 && this.roundHoldMs <= 0) return;

    if (this.net) {
      this.readHuman();
      const mine = this.youSide === 1 ? this.p1In : this.p2In;
      NetPlay.sendInput(mine);
      this.paintPing();
      if (document.hidden && this.netHost) {
        const now = this.time.now;
        if (!this.lastYieldAt || now - this.lastYieldAt > 700) {
          this.lastYieldAt = now;
          NetPlay.yieldHost();
        }
      }
      if (this.netHost) {
        let tick = NetPlay.takeTick();
        let stepped = false;
        while (tick) {
          this.applyNetTick(tick);
          stepped = true;
          tick = NetPlay.takeTick();
        }
        if (!stepped) this.syncSprites();
      } else {
        const snap = NetPlay.takeSnap();
        if (snap) this.applyGuestSnap(snap);
        else this.syncSprites();
        NetPlay.ticks.length = 0;
      }
      return;
    }

    this.physAcc += Math.min(delta, 80) * this.worldRate;
    let stepped = false;
    while (this.physAcc >= this.stepMs) {
      this.physAcc -= this.stepMs;
      this.stepPhysics();
      stepped = true;
    }
    if (!stepped) this.syncSprites();
  }

  tickPointSlow(delta) {
    if (this.roundEnded) this.roundHoldMs -= delta;
    if (this.pointSlowMs > 0) {
      this.pointSlowMs -= delta;
      this.worldRate = 0.4;
      this.tweens.timeScale = 0.4;
      if (this.pointSlowMs <= 0) {
        this.worldRate = 1;
        this.tweens.timeScale = 1;
      }
    } else {
      this.worldRate = 1;
      this.tweens.timeScale = 1;
    }
  }

  applyNetTick(tick) {
    this.p1In.xDirection = tick.a.x | 0;
    this.p1In.yDirection = tick.a.y | 0;
    this.p1In.powerHit = tick.a.p | 0;
    this.p2In.xDirection = tick.b.x | 0;
    this.p2In.yDirection = tick.b.y | 0;
    this.p2In.powerHit = tick.b.p | 0;
    const pack = this.physicsPack;
    const hitGround = pack.runEngineForNextFrame([this.p1In, this.p2In]);
    this.detectHits();
    this.markOrbPhysics();
    this.handleSounds();
    if (hitGround && !this.roundEnded) this.onPoint();
    if (this.roundEnded && !this.matchOver && !this.holdForPause && !this.paused && this.pointSlowMs <= 0 && this.roundHoldMs <= 0) {
      this.resetRound();
    }
    this.syncSprites();
    if (this.netHost) NetPlay.send(packMatchSnap(this));
  }

  applyGuestSnap(snap) {
    const was0 = this.score[0];
    const was1 = this.score[1];
    const info = applyMatchSnap(this, snap);
    if (this.s1) this.s1.setText(String(this.score[0]));
    if (this.s2) this.s2.setText(String(this.score[1]));
    if (info.scoreChanged) {
      AudioSystem.score();
      const leftWon = this.score[1] > was1;
      const winSide = leftWon ? 2 : 1;
      const winData = winSide === 1 ? this.leftData : this.rightData;
      this.cheer.show(winSide, winData.id, {
        you: winSide === this.youSide,
        skin: this.skinForSide(winSide),
        champSet: this.champForSide(winSide),
        season: this.season
      });
      this.showBanner(winData.name, leftWon ? "#c8ff3a" : "#ff8a3a");
      this.pointSlowMs = 500;
      this.roundHoldMs = 1400;
      if (this.pauseWanted) {
        this.pauseWanted = false;
        this.holdForPause = true;
        NetPlay.pause("player");
      }
    }
    const need = GAME.winScore - 1;
    this.mpL.setText(this.score[0] >= need && this.score[0] < GAME.winScore ? t("play.matchPoint") : "");
    this.mpR.setText(this.score[1] >= need && this.score[1] < GAME.winScore ? t("play.matchPoint") : "");
    if (info.justOver) this.goResult();
    this.syncSprites();
  }

  paintPing() {
    if (!this.linkText || !this.linkOrbs) return;
    const n = NetPlay.pingMs | 0;
    let grade = 0;
    let key = "linkWait";
    let col = "#7a4a30";
    if (NetPlay.pingLive) {
      if (n < 45) { grade = 4; key = "linkBest"; col = "#1a7a48"; }
      else if (n < 90) { grade = 3; key = "linkGood"; col = "#2a7a38"; }
      else if (n < 160) { grade = 2; key = "linkMeh"; col = "#c45a16"; }
      else { grade = 1; key = "linkBad"; col = "#c42a4a"; }
    }
    this.linkText.setText(t("play." + key)).setColor(col);
    this.linkOrbs.forEach((orb, i) => {
      const on = i < grade;
      orb.core.setAlpha(on ? 1 : 0.16);
      orb.shine.setAlpha(on ? 0.95 : 0.15);
      orb.shell.setStrokeStyle(2, on ? orb.color : 0xffb14a, on ? 0.95 : 0.4);
    });
  }

  goResult() {
    const youScore = this.youSide === 1 ? this.score[0] : this.score[1];
    const botScore = this.youSide === 1 ? this.score[1] : this.score[0];
    this.matchOver = true;
    if (this.mpL) this.mpL.setText("");
    if (this.mpR) this.mpR.setText("");
    this.time.delayedCall(2200, () => {
      this.scene.start("result", {
        winner: youScore >= GAME.winScore ? 1 : 2,
        score: { p1: youScore, p2: botScore },
        courtId: this.season,
        youId: this.youData.id,
        botId: this.botData.id,
        refChar: this.refChar,
        refSeason: this.refSeason,
        stats: snapshotMatchStats(this.matchStats)
      });
    });
  }

  stepPhysics() {
    if (this.readyFrames > 0) {
      this.readyFrames -= 1;
      this.syncSprites();
      return;
    }
    if (this.ultFreezeLeft > 0) {
      this.ultFreezeLeft -= 1;
      this.syncSprites();
      return;
    }

    this.readHuman();
    const pack = this.physicsPack;
    const hitGround = pack.runEngineForNextFrame([this.p1In, this.p2In]);
    this.detectHits();
    this.markOrbPhysics();
    this.handleSounds();

    if (hitGround && !this.roundEnded) this.onPoint();
    if (this.roundEnded && !this.matchOver && !this.holdForPause && !this.paused && this.pointSlowMs <= 0 && this.roundHoldMs <= 0) {
      this.resetRound();
    }

    this.syncSprites();
  }

  detectHits() {
    const a = this.physicsPack;
    const now = [a.player1.isCollisionWithBallHappened, a.player2.isCollisionWithBallHappened];
    const power = a.ball.isPowerHit;
    if (now[0] && !this.prevHit[0]) this.onBallTouch(1, power);
    if (now[1] && !this.prevHit[1]) this.onBallTouch(2, power);
    this.prevHit = now;
  }

  onBallTouch(side, power) {
    this.lastHitter = side;
    const idx = side - 1;
    const data = side === 1 ? this.leftData : this.rightData;
    const human = (this.youSide === 1 && side === 1) || (this.youSide === 2 && side === 2);
    const a = this.physicsPack.ball;
    let usedUlt = false;
    if (!this.roundEnded) {
      if (power && isFull(idx) && ((human && this.ultArmed) || !human)) {
        const ult = fireUlt(idx, data.id);
        usedUlt = true;
        this.ultArmed = false;
        this.playUlt(ult);
        this.applyUltBall(ult, a);
      } else if (power) {
        if (addGauge(idx, 1) && human) this.showUltPopup();
      }
    }
    if (this.ultGrand && this.orbKind) {
      noteOrbContact(this.orbFx, toScreenX(a.x), toScreenY(a.y), this.orbKind, this.time.now, this.cameras.main);
    }
    if (!this.roundEnded) {
      this.matchStats.rallyBySide[idx] += 1;
      this.matchStats.rallyTouches += 1;
      if (human) {
        this.matchStats.hits += 1;
        if (power && !usedUlt) this.matchStats.powerHits += 1;
      }
    }
    if (this.fx && this.fx.pop) {
      if (usedUlt && this.fx.ultPop) this.fx.ultPop(toScreenX(a.x), toScreenY(a.y), data.id, this.ultGrand);
      else this.fx.pop(toScreenX(a.x), toScreenY(a.y), data.id, power);
    }
    const pal = ELEMENT_FX[data.id] || ELEMENT_FX.ignis;
    this.trail1.setTint(pal.tints[0]);
    this.trail2.setTint(pal.tints[1]);
    this.ball.setTint(power ? pal.smash[0] : 0xffffff);
    if (!power) this.time.delayedCall(120, () => this.ball.clearTint());
    if (!this.roundEnded) {
      if (power) AudioSystem.smash(data.id);
      else AudioSystem.hit(data.id);
    }
  }

  handleSounds() {
    const a = this.physicsPack;
    if (a.player1.sound.chu) {
      AudioSystem.jump(this.leftData.id);
      a.player1.sound.chu = false;
    }
    if (a.player2.sound.chu) {
      AudioSystem.jump(this.rightData.id);
      a.player2.sound.chu = false;
    }
    a.player1.sound.pika = false;
    a.player2.sound.pika = false;
    a.ball.sound.powerHit = false;
    a.ball.sound.ballTouchesGround = false;
  }

  syncSprites() {
    const a = this.physicsPack;
    this.p1.setPosition(toScreenX(a.player1.x), toScreenY(a.player1.y));
    this.p2.setPosition(toScreenX(a.player2.x), toScreenY(a.player2.y));
    paintSkinAura(this.aura1, this.p1.x, this.p1.y, this.leftData.id, champAuraTier(this.leftData.id, this.skinForSide(1), this.champForSide(1)), this.time.now, CHAR * 0.52);
    paintSkinAura(this.aura2, this.p2.x, this.p2.y, this.rightData.id, champAuraTier(this.rightData.id, this.skinForSide(2), this.champForSide(2)), this.time.now, CHAR * 0.52);
    this.sh1.setPosition(toScreenX(a.player1.x), toScreenY(WORLD.playerGroundY + 28));
    this.sh2.setPosition(toScreenX(a.player2.x), toScreenY(WORLD.playerGroundY + 28));
    this.ball.setPosition(toScreenX(a.ball.x), toScreenY(a.ball.y));
    this.ball.angle += a.ball.xVelocity * 2.2;
    this.ball.setVisible(!MATCH_FX.hideBall);
    this.trail1.setPosition(toScreenX(a.ball.previousX), toScreenY(a.ball.previousY));
    this.trail1.setAngle(this.ball.angle);
    this.trail2.setPosition(toScreenX(a.ball.previousPreviousX), toScreenY(a.ball.previousPreviousY));
    this.trail2.setAngle(this.ball.angle);
    this.drawBolt(a.ball);
    this.drawFlame(a.ball);
    this.paintOrbTouch(a.ball);
    this.tickStatusFx(a);
    this.p1.setDisplaySize(CHAR, CHAR);
    this.p2.setDisplaySize(CHAR, CHAR);
    this.p1.setTexture(this.poseKey(this.leftData.id, 1, a.player1));
    this.p2.setTexture(this.poseKey(this.rightData.id, 2, a.player2));
    this.p1.setFlipX(false);
    this.p2.setFlipX(false);
    try {
      syncJumpForm(this, this.jslot1, a.player1, this.p1, this.jform1, this.jfx1, this.leftData.id, this.time.now, CHAR, this.jspark1);
      syncJumpForm(this, this.jslot2, a.player2, this.p2, this.jform2, this.jfx2, this.rightData.id, this.time.now, CHAR, this.jspark2);
    } catch (e) {}
    this.p1.setTint(a.player1.state === 2 ? 0xffe0a0 : 0xffffff);
    this.p2.setTint(a.player2.state === 2 ? 0xe8ffa0 : 0xffffff);
    if (a.ball.isPowerHit) {
      this.trail1.setVisible(!MATCH_FX.hideBall);
      this.trail2.setVisible(!MATCH_FX.hideBall);
    } else {
      this.trail1.setVisible(!MATCH_FX.hideBall && Math.abs(a.ball.xVelocity) > 6);
      this.trail2.setVisible(!MATCH_FX.hideBall && Math.abs(a.ball.xVelocity) > 10);
    }
    this.paintArmedBall(a.ball);
    this.syncGauges();
  }

  youServing() {
    return this.p2Serves ? this.youSide === 2 : this.youSide === 1;
  }

  paintArmedBall(ball) {
    if (!this.ballFxG) return;
    const youId = this.youSide === 1 ? this.leftData.id : this.rightData.id;
    const armed = ballFxOf(SaveSystem.armedBallFx(youId));
    const row = this.youServing() && ballFxFitsChar(armed, youId) ? armed : null;
    const tex = row && this.textures.exists(row.tex) ? row.tex : "ball";
    if (this.ball.texture.key !== tex) this.ball.setTexture(tex);
    if (this.trail1.texture.key !== tex) this.trail1.setTexture(tex);
    if (this.trail2.texture.key !== tex) this.trail2.setTexture(tex);
    if (!ball.isPowerHit) {
      this.ball.clearTint();
      this.trail1.clearTint();
      this.trail2.clearTint();
    }
    if (!row || MATCH_FX.hideBall) {
      this.ballFxG.clear();
      return;
    }
    drawArmedBallFx(this.ballFxG, toScreenX(ball.x), toScreenY(ball.y), BALL / 2, row, this.time.now, this.justUlted ? "ult" : (ball.isPowerHit ? "smash" : "hit"));
  }

  pulseMatchPoint() {
    if (!this.mpL) return;
    const pulse = 0.55 + Math.abs(Math.sin(this.time.now / 180)) * 0.45;
    this.mpL.setAlpha(this.mpL.text ? pulse : 0);
    this.mpR.setAlpha(this.mpR.text ? pulse : 0);
  }

  onPoint() {
    this.roundEnded = true;
    this.justUlted = false;
    this.pointSlowMs = 500;
    this.roundHoldMs = 1400;
    this.worldRate = 0.4;
    this.tweens.timeScale = 0.4;
    const leftLand = this.physicsPack.ball.punchEffectX < GROUND_HALF_WIDTH;
    if (leftLand) {
      this.score[1] += 1;
      this.p2Serves = true;
    } else {
      this.score[0] += 1;
      this.p2Serves = false;
    }
    this.s1.setText(String(this.score[0]));
    this.s2.setText(String(this.score[1]));
    AudioSystem.score();
    const winSide = leftLand ? 2 : 1;
    const winData = winSide === 1 ? this.leftData : this.rightData;
    if (winSide === this.streakSide) this.streak += 1;
    else {
      this.streak = 1;
      this.streakSide = winSide;
    }
    this.cheer.show(winSide, winData.id, {
      you: winSide === this.youSide,
      skin: this.skinForSide(winSide),
      champSet: this.champForSide(winSide),
      season: this.season
    });
    this.notePointStats(winSide);
    this.showBanner(winData.name, leftLand ? "#c8ff3a" : "#ff8a3a");
    if (this.streak >= 2) {
      this.time.delayedCall(180, () => this.showStreak(this.streak, charName(winData.id)));
    }
    if (this.ref) this.tweens.add({ targets: this.ref, scale: 1.12, duration: 90, yoyo: true });
    tickPointStatuses();
    this.ultArmed = false;
    this.enterHold = 0;
    this.enterDownAt = 0;
    const youScore = this.youSide === 1 ? this.score[0] : this.score[1];
    const botScore = this.youSide === 1 ? this.score[1] : this.score[0];
    const need = GAME.winScore - 1;
    const mpL = this.score[0] >= need && this.score[0] < GAME.winScore;
    const mpR = this.score[1] >= need && this.score[1] < GAME.winScore;
    this.mpL.setText(mpL ? t("play.matchPoint") : "");
    this.mpR.setText(mpR ? t("play.matchPoint") : "");
    if (this.net && this.pauseWanted) {
      this.pauseWanted = false;
      this.holdForPause = true;
      NetPlay.pause("player");
    }
    if (youScore >= GAME.winScore || botScore >= GAME.winScore) {
      this.goResult();
    } else if ((mpL || mpR) && !this.hadMatchPoint) {
      this.hadMatchPoint = true;
      const who = mpL && mpR
        ? t("play.both")
        : (mpL ? charName(this.leftData.id) : charName(this.rightData.id));
      this.time.delayedCall(this.streak >= 2 ? 900 : 280, () => this.showMatchPoint(who));
    }
  }

  showBanner(text, color) {
    this.banner.setText(text).setColor(color || "#fff6ea").setAlpha(1).setScale(0.86);
    this.tweens.add({ targets: this.banner, scale: 1, duration: 120 });
    this.tweens.add({ targets: this.banner, alpha: 0, delay: 500, duration: 180 });
  }

  showNotice(text) {
    if (!this.notice) return;
    this.tweens.killTweensOf([this.notice, this.noticeBg]);
    this.notice.setText(text).setAlpha(1);
    const w = Math.min(620, Math.max(220, this.notice.width + 36));
    const h = Math.max(36, this.notice.height + 16);
    if (this.noticeBg) {
      this.noticeBg.clear();
      this.noticeBg.fillStyle(0xfff6ea, 0.96);
      this.noticeBg.fillRoundedRect(GAME.width / 2 - w / 2, 168 - h / 2, w, h, 18);
      this.noticeBg.lineStyle(3, 0xffb14a, 0.9);
      this.noticeBg.strokeRoundedRect(GAME.width / 2 - w / 2, 168 - h / 2, w, h, 18);
      this.noticeBg.setAlpha(1);
    }
    this.tweens.add({
      targets: [this.notice, this.noticeBg],
      alpha: 0,
      delay: 1600,
      duration: 240
    });
  }

  showCallout(title, sub, color) {
    this.tweens.killTweensOf([this.callout, this.calloutSub]);
    this.callout.setText(title).setColor(color).setAlpha(1).setScale(0.7);
    this.calloutSub.setText(sub).setAlpha(1).setScale(0.85);
    this.tweens.add({ targets: this.callout, scale: 1.12, duration: 160, yoyo: true });
    this.tweens.add({
      targets: [this.callout, this.calloutSub],
      alpha: 0,
      delay: 980,
      duration: 220
    });
  }

  showStreak(n, name) {
    const title = n === 5 ? "ON FIRE x5" : ("STREAK x" + n);
    const key = n >= 2 && n <= 5 ? String(n) : "more";
    this.showCallout(title, t("streak." + key, { name }), n >= 5 ? "#ff6a22" : "#ffe08a");
    AudioSystem.ui();
  }

  showMatchPoint(who) {
    this.showCallout(t("play.matchPoint"), t("play.matchSub", { who }), "#ff4a6a");
    AudioSystem.ui();
  }

  showUltPopup() {
    this.ultPop.setText(t("play.ultFull")).setAlpha(1).setScale(0.92);
    this.tweens.add({ targets: this.ultPop, scale: 1, duration: 140 });
    this.tweens.add({ targets: this.ultPop, alpha: 0, delay: 2400, duration: 280 });
    AudioSystem.ui();
  }

  playUlt(ult) {
    if (!ult) return;
    const courtSide = ult.side === 0 ? 1 : 2;
    this.ultFreezeLeft = 13;
    this.justUlted = true;
    this.ultArmed = false;
    this.enterHold = 0;
    this.enterDownAt = 0;
    this.ultGrand = (courtSide === this.youSide) && SaveSystem.grandUlt(ult.id);
    this.orbKind = this.ultGrand ? ult.id : "";
    if (this.ultGrand) clearOrbTouchFx(this.orbFx);
    this.ultCut.show(courtSide, ult.id, this.faceKey(ult.id, courtSide), this.ultGrand);
    this.cameras.main.flash(this.ultGrand ? 110 : 70, 255, 236, 210);
    const names = { ignis: "BLAZE SPIKE", aqua: "TIDAL BREAK", volt: "THUNDER GHOST", terra: "QUAKE SMASH" };
    this.showBanner(names[ult.id] || "ULTIMATE", "#ffe08a");
    if (ult.id === "ignis") shakeCam(this.cameras.main, 280, 0.01);
    if (ult.id === "terra") shakeCam(this.cameras.main, 520, 0.02);
    if (ult.pierce) this.time.delayedCall(420, () => this.showBanner(t("play.pierce"), "#ff6a22"));
    if (ult.statusBlocked) {
      this.time.delayedCall(ult.pierce ? 780 : 420, () => this.showBanner(t("play.statusBlocked"), "#ff8aa8"));
    } else {
      if (ult.id === "ignis") this.time.delayedCall(ult.pierce ? 780 : 420, () => this.showBanner(t("play.burn"), "#ff6a22"));
      if (ult.stone) this.time.delayedCall(420, () => this.showBanner(t("play.stone"), "#e0a24a"));
      if (ult.para) this.time.delayedCall(420, () => this.showBanner(t("play.para"), "#c8ff3a"));
    }
    this.boltTrail = [];
    if (courtSide === this.youSide) this.matchStats.ults += 1;
  }

  markOrbPhysics() {
    if (!this.ultGrand || !this.orbKind) return;
    const b = this.physicsPack.ball;
    scanOrbContact(this.orbFx, b, toScreenX(b.x), toScreenY(b.y), this.orbKind, this.time.now, this.cameras.main);
  }

  paintOrbTouch(ball) {
    if (!this.orbFx || !this.orbKind) return;
    const x = toScreenX(ball.x);
    const y = toScreenY(ball.y);
    if (this.ultGrand) {
      noteOrbTravel(this.orbFx, x, y, this.orbKind, this.time.now);
      this.orbFx.lastX = x;
      this.orbFx.lastY = y;
    }
    tickOrbTouchFx(this.orbFx, this.orbKind, this.time.now, toScreenY(WORLD.ballGroundY));
  }

  notePointStats(winSide) {
    const s = this.matchStats;
    s.longestRally = Math.max(s.longestRally, s.rallyTouches);
    if (winSide === this.youSide) {
      s.bestStreak = Math.max(s.bestStreak, this.streak);
      const botIdx = this.youSide === 1 ? 1 : 0;
      if (s.rallyBySide[botIdx] === 0) s.aces += 1;
    } else if (this.lastHitter === this.youSide) {
      s.errors += 1;
    }
    s.rallyTouches = 0;
    s.rallyBySide = [0, 0];
  }

  applyUltBall(ult, ball) {
    if (!ult || !ball) return;
    if (ult.id === "ignis") {
      ball.xVelocity *= 2.15;
      ball.yVelocity *= 1.85;
      if (Math.abs(ball.xVelocity) < 14) ball.xVelocity = ball.xVelocity < 0 ? -16 : 16;
    } else if (ult.id === "volt") {
      ball.xVelocity *= 3.4;
      ball.yVelocity *= 2.8;
      if (Math.abs(ball.xVelocity) < 18) ball.xVelocity = ball.xVelocity < 0 ? -20 : 20;
    } else if (ult.id === "terra") {
      ball.xVelocity *= 1.85;
      ball.yVelocity *= 1.7;
    } else if (ult.id === "aqua") {
      ball.xVelocity *= 1.2;
    }
  }

  syncGauges() {
    const now = this.time.now;
    const full0 = isFull(0);
    const full1 = isFull(1);
    if (full0 && !this.plateL.wasFull) this.burstGauge(this.plateL);
    if (full1 && !this.plateR.wasFull) this.burstGauge(this.plateR);
    this.plateL.wasFull = full0;
    this.plateR.wasFull = full1;
    paintChibiPips(this.plateL, UltState.gauge[0], full0, this.ultArmed && this.youSide === 1, now, UltState.burn[0] > 0);
    paintChibiPips(this.plateR, UltState.gauge[1], full1, this.ultArmed && this.youSide === 2, now, UltState.burn[1] > 0);
  }

  burstGauge(g) {
    const ring = this.add.circle(g.x, g.y, 12, 0xffe08a, 0.0).setStrokeStyle(3, 0xffe08a, 0.95).setDepth(14);
    this.tweens.add({ targets: ring, scale: 3.2, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
  }

  drawBolt(ball) {
    this.bolt.clear();
    if (!MATCH_FX.volt) {
      this.boltTrail = [];
      return;
    }
    const x = toScreenX(ball.x);
    const y = toScreenY(ball.y);
    this.boltTrail.push({ x, y });
    if (this.boltTrail.length > 10) this.boltTrail.shift();
    const pts = this.boltTrail;
    if (pts.length < 2) return;
    this.bolt.lineStyle(this.ultGrand ? 12 : 7, 0xe8ff3a, this.ultGrand ? 0.55 : 0.4);
    this.bolt.beginPath();
    this.bolt.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i += 1) this.bolt.lineTo(pts[i].x, pts[i].y);
    this.bolt.strokePath();
    this.bolt.lineStyle(3, 0xffffff, 0.95);
    this.bolt.beginPath();
    this.bolt.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i += 1) {
      this.bolt.lineTo(pts[i].x + (Math.random() - 0.5) * 10, pts[i].y + (Math.random() - 0.5) * 10);
    }
    this.bolt.strokePath();
    this.bolt.fillStyle(0xffffcc, 1);
    this.bolt.fillCircle(x, y, this.ultGrand ? 14 : 9);
    this.bolt.fillStyle(0xe8ff3a, 0.65);
    this.bolt.fillCircle(x, y, this.ultGrand ? 26 : 16);
    if (this.ultGrand) {
      this.bolt.lineStyle(2, 0xffffff, 0.8);
      for (let i = 0; i < 4; i += 1) {
        const ang = (this.time.now / 80) + i * 1.57;
        this.bolt.lineBetween(x, y, x + Math.cos(ang) * 34, y + Math.sin(ang) * 34);
      }
    }
  }

  drawFlame(ball) {
    this.flame.clear();
    if (!MATCH_FX.fire) {
      this.flameTrail = [];
      return;
    }
    const x = toScreenX(ball.x);
    const y = toScreenY(ball.y);
    this.flameTrail.push({ x, y });
    if (this.flameTrail.length > 12) this.flameTrail.shift();
    const pts = this.flameTrail;
    for (let i = 0; i < pts.length; i += 1) {
      const p = pts[i];
      const u = (i + 1) / pts.length;
      const g = this.ultGrand ? 1.7 : 1;
      this.flame.fillStyle(0xff6a22, 0.18 + u * 0.45);
      this.flame.fillCircle(p.x, p.y, (8 + u * 16) * g);
      this.flame.fillStyle(0xffe08a, 0.2 + u * 0.5);
      this.flame.fillCircle(p.x, p.y, (4 + u * 8) * g);
    }
    this.flame.fillStyle(0xfff4e8, 0.95);
    this.flame.fillCircle(x, y, this.ultGrand ? 16 : 10);
    if (this.ultGrand) {
      this.flame.fillStyle(0xff3300, 0.28);
      this.flame.fillCircle(x, y + 6, 28);
    }
    this.ball.setTint(0xff6a22);
  }

  tickStatusFx(a) {
    const wet = UltState.wetPoints > 0;
    this.wetRing.setVisible(wet && !MATCH_FX.hideBall);
    this.drops.forEach((d) => d.setVisible(wet && !MATCH_FX.hideBall));
    if (wet) {
      const bx = toScreenX(a.ball.x);
      const by = toScreenY(a.ball.y);
      this.wetRing.setPosition(bx, by);
      this.wetRing.setScale((this.ultGrand ? 1.55 : 1.15) + Math.sin(this.time.now / 120) * (this.ultGrand ? 0.32 : 0.2));
      this.wetRing.setAlpha(0.75);
      this.ball.setTint(0x66e8ff);
      const tw = this.time.now / 160;
      this.drops.forEach((d, i) => {
        const ang = tw + i * 1.25;
        d.setPosition(bx + Math.cos(ang) * (28 + i * 4), by + Math.sin(ang * 1.3) * (22 + i * 3));
        d.setAlpha(0.55 + (i % 2) * 0.3);
      });
    }
    const spin = this.time.now / 55;
    const p1 = UltState.para[0] > 0;
    const p2 = UltState.para[1] > 0;
    const b1 = UltState.burn[0] > 0;
    const b2 = UltState.burn[1] > 0;
    this.spark1.setVisible(p1);
    this.spark1b.setVisible(p1);
    this.spark2.setVisible(p2);
    this.spark2b.setVisible(p2);
    this.ember1.setVisible(b1);
    this.ember1b.setVisible(b1);
    this.ember2.setVisible(b2);
    this.ember2b.setVisible(b2);
    if (p1) {
      this.p1.setTint(0xf2ff8a);
      this.spark1.setPosition(toScreenX(a.player1.x) + Math.cos(spin) * 40, toScreenY(a.player1.y) + Math.sin(spin * 1.8) * 32);
      this.spark1b.setPosition(toScreenX(a.player1.x) + Math.cos(spin + 2) * 28, toScreenY(a.player1.y) + Math.sin(spin * 2.1) * 24);
      this.spark1.setAlpha(0.75);
      this.spark1b.setAlpha(0.85);
      this.statusTag1.setText(t("play.para")).setColor("#e8ff3a").setPosition(toScreenX(a.player1.x), toScreenY(a.player1.y) - 70);
    } else this.statusTag1.setText("");
    if (p2) {
      this.p2.setTint(0xf2ff8a);
      this.spark2.setPosition(toScreenX(a.player2.x) + Math.cos(spin + 1) * 40, toScreenY(a.player2.y) + Math.sin(spin * 1.8) * 32);
      this.spark2b.setPosition(toScreenX(a.player2.x) + Math.cos(spin + 3) * 28, toScreenY(a.player2.y) + Math.sin(spin * 2.1) * 24);
      this.spark2.setAlpha(0.75);
      this.spark2b.setAlpha(0.85);
      this.statusTag2.setText(t("play.para")).setColor("#e8ff3a").setPosition(toScreenX(a.player2.x), toScreenY(a.player2.y) - 70);
    } else this.statusTag2.setText("");
    if (b1 && !p1) {
      this.p1.setTint(0xff6a22);
      this.ember1.setPosition(toScreenX(a.player1.x) + Math.cos(spin) * 36, toScreenY(a.player1.y) - 24 + Math.sin(spin * 2) * 10);
      this.ember1b.setPosition(toScreenX(a.player1.x) + Math.cos(spin + 2.2) * 22, toScreenY(a.player1.y) - 38);
      this.ember1.setAlpha(0.7);
      this.ember1b.setAlpha(0.9);
      this.statusTag1.setText(t("play.burn") + " x" + UltState.burn[0]).setColor("#ff6a22").setPosition(toScreenX(a.player1.x), toScreenY(a.player1.y) - 70);
    }
    if (b2 && !p2) {
      this.p2.setTint(0xff6a22);
      this.ember2.setPosition(toScreenX(a.player2.x) + Math.cos(spin + 1) * 36, toScreenY(a.player2.y) - 24 + Math.sin(spin * 2) * 10);
      this.ember2b.setPosition(toScreenX(a.player2.x) + Math.cos(spin + 3.1) * 22, toScreenY(a.player2.y) - 38);
      this.ember2.setAlpha(0.7);
      this.ember2b.setAlpha(0.9);
      this.statusTag2.setText(t("play.burn") + " x" + UltState.burn[1]).setColor("#ff6a22").setPosition(toScreenX(a.player2.x), toScreenY(a.player2.y) - 70);
    }
    if (UltState.wetVictim === 0 && UltState.wetPoints > 0 && !p1) {
      this.statusTag1.setText(t("play.slip")).setColor("#7ae8ff").setPosition(toScreenX(a.player1.x), toScreenY(a.player1.y) - 70);
    }
    if (UltState.wetVictim === 1 && UltState.wetPoints > 0 && !p2) {
      this.statusTag2.setText(t("play.slip")).setColor("#7ae8ff").setPosition(toScreenX(a.player2.x), toScreenY(a.player2.y) - 70);
    }
    if (MATCH_FX.stone || MATCH_FX.stuck) this.ball.setTint(this.ultGrand ? 0xffc070 : 0xc07830);
    if (MATCH_FX.stuck && !this.stuckShook) {
      shakeCam(this.cameras.main, 280, 0.012);
      this.stuckShook = true;
    }
    if (!MATCH_FX.stuck) this.stuckShook = false;
  }
}
