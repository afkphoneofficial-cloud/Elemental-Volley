import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { t, charName, I18n } from "../i18n/I18n.js";
import { BAG_COLS, BAG_SLOTS, BAG_TABS, ITEMS, bagTabOf, itemIconKey, stackSlots } from "../data/items.js?v=local196";
import { shopLookLabel, shopLookOf } from "../data/costumeShop.js";
import { openRename, hideRename } from "../ui/renameOverlay.js";

function itemCopy(id, field) {
  const row = ITEMS[id];
  if (row && row.effect === "champSkin") {
    return t("item.champSkin." + field, { name: charName(row.charId), n: row.set });
  }
  const champ = String(id || "").match(/^champ-([a-z]+)-(\d+)$/);
  if (champ) return t("item.champSkin." + field, { name: charName(champ[1]), n: champ[2] | 0 });
  if ((row && row.effect === "shopLook") || shopLookOf(id)) {
    const look = shopLookOf(id);
    return look ? shopLookLabel(look, I18n.lang) : id;
  }
  return t("item." + id + "." + field);
}

function slotList(tab) {
  const cur = SaveSystem.data.currencies || {};
  const rows = [];
  const seen = {};
  const push = (id, n, material) => {
    if (!id || seen[id]) return;
    const count = n | 0;
    if (count <= 0) return;
    seen[id] = true;
    stackSlots(id, count).forEach((row) => rows.push({ ...row, material: Boolean(material) }));
  };
  if (tab === "mat") {
    push("stone", cur.pvp | 0, true);
    push("shard", cur.tokens | 0, true);
    return rows;
  }
  Object.keys(SaveSystem.data.inventory || {}).forEach((id) => {
    const cat = bagTabOf(id) || (String(id).indexOf("champ-") === 0 || shopLookOf(id) ? "look" : "");
    if (cat !== tab) return;
    push(id, SaveSystem.itemCount(id), false);
  });
  if (tab === "look") {
    (SaveSystem.data.shopLooks && SaveSystem.data.shopLooks.owned || []).forEach((id) => {
      push(id, Math.max(1, SaveSystem.itemCount(id)), false);
    });
    Object.keys(SaveSystem.data.champEquipped || {}).forEach((charId) => {
      const set = SaveSystem.data.champEquipped[charId] | 0;
      if (set >= 1 && set <= 3) push("champ-" + charId + "-" + set, Math.max(1, SaveSystem.itemCount("champ-" + charId + "-" + set)), false);
    });
  }
  return rows;
}

function startTab() {
  return ["look", "use", "mat"].find((id) => slotList(id).length) || "use";
}

function iconKey(scene, id) {
  const key = itemIconKey(id);
  if (scene.textures.exists(key)) return key;
  const row = ITEMS[id];
  if (row && row.effect === "ballFx" && scene.textures.exists("ball")) return "ball";
  if (row && row.charId && scene.textures.exists("vis_select_" + row.charId)) return "vis_select_" + row.charId;
  return "item-stone";
}

function isWear(id) {
  const row = ITEMS[id];
  return Boolean(row && (row.effect === "champSkin" || row.effect === "shopLook"))
    || String(id).indexOf("champ-") === 0
    || Boolean(shopLookOf(id));
}

export class BagScene extends Phaser.Scene {
  constructor() { super("bag"); }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    makeButton(this, 96, 36, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start("hub");
    }, 0x7d5cff);

    this.add.text(W / 2, 36, t("bag.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);

    this.tab = startTab();
    this.page = 0;
    this.pick = 0;
    this.bits = [];
    this.paintGrid();
    AudioSystem.playMenu();
  }

  paintGrid() {
    this.bits.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.bits = [];
    const W = this.scale.width;
    const keep = (o) => { this.bits.push(o); return o; };
    BAG_TABS.forEach((row, i) => {
      const on = this.tab === row.id;
      const btn = makeButton(this, 220 + i * 168, 92, 152, 36, t("bag.tab" + row.id.charAt(0).toUpperCase() + row.id.slice(1)), () => {
        AudioSystem.ui();
        this.tab = row.id;
        this.page = 0;
        this.pick = 0;
        this.paintGrid();
      }, on ? row.color : 0xc8bdd8);
      this.bits.push(btn.gfx, btn.text, btn.bg);
    });

    const all = slotList(this.tab);
    const pages = Math.max(1, Math.ceil(all.length / BAG_SLOTS) || 1);
    if (this.page >= pages) this.page = pages - 1;
    const start = this.page * BAG_SLOTS;
    const slots = all.slice(start, start + BAG_SLOTS);
    while (slots.length < BAG_SLOTS) slots.push(null);
    if (this.pick >= BAG_SLOTS) this.pick = 0;

    const size = 108;
    const gap = 12;
    const x0 = 72 + size / 2;
    const y0 = 200;

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
        keep(this.add.image(x, y - 6, iconKey(this, row.id)).setDisplaySize(68, 68).setDepth(7));
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

    if (pages > 1) {
      const prev = makeButton(this, 640, 92, 72, 36, "‹", () => {
        AudioSystem.ui();
        this.page = Math.max(0, this.page - 1);
        this.pick = 0;
        this.paintGrid();
      }, 0xff6a22);
      const next = makeButton(this, 800, 92, 72, 36, "›", () => {
        AudioSystem.ui();
        this.page = Math.min(pages - 1, this.page + 1);
        this.pick = 0;
        this.paintGrid();
      }, 0xff6a22);
      this.bits.push(prev.gfx, prev.text, prev.bg, next.gfx, next.text, next.bg);
      keep(this.add.text(720, 92, (this.page + 1) + "/" + pages, {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#7a4a30"
      }).setOrigin(0.5).setDepth(8));
    }

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
    keep(this.add.image(panelX, panelY - 170, iconKey(this, chosen.id)).setDisplaySize(96, 96).setDepth(8));
    keep(this.add.text(panelX, panelY - 96, itemCopy(chosen.id, "name"), {
      fontFamily: UI_FONT, fontSize: "22px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5).setDepth(8));
    const fxRow = ITEMS[chosen.id];
    if (fxRow && fxRow.effect === "ballFx") {
      keep(this.add.text(panelX, panelY - 68, fxRow.char ? t("shop.fxFor", { name: charName(fxRow.char) }) : t("shop.fxForAll"), {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#c45a16"
      }).setOrigin(0.5).setDepth(8));
    }
    keep(this.add.text(panelX, panelY - 40, t("bag.held", { n: chosen.n }), {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5).setDepth(8));

    if (chosen.material) return;

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

    const wear = isWear(chosen.id);
    const ballFx = ITEMS[chosen.id] && ITEMS[chosen.id].effect === "ballFx";
    const armed = ballFx && SaveSystem.armedBallFx() === chosen.id;
    const useX = wear || armed ? panelX - 78 : panelX;
    const useW = wear || armed ? 140 : 220;
    const use = makeButton(this, useX, panelY + 210, useW, 44, armed ? t("shop.using") : t("bag.use"), () => this.tryUse(chosen.id), 0x7d5cff);
    this.bits.push(use.gfx, use.text, use.bg);
    if (wear) {
      const off = makeButton(this, panelX + 78, panelY + 210, 140, 44, t("shop.buyCancel"), () => this.tryOff(chosen.id), 0xff6a22);
      this.bits.push(off.gfx, off.text, off.bg);
    } else if (armed) {
      const off = makeButton(this, panelX + 78, panelY + 210, 140, 44, t("shop.buyCancel"), () => this.tryOff(chosen.id), 0xff6a22);
      this.bits.push(off.gfx, off.text, off.bg);
    }
  }

  flash(note, ok) {
    const W = this.scale.width;
    const msg = this.add.text(W / 2, 660, note, {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: ok ? "#1a7a48" : "#c45a16"
    }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1600, () => { if (msg && msg.destroy) msg.destroy(); });
  }

  tryUse(id) {
    AudioSystem.ui();
    if (id === "namestone") {
      openRename((ok, name) => {
        if (!ok) return;
        if (!SaveSystem.consumeItem("namestone", 1)) {
          this.flash(t("bag.err.none"), false);
          return;
        }
        this.paintGrid();
        this.flash(t("bag.usedRename", { name }), true);
      });
      return;
    }
    const ctx = id === "bodyfruit" ? { charId: this.useChar } : {};
    const res = SaveSystem.useItem(id, ctx);
    let note = res.ok ? t("bag.used") : t("bag.err." + (res.reason || "no"));
    if (res.ok && id === "stone") note = t("bag.usedStone");
    if (res.ok && res.charId && res.effect === "respecLevel") note = t("bag.usedFruit", { name: charName(res.charId) });
    if (res.ok && (res.effect === "champSkin" || res.effect === "shopLook")) {
      note = t("bag.usedChamp", { name: charName(res.charId) });
    }
    if (res.ok && res.effect === "ballFx") note = t("bag.usedBall");
    this.paintGrid();
    this.flash(note, res.ok);
  }

  tryOff(id) {
    AudioSystem.ui();
    const row = ITEMS[id];
    if (row && row.effect === "ballFx") {
      SaveSystem.clearBallFx();
      this.paintGrid();
      this.flash(t("bag.usedBallOff"), true);
      return;
    }
    const charId = row && row.charId;
    const res = SaveSystem.unequipOutfit(charId);
    const note = res.ok
      ? t("bag.usedChampOff", { name: charName(charId) })
      : t("bag.err." + (res.reason || "no"));
    this.paintGrid();
    this.flash(note, res.ok);
  }

  shutdown() {
    hideRename();
  }
}
