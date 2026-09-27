import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { t, I18n } from "../i18n/I18n.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { MAP_LOCS } from "../data/worldMap.js";

export class WikiScene extends Phaser.Scene {
  constructor() { super("wiki"); }

  init(data) {
    this.from = (data && data.from) || "hub";
  }

  create() {
    if (this.from !== "auth" && !AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    const H = this.scale.height;
    this.mapW = 1220;
    this.mapH = 536;
    this.mapCX = W / 2;
    this.mapCY = 386;

    this.add.text(W / 2, 28, t("wiki.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418",
      stroke: "#fff6ea", strokeThickness: 6
    }).setOrigin(0.5);
    this.add.text(W / 2, 56, t("wiki.sub"), {
      fontFamily: UI_FONT, fontSize: "15px", fontStyle: "700", color: "#5a3828",
      stroke: "#fff6ea", strokeThickness: 4
    }).setOrigin(0.5);

    makeButton(this, 96, 42, 132, 40, t("nav.back"), () => {
      if (this.from === "auth") {
        this.scene.start("auth");
        return;
      }
      this.scene.start(this.from);
    }, 0x7d5cff);
    makeButton(this, W - 96, 42, 132, 40, t("wiki.tabRules"), () => this.openRules(), 0xff8a3a);

    const frame = this.add.graphics().setDepth(4);
    frame.fillStyle(0xfff6ea, 0.2);
    frame.fillRoundedRect(this.mapCX - this.mapW / 2 - 8, this.mapCY - this.mapH / 2 - 8, this.mapW + 16, this.mapH + 16, 22);
    frame.lineStyle(3, 0xc45a16, 0.45);
    frame.strokeRoundedRect(this.mapCX - this.mapW / 2 - 8, this.mapCY - this.mapH / 2 - 8, this.mapW + 16, this.mapH + 16, 22);

    const key = this.textures.exists("map-etheria") ? "map-etheria" : null;
    const maskG = this.add.graphics();
    maskG.fillStyle(0xffffff, 1);
    maskG.fillRoundedRect(this.mapCX - this.mapW / 2, this.mapCY - this.mapH / 2, this.mapW, this.mapH, 18);
    maskG.setVisible(false);
    if (key) {
      const mapImg = this.add.image(this.mapCX, this.mapCY, key).setDisplaySize(this.mapW, this.mapH).setDepth(5);
      mapImg.setMask(maskG.createGeometryMask());
    } else {
      this.add.rectangle(this.mapCX, this.mapCY, this.mapW, this.mapH, 0x7ad4ff, 0.35).setDepth(5);
    }

    MAP_LOCS.forEach((loc) => this.spawnPin(loc));
    this.drawLegend(W, H);

    this.popup = this.add.container(0, 0).setDepth(50).setVisible(false);
    this.input.setTopOnly(false);
    AudioSystem.playMenu();
  }

  pinXY(loc) {
    return {
      x: this.mapCX - this.mapW / 2 + loc.x * this.mapW,
      y: this.mapCY - this.mapH / 2 + loc.y * this.mapH
    };
  }

  spawnPin(loc) {
    const p = this.pinXY(loc);
    const col = loc.color;
    const big = loc.kind === "shown" && loc.char;
    const ring = this.add.circle(p.x, p.y, big ? 38 : loc.kind === "fog" ? 16 : 20, 0xfff6ea, 0.92)
      .setStrokeStyle(3, col, loc.kind === "shown" ? 1 : 0.7)
      .setDepth(8);
    ring.setInteractive(new Phaser.Geom.Circle(0, 0, big ? 44 : 28), Phaser.Geom.Circle.Contains);
    ring.input.cursor = "pointer";
    this.add.circle(p.x, p.y + (big ? 34 : 18), big ? 16 : 10, 0x000000, 0.18).setDepth(7);
    if (big) {
      const vis = this.textures.exists("vis_" + loc.char) ? "vis_" + loc.char : "vis_ignis";
      this.add.image(p.x, p.y - 2, vis).setDisplaySize(68, 68).setDepth(9);
    } else if (loc.kind === "sealed") {
      this.add.text(p.x, p.y - 1, "?", {
        fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#5a3828"
      }).setOrigin(0.5).setDepth(9);
    } else {
      this.add.text(p.x, p.y - 1, "···", {
        fontFamily: UI_FONT, fontSize: "13px", fontStyle: "900", color: "#5a6070"
      }).setOrigin(0.5).setDepth(9);
    }
    this.tweens.add({
      targets: ring,
      scale: 1.04,
      duration: loc.kind === "fog" ? 1400 : 900,
      yoyo: true,
      repeat: -1
    });
    ring.on("pointerdown", () => this.openLoc(loc));
  }

  drawLegend(W, H) {
    const y = H - 28;
    const items = [
      { c: 0xff6a22, k: "legendShown" },
      { c: 0x7d5cff, k: "legendSealed" },
      { c: 0x8aa0b4, k: "legendFog" }
    ];
    const start = W / 2 - 310;
    items.forEach((it, i) => {
      const x = start + i * 220;
      this.add.circle(x, y, 7, it.c, 1).setDepth(10);
      this.add.text(x + 14, y, t("wiki." + it.k), {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#3a2418"
      }).setOrigin(0, 0.5).setDepth(10);
    });
  }

  locCopy(loc) {
    return I18n.lang === "en" ? loc.en : loc.th;
  }

  openLoc(loc) {
    AudioSystem.ui();
    const copy = this.locCopy(loc);
    const statusKey = loc.kind === "shown" ? "statusShown" : loc.kind === "sealed" ? "statusSealed" : "statusFog";
    const chip = loc.kind === "shown" ? "#c45a16" : loc.kind === "sealed" ? "#6a3cff" : "#5a6878";
    this.buildPopup({
      chip,
      status: t("wiki." + statusKey),
      title: copy.name,
      region: copy.region,
      body: copy.body,
      vis: loc.char && this.textures.exists("vis_" + loc.char) ? "vis_" + loc.char : null
    });
  }

  openRules() {
    AudioSystem.ui();
    const pack = I18n.rules();
    const body = pack.groups.map((g) => g.h + "\n" + g.items.map((n) => "·  " + n).join("\n")).join("\n\n");
    this.buildPopup({
      chip: "#c45a16",
      status: pack.kicker,
      title: pack.title,
      region: "",
      body,
      vis: null,
      wide: true
    });
  }

  buildPopup(info) {
    this.closePopup();
    const W = this.scale.width;
    const H = this.scale.height;
    const wide = !!info.wide;
    const cardW = wide ? 820 : 560;
    const cardH = wide ? 600 : 360;
    const y0 = H / 2 - cardH / 2;
    const headerH = info.vis ? 132 : (info.region ? 108 : 92);
    const viewW = cardW - 72;
    const viewH = cardH - headerH - 28;
    const viewX = W / 2 - viewW / 2;
    const viewY = y0 + headerH;

    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x1a1008, 0.46)
      .setInteractive()
      .setDepth(50);
    dim.on("pointerdown", () => this.closePopup());
    const g = this.add.graphics().setDepth(51);
    g.fillStyle(0xfff6ea, 0.98);
    g.fillRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 24);
    g.lineStyle(3, 0xc45a16, 0.55);
    g.strokeRoundedRect(W / 2 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, 24);
    const block = this.add.zone(W / 2, H / 2, cardW, cardH).setInteractive();
    const bits = [dim, g, block];
    bits.push(this.add.text(W / 2, y0 + 26, info.status, {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: info.chip
    }).setOrigin(0.5).setDepth(52));
    const titleX = info.vis ? W / 2 + 28 : W / 2;
    if (info.vis) {
      bits.push(this.add.circle(W / 2 - 196, y0 + 96, 52, 0xffe8c8, 1).setStrokeStyle(3, 0xc45a16, 0.5).setDepth(52));
      bits.push(this.add.image(W / 2 - 196, y0 + 96, info.vis).setDisplaySize(88, 88).setDepth(53));
    }
    bits.push(this.add.text(titleX, y0 + 58, info.title, {
      fontFamily: UI_FONT, fontSize: wide ? "28px" : "26px", fontStyle: "900", color: "#3a2418",
      align: "center", wordWrap: { width: cardW - (info.vis ? 240 : 96) }
    }).setOrigin(0.5).setDepth(52));
    if (info.region) {
      bits.push(this.add.text(titleX, y0 + 92, info.region, {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "700", color: "#7a4a30"
      }).setOrigin(0.5).setDepth(52));
    }

    const body = this.add.text(wide ? 0 : viewW / 2, 0, info.body, {
      fontFamily: UI_FONT, fontSize: "17px", fontStyle: "600", color: "#4a3228",
      align: wide ? "left" : "center", wordWrap: { width: viewW }, lineSpacing: 7
    }).setOrigin(wide ? 0 : 0.5, 0).setDepth(52);
    const wrap = this.add.container(viewX, viewY).setDepth(52);
    wrap.add(body);
    const maskG = this.add.graphics();
    maskG.fillStyle(0xffffff, 1);
    maskG.fillRoundedRect(viewX, viewY, viewW, viewH, 8);
    maskG.setVisible(false);
    wrap.setMask(maskG.createGeometryMask());

    const maxScroll = Math.max(0, body.height - viewH);
    this._popScroll = 0;
    const applyScroll = () => {
      this._popScroll = Phaser.Math.Clamp(this._popScroll, 0, maxScroll);
      body.y = -this._popScroll;
      if (hint) hint.setVisible(maxScroll > 8 && this._popScroll < maxScroll - 4);
    };
    let hint = null;
    if (maxScroll > 8) {
      hint = this.add.text(W / 2, y0 + cardH - 18, t("wiki.scrollHint"), {
        fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
      }).setOrigin(0.5).setDepth(54);
      bits.push(hint);
    }
    const dragZ = this.add.zone(W / 2, viewY + viewH / 2, viewW, viewH).setInteractive().setDepth(53);
    dragZ.on("pointerdown", (p) => { this._popDrag = p.y; });
    dragZ.on("pointermove", (p) => {
      if (!p.isDown || this._popDrag == null) return;
      this._popScroll -= (p.y - this._popDrag);
      this._popDrag = p.y;
      applyScroll();
    });
    this._onPopWheel = (_pointer, _over, _dx, dy) => {
      if (!this.popup.visible) return;
      this._popScroll += dy * 0.45;
      applyScroll();
    };
    this.input.on("wheel", this._onPopWheel);
    applyScroll();

    const close = makeButton(this, W / 2 + cardW / 2 - 36, y0 + 28, 44, 40, "✕", () => this.closePopup(), 0x7d5cff);
    this.popup.add(bits.concat([wrap, dragZ, maskG]));
    this.popup.add([close.gfx, close.text, close.bg]);
    this.popup.setVisible(true);
  }

  closePopup() {
    if (this._onPopWheel) {
      this.input.off("wheel", this._onPopWheel);
      this._onPopWheel = null;
    }
    this._popDrag = null;
    if (!this.popup) return;
    this.popup.setVisible(false);
    this.popup.removeAll(true);
  }
}
