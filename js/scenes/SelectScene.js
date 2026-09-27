import { drawGrid, makeButton } from "../ui/Ui.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { Session } from "../systems/Session.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { SELECT_PLATE, drawOrbit, drawLock, paintHopFx } from "../fx/SelectHover.js";

const PLATE_R = 118;

export class SelectScene extends Phaser.Scene {
  constructor() { super("select"); }

  create() {
    this.input.setTopOnly(false);
    drawGrid(this);
    const W = this.scale.width;
    this.pick = SaveSystem.data.starterId;
    this.diff = "normal";
    this.cards = [];

    this.add.text(W / 2, 48, t("select.title"), {
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
      const hit = this.add.circle(x, y, PLATE_R, 0x000000, 0.001).setDepth(15);
      const orbit = this.add.graphics().setDepth(8);
      const hopGfx = this.add.graphics().setDepth(9);
      const sprite = this.add.image(x, y + 8, key)
        .setDisplaySize(148, 148)
        .setAlpha(unlocked ? 1 : 0.28)
        .setDepth(10);
      const form = this.add.image(x, y, "jump-fire").setDepth(11).setVisible(false);
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
        hover: false, hopping: false, landY: y + 8, main: data.colors.main
      };
      this.cards.push(card);

      hit.setInteractive({
        hitArea: new Phaser.Geom.Circle(0, 0, PLATE_R),
        hitAreaCallback: Phaser.Geom.Circle.Contains,
        useHandCursor: unlocked
      });
      hit.on("pointerover", () => {
        if (!unlocked) return;
        card.hover = true;
        this.hopOnce(card);
      });
      hit.on("pointerout", () => {
        card.hover = false;
        card.orbit.clear();
        paintHopFx(card.hopGfx, card.form, null, card.x, card.sprite.y, card.landY, card.id, 0, 130, false);
        this.tweens.killTweensOf(card.sprite);
        card.hopping = false;
        card.sprite.y = card.landY;
      });
      if (unlocked) {
        hit.on("pointerdown", () => {
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

    makeButton(this, W / 2, 620, 280, 52, t("select.start"), () => {
      if (!SaveSystem.isUnlocked(this.pick)) return;
      Session.playerId = this.pick;
      const lockedPool = ROSTER_IDS.filter((id) => id !== this.pick);
      Session.botId = Phaser.Utils.Array.GetRandom(lockedPool);
      Session.difficulty = this.diff;
      Session.youSide = Math.random() < 0.5 ? 1 : 2;
      AudioSystem.ui();
      this.scene.start("luck");
    });

    makeButton(this, 120, 48, 140, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
  }

  hopOnce(card) {
    if (!card.hover || !card.unlocked || card.hopping) return;
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
        if (card.hover) this.time.delayedCall(90, () => this.hopOnce(card));
      }
    });
  }

  refreshPick() {
    this.pickText.setText(t("select.pick", {
      name: I18n.charName(this.pick),
      diff: t("select.diff" + this.diff[0].toUpperCase() + this.diff.slice(1))
    }));
    this.cards.forEach((card) => {
      const selected = card.id === this.pick;
      card.plate.setStrokeStyle(selected ? 6 : 3, selected ? card.main : 0xfff6ea, selected ? 1 : 0.95);
    });
  }

  update(_t, now) {
    this.cards.forEach((card) => {
      if (card.hover && card.unlocked) {
        card.orbit.clear();
        drawOrbit(card.orbit, card.x, card.y, PLATE_R + 6, now, card.id);
        const rising = card.sprite.y < card.landY - 2;
        paintHopFx(
          card.hopGfx, card.form, this.hopSpark,
          card.x, card.sprite.y, card.landY, card.id, now, 130, rising
        );
      }
    });
  }
}
