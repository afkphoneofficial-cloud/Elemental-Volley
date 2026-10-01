import { drawGrid, makeButton, makeChoiceButton, UI_FONT } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js?v=local245";
import { medalFromMmr, searchWindow, badgeKey, isCalibrating, RANK_CAL_GAMES, displayBadgeId } from "../data/ranks.js";
import { avatarKey } from "../data/avatars.js";
import { NetPlay } from "../systems/NetPlay.js?v=local245";
import { clampSkin } from "../data/skins.js";
import { champSetOf, clampChamp } from "../data/seasonLooks.js";
import { isRankWindowOpen } from "../data/rankWindows.js";
import { maintenanceNow } from "../data/maintenance.js";
import { MatchLive, startLocalBot } from "../systems/MatchLive.js?v=local242";

function formatWait(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + String(s).padStart(2, "0");
}

function rivalLabel(rival) {
  if (!rival) return "";
  return I18n.lang === "en" ? rival.nameEn : rival.nameTh;
}

export class QueueScene extends Phaser.Scene {
  constructor() { super("queue"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    if (AuthSystem.isGuest()) {
      Session.mode = "exhibit";
      Session.exhibitCasual = true;
      Session.exhibitFriendId = null;
    }
    if (maintenanceNow()) {
      this.scene.start(AuthSystem.lobbyKey());
      return;
    }
    const kind = Session.mode;
    if ((kind === "pvp" && !isRankWindowOpen("pvp")) || (kind === "special" && !isRankWindowOpen("special"))) {
      this.scene.start("mode");
      return;
    }
    drawGrid(this);
    const W = this.scale.width;
    const rank = SaveSystem.data.rank;
    this.started = this.time.now;
    this.waitAt = Date.now();
    this.found = false;
    this.bits = [];

    this.add.text(W / 2, 48, t("queue.title"), {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.status = this.add.text(W / 2, 96, t("queue.searching"), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30"
    }).setOrigin(0.5);
    this.waitClock = this.add.text(W / 2, 128, t("queue.waitTime", { t: "0:00" }), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#c45a16"
    }).setOrigin(0.5);
    this.windowText = this.add.text(W / 2, 164, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5);

    this.add.circle(W / 2, 280, 90, 0xffffff, 0.4).setStrokeStyle(4, 0x7d5cff, 0.55);
    const youKey = this.textures.exists(avatarKey(SaveSystem.data.avatarId))
      ? avatarKey(SaveSystem.data.avatarId) : avatarKey("av01");
    this.add.image(W / 2, 268, youKey).setDisplaySize(120, 120);
    const shown = displayBadgeId(rank);
    if (this.textures.exists(badgeKey(shown))) {
      this.add.image(W / 2 + 52, 318, badgeKey(shown)).setDisplaySize(48, 48);
    }
    const youMedal = isCalibrating(rank) ? null : medalFromMmr(rank.mmr);
    this.add.text(W / 2, 390, isCalibrating(rank)
      ? t("rank.calShort", { n: rank.games, max: RANK_CAL_GAMES })
      : t("rank.chip", { name: t("rank.tier." + youMedal.id), star: youMedal.star || "" }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    this.ring = this.add.graphics();
    this.cancelBtn = makeButton(this, 120, 48, 140, 40, t("queue.cancel"), () => {
      AudioSystem.ui();
      NetPlay.cancel();
      if (AuthSystem.isGuest()) this.scene.start("auth");
      else this.scene.start(Session.exhibitCasual ? "friends" : "select");
    }, 0x7d5cff);
    if (!AuthSystem.isGuest()) {
      makeButton(this, W - 140, 48, 180, 40, t("queue.how"), () => {
        AudioSystem.ui();
        NetPlay.cancel();
        this.scene.start("rankinfo", { from: "select", tab: "rules" });
      }, 0xffb14a);
    }
    if (Session.mode === "exhibit" && (Session.exhibitCasual || AuthSystem.isGuest())) {
      makeButton(this, W / 2, 640, 320, 50, t("queue.vsBot"), () => {
        AudioSystem.ui();
        this.found = true;
        NetPlay.cancel();
        startLocalBot(this, Session.playerId);
      }, 0x3ad6ff);
    }

    this.off = NetPlay.on((msg) => this.onNet(msg));
    this.events.once("shutdown", () => {
      if (this.off) this.off();
      if (!this.found) NetPlay.cancel();
    });

    NetPlay.ensure();
    if (!NetPlay.configured()) {
      this.status.setText(t("queue.noServer"));
      this.stopWaitClock();
      return;
    }
    if (NetPlay.cooldownUntil > Date.now() && !Session.exhibitIncoming && !Session.exhibitCasual) {
      this.status.setText(t("queue.cooldown", { n: Math.ceil((NetPlay.cooldownUntil - Date.now()) / 60000) }));
      this.stopWaitClock();
      return;
    }
    if (Session.exhibitIncoming) {
      Session.exhibitIncoming = false;
      this.status.setText(t("queue.searchExhibit"));
      this.beginWait();
    } else if (Session.mode === "exhibit" && Session.exhibitCasual) {
      const left = (NetPlay.exhibitCooldownUntil | 0) - Date.now();
      if (left > 0) {
        this.status.setText(t("queue.coolSec", { n: Math.ceil(left / 1000) }));
        this.stopWaitClock();
        this.time.delayedCall(700, () => this.scene.start(AuthSystem.isGuest() ? "auth" : "friends"));
        return;
      }
      this.status.setText(t("queue.searchExhibit"));
      NetPlay.queueExhibit();
      this.beginWait();
      this.paintExhibitWait();
      MatchLive.pull().then(() => { if (this.sys && this.sys.isActive()) this.paintExhibitWait(); });
    } else if (Session.mode === "exhibit" && Session.exhibitFriendId) {
      NetPlay.exhibit(Session.exhibitFriendId);
      this.beginWait();
    } else {
      const st = SaveSystem.etherNow();
      if ((st.n | 0) < ECONOMY.etherCostPvp) {
        this.status.setText(t("queue.noEther"));
        this.stopWaitClock();
        this.time.delayedCall(900, () => this.scene.start(AuthSystem.lobbyKey()));
        return;
      }
      NetPlay.queueRanked();
      this.beginWait();
    }
  }

  onNet(msg) {
    if (!this.sys || !this.sys.isActive()) return;
    if (msg.t === "searching" || msg.t === "live") {
      if (msg.exhibit != null) MatchLive.exhibit = msg.exhibit | 0;
      if (msg.ranked != null) MatchLive.ranked = msg.ranked | 0;
      this.paintExhibitWait();
    }
    if (msg.t === "searching") {
      this.clearOffer();
      if (this.found) return;
      this.status.setText(Session.exhibitCasual ? t("queue.searchExhibit") : t("queue.searching"));
      this.beginWait();
    }
    if (msg.t === "cooldown") {
      this.clearOffer();
      const mins = Math.max(1, Math.ceil((msg.ms || 120000) / 60000));
      this.status.setText(t("queue.cooldown", { n: mins }));
      this.stopWaitClock();
    }
    if (msg.t === "offline") {
      this.status.setText(t("queue.offline"));
      this.stopWaitClock();
    }
    if (msg.t === "busy") {
      this.status.setText(t("queue.busy"));
      this.stopWaitClock();
    }
    if (msg.t === "declined") {
      this.status.setText(t("queue.declined"));
      this.stopWaitClock();
    }
    if (msg.t === "retrying" || msg.t === "authFail") {
      this.status.setText(t("queue.retrying"));
      this.beginWait();
    }
    if (msg.t === "closed") {
      this.status.setText(t("queue.noServer"));
      this.stopWaitClock();
    }
    if (msg.t === "offer") this.showOffer(msg);
    if (msg.t === "luck") this.enterLuck(msg);
  }

  enterLuck(msg) {
    if (this.found) return;
    if (Session.mode !== "exhibit") {
      if (!SaveSystem.spendEther(ECONOMY.etherCostPvp)) {
        this.status.setText(t("queue.noEther"));
        NetPlay.cancel();
        this.time.delayedCall(900, () => this.scene.start(AuthSystem.lobbyKey()));
        return;
      }
    }
    this.found = true;
    this.stopWaitClock();
    Session.net = true;
    Session.netHost = msg.host === true;
    Session.mode = Session.mode === "exhibit" ? "exhibit" : "pvp";
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
        skin: msg.rival.skin | 0 || 1,
        champSet: clampChamp(msg.rival.champSet)
      };
    }
    Session.youSide = msg.youSide === 2 ? 2 : 1;
    Session.botId = (msg.rival && msg.rival.fighter) || Session.botId;
    Session.youSkin = clampSkin(SaveSystem.skinOf(Session.playerId));
    Session.youChamp = champSetOf(Session.playerId);
    Session.foeSkin = clampSkin((msg.rival && msg.rival.skin) || 1);
    Session.foeChamp = clampChamp(msg.rival && msg.rival.champSet);
    this.scene.start("luck", msg);
  }

  clearOffer() {
    this.bits.forEach((o) => {
      try { o.destroy(); } catch (e) {}
    });
    this.bits = [];
    this.offerUntil = 0;
    this.offerClock = null;
    if (this.waitAt) this.setWaitVisible(true);
    if (this.cancelBtn && this.cancelBtn.bg) this.cancelBtn.bg.setVisible(true);
    if (this.cancelBtn && this.cancelBtn.text) this.cancelBtn.text.setVisible(true);
    if (this.cancelBtn && this.cancelBtn.gfx) this.cancelBtn.gfx.setVisible(true);
  }

  showOffer(msg) {
    this.clearOffer();
    const W = this.scale.width;
    const H = this.scale.height;
    const rival = msg.rival || {};
    Session.rival = {
      live: true,
      userId: rival.id,
      nameTh: rival.name,
      nameEn: rival.name,
      mmr: rival.mmr | 0,
      fighter: rival.fighter,
      avatarId: rival.avatarId || "av01",
      wins: rival.wins | 0,
      mostUsed: rival.mostUsed,
      difficulty: "normal",
      skin: rival.skin | 0 || 1,
      champSet: clampChamp(rival.champSet)
    };
    Session.foeSkin = clampSkin(Session.rival.skin);
    Session.foeChamp = Session.rival.champSet;
    Session.youSkin = clampSkin(SaveSystem.skinOf(Session.playerId));
    Session.youChamp = champSetOf(Session.playerId);
    this.offerVoted = false;
    this.offerId = msg.offerId;
    this.status.setText(t("queue.foundLive"));
    this.setWaitVisible(false);
    if (this.cancelBtn && this.cancelBtn.bg) this.cancelBtn.bg.setVisible(false);
    if (this.cancelBtn && this.cancelBtn.text) this.cancelBtn.text.setVisible(false);
    if (this.cancelBtn && this.cancelBtn.gfx) this.cancelBtn.gfx.setVisible(false);

    const head = this.add.text(W / 2, H / 2 - 196, t("queue.fightAsk"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5).setDepth(32);
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x3a2418, 0.38).setDepth(30).setInteractive();
    const panel = this.add.graphics().setDepth(31);
    panel.fillStyle(0xfff6ea, 0.98);
    panel.fillRoundedRect(W / 2 - 300, H / 2 - 230, 600, 470, 32);
    panel.lineStyle(5, 0xffb14a, 0.95);
    panel.strokeRoundedRect(W / 2 - 300, H / 2 - 230, 600, 470, 32);
    panel.fillStyle(0xffe08a, 0.35);
    panel.fillCircle(W / 2 - 220, H / 2 - 160, 28);
    panel.fillStyle(0x7ad4ff, 0.28);
    panel.fillCircle(W / 2 + 230, H / 2 + 40, 36);
    const medal = medalFromMmr(rival.mmr | 0);
    const av = this.textures.exists(avatarKey(rival.avatarId)) ? avatarKey(rival.avatarId) : avatarKey("av01");
    const img = this.add.image(W / 2, H / 2 - 128, av).setDisplaySize(96, 96).setDepth(32);
    let badge = null;
    if (this.textures.exists(badgeKey(medal.id))) {
      badge = this.add.image(W / 2 + 52, H / 2 - 88, badgeKey(medal.id)).setDisplaySize(40, 40).setDepth(33);
    }
    const name = this.add.text(W / 2, H / 2 - 48, rivalLabel(Session.rival), {
      fontFamily: UI_FONT, fontSize: "24px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(32);
    const rankLine = this.add.text(W / 2, H / 2 - 14, t("rank.chip", { name: t("rank.tier." + medal.id), star: medal.star || "" }), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(32);
    const wins = this.add.text(W / 2, H / 2 + 16, t("queue.wins", { n: rival.wins | 0 }), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(32);
    const used = this.add.text(W / 2, H / 2 + 44, t("queue.mostUsed", { name: charName(rival.mostUsed || rival.fighter || "ignis") }), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(32);
    const yes = makeChoiceButton(this, W / 2 - 118, H / 2 + 148, 210, 58, t("queue.accept"), "yes", () => {
      AudioSystem.ui();
      this.offerVoted = true;
      NetPlay.vote(msg.offerId, true);
      this.status.setText(t("queue.waitAccept"));
      yes.bg.disableInteractive();
      no.bg.disableInteractive();
    });
    const no = makeChoiceButton(this, W / 2 + 118, H / 2 + 148, 210, 58, t("queue.decline"), "no", () => {
      AudioSystem.ui();
      this.offerVoted = true;
      NetPlay.vote(msg.offerId, false);
      this.clearOffer();
      if (Session.exhibitCasual) {
        NetPlay.queueExhibit();
        this.status.setText(t("queue.searchExhibit"));
        this.beginWait();
      } else {
        this.status.setText(t("queue.cooldown", { n: 5 }));
      }
    });
    this.offerUntil = msg.deadline || (Date.now() + 30000);
    this.offerClock = this.add.text(W / 2, H / 2 + 198, t("queue.offerSec", { n: 30 }), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#c45a16"
    }).setOrigin(0.5).setDepth(34);
    [yes.gfx, yes.text, yes.bg, yes.mark, no.gfx, no.text, no.bg, no.mark].forEach((o) => o.setDepth(34));
    this.bits = [veil, panel, head, img, name, rankLine, wins, used, yes.gfx, yes.text, yes.bg, yes.mark, no.gfx, no.text, no.bg, no.mark, this.offerClock];
    if (badge) this.bits.push(badge);
  }

  beginWait() {
    this.waitAt = Date.now();
    this.started = this.time.now;
    this.setWaitVisible(true);
    this.paintWait();
  }

  stopWaitClock() {
    this.waitAt = 0;
    this.setWaitVisible(false);
  }

  setWaitVisible(on) {
    if (this.waitClock) this.waitClock.setVisible(on);
  }

  paintWait() {
    if (!this.waitClock || !this.waitAt) return;
    this.waitClock.setText(t("queue.waitTime", { t: formatWait(Date.now() - this.waitAt) }));
  }

  paintExhibitWait() {
    if (!this.windowText) return;
    if (Session.mode === "exhibit") {
      this.windowText.setText(t("queue.exhibitWait", { n: MatchLive.exhibit | 0 }));
    }
  }

  update() {
    if (this.offerClock && this.offerUntil) {
      const left = Math.max(0, Math.ceil((this.offerUntil - Date.now()) / 1000));
      this.offerClock.setText(t("queue.offerSec", { n: left }));
      if (left <= 0 && !this.offerVoted && Session.exhibitCasual) {
        this.offerVoted = true;
        NetPlay.vote(this.offerId, false);
        NetPlay.exhibitCooldownUntil = Date.now() + 60000;
        NetPlay.cancel();
        this.scene.start(AuthSystem.isGuest() ? "select" : "friends");
        return;
      }
    }
    if (this.waitAt && !this.offerClock) this.paintWait();
    if (this.found) return;
    const elapsed = this.time.now - this.started;
    this.ring.clear();
    this.ring.lineStyle(3, 0x7d5cff, 0.45 + 0.25 * Math.sin(elapsed / 180));
    this.ring.strokeCircle(this.scale.width / 2, 280, 90 + 8 * Math.sin(elapsed / 220));
    if (Session.mode === "exhibit") this.paintExhibitWait();
    else this.windowText.setText(t("queue.window", { n: searchWindow(elapsed) }));
  }
}
