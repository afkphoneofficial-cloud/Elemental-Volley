import { makeButton, UI_FONT } from "./Ui.js";
import { ROSTER } from "../data/roster.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { SELECT_PLATE, drawOrbit, drawLock, paintHopFx } from "../fx/SelectHover.js";
import { texHeroSelect } from "../data/seasonLooks.js";
import { paintSkinAura } from "../fx/SkinAura.js";

export const CAROUSEL = {
  plateR: 118,
  small: 1 / 3,
  bigHalf: 136,
  smallSlot: 94
};

export class RosterCarousel {
  constructor(scene, opts) {
    this.scene = scene;
    this.cx = opts.x;
    this.cy = opts.y;
    this.ids = (opts.ids || []).slice();
    this.pick = opts.pick;
    this.onPick = opts.onPick || (() => {});
    this.spark = opts.spark || null;
    this.cards = [];
    this.depth = opts.depth || 6;

    this.strip = scene.add.container(0, 0).setDepth(this.depth);
    const W = scene.scale.width;
    this.maskG = null;

    this.ids.forEach((id) => this.spawnCard(id));

    this.nameText = scene.add.text(this.cx, this.cy + 148, "", {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "800", color: "#3a2418"
    }).setOrigin(0.5).setDepth(this.depth + 24);
    this.tagText = scene.add.text(this.cx, this.cy + 174, "", {
      fontFamily: UI_FONT, fontSize: "14px", color: "#2a7a38"
    }).setOrigin(0.5).setDepth(this.depth + 24);

    this.prevBtn = makeButton(scene, 56, this.cy, 56, 56, "‹", () => this.nudge(-1), 0x7d5cff, 40);
    this.nextBtn = makeButton(scene, W - 56, this.cy, 56, 56, "›", () => this.nudge(1), 0x7d5cff, 40);

    this._onWheel = (_p, _g, dx, dy) => {
      this.nudge(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? 1 : -1));
    };
    scene.input.on("wheel", this._onWheel);

    this.layout(false);
  }

  spawnCard(id) {
    const scene = this.scene;
    const data = ROSTER[id] || { colors: { main: 0xffb14a } };
    const unlocked = SaveSystem.isUnlocked(id);
    const key = texHeroSelect(scene, id);
    const plateCol = SELECT_PLATE[id] != null ? SELECT_PLATE[id] : data.colors.main;
    const box = scene.add.container(this.cx, this.cy);
    const plate = scene.add.circle(0, 0, CAROUSEL.plateR, plateCol, 1).setStrokeStyle(3, 0xfff6ea, 0.95);
    const orbit = scene.add.graphics();
    const aura = scene.add.graphics();
    const hopGfx = scene.add.graphics();
    const sprite = scene.add.image(0, 8, key).setDisplaySize(148, 148).setAlpha(unlocked ? 1 : 0.32);
    const form = scene.add.image(0, 0, "jump-fire").setVisible(false);
    if (form.disableInteractive) form.disableInteractive();
    const lockGfx = scene.add.graphics();
    if (!unlocked) drawLock(lockGfx, 0, 0);
    box.add([aura, plate, orbit, hopGfx, sprite, form, lockGfx]);
    this.strip.add(box);
    plate.setInteractive({ useHandCursor: true });
    plate.on("pointerdown", () => this.setPick(id, true, true));
    this.cards.push({
      id, unlocked, box, plate, sprite, form, orbit, aura, hopGfx, lockGfx,
      hopping: false, landY: 8, main: data.colors.main
    });
  }

  indexOf(id) {
    const i = this.ids.indexOf(id);
    return i < 0 ? 0 : i;
  }

  slotX(i, selected) {
    if (i === selected) return this.cx;
    const dir = i < selected ? -1 : 1;
    const steps = Math.abs(i - selected);
    return this.cx + dir * (CAROUSEL.bigHalf + CAROUSEL.smallSlot * (steps - 0.5));
  }

  nudge(dir) {
    if (this.ids.length < 2) return;
    const n = this.ids.length;
    const next = (this.indexOf(this.pick) + dir + n) % n;
    this.setPick(this.ids[next], true, true);
  }

  setPick(id, animate, notify) {
    if (!id || this.ids.indexOf(id) < 0) return;
    const changed = this.pick !== id;
    this.pick = id;
    this.layout(!!animate);
    if (changed && notify) {
      AudioSystem.ui();
      this.onPick(id);
    }
  }

  layout(animate) {
    const s = this.indexOf(this.pick);
    const dur = animate ? 320 : 0;
    this.cards.forEach((card, i) => {
      const on = card.id === this.pick;
      const x = this.slotX(i, s);
      const sc = on ? 1 : CAROUSEL.small;
      this.scene.tweens.killTweensOf(card.box);
      if (dur) {
        this.scene.tweens.add({
          targets: card.box,
          x,
          y: this.cy,
          scaleX: sc,
          scaleY: sc,
          duration: dur,
          ease: "Cubic.easeOut"
        });
      } else {
        card.box.setPosition(x, this.cy);
        card.box.setScale(sc);
      }
      card.box.setDepth(on ? 16 : 8 - Math.abs(i - s));
      card.plate.setStrokeStyle(on ? 6 : 3, on ? card.main : 0xfff6ea, on ? 1 : 0.95);
      if (on) this.hopOnce(card);
      else this.stopHop(card);
    });
    const chosen = this.cards[s];
    const unlocked = !!(chosen && chosen.unlocked);
    this.nameText.setText(I18n.charName(this.pick));
    this.nameText.setColor(unlocked ? "#3a2418" : "#8a7a90");
    this.tagText.setText(unlocked ? t("select.ready") : t("select.locked"));
    this.tagText.setColor(unlocked ? "#2a7a38" : "#c45a2a");
    const many = this.ids.length > 1;
    [this.prevBtn, this.nextBtn].forEach((b) => {
      if (!b) return;
      b.gfx.setAlpha(many ? 1 : 0.35);
      b.text.setAlpha(many ? 1 : 0.45);
    });
  }

  isActive(card) {
    return card && card.id === this.pick;
  }

  stopHop(card) {
    this.scene.tweens.killTweensOf(card.sprite);
    card.hopping = false;
    card.sprite.y = card.landY;
    card.orbit.clear();
    paintHopFx(card.hopGfx, card.form, null, 0, card.sprite.y, card.landY, card.id, 0, 130, false);
  }

  hopOnce(card) {
    if (!this.isActive(card) || card.hopping) return;
    card.hopping = true;
    this.scene.tweens.add({
      targets: card.sprite,
      y: card.landY - 16,
      duration: 150,
      yoyo: true,
      ease: "Sine.easeOut",
      hold: 30,
      onComplete: () => {
        card.hopping = false;
        if (card.sprite && card.sprite.active) card.sprite.y = card.landY;
        if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) return;
        if (this.isActive(card)) this.scene.time.delayedCall(90, () => {
          if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) return;
          this.hopOnce(card);
        });
      }
    });
  }

  update(now) {
    if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) return;
    this.cards.forEach((card) => {
      const on = this.isActive(card);
      if (card.aura) {
        if (on && card.unlocked) paintSkinAura(card.aura, 0, card.sprite.y, card.id, SaveSystem.skinOf(card.id), now, 78);
        else card.aura.clear();
      }
      if (!on) {
        card.orbit.clear();
        return;
      }
      card.orbit.clear();
      drawOrbit(card.orbit, 0, 0, CAROUSEL.plateR + 6, now, card.id);
      const rising = card.sprite.y < card.landY - 2;
      paintHopFx(card.hopGfx, card.form, null, 0, card.sprite.y, card.landY, card.id, now, 130, rising);
      if (rising && this.spark) {
        try {
          const tint = card.id === "aqua" ? 0x66e8ff : card.id === "volt" ? 0xe8ff3a : card.id === "terra" ? 0xc07830 : 0xff6a22;
          if (this.spark.setParticleTint) this.spark.setParticleTint(tint);
          this.spark.emitParticleAt(card.box.x, card.box.y + card.sprite.y * card.box.scaleY + 6, 2);
        } catch (e) {}
      }
    });
  }

  destroy() {
    try {
      if (this._onWheel && this.scene && this.scene.input) this.scene.input.off("wheel", this._onWheel);
    } catch (e) {}
    this._onWheel = null;
    this.cards.forEach((card) => {
      try { this.scene.tweens.killTweensOf(card.box); } catch (e) {}
      try { this.scene.tweens.killTweensOf(card.sprite); } catch (e) {}
    });
    try { if (this.strip) this.strip.destroy(true); } catch (e) {}
    try { if (this.maskG) this.maskG.destroy(); } catch (e) {}
    try { if (this.nameText) this.nameText.destroy(); } catch (e) {}
    try { if (this.tagText) this.tagText.destroy(); } catch (e) {}
    this.cards = [];
    this.strip = null;
  }
}
