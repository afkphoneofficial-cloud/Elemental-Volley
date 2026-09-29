import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";
import { paintSeasonTabs } from "../ui/sceneTabs.js";
import { itemIconKey } from "../data/items.js";
import { SEASON_TABLE, seasonLootBits } from "../data/seasonRewards.js";

function ensureSeasonIcons(scene) {
  if (!scene.textures.exists("item-plate")) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xfff6ea, 1);
    g.fillRoundedRect(8, 16, 48, 32, 8);
    g.lineStyle(3, 0xe8b84a, 1);
    g.strokeRoundedRect(8, 16, 48, 32, 8);
    g.fillStyle(0xe8b84a, 1);
    g.fillRoundedRect(14, 26, 36, 10, 4);
    g.generateTexture("item-plate", 64, 64);
    g.destroy();
  }
  if (!scene.textures.exists("item-cheer")) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xff8ab8, 1);
    g.fillTriangle(10, 50, 32, 8, 54, 50);
    g.fillStyle(0x7d5cff, 1);
    g.fillCircle(32, 28, 10);
    g.fillStyle(0xffe08a, 1);
    g.fillCircle(32, 28, 5);
    g.generateTexture("item-cheer", 64, 64);
    g.destroy();
  }
}

function iconKey(scene, bit) {
  if (bit.icon && scene.textures.exists(bit.icon)) return bit.icon;
  const item = itemIconKey(bit.id);
  if (scene.textures.exists(item)) return item;
  return "item-stone";
}

export class SeasonScene extends Phaser.Scene {
  constructor() { super("season"); }

  init(data) {
    this.from = (data && data.from) || "hub";
    this.via = (data && data.via) || "hub";
    this.tab = (data && data.tab) === "special" ? "special" : "pvp";
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    ensureSeasonIcons(this);
    const W = this.scale.width;
    const H = this.scale.height;
    const special = this.tab === "special";

    paintSeasonTabs(this, this.tab);
    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      if (this.from === "rankinfo") {
        this.scene.start("rankinfo", { from: this.via, tab: this.tab });
        return;
      }
      const dest = this.from === "queue" ? "queue" : this.from;
      this.scene.start(dest);
    }, 0x7d5cff);

    if (special) this.paintEpicFrame(W, H);

    const ink = special ? "#fff6ea" : "#3a2418";
    const muted = special ? "#c8b8ff" : "#7a4a30";
    const gold = special ? "#ffe08a" : "#c45a16";

    this.add.text(W / 2, 88, t("season.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: ink
    }).setOrigin(0.5).setDepth(8);
    this.add.text(W / 2, 118, t("season.sub"), {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "700", color: muted, align: "center",
      wordWrap: { width: 1000 }
    }).setOrigin(0.5).setDepth(8);

    const tableW = 1040;
    const tableX = W / 2 - tableW / 2;
    const headY = 142;
    const rowH = 64;
    const placeW = 250;
    const headH = 44;
    const rows = SEASON_TABLE;
    const tableH = headH + rows.length * rowH;
    const panel = this.add.graphics().setDepth(6);
    if (special) {
      panel.fillStyle(0x120e1c, 0.82);
      panel.fillRoundedRect(tableX, headY, tableW, tableH, 18);
      panel.lineStyle(3, 0xffd24a, 0.95);
      panel.strokeRoundedRect(tableX, headY, tableW, tableH, 18);
      panel.lineStyle(2, 0x7d5cff, 0.7);
      panel.strokeRoundedRect(tableX + 6, headY + 6, tableW - 12, tableH - 12, 14);
    } else {
      panel.fillStyle(0xfff6ea, 0.96);
      panel.fillRoundedRect(tableX, headY, tableW, tableH, 18);
      panel.lineStyle(3, 0xffb14a, 0.85);
      panel.strokeRoundedRect(tableX, headY, tableW, tableH, 18);
    }

    const head = this.add.graphics().setDepth(7);
    head.fillStyle(special ? 0x2a1848 : 0xffe8c8, special ? 0.95 : 1);
    head.fillRoundedRect(tableX + 8, headY + 8, tableW - 16, headH - 4, 10);
    this.add.text(tableX + 24, headY + headH / 2 + 4, t("season.colPlace"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: gold
    }).setOrigin(0, 0.5).setDepth(8);
    this.add.text(tableX + placeW + 16, headY + headH / 2 + 4, t("season.colReward"), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: gold
    }).setOrigin(0, 0.5).setDepth(8);

    rows.forEach((row, i) => {
      const y = headY + headH + i * rowH;
      const stripe = this.add.graphics().setDepth(7);
      if (i % 2) {
        stripe.fillStyle(special ? 0xffffff : 0xff8a3a, special ? 0.04 : 0.06);
        stripe.fillRect(tableX + 10, y, tableW - 20, rowH);
      }
      if (i < rows.length - 1) {
        stripe.lineStyle(1, special ? 0x7d5cff : 0xffb14a, 0.28);
        stripe.lineBetween(tableX + 20, y + rowH, tableX + tableW - 20, y + rowH);
      }
      stripe.lineStyle(1, special ? 0x7d5cff : 0xffb14a, 0.22);
      stripe.lineBetween(tableX + placeW, y + 10, tableX + placeW, y + rowH - 10);

      const placeLabel = row.play ? t("season.play") : t("season.place" + row.id);
      this.add.text(tableX + 24, y + rowH / 2, placeLabel, {
        fontFamily: UI_FONT, fontSize: row.play ? "18px" : "24px", fontStyle: "900", color: ink,
        wordWrap: { width: placeW - 36 }
      }).setOrigin(0, 0.5).setDepth(8);

      const bits = seasonLootBits(this.tab, row);
      const gap = 86;
      const start = tableX + placeW + 36;
      bits.forEach((bit, n) => {
        const x = start + n * gap;
        const cy = y + rowH / 2 - 6;
        const key = iconKey(this, bit);
        this.add.image(x, cy, key).setDisplaySize(44, 44).setDepth(8);
        this.add.text(x, cy + 28, "x" + bit.n, {
          fontFamily: UI_FONT, fontSize: "14px", fontStyle: "900", color: muted
        }).setOrigin(0.5).setDepth(8);
      });
    });

    this.add.text(W / 2, headY + tableH + 18, t("season.notePlate"), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700", color: muted, align: "center",
      wordWrap: { width: 1000 }
    }).setOrigin(0.5, 0).setDepth(8);
    this.add.text(W / 2, headY + tableH + 48, t("season.noteCheer"), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "700", color: muted, align: "center",
      wordWrap: { width: 1000 }
    }).setOrigin(0.5, 0).setDepth(8);

    AudioSystem.playMenu();
  }

  paintEpicFrame(W, H) {
    const top = 62;
    const w = W - 36;
    const h = H - top - 10;
    const x = W / 2;
    const y = top + h / 2;
    const halo = this.add.graphics().setDepth(1);
    halo.fillStyle(0x7d5cff, 0.2);
    halo.fillRoundedRect(x - w / 2 - 16, y - h / 2 - 16, w + 32, h + 32, 28);
    halo.fillStyle(0xffd24a, 0.12);
    halo.fillRoundedRect(x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16, 24);
    const panel = this.add.graphics().setDepth(2);
    panel.fillStyle(0x1a1033, 0.94);
    panel.fillRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    panel.lineStyle(5, 0xffd24a, 1);
    panel.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 22);
    panel.lineStyle(2, 0x3ad6ff, 0.95);
    panel.strokeRoundedRect(x - w / 2 + 7, y - h / 2 + 7, w - 14, h - 14, 18);
  }
}
