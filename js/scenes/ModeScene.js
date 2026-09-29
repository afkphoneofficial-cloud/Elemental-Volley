import { drawGrid, makeButton, UI_FONT, roundPanel } from "../ui/Ui.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { wantFx } from "../systems/GameSettings.js";
import { Session } from "../systems/Session.js";
import { t, I18n } from "../i18n/I18n.js";
import { formatEtherWait } from "../systems/Ether.js";

export class ModeScene extends Phaser.Scene {
  constructor() { super("mode"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const st = SaveSystem.etherNow();
    const wait = st.full ? t("hub.etherFull") : t("hub.etherWait", { t: formatEtherWait(st.nextMs) });
    this.ruleBits = [];
    this.fxRing = this.add.graphics().setDepth(7);

    this.add.text(W / 2, 40, t("hub.modeTitle"), {
      fontFamily: UI_FONT, fontSize: "30px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);

    const cw = 500;
    const ch = 248;
    const gapX = 28;
    const col0 = W / 2 - gapX / 2 - cw / 2;
    const col1 = W / 2 + gapX / 2 + cw / 2;
    const row0 = 210;
    const row1 = 478;

    this.card(col0, row0, cw, ch, 0xffb14a, t("hub.playBot"), t("hub.modeBotBody"), () => {
      Session.mode = "bot";
      Session.rival = null;
      AudioSystem.ui();
      this.scene.start("select");
    });
    this.card(col1, row0, cw, ch, 0xff8ab8, t("hub.playExhibit"), t("hub.modeExhibitBody"), () => {
      Session.mode = "exhibit";
      AudioSystem.ui();
      this.scene.start("friends", { pick: true });
    });
    this.rankCard(col0, row1, cw, ch, t("hub.playPvp"), t("hub.modePvpBody", {
      n: st.n, max: ECONOMY.etherMax, wait
    }), () => {
      Session.mode = "pvp";
      AudioSystem.ui();
      this.scene.start("select");
    });
    this.epicCard(col1, row1, cw, ch, t("hub.playSpecial"), t("hub.modeSpecialBody"), () => {
      Session.mode = "special";
      AudioSystem.ui();
      this.scene.start("select");
    });

    makeButton(this, 120, 40, 140, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start("hub");
    }, 0x7d5cff);
    makeButton(this, W - 330, 40, 160, 40, t("hub.playRules"), () => {
      AudioSystem.ui();
      this.openPlayRules();
    }, 0xff8a3a);
    makeButton(this, W - 140, 40, 180, 40, t("queue.how"), () => {
      AudioSystem.ui();
      this.scene.start("rankinfo", { from: "mode", tab: "rules" });
    }, 0x3ad6ff);
    this.fxBoxes = [
      { x: col0, y: row1, w: cw, h: ch, kind: "rank" },
      { x: col1, y: row1, w: cw, h: ch, kind: "epic" }
    ];
    AudioSystem.playMenu();
  }

  card(x, y, w, h, color, title, body, onClick) {
    roundPanel(this, x, y, w, h, color, 0xfff6ea);
    this.add.text(x, y - 68, title, {
      fontFamily: UI_FONT, fontSize: "24px", fontStyle: "900", color: "#3a2418",
      align: "center", wordWrap: { width: w - 40 }
    }).setOrigin(0.5).setDepth(8);
    this.add.text(x, y + 4, body, {
      fontFamily: UI_FONT, fontSize: "14px", color: "#5a3828",
      align: "center", wordWrap: { width: w - 64 }
    }).setOrigin(0.5).setDepth(8);
    makeButton(this, x, y + 82, 220, 44, title, () => onClick(), color);
  }

  rankCard(x, y, w, h, title, body, onClick) {
    const halo = this.add.graphics().setDepth(3);
    halo.fillStyle(0xa898ff, 0.16);
    halo.fillRoundedRect(x - w / 2 - 12, y - h / 2 - 12, w + 24, h + 24, 24);
    this.tweens.add({
      targets: halo,
      alpha: { from: 0.42, to: 0.78 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const panel = this.add.graphics().setDepth(4);
    panel.fillStyle(0xfff6ea, 0.96);
    panel.fillRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    panel.lineStyle(3, 0x9b86ff, 0.7);
    panel.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    panel.lineStyle(1.5, 0xc8b8ff, 0.55);
    panel.strokeRoundedRect(x - w / 2 + 6, y - h / 2 + 6, w - 12, h - 12, 16);

    this.add.text(x, y - 68, title, {
      fontFamily: UI_FONT, fontSize: "24px", fontStyle: "900", color: "#3a2418",
      align: "center", wordWrap: { width: w - 40 }
    }).setOrigin(0.5).setDepth(8);
    this.add.text(x, y + 4, body, {
      fontFamily: UI_FONT, fontSize: "14px", color: "#5a3828",
      align: "center", wordWrap: { width: w - 64 }
    }).setOrigin(0.5).setDepth(8);
    makeButton(this, x, y + 82, 220, 44, title, () => onClick(), 0x7d5cff);

    if (wantFx() && this.textures.exists("dot")) {
      try {
        const spark = this.add.particles(x, y, "dot", {
          lifespan: 2200,
          speed: { min: 2, max: 14 },
          scale: { start: 0.38, end: 0 },
          alpha: { start: 0.45, end: 0 },
          tint: [0xc8b8ff, 0xe8e0ff, 0x9b86ff],
          blendMode: "ADD",
          quantity: 1,
          frequency: 90,
          emitZone: {
            type: "edge",
            source: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
            quantity: 16
          }
        });
        spark.setDepth(6);
      } catch (e) {}
    }
  }

  epicCard(x, y, w, h, title, body, onClick) {
    const halo = this.add.graphics().setDepth(3);
    halo.fillStyle(0x7d5cff, 0.18);
    halo.fillRoundedRect(x - w / 2 - 18, y - h / 2 - 18, w + 36, h + 36, 28);
    halo.fillStyle(0xffd24a, 0.12);
    halo.fillRoundedRect(x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16, 24);
    this.tweens.add({
      targets: halo,
      alpha: { from: 0.55, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    const panel = this.add.graphics().setDepth(4);
    panel.fillStyle(0x1a1033, 0.92);
    panel.fillRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    panel.lineStyle(5, 0xffd24a, 1);
    panel.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 20);
    panel.lineStyle(2, 0x3ad6ff, 0.95);
    panel.strokeRoundedRect(x - w / 2 + 7, y - h / 2 + 7, w - 14, h - 14, 16);
    panel.fillStyle(0xffffff, 0.08);
    panel.fillRoundedRect(x - w / 2 + 18, y - h / 2 + 14, w - 36, 36, 12);

    this.add.text(x, y - 68, title, {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#ffe08a",
      stroke: "#3a1870", strokeThickness: 6,
      align: "center", wordWrap: { width: w - 40 }
    }).setOrigin(0.5).setDepth(8);
    this.add.text(x, y + 4, body, {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: "#e8dcff",
      align: "center", wordWrap: { width: w - 64 }
    }).setOrigin(0.5).setDepth(8);
    makeButton(this, x, y + 82, 260, 46, title, () => onClick(), 0xffd24a);

    if (wantFx() && this.textures.exists("dot")) {
      try {
        const spark = this.add.particles(x, y, "dot", {
          lifespan: 1600,
          speed: { min: 8, max: 42 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.95, end: 0 },
          tint: [0xffe08a, 0x7d5cff, 0x3ad6ff, 0xff6a22],
          blendMode: "ADD",
          quantity: 1,
          frequency: 28,
          emitZone: {
            type: "edge",
            source: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
            quantity: 28
          }
        });
        spark.setDepth(6);
      } catch (e) {}
    }
  }

  update(now) {
    if (!this.fxRing || !this.fxBoxes) return;
    const t = now * 0.001;
    this.fxRing.clear();
    this.fxBoxes.forEach((box) => {
      const { x, y, w, h, kind } = box;
      if (kind === "rank") {
        for (let i = 0; i < 4; i += 1) {
          const a = t * 0.55 + i * 1.57;
          const rx = x + Math.cos(a) * (w * 0.5);
          const ry = y + Math.sin(a) * (h * 0.5);
          this.fxRing.fillStyle(0xb8a8ff, 0.35);
          this.fxRing.fillCircle(rx, ry, 3.2);
        }
        const pulse = 5 + Math.sin(t * 1.4) * 3;
        this.fxRing.lineStyle(2, 0x9b86ff, 0.16 + Math.sin(t * 1.2) * 0.08);
        this.fxRing.strokeRoundedRect(x - w / 2 - pulse, y - h / 2 - pulse, w + pulse * 2, h + pulse * 2, 24);
        return;
      }
      for (let i = 0; i < 8; i += 1) {
        const a = t * (i % 2 === 0 ? 1.4 : -1.1) + i * 0.785;
        const rx = x + Math.cos(a) * (w * 0.52);
        const ry = y + Math.sin(a) * (h * 0.52);
        const r = 5 + Math.sin(t * 4 + i) * 2;
        this.fxRing.fillStyle(i % 2 ? 0xffd24a : 0x3ad6ff, 0.85);
        this.fxRing.fillCircle(rx, ry, r);
      }
      const pulse = 10 + Math.sin(t * 3) * 6;
      this.fxRing.lineStyle(3, 0xffd24a, 0.35 + Math.sin(t * 2) * 0.15);
      this.fxRing.strokeRoundedRect(x - w / 2 - pulse, y - h / 2 - pulse, w + pulse * 2, h + pulse * 2, 26);
    });
  }

  openPlayRules() {
    this.closePlayRules();
    const W = this.scale.width;
    const H = this.scale.height;
    const pack = I18n.rules();
    const body = pack.groups.map((g) => g.h + "\n" + g.items.map((n) => "·  " + n).join("\n")).join("\n\n");
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x1a1008, 0.5).setDepth(70).setInteractive();
    dim.on("pointerdown", () => this.closePlayRules());
    const cardW = 820;
    const cardH = 560;
    const g = this.add.graphics().setDepth(71);
    g.fillStyle(0xfff6ea, 0.98);
    g.fillRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 24);
    g.lineStyle(3, 0xc45a16, 0.55);
    g.strokeRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 24);
    const block = this.add.zone(W / 2, H / 2, cardW, cardH).setInteractive().setDepth(71);
    const kicker = this.add.text(W / 2, H / 2 - cardH / 2 + 28, pack.kicker, {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#c45a16"
    }).setOrigin(0.5).setDepth(72);
    const title = this.add.text(W / 2, H / 2 - cardH / 2 + 58, pack.title, {
      fontFamily: UI_FONT, fontSize: "26px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(72);
    const text = this.add.text(W / 2, H / 2 + 18, body, {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "600", color: "#4a3228",
      align: "left", wordWrap: { width: 740 }, lineSpacing: 6
    }).setOrigin(0.5).setDepth(72);
    const close = makeButton(this, W / 2, H / 2 + cardH / 2 - 36, 160, 42, t("hub.infoClose"), () => {
      AudioSystem.ui();
      this.closePlayRules();
    }, 0xff6a22, 80);
    this.ruleBits = [dim, g, block, kicker, title, text, close.gfx, close.text, close.bg];
  }

  closePlayRules() {
    this.ruleBits.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.ruleBits = [];
  }
}
