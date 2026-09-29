import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ROSTER_IDS } from "../data/roster.js";
import { SKIN_TIERS, SKIN_PIECES, skinTier, texSelect, texFace } from "../data/skins.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js";
import { SELECT_PLATE, drawOrbit, paintHopFx } from "../fx/SelectHover.js";

export class DressScene extends Phaser.Scene {
  constructor() { super("dress"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    this.charId = SaveSystem.data.showcaseId || SaveSystem.data.starterId || "ignis";
    this.tier = SaveSystem.skinOf(this.charId);
    this.hopping = false;
    this.view = "f";

    this.add.text(W / 2, 36, t("dress.title"), {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 68, t("dress.sub"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5);

    makeButton(this, 120, 40, 140, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);

    ROSTER_IDS.forEach((id, i) => {
      const x = W / 2 - 240 + i * 160;
      makeButton(this, x, 118, 140, 40, charName(id), () => {
        this.charId = id;
        this.tier = SaveSystem.skinOf(id);
        this.view = "f";
        this.refresh();
        AudioSystem.ui();
      }, SaveSystem.isUnlocked(id) ? 0xffb14a : 0xc8bdd8);
    });

    this.plate = this.add.circle(W / 2, 318, 132, SELECT_PLATE.ignis, 1)
      .setStrokeStyle(4, 0xfff6ea, 0.95).setDepth(5);
    this.orbit = this.add.graphics().setDepth(8);
    this.hopGfx = this.add.graphics().setDepth(9);
    this.hero = this.add.image(W / 2, 326, "vis_select_ignis").setDisplaySize(236, 236).setDepth(10);
    this.sideL = this.add.image(W / 2 - 268, 318, "vis_ignis_l").setDisplaySize(118, 118).setDepth(10).setInteractive({ useHandCursor: true });
    this.sideR = this.add.image(W / 2 + 268, 318, "vis_ignis_r").setDisplaySize(118, 118).setDepth(10).setInteractive({ useHandCursor: true });
    this.sideL.on("pointerdown", () => { this.view = "l"; this.refresh(); this.hop(); AudioSystem.ui(); });
    this.sideR.on("pointerdown", () => { this.view = "r"; this.refresh(); this.hop(); AudioSystem.ui(); });
    this.add.text(W / 2 - 268, 392, t("dress.viewL"), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);
    this.add.text(W / 2, 448, t("dress.viewF"), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);
    this.add.text(W / 2 + 268, 392, t("dress.viewR"), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);
    this.form = this.add.image(W / 2, 318, "jump-fire").setDepth(11).setVisible(false);
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

    this.nameLab = this.add.text(W / 2, 478, "", {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.tierLab = this.add.text(W / 2, 504, "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5);

    this.slotBits = [];
    SKIN_PIECES.forEach((piece, i) => {
      const x = W / 2 - 195 + i * 130;
      const y = 548;
      const g = this.add.graphics().setDepth(6);
      const lab = this.add.text(x, y + 28, I18n.lang === "en" ? piece.en : piece.th, {
        fontFamily: UI_FONT, fontSize: "12px", fontStyle: "700", color: "#7a4a30"
      }).setOrigin(0.5).setDepth(7);
      this.slotBits.push({ x, y, g, lab, piece });
    });

    this.tierBtns = SKIN_TIERS.map((row, i) => {
      const x = 140 + i * 250;
      return makeButton(this, x, 628, 220, 44, "", () => {
        this.tier = row.id;
        this.view = "f";
        this.refresh();
        AudioSystem.ui();
      }, 0xffe08a);
    });

    this.wearBtn = makeButton(this, W / 2, 684, 280, 46, t("dress.wear"), () => {
      if (!SaveSystem.isUnlocked(this.charId)) return;
      SaveSystem.setSkin(this.charId, this.tier);
      AudioSystem.ui();
      this.refresh();
    }, 0xff6a22);

    this.hero.setInteractive({ useHandCursor: true });
    this.hero.on("pointerdown", () => {
      this.view = "f";
      this.refresh();
      this.hop();
    });
    this.time.addEvent({ delay: 2200, loop: true, callback: () => this.hop() });

    this.refresh();
    AudioSystem.playMenu();
  }

  hop() {
    if (this.hopping || !this.hero) return;
    this.hopping = true;
    const land = 326;
    this.tweens.add({
      targets: this.hero,
      y: 250,
      duration: 160,
      yoyo: true,
      ease: "Quad.easeOut",
      onUpdate: () => {
        const rising = this.hero.y < land - 8;
        paintHopFx(this.hopGfx, this.form, this.hopSpark, this.hero.x, this.hero.y, 430, this.charId, this.time.now, 180, rising);
        this.hero.setAlpha(rising ? 0 : 1);
      },
      onComplete: () => {
        this.hopping = false;
        this.hero.y = land;
        this.hero.setAlpha(1);
        paintHopFx(this.hopGfx, this.form, this.hopSpark, this.hero.x, this.hero.y, 430, this.charId, this.time.now, 180, false);
      }
    });
  }

  previewKey() {
    if (this.view === "l") return texFace(this, this.charId, 2, this.tier);
    if (this.view === "r") return texFace(this, this.charId, 1, this.tier);
    return texSelect(this, this.charId, this.tier);
  }

  refresh() {
    const id = this.charId;
    const row = skinTier(this.tier);
    this.hero.setTexture(this.previewKey()).setDisplaySize(236, 236);
    if (this.sideL) this.sideL.setTexture(texFace(this, id, 2, this.tier)).setDisplaySize(118, 118);
    if (this.sideR) this.sideR.setTexture(texFace(this, id, 1, this.tier)).setDisplaySize(118, 118);
    this.plate.setFillStyle(SELECT_PLATE[id] || 0xffb14a, 1);
    this.nameLab.setText(charName(id));
    this.tierLab.setText(t("dress.tierLine", { n: this.tier, name: I18n.lang === "en" ? row.en : row.th }));
    const worn = SaveSystem.skinOf(id) === this.tier;
    if (this.wearBtn && this.wearBtn.text) {
      if (!SaveSystem.isUnlocked(id)) this.wearBtn.text.setText(t("dress.locked"));
      else this.wearBtn.text.setText(worn ? t("dress.using") : t("dress.wear"));
    }
    this.slotBits.forEach((slot, i) => {
      const on = i < row.pieces;
      slot.g.clear();
      slot.g.fillStyle(on ? 0xffe08a : 0xfff6ea, 0.96);
      slot.g.fillRoundedRect(slot.x - 52, slot.y - 18, 104, 36, 14);
      slot.g.lineStyle(3, on ? 0xff8a3a : 0xffd6a8, 0.95);
      slot.g.strokeRoundedRect(slot.x - 52, slot.y - 18, 104, 36, 14);
      slot.lab.setColor(on ? "#3a2418" : "#b39880");
      slot.lab.setText(I18n.lang === "en" ? slot.piece.en : slot.piece.th);
    });
    this.tierBtns.forEach((btn, i) => {
      const n = i + 1;
      const on = this.tier === n;
      if (btn.text) btn.text.setText((on ? "● " : "") + t("dress.tier", { n }) + "  " + (I18n.lang === "en" ? SKIN_TIERS[i].en : SKIN_TIERS[i].th));
    });
  }

  update(now) {
    if (!this.orbit) return;
    this.orbit.clear();
    drawOrbit(this.orbit, this.hero.x, 318, 118, now, this.charId);
  }
}
