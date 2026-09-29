import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { SELECT_PLATE, drawOrbit, drawLock, paintHopFx } from "../fx/SelectHover.js";
import { texSelect } from "../data/skins.js";
import { paintSkinAura } from "../fx/SkinAura.js";
import { botSheet, STAT_IDS, GROWTH_SPECIAL_LV } from "../data/growth.js";
import { isRankWindowOpen } from "../data/rankWindows.js";

const PLATE_R = 118;

export class SelectScene extends Phaser.Scene {
  constructor() { super("select"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    this.pvpMode = Session.mode === "pvp";
    this.exhibitMode = Session.mode === "exhibit";
    this.specialMode = Session.mode === "special";
    if ((this.pvpMode && !isRankWindowOpen("pvp")) || (this.specialMode && !isRankWindowOpen("special"))) {
      this.scene.start("mode");
      return;
    }
    this.input.setTopOnly(true);
    drawGrid(this);
    const W = this.scale.width;
    this.pick = SaveSystem.isUnlocked(SaveSystem.data.starterId)
      ? SaveSystem.data.starterId
      : ROSTER_IDS.find((id) => SaveSystem.isUnlocked(id)) || SaveSystem.data.starterId;
    this.diff = "normal";
    this.cards = [];

    this.add.text(W / 2, 48, t(this.pvpMode ? "select.titlePvp" : this.exhibitMode ? "select.titleExhibit" : this.specialMode ? "select.titleSpecial" : "select.titleExplore"), {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "28px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5);

    try {
      this.hopSpark = this.add.particles(0, 0, "dot", {
        lifespan: { min: 260, max: 560 },
        speed: { min: 40, max: 240 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 110,
        blendMode: "ADD",
        emitting: false
      });
      this.hopSpark.setDepth(12);
      if (this.hopSpark.disableInteractive) this.hopSpark.disableInteractive();
    } catch (e) {
      this.hopSpark = null;
    }

    ROSTER_IDS.forEach((id, i) => {
      const data = ROSTER[id];
      const x = 190 + i * 300;
      const y = 262;
      const unlocked = SaveSystem.isUnlocked(id);
      const key = texSelect(this, id, SaveSystem.skinOf(id));

      const plate = this.add.circle(x, y, PLATE_R, SELECT_PLATE[id], 1)
        .setStrokeStyle(3, 0xfff6ea, 0.95)
        .setDepth(5);
      const orbit = this.add.graphics().setDepth(8);
      const aura = this.add.graphics().setDepth(7);
      const hopGfx = this.add.graphics().setDepth(9);
      const sprite = this.add.image(x, y + 8, key)
        .setDisplaySize(148, 148)
        .setAlpha(unlocked ? 1 : 0.28)
        .setDepth(10);
      const form = this.add.image(x, y, "jump-fire").setDepth(11).setVisible(false);
      if (form.disableInteractive) form.disableInteractive();
      const lockGfx = this.add.graphics().setDepth(13);
      if (!unlocked) drawLock(lockGfx, x, y);

      this.add.text(x, y + 142, I18n.charName(id), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "22px", fontStyle: "800",
        color: unlocked ? "#3a2418" : "#8a7a90"
      }).setOrigin(0.5);
      this.add.text(x, y + 168, unlocked ? t("select.ready") : t("select.locked"), {
        fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "14px",
        color: unlocked ? "#2a7a38" : "#c45a2a"
      }).setOrigin(0.5);

      const card = {
        id, x, y, unlocked, plate, sprite, form, orbit, aura, hopGfx, lockGfx,
        hopping: false, landY: y + 8, main: data.colors.main
      };
      this.cards.push(card);

      if (unlocked) {
        plate.setInteractive({ useHandCursor: true });
        plate.on("pointerdown", () => {
          if (this.pick === id) return;
          this.pick = id;
          this.refreshPick();
          AudioSystem.ui();
        });
      }
    });

    this.pickText = this.add.text(W / 2, 470, "", {
      fontFamily: "Segoe UI, Kanit, sans-serif", fontSize: "16px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(20);
    this.refreshPick();

    if (this.pvpMode || this.exhibitMode || this.specialMode) {
      makeButton(this, W / 2, 530, 240, 46, t("queue.how"), () => {
        AudioSystem.ui();
        this.scene.start("rankinfo", { from: "select", tab: "rules" });
      }, 0x3ad6ff);
      makeButton(this, W / 2, 620, 280, 52, t(this.pvpMode ? "select.startPvp" : this.exhibitMode ? "select.startExhibit" : "select.startSpecial"), () => {
        if (!SaveSystem.isUnlocked(this.pick)) return;
        Session.playerId = this.pick;
        Session.youSkin = SaveSystem.skinOf(this.pick);
        Session.youSide = Math.random() < 0.5 ? 1 : 2;
        AudioSystem.ui();
        if (this.pvpMode) {
          Session.mode = "pvp";
          this.scene.start("queue");
          return;
        }
        if (this.exhibitMode) {
          Session.mode = "exhibit";
          if (!Session.rival || !Session.exhibitFriendId) {
            this.scene.start("friends", { pick: true });
            return;
          }
          this.scene.start("queue");
          return;
        }
        Session.mode = "special";
        const lv = SaveSystem.growthOf(this.pick).level;
        if (lv < GROWTH_SPECIAL_LV) {
          this.pickText.setText(t("growth.specialNeed", { n: GROWTH_SPECIAL_LV }));
          return;
        }
        this.pickText.setText(t("growth.specialSoon"));
      });
    } else {
      makeButton(this, W / 2, 560, 360, 52, t("select.explore"), () => {
        if (!SaveSystem.isUnlocked(this.pick)) return;
        Session.playerId = this.pick;
        Session.youSkin = SaveSystem.skinOf(this.pick);
        Session.mode = "bot";
        AudioSystem.ui();
        this.scene.start("explore", { from: "select" });
      }, 0xffb14a);
    }

    makeButton(this, 120, 48, 140, 40, t("nav.back"), () => this.scene.start("mode"), 0x7d5cff);
  }

  isActiveCard(card) {
    return card.unlocked && card.id === this.pick;
  }

  stopHop(card) {
    this.tweens.killTweensOf(card.sprite);
    card.hopping = false;
    card.sprite.y = card.landY;
    card.orbit.clear();
    paintHopFx(card.hopGfx, card.form, null, card.x, card.sprite.y, card.landY, card.id, 0, 130, false);
  }

  hopOnce(card) {
    if (!this.isActiveCard(card) || card.hopping) return;
    card.hopping = true;
    this.tweens.add({
      targets: card.sprite,
      y: card.landY - 16,
      duration: 150,
      yoyo: true,
      ease: "Sine.easeOut",
      hold: 30,
      onComplete: () => {
        card.hopping = false;
        card.sprite.y = card.landY;
        if (this.isActiveCard(card)) this.time.delayedCall(90, () => this.hopOnce(card));
      }
    });
  }

  refreshPick() {
    if (this.pvpMode) {
      this.pickText.setText(t("select.pickPvp", { name: I18n.charName(this.pick) }));
    } else if (this.exhibitMode) {
      this.pickText.setText(t("select.pickExhibit", { name: I18n.charName(this.pick) }));
    } else if (this.specialMode) {
      this.pickText.setText(t("select.pickSpecial", {
        name: I18n.charName(this.pick),
        n: SaveSystem.growthOf(this.pick).level
      }));
    } else {
      this.pickText.setText(t("select.pickExplore", { name: I18n.charName(this.pick) }));
    }
    this.cards.forEach((card) => {
      const selected = this.isActiveCard(card);
      card.plate.setStrokeStyle(selected ? 6 : 3, selected ? card.main : 0xfff6ea, selected ? 1 : 0.95);
      if (selected) this.hopOnce(card);
      else this.stopHop(card);
    });
  }

  closeScout() {
    (this.scoutBits || []).forEach((o) => { try { o.destroy(); } catch (e) {} });
    this.scoutBits = [];
  }

  openScout() {
    this.closeScout();
    const W = this.scale.width;
    const H = this.scale.height;
    const you = SaveSystem.growthOf(this.pick);
    const foe = Session.botSheet;
    const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x3a2418, 0.5).setDepth(40).setInteractive();
    const panel = this.add.graphics().setDepth(41);
    panel.fillStyle(0xfff6ea, 0.98);
    panel.fillRoundedRect(W / 2 - 400, 70, 800, 560, 28);
    panel.lineStyle(4, 0xffb14a, 0.95);
    panel.strokeRoundedRect(W / 2 - 400, 70, 800, 560, 28);
    const title = this.add.text(W / 2, 100, t("growth.scoutTitle"), {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(42);
    const youHead = this.add.text(W / 2 - 180, 148, t("growth.scoutYou") + " · " + charName(this.pick), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#2a7a18"
    }).setOrigin(0.5).setDepth(42);
    const foeHead = this.add.text(W / 2 + 180, 148, t("growth.scoutFoe") + " · " + charName(Session.botId), {
      fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5).setDepth(42);
    const youLv = this.add.text(W / 2 - 180, 178, t("growth.level", { n: you.level, max: 50 }), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(42);
    const foeLv = this.add.text(W / 2 + 180, 178, t("growth.level", { n: foe.level, max: 50 }), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(42);
    const lines = [];
    STAT_IDS.forEach((stat, i) => {
      const y = 230 + i * 52;
      lines.push(this.add.text(W / 2, y, t("growth.stat." + stat), {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
      }).setOrigin(0.5).setDepth(42));
      lines.push(this.add.text(W / 2 - 180, y, String(you.totals[stat]), {
        fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#2a7a18"
      }).setOrigin(0.5).setDepth(42));
      lines.push(this.add.text(W / 2 + 180, y, String(foe.totals[stat]), {
        fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#c45a16"
      }).setOrigin(0.5).setDepth(42));
    });
    const go = makeButton(this, W / 2 + 140, 560, 200, 48, t("growth.scoutGo"), () => {
      this.closeScout();
      this.scene.start("luck");
    }, 0xffb14a, 43);
    const back = makeButton(this, W / 2 - 140, 560, 200, 48, t("growth.scoutBack"), () => {
      this.closeScout();
    }, 0x7d5cff, 43);
    this.scoutBits = [veil, panel, title, youHead, foeHead, youLv, foeLv, ...lines, go.gfx, go.text, go.bg, back.gfx, back.text, back.bg];
  }

  update(_t, now) {
    this.cards.forEach((card) => {
      if (card.aura) {
        if (card.unlocked) paintSkinAura(card.aura, card.x, card.sprite.y, card.id, SaveSystem.skinOf(card.id), now, 78);
        else card.aura.clear();
      }
      if (!this.isActiveCard(card)) return;
      card.orbit.clear();
      drawOrbit(card.orbit, card.x, card.y, PLATE_R + 6, now, card.id);
      const rising = card.sprite.y < card.landY - 2;
      paintHopFx(
        card.hopGfx, card.form, this.hopSpark,
        card.x, card.sprite.y, card.landY, card.id, now, 130, rising
      );
    });
  }
}
