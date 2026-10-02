import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { champLookCards, champLookPoses } from "../data/champLooks.js?v=local232";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, charName } from "../i18n/I18n.js?v=local232";
import { paintSkinAura } from "../fx/SkinAura.js";
import { ArtLoad } from "../systems/ArtLoad.js?v=local273";

export class ChampLooksScene extends Phaser.Scene {
  constructor() { super("champLooks"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    if (this._artReady !== true) {
      if (this._artReady === "load") return;
      this._artReady = "load";
      this.events.once("shutdown", () => { this._artReady = false; });
      ArtLoad.ensureChampLooks(this).then(() => {
        this._artReady = true;
        if (this.sys && this.sys.isActive()) this.create();
      }).catch(() => {
        this._artReady = true;
        if (this.sys && this.sys.isActive()) this.create();
      });
      return;
    }
    drawGrid(this);
    const W = this.scale.width;
    const H = this.scale.height;
    this.prevBits = [];

    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    this.add.text(W / 2, 36, t("hub.navChampLook"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);
    this.add.text(W / 2, 68, t("champLooks.sub"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#7a4a30"
    }).setOrigin(0.5);

    const cards = champLookCards();
    const cols = 4;
    const cellW = 210;
    const cellH = 168;
    const gapX = 18;
    const gapY = 14;
    const gridW = cols * cellW + (cols - 1) * gapX;
    const ox = (W - gridW) / 2 + cellW / 2;
    const oy = 168;

    cards.forEach((row, i) => {
      const col = i % cols;
      const r = Math.floor(i / cols);
      const x = ox + col * (cellW + gapX);
      const y = oy + r * (cellH + gapY);
      roundPanel(this, x, y, cellW, cellH, 0xffc44a, 0xfff6ea);
      const key = this.textures.exists(row.select) ? row.select : "item-plate-champ";
      const img = this.add.image(x, y - 10, key).setDisplaySize(118, 118).setDepth(6);
      this.add.text(x, y + 62, t("champLooks.card", { name: charName(row.charId), n: row.set }), {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#3a2418",
        align: "center", wordWrap: { width: 190 }
      }).setOrigin(0.5).setDepth(7);
      const zone = this.add.zone(x, y, cellW, cellH).setInteractive({ useHandCursor: true }).setDepth(8);
      zone.on("pointerdown", () => {
        AudioSystem.ui();
        this.openPrev(row.charId, row.set);
      });
      img.setInteractive({ useHandCursor: true });
      img.on("pointerdown", () => {
        AudioSystem.ui();
        this.openPrev(row.charId, row.set);
      });
    });

    this.add.text(W / 2, H - 42, t("champLooks.onlyChamp"), {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#c45a16",
      align: "center", wordWrap: { width: 1100 }
    }).setOrigin(0.5).setDepth(10);

    AudioSystem.playMenu();
  }

  closePrev() {
    this.prevBits.forEach((o) => { try { o.destroy(); } catch (e) {} });
    this.prevBits = [];
  }

  openPrev(charId, set) {
    this.closePrev();
    const poses = champLookPoses(this, charId, set);
    if (!poses.length) return;
    const W = this.scale.width;
    const H = this.scale.height;
    const D = 80;
    const keep = (o) => { this.prevBits.push(o); return o; };
    const dim = keep(this.add.rectangle(W / 2, H / 2, W, H, 0x3a2418, 0.55).setDepth(D).setInteractive());
    dim.on("pointerdown", () => this.closePrev());
    keep(this.add.rectangle(W / 2, H / 2, 720, 560, 0xfffaf4, 1).setStrokeStyle(4, 0xffc44a, 0.95).setDepth(D + 1).setInteractive());
    keep(this.add.text(W / 2, 108, t("champLooks.card", { name: charName(charId), n: set }), {
      fontFamily: UI_FONT, fontSize: "24px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(D + 2));
    keep(this.add.text(W / 2, 142, t("champLooks.mirror"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(D + 2));

    const aura = keep(this.add.graphics().setDepth(D + 2));
    let poseI = 0;
    const hero = keep(this.add.image(W / 2, 300, poses[0].tex(charId, set)).setDisplaySize(240, 240).setDepth(D + 4));
    const poseLab = keep(this.add.text(W / 2, 508, "", {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(D + 4));

    const show = () => {
      const pose = poses[poseI];
      const key = this.textures.exists(pose.tex(charId, set)) ? pose.tex(charId, set) : poses[0].tex(charId, set);
      hero.setTexture(key);
      poseLab.setText(t("champLooks.pose." + pose.id) + "  ·  " + (poseI + 1) + "/" + poses.length);
      paintSkinAura(aura, hero.x, hero.y, charId, 5, this.time.now, 130);
    };

    const prev = makeButton(this, W / 2 - 280, 310, 56, 56, "‹", () => {
      poseI = (poseI + poses.length - 1) % poses.length;
      AudioSystem.ui();
      show();
    }, 0xffc44a, D + 5);
    const next = makeButton(this, W / 2 + 280, 310, 56, 56, "›", () => {
      poseI = (poseI + 1) % poses.length;
      AudioSystem.ui();
      show();
    }, 0xffc44a, D + 5);
    const close = makeButton(this, W / 2, 558, 200, 44, t("nav.back"), () => {
      AudioSystem.ui();
      this.closePrev();
    }, 0xff8a3a, D + 5);
    [prev, next, close].forEach((btn) => {
      keep(btn.gfx); keep(btn.text); keep(btn.bg);
    });

    poses.forEach((pose, i) => {
      const tx = W / 2 - ((poses.length - 1) * 56) / 2 + i * 56;
      const tk = pose.tex(charId, set);
      if (!this.textures.exists(tk)) return;
      const thumb = keep(this.add.image(tx, 458, tk).setDisplaySize(48, 48).setDepth(D + 6).setInteractive({ useHandCursor: true }));
      thumb.on("pointerdown", () => {
        poseI = i;
        AudioSystem.ui();
        show();
      });
    });
    show();
  }
}
