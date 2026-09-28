import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { medalFromMmr, searchWindow, badgeKey, isCalibrating, RANK_CAL_GAMES } from "../data/ranks.js";
import { Matchmaking, makeIslandRival } from "../systems/Matchmaking.js";
import { avatarKey } from "../data/avatars.js";

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
    this.busy = false;
    this.pollAt = 0;

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
    this.youRank = this.add.text(W / 2, 390, isCalibrating(rank)
      ? t("rank.calShort", { n: rank.games, max: RANK_CAL_GAMES })
      : t("rank.chip", { name: t("rank.tier." + youMedal.id), star: youMedal.star || "" }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    this.ring = this.add.graphics();
    this.foundBox = [];

    Matchmaking.enterQueue({
      mmr: rank.mmr,
      fighter: Session.playerId,
      avatar: SaveSystem.data.avatarId
    });
    this.events.once("shutdown", () => Matchmaking.leaveQueue());

    makeButton(this, 120, 48, 140, 40, t("queue.cancel"), () => {
      AudioSystem.ui();
      this.scene.start("select");
    }, 0x7d5cff);
    makeButton(this, W - 140, 48, 180, 40, t("queue.how"), () => {
      AudioSystem.ui();
      this.scene.start("rankinfo", { from: "select" });
    }, 0xffb14a);
  }

  update(_t, now) {
    if (this.found) return;
    const elapsed = this.time.now - this.started;
    const win = searchWindow(elapsed);
    this.ring.clear();
    this.ring.lineStyle(3, 0x7d5cff, 0.45 + 0.25 * Math.sin(elapsed / 180));
    this.ring.strokeCircle(this.scale.width / 2, 280, 90 + 8 * Math.sin(elapsed / 220));
    this.windowText.setText(t("queue.window", { n: win }));
    if (this.time.now < this.pollAt) return;
    this.pollAt = this.time.now + 900;
    this.tryMatch(elapsed, win);
  }

  async tryMatch(elapsed, win) {
    if (this.found || this.busy) return;
    this.busy = true;
    const mmr = SaveSystem.data.rank.mmr | 0;
    let rival = await Matchmaking.pollLive(mmr, win, elapsed);
    const giveUp = elapsed >= 10000;
    if (!rival && giveUp) {
      rival = makeIslandRival(mmr, Session.playerId, win, (Date.now() / 80) | 0);
    }
    this.busy = false;
    if (!rival || this.found) return;
    this.lockRival(rival);
  }

  lockRival(rival) {
    if (this.found) return;
    if (!SaveSystem.spendEther(ECONOMY.etherCostPvp)) {
      this.status.setText(t("queue.noEther"));
      this.time.delayedCall(900, () => this.scene.start("hub"));
      return;
    }
    this.found = true;
    Session.mode = "pvp";
    Session.rival = rival;
    Session.botId = rival.fighter;
    Session.difficulty = rival.difficulty;
    Session.youSide = Math.random() < 0.5 ? 1 : 2;
    AudioSystem.ui();
    this.status.setText(rival.live ? t("queue.foundLive") : t("queue.foundIsle"));
    const W = this.scale.width;
    const medal = medalFromMmr(rival.mmr);
    const av = this.textures.exists(avatarKey(rival.avatarId)) ? avatarKey(rival.avatarId) : avatarKey("av01");
    this.add.image(W / 2 + 220, 268, av).setDisplaySize(96, 96);
    if (this.textures.exists(badgeKey(medal.id))) {
      this.add.image(W / 2 + 220, 360, badgeKey(medal.id)).setDisplaySize(48, 48);
    }
    this.add.text(W / 2 + 220, 400, rivalLabel(rival), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2 + 220, 428, t("rank.chip", { name: t("rank.tier." + medal.id), star: medal.star || "" }), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5);
    this.time.delayedCall(1200, () => this.scene.start("luck"));
  }
}
