import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { medalFromMmr, searchWindow, badgeKey, isCalibrating, RANK_CAL_GAMES } from "../data/ranks.js";
import { avatarKey } from "../data/avatars.js";
import { NetPlay } from "../systems/NetPlay.js";

function rivalLabel(rival) {
  if (!rival) return "";
  return I18n.lang === "en" ? rival.nameEn : rival.nameTh;
}

export class QueueScene extends Phaser.Scene {
  constructor() { super("queue"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const rank = SaveSystem.data.rank;
    this.started = this.time.now;
    this.found = false;
    this.bits = [];

    this.add.text(W / 2, 48, t("queue.title"), {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.status = this.add.text(W / 2, 96, t("queue.searching"), {
      fontFamily: UI_FONT, fontSize: "16px", color: "#7a4a30"
    }).setOrigin(0.5);
    this.windowText = this.add.text(W / 2, 128, "", {
      fontFamily: UI_FONT, fontSize: "14px", color: "#8a5a38"
    }).setOrigin(0.5);

    this.add.circle(W / 2, 280, 90, 0xffffff, 0.4).setStrokeStyle(4, 0x7d5cff, 0.55);
    const youKey = this.textures.exists(avatarKey(SaveSystem.data.avatarId))
      ? avatarKey(SaveSystem.data.avatarId) : avatarKey("av01");
    this.add.image(W / 2, 268, youKey).setDisplaySize(120, 120);
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
      this.scene.start("select");
    }, 0x7d5cff);
    makeButton(this, W - 140, 48, 180, 40, t("queue.how"), () => {
      AudioSystem.ui();
      NetPlay.cancel();
      this.scene.start("rankinfo", { from: "select" });
    }, 0xffb14a);

    this.off = NetPlay.on((msg) => this.onNet(msg));
    this.events.once("shutdown", () => {
      if (this.off) this.off();
      if (!this.found) NetPlay.cancel();
    });

    NetPlay.ensure();
    if (!NetPlay.configured()) {
      this.status.setText(t("queue.noServer"));
      return;
    }
    if (NetPlay.cooldownUntil > Date.now()) {
      this.status.setText(t("queue.cooldown", { n: Math.ceil((NetPlay.cooldownUntil - Date.now()) / 60000) }));
      return;
    }
    if (Session.mode === "exhibit" && Session.exhibitFriendId) {
      NetPlay.exhibit(Session.exhibitFriendId);
    } else {
      const st = SaveSystem.etherNow();
      if ((st.n | 0) < ECONOMY.etherCostPvp) {
        this.status.setText(t("queue.noEther"));
        this.time.delayedCall(900, () => this.scene.start("hub"));
        return;
      }
      NetPlay.queueRanked();
    }
  }

  onNet(msg) {
    if (!this.sys || !this.sys.isActive()) return;
    if (msg.t === "searching") this.status.setText(t("queue.searching"));
    if (msg.t === "cooldown") {
      this.clearOffer();
      this.status.setText(t("queue.cooldown", { n: 5 }));
    }
    if (msg.t === "offline") this.status.setText(t("queue.offline"));
    if (msg.t === "busy") this.status.setText(t("queue.busy"));
    if (msg.t === "declined") this.status.setText(t("queue.declined"));
    if (msg.t === "authFail" || msg.t === "closed") this.status.setText(t("queue.noServer"));
    if (msg.t === "offer") this.showOffer(msg);
    if (msg.t === "luck") this.enterLuck(msg);
  }

  enterLuck(msg) {
    if (this.found) return;
    if (Session.mode !== "exhibit") {
      if (!SaveSystem.spendEther(ECONOMY.etherCostPvp)) {
        this.status.setText(t("queue.noEther"));
        NetPlay.cancel();
        this.time.delayedCall(900, () => this.scene.start("hub"));
        return;
      }
    }
    this.found = true;
    Session.net = true;
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
        difficulty: "normal"
      };
    }
    Session.youSide = msg.youSide === 2 ? 2 : 1;
    Session.botId = (msg.rival && msg.rival.fighter) || Session.botId;
    this.scene.start("luck");
  }

  clearOffer() {
    this.bits.forEach((o) => {
      try { o.destroy(); } catch (e) {}
    });
    this.bits = [];
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
      difficulty: "normal"
    };
    this.status.setText(t("queue.foundLive"));
    if (this.cancelBtn && this.cancelBtn.bg) this.cancelBtn.bg.setVisible(false);
    if (this.cancelBtn && this.cancelBtn.text) this.cancelBtn.text.setVisible(false);
    if (this.cancelBtn && this.cancelBtn.gfx) this.cancelBtn.gfx.setVisible(false);

    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x3a2418, 0.38).setDepth(30).setInteractive();
    const panel = this.add.graphics().setDepth(31);
    panel.fillStyle(0xfff6ea, 0.97);
    panel.fillRoundedRect(W / 2 - 280, H / 2 - 220, 560, 440, 28);
    panel.lineStyle(4, 0x7d5cff, 0.9);
    panel.strokeRoundedRect(W / 2 - 280, H / 2 - 220, 560, 440, 28);
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
    const yes = makeButton(this, W / 2 - 110, H / 2 + 130, 180, 52, t("queue.accept"), () => {
      AudioSystem.ui();
      NetPlay.vote(msg.offerId, true);
      this.status.setText(t("queue.waitAccept"));
      yes.bg.disableInteractive();
      no.bg.disableInteractive();
    }, 0x3ad6ff);
    const no = makeButton(this, W / 2 + 110, H / 2 + 130, 180, 52, t("queue.decline"), () => {
      AudioSystem.ui();
      NetPlay.vote(msg.offerId, false);
      this.clearOffer();
      this.status.setText(t("queue.cooldown", { n: 5 }));
    }, 0xff8ab8);
    [yes.gfx, yes.text, yes.bg, no.gfx, no.text, no.bg].forEach((o) => o.setDepth(34));
    this.bits = [veil, panel, img, name, rankLine, wins, used, yes.gfx, yes.text, yes.bg, no.gfx, no.text, no.bg];
    if (badge) this.bits.push(badge);
  }

  update() {
    if (this.found) return;
    const elapsed = this.time.now - this.started;
    const win = searchWindow(elapsed);
    this.ring.clear();
    this.ring.lineStyle(3, 0x7d5cff, 0.45 + 0.25 * Math.sin(elapsed / 180));
    this.ring.strokeCircle(this.scale.width / 2, 280, 90 + 8 * Math.sin(elapsed / 220));
    this.windowText.setText(t("queue.window", { n: win }));
  }
}
