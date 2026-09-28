import { drawGrid, makeButton } from "../ui/Ui.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { SELECT_PLATE, drawOrbit, drawLock, paintHopFx } from "../fx/SelectHover.js";

const PLATE_R = 118;

export class SelectScene extends Phaser.Scene {
  constructor() { super("select"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    this.pvpMode = Session.mode === "pvp";
    this.exhibitMode = Session.mode === "exhibit";
    this.input.setTopOnly(true);
    drawGrid(this);
    const W = this.scale.width;
    this.pick = SaveSystem.isUnlocked(SaveSystem.data.starterId)
      ? SaveSystem.data.starterId
      : ROSTER_IDS.find((id) => SaveSystem.isUnlocked(id)) || SaveSystem.data.starterId;
    this.diff = "normal";
    this.cards = [];

    this.add.text(W / 2, 48, t(this.pvpMode ? "select.titlePvp" : this.exhibitMode ? "select.titleExhibit" : "select.title"), {
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
      const key = this.textures.exists("vis_select_" + id) ? "vis_select_" + id : "vis_" + id;

      const plate = this.add.circle(x, y, PLATE_R, SELECT_PLATE[id], 1)
        .setStrokeStyle(3, 0xfff6ea, 0.95)
        .setDepth(5);
      const orbit = this.add.graphics().setDepth(8);
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
        id, x, y, unlocked, plate, sprite, form, orbit, hopGfx, lockGfx,
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

    if (!this.pvpMode && !this.exhibitMode) {
      [
        ["easy", "select.botEasy"],
        ["normal", "select.botNormal"],
        ["hard", "select.botHard"]
      ].forEach(([d, key], i) => {
        makeButton(this, 420 + i * 220, 530, 180, 46, t(key), () => {
          this.diff = d;
          this.refreshPick();
          AudioSystem.ui();
        }, d === "hard" ? 0xff5a1f : 0x7d5cff);
      });
    } else {
      makeButton(this, W / 2, 530, 240, 46, t("queue.how"), () => {
        AudioSystem.ui();
        this.scene.start("rankinfo", { from: "select" });
      }, 0x3ad6ff);
    }

    makeButton(this, W / 2, 620, 280, 52, t(this.pvpMode ? "select.startPvp" : this.exhibitMode ? "select.startExhibit" : "select.start"), () => {
      if (!SaveSystem.isUnlocked(this.pick)) return;
      Session.playerId = this.pick;
      Session.youSide = Math.random() < 0.5 ? 1 : 2;
      AudioSystem.ui();
      if (this.pvpMode) {
        Session.mode = "pvp";
        this.scene.start("queue");
        return;
      }
      if (this.exhibitMode) {
        Session.mode = "exhibit";
        if (!Session.rival) {
          this.scene.start("friends", { pick: true });
          return;
        }
        Session.botId = Session.rival.fighter;
        this.scene.start("luck");
        return;
      }
      Session.mode = "bot";
      Session.rival = null;
      const lockedPool = ROSTER_IDS.filter((id) => id !== this.pick);
      Session.botId = Phaser.Utils.Array.GetRandom(lockedPool);
      Session.difficulty = this.diff;
      this.scene.start("luck");
    });

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
    } else {
      this.pickText.setText(t("select.pick", {
        name: I18n.charName(this.pick),
        diff: t("select.diff" + this.diff[0].toUpperCase() + this.diff.slice(1))
      }));
    }
    this.cards.forEach((card) => {
      const selected = this.isActiveCard(card);
      card.plate.setStrokeStyle(selected ? 6 : 3, selected ? card.main : 0xfff6ea, selected ? 1 : 0.95);
      if (selected) this.hopOnce(card);
      else this.stopHop(card);
    });
  }

  update(_t, now) {
    this.cards.forEach((card) => {
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
