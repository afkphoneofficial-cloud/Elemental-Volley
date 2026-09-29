import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { FREE_AVATARS, avatarKey, avatarLabel } from "../data/avatars.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { formatMatchClock } from "../gameplay/MatchStats.js";
import { medalFromMmr, isCalibrating, badgeKey, RANK_CAL_GAMES, displayBadgeId } from "../data/ranks.js";
import { Leaderboard } from "../systems/Leaderboard.js";

export class CareerScene extends Phaser.Scene {
  constructor() { super("career"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const c = SaveSystem.data.career;
    const log = SaveSystem.data.matchLog || [];
    this.pickerBits = [];

    this.add.text(W / 2, 36, t("career.title"), {
      fontFamily: UI_FONT, fontSize: "32px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    roundPanel(this, W / 2, 148, 640, 150, 0xff8a3a, 0xfff6ea);
    const avId = SaveSystem.data.avatarId;
    const key = this.textures.exists(avatarKey(avId)) ? avatarKey(avId) : avatarKey("av01");
    this.avImg = this.add.image(W / 2 - 210, 148, key).setDisplaySize(112, 112).setDepth(8);
    this.add.circle(W / 2 - 210, 148, 58, 0x000000, 0).setStrokeStyle(4, 0xc45a16, 0.85).setDepth(9);
    this.add.text(W / 2 - 120, 118, AuthSystem.displayName(), {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0, 0.5).setDepth(8);
    this.avName = this.add.text(W / 2 - 120, 152, avatarLabel(avId, I18n.lang), {
      fontFamily: UI_FONT, fontSize: "15px", color: "#7a4a30"
    }).setOrigin(0, 0.5).setDepth(8);
    const rk = SaveSystem.data.rank;
    const medal = medalFromMmr(rk.mmr);
    const rankLab = isCalibrating(rk)
      ? t("rank.calShort", { n: rk.games, max: RANK_CAL_GAMES })
      : t("rank.chip", { name: t("rank.tier." + medal.id), star: medal.star || "" });
    this.add.text(W / 2 - 120, 178, rankLab, {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0, 0.5).setDepth(8);
    const shown = displayBadgeId(rk);
    if (this.textures.exists(badgeKey(shown))) {
      this.add.image(W / 2 - 148, 178, badgeKey(shown)).setDisplaySize(28, 28).setDepth(8);
    }
    makeButton(this, W / 2 + 170, 168, 220, 40, t("career.change"), () => {
      AudioSystem.ui();
      this.openPicker();
    }, 0x7d5cff);

    roundPanel(this, W / 2, 268, 1100, 72, 0xff8a3a, 0xfff6ea);
    this.add.text(W / 2, 268,
      t("career.totals", {
        m: c.matches,
        w: c.wins,
        l: c.losses,
        aces: c.aces,
        ults: c.ults,
        time: formatMatchClock(c.playMs),
        streak: c.bestStreak,
        rally: c.longestRally
      }),
      { fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#3a2418", align: "center", wordWrap: { width: 1040 } }
    ).setOrigin(0.5).setDepth(6);

    this.add.text(W / 2, 322, t("career.logHead", { n: Math.min(log.length, ECONOMY.matchLogMax) }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5);

    if (!log.length) {
      this.add.text(W / 2, 430, t("career.empty"), {
        fontFamily: UI_FONT, fontSize: "18px", color: "#7a4a30"
      }).setOrigin(0.5);
    } else {
      log.slice(0, 6).forEach((row, i) => {
        const y = 356 + i * 38;
        const line = t("career.row", {
          result: row.win ? t("career.win") : t("career.lose"),
          you: charName(row.you),
          foe: row.foeName || charName(row.foe),
          a: row.youScore,
          b: row.foeScore,
          mode: row.mode === "pvp" ? t("career.pvp") : row.mode === "exhibit" ? t("career.exhibit") : t("career.bot")
        });
        this.add.text(W / 2, y, line, {
          fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: row.win ? "#2a7a38" : "#7a4a30"
        }).setOrigin(0.5);
      });
      if (log.length > 6) {
        this.add.text(W / 2, 356 + 6 * 38, t("career.more", { n: log.length - 6 }), {
          fontFamily: UI_FONT, fontSize: "14px", color: "#8a5a38"
        }).setOrigin(0.5);
      }
    }

    makeButton(this, 120, 36, 140, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    makeButton(this, W - 360, 36, 180, 40, t("career.board"), () => Leaderboard.show(), 0xffb14a);
    makeButton(this, W - 150, 36, 200, 40, t("career.howRank"), () => this.scene.start("rankinfo", { from: "career" }), 0x3ad6ff);
    AudioSystem.playMenu();
  }

  openPicker() {
    if (this.pickerOn) return;
    this.pickerOn = true;
    const W = this.scale.width;
    const H = this.scale.height;
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x12080e, 0.55).setDepth(40).setInteractive();
    const panel = this.add.graphics().setDepth(41);
    panel.fillStyle(0xfff6ea, 0.98);
    panel.fillRoundedRect(W / 2 - 430, 70, 860, 560, 24);
    panel.lineStyle(3, 0xc45a16, 0.8);
    panel.strokeRoundedRect(W / 2 - 430, 70, 860, 560, 24);
    const title = this.add.text(W / 2, 98, t("career.pickTitle"), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(42);
    const note = this.add.text(W / 2, 128, t("career.freeNote"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(42);
    this.pickerBits.push(dim, panel, title, note);

    FREE_AVATARS.forEach((a, i) => {
      const col = i % 5;
      const row = (i / 5) | 0;
      const x = W / 2 - 320 + col * 160;
      const y = 210 + row * 96;
      const key = this.textures.exists(avatarKey(a.id)) ? avatarKey(a.id) : "av-art-" + a.id;
      const img = this.add.image(x, y, this.textures.exists(key) ? key : avatarKey("av01"))
        .setDisplaySize(72, 72)
        .setDepth(43)
        .setInteractive({ useHandCursor: true });
      const ring = this.add.circle(x, y, 38, 0x000000, 0).setDepth(44);
      const paint = () => {
        const on = SaveSystem.data.avatarId === a.id;
        ring.setStrokeStyle(on ? 4 : 2, on ? 0xff6a22 : 0xc45a16, on ? 1 : 0.45);
      };
      paint();
      img.on("pointerdown", () => {
        SaveSystem.equipAvatar(a.id);
        AudioSystem.ui();
        this.refreshAvatar();
        this.pickerBits.forEach((b) => {
          if (b && b.paint) b.paint();
        });
      });
      img.aid = a.id;
      img.paint = paint;
      this.pickerBits.push(img, ring);
      ring.aid = a.id;
      ring.paint = paint;
    });

    const close = makeButton(this, W / 2, 590, 200, 42, t("career.close"), () => {
      AudioSystem.ui();
      this.closePicker();
    }, 0xff6a22);
    this.pickerBits.push(close.bg, close.text, close.gfx);
  }

  closePicker() {
    this.pickerBits.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.pickerBits = [];
    this.pickerOn = false;
  }

  refreshAvatar() {
    const avId = SaveSystem.data.avatarId;
    const key = this.textures.exists(avatarKey(avId)) ? avatarKey(avId) : avatarKey("av01");
    if (this.avImg) this.avImg.setTexture(key);
    if (this.avName) this.avName.setText(avatarLabel(avId, I18n.lang));
  }
}
