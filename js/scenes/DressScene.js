import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { ROSTER_IDS } from "../data/roster.js";
import { SKIN_TIERS, skinTier, skinNeedLv, texSelect, texFace } from "../data/skins.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n, charName } from "../i18n/I18n.js?v=local271";
import { SELECT_PLATE, drawOrbit, paintHopFx } from "../fx/SelectHover.js";
import { paintSkinAura } from "../fx/SkinAura.js";
import { ArtLoad } from "../systems/ArtLoad.js?v=local273";

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
    this.heroY = 292;

    makeButton(this, 96, 40, 132, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    this.add.text(W / 2, 36, t("dress.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 68, t("dress.sub"), {
      fontFamily: UI_FONT, fontSize: "14px", color: "#7a4a30"
    }).setOrigin(0.5);

    ROSTER_IDS.forEach((id, i) => {
      const x = W / 2 - 240 + i * 160;
      makeButton(this, x, 108, 140, 40, charName(id), () => {
        this.charId = id;
        this.tier = SaveSystem.skinOf(id);
        this.view = "f";
        this.refresh();
        AudioSystem.ui();
        void ArtLoad.ensureSkinSet(this, id).then(() => {
          if (this.sys && this.sys.isActive() && this.charId === id) this.refresh();
        });
      }, SaveSystem.isUnlocked(id) ? 0xffb14a : 0xc8bdd8);
    });

    this.plate = this.add.circle(W / 2, this.heroY, 128, SELECT_PLATE.ignis, 1)
      .setStrokeStyle(4, 0xfff6ea, 0.95).setDepth(5);
    this.orbit = this.add.graphics().setDepth(8);
    this.auraGfx = this.add.graphics().setDepth(7);
    this.hopGfx = this.add.graphics().setDepth(9);
    this.hero = this.add.image(W / 2, this.heroY + 8, "vis_select_ignis").setDisplaySize(248, 248).setDepth(10);
    this.sideL = this.add.image(W / 2 - 278, this.heroY, "vis_ignis_l").setDisplaySize(128, 128).setDepth(10).setInteractive({ useHandCursor: true });
    this.sideR = this.add.image(W / 2 + 278, this.heroY, "vis_ignis_r").setDisplaySize(128, 128).setDepth(10).setInteractive({ useHandCursor: true });
    this.sideL.on("pointerdown", () => { this.view = "l"; this.refresh(); this.hop(); AudioSystem.ui(); });
    this.sideR.on("pointerdown", () => { this.view = "r"; this.refresh(); this.hop(); AudioSystem.ui(); });
    this.add.text(W / 2 - 278, this.heroY + 78, t("dress.viewL"), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);
    this.add.text(W / 2, this.heroY + 142, t("dress.viewF"), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);
    this.add.text(W / 2 + 278, this.heroY + 78, t("dress.viewR"), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5);
    this.form = this.add.image(W / 2, this.heroY, "jump-fire").setDepth(11).setVisible(false);
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

    this.nameLab = this.add.text(W / 2, 456, "", {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.tierLab = this.add.text(W / 2, 482, "", {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5);

    this.outfitBits = SKIN_TIERS.map((row, i) => {
      const x = W / 2 - 464 + i * 232;
      const y = 572;
      const g = this.add.graphics().setDepth(6);
      const img = this.add.image(x, y - 6, "vis_select_ignis").setDisplaySize(78, 78).setDepth(7);
      const lab = this.add.text(x, y + 44, "", {
        fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#3a2418"
      }).setOrigin(0.5).setDepth(8);
      const need = this.add.text(x, y + 62, "", {
        fontFamily: UI_FONT, fontSize: "12px", fontStyle: "700", color: "#7a4a30"
      }).setOrigin(0.5).setDepth(8);
      const lock = this.add.graphics().setDepth(9);
      const zone = this.add.zone(x, y, 212, 118).setInteractive({ useHandCursor: true }).setDepth(10);
      zone.on("pointerdown", () => {
        this.tier = row.id;
        this.view = "f";
        this.refresh();
        this.hop();
        AudioSystem.ui();
      });
      return { x, y, g, img, lab, need, lock, row };
    });

    this.wearBtn = makeButton(this, W / 2, 684, 280, 46, t("dress.wear"), () => {
      if (!SaveSystem.isUnlocked(this.charId)) {
        AudioSystem.error();
        return;
      }
      if (!SaveSystem.skinOpen(this.charId, this.tier)) {
        AudioSystem.error();
        this.tierLab.setText(t("dress.needLv", { n: skinNeedLv(this.tier) }));
        return;
      }
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
    void ArtLoad.ensureSkinSet(this, this.charId).then(() => {
      if (this.sys && this.sys.isActive()) this.refresh();
    });
  }

  hop() {
    if (this.hopping || !this.hero) return;
    this.hopping = true;
    const land = this.heroY + 8;
    this.tweens.add({
      targets: this.hero,
      y: land - 76,
      duration: 160,
      yoyo: true,
      ease: "Quad.easeOut",
      onUpdate: () => {
        const rising = this.hero.y < land - 8;
        paintHopFx(this.hopGfx, this.form, this.hopSpark, this.hero.x, this.hero.y, 400, this.charId, this.time.now, 180, rising);
        this.hero.setAlpha(rising ? 0 : 1);
      },
      onComplete: () => {
        this.hopping = false;
        this.hero.y = land;
        this.hero.setAlpha(1);
        paintHopFx(this.hopGfx, this.form, this.hopSpark, this.hero.x, this.hero.y, 400, this.charId, this.time.now, 180, false);
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
    const open = SaveSystem.skinOpen(id, this.tier);
    const bagOn = Boolean(SaveSystem.outfitIdOf(id));
    this.hero.setTexture(this.previewKey()).setDisplaySize(248, 248);
    if (this.sideL) this.sideL.setTexture(texFace(this, id, 2, this.tier)).setDisplaySize(128, 128);
    if (this.sideR) this.sideR.setTexture(texFace(this, id, 1, this.tier)).setDisplaySize(128, 128);
    this.plate.setFillStyle(SELECT_PLATE[id] || 0xffb14a, 1);
    this.nameLab.setText(charName(id));
    this.tierLab.setText(bagOn
      ? t("dress.bagOn")
      : t("dress.tierLine", { n: this.tier, name: I18n.lang === "en" ? row.en : row.th }));
    const worn = !bagOn && SaveSystem.skinOf(id) === this.tier;
    if (this.wearBtn && this.wearBtn.text) {
      if (!SaveSystem.isUnlocked(id)) this.wearBtn.text.setText(t("dress.locked"));
      else if (!open) this.wearBtn.text.setText(t("dress.needLv", { n: skinNeedLv(this.tier) }));
      else this.wearBtn.text.setText(worn ? t("dress.using") : t("dress.wear"));
    }
    (this.outfitBits || []).forEach((slot) => {
      const n = slot.row.id;
      const on = this.tier === n;
      const can = SaveSystem.skinOpen(id, n);
      const using = !bagOn && SaveSystem.skinOf(id) === n;
      slot.g.clear();
      slot.g.fillStyle(on ? 0xffe8c8 : 0xfff6ea, 0.96);
      slot.g.fillRoundedRect(slot.x - 106, slot.y - 56, 212, 118, 18);
      slot.g.lineStyle(3, on ? 0xff6a22 : 0xffd6a8, on ? 1 : 0.9);
      slot.g.strokeRoundedRect(slot.x - 106, slot.y - 56, 212, 118, 18);
      slot.img.setTexture(texSelect(this, id, n)).setDisplaySize(78, 78).setAlpha(can ? 1 : 0.42);
      slot.lab.setText(t("dress.tier", { n }) + (using ? "  ●" : ""));
      slot.need.setText(t("dress.unlockLv", { n: skinNeedLv(n) }));
      slot.need.setColor(can ? "#2a7a38" : "#c45a16");
      slot.lock.clear();
      if (!can) {
        slot.lock.fillStyle(0xfff6ea, 0.95);
        slot.lock.fillCircle(slot.x + 78, slot.y - 22, 14);
        slot.lock.lineStyle(2, 0x3a2418, 0.85);
        slot.lock.strokeCircle(slot.x + 78, slot.y - 22, 14);
        slot.lock.beginPath();
        slot.lock.arc(slot.x + 78, slot.y - 28, 6, Math.PI * 1.05, -0.05, false);
        slot.lock.strokePath();
      }
    });
  }

  update(now) {
    if (!this.orbit) return;
    this.orbit.clear();
    drawOrbit(this.orbit, this.hero.x, this.heroY, 118, now, this.charId);
    paintSkinAura(this.auraGfx, this.hero.x, this.hero.y, this.charId, this.tier, now, 108);
  }
}
