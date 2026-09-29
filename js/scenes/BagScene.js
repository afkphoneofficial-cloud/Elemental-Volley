import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { paintFighterTabs } from "../ui/sceneTabs.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { t, charName } from "../i18n/I18n.js";
import { BAG_COLS, BAG_SLOTS, ITEMS, itemIconKey } from "../data/items.js";

function slotList() {
  const cur = SaveSystem.data.currencies || {};
  const rows = [];
  const stones = cur.pvp | 0;
  const shards = cur.tokens | 0;
  if (stones > 0) rows.push({ id: "stone", n: stones, material: false });
  if (shards > 0) rows.push({ id: "shard", n: shards, material: true });
  Object.keys(SaveSystem.data.inventory || {}).forEach((id) => {
    const n = SaveSystem.itemCount(id);
    if (n > 0 && ITEMS[id] && ITEMS[id].kind === "use") rows.push({ id, n, material: false });
  });
  while (rows.length < BAG_SLOTS) rows.push(null);
  return rows.slice(0, BAG_SLOTS);
}

export class BagScene extends Phaser.Scene {
  constructor() { super("bag"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    paintFighterTabs(this, "bag");
    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start("hub");
    }, 0x7d5cff);

    this.add.text(W / 2, 100, t("bag.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);

    this.pick = 0;
    this.bits = [];
    this.paintGrid();
    AudioSystem.playMenu();
  }

  paintGrid() {
    this.bits.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.bits = [];
    const W = this.scale.width;
    const slots = slotList();
    const size = 108;
    const gap = 12;
    const gridW = BAG_COLS * size + (BAG_COLS - 1) * gap;
    const x0 = 72 + size / 2;
    const y0 = 210;
    const keep = (o) => { this.bits.push(o); return o; };

    slots.forEach((row, i) => {
      const col = i % BAG_COLS;
      const r = Math.floor(i / BAG_COLS);
      const x = x0 + col * (size + gap);
      const y = y0 + r * (size + gap);
      const on = i === this.pick && row;
      const g = keep(this.add.graphics().setDepth(6));
      g.fillStyle(on ? 0xffe8c8 : 0xfff6ea, 0.96);
      g.fillRoundedRect(x - size / 2, y - size / 2, size, size, 16);
      g.lineStyle(3, on ? 0xff6a22 : 0xffb14a, on ? 1 : 0.55);
      g.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 16);
      if (row) {
        const key = this.textures.exists(itemIconKey(row.id)) ? itemIconKey(row.id) : "item-stone";
        keep(this.add.image(x, y - 6, key).setDisplaySize(68, 68).setDepth(7));
        keep(this.add.text(x + 40, y + 38, "x" + row.n, {
          fontFamily: UI_FONT, fontSize: "14px", fontStyle: "900", color: "#3a2418"
        }).setOrigin(1, 1).setDepth(8));
      }
      keep(this.add.zone(x, y, size, size).setInteractive({ useHandCursor: true }).setDepth(9)
        .on("pointerdown", () => {
          AudioSystem.ui();
          this.pick = i;
          this.paintGrid();
        }));
    });

    const panelX = W - 250;
    const panelY = 390;
    const pg = keep(this.add.graphics().setDepth(6));
    pg.fillStyle(0xfff6ea, 0.98);
    pg.fillRoundedRect(panelX - 210, panelY - 250, 420, 500, 22);
    pg.lineStyle(3, 0xff6a22, 0.8);
    pg.strokeRoundedRect(panelX - 210, panelY - 250, 420, 500, 22);

    const chosen = slots[this.pick];
    if (!chosen) {
      keep(this.add.text(panelX, panelY - 40, t("bag.slotEmpty"), {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "800", color: "#8a5a38", align: "center", wordWrap: { width: 360 }
      }).setOrigin(0.5).setDepth(8));
      return;
    }
    const key = this.textures.exists(itemIconKey(chosen.id)) ? itemIconKey(chosen.id) : "item-stone";
    keep(this.add.image(panelX, panelY - 170, key).setDisplaySize(96, 96).setDepth(8));
    keep(this.add.text(panelX, panelY - 96, t("item." + chosen.id + ".name"), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(8));
    keep(this.add.text(panelX, panelY - 40, t("item." + chosen.id + ".body"), {
      fontFamily: UI_FONT, fontSize: "15px", color: "#5a3828", align: "center", wordWrap: { width: 360 }
    }).setOrigin(0.5).setDepth(8));
    keep(this.add.text(panelX, panelY + 40, t("bag.held", { n: chosen.n }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(8));

    if (chosen.material) {
      keep(this.add.text(panelX, panelY + 100, t("bag.materialHint"), {
        fontFamily: UI_FONT, fontSize: "14px", color: "#8a5a38", align: "center", wordWrap: { width: 340 }
      }).setOrigin(0.5).setDepth(8));
      return;
    }

    if (chosen.id === "bodyfruit") {
      const unlocked = SaveSystem.data.unlocked || [];
      this.useChar = this.useChar && unlocked.includes(this.useChar) ? this.useChar : unlocked[0] || SaveSystem.data.starterId;
      keep(this.add.text(panelX, panelY + 88, t("bag.pickFighter"), {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#c45a16"
      }).setOrigin(0.5).setDepth(8));
      unlocked.slice(0, 4).forEach((id, i) => {
        const on = id === this.useChar;
        const btn = makeButton(this, panelX - 135 + (i % 2) * 180, panelY + 132 + Math.floor(i / 2) * 44, 168, 36, charName(id), () => {
          AudioSystem.ui();
          this.useChar = id;
          this.paintGrid();
        }, on ? 0xff6a22 : 0xffe08a);
        this.bits.push(btn.gfx, btn.text, btn.bg);
      });
    }

    const use = makeButton(this, panelX, panelY + 210, 220, 48, t("bag.use"), () => this.tryUse(chosen.id), 0x7d5cff);
    this.bits.push(use.gfx, use.text, use.bg);
  }

  tryUse(id) {
    AudioSystem.ui();
    const ctx = id === "bodyfruit" ? { charId: this.useChar } : {};
    const res = SaveSystem.useItem(id, ctx);
    this.note = res.ok
      ? t("bag.used")
      : t("bag.err." + (res.reason || "no"));
    if (res.ok && id === "stone") this.note = t("bag.usedStone");
    if (res.ok && res.charId) this.note = t("bag.usedFruit", { name: charName(res.charId) });
    this.paintGrid();
    const W = this.scale.width;
    const msg = this.add.text(W / 2, 660, this.note, {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#1a7a48"
    }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1600, () => { if (msg && msg.destroy) msg.destroy(); });
  }
}
