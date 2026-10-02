import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { t, charName, I18n } from "../i18n/I18n.js";
import { BAG_COLS, BAG_SLOTS, BAG_TABS, ITEMS, bagTabOf, itemIconKey, stackSlots, wearCharOf, wearKindOf, wearKindRank } from "../data/items.js?v=local198";
import { shopLookLabel, shopLookOf } from "../data/costumeShop.js";
import { openRename, hideRename } from "../ui/renameOverlay.js";
import { ROSTER_IDS } from "../data/roster.js";
import { texHeroSelect } from "../data/seasonLooks.js";
import { ArtLoad } from "../systems/ArtLoad.js?v=local273";

const GEAR_SLOTS = [
  { id: "look", x: -148, y: -64 },
  { id: "ball", x: -148, y: 64 },
  { id: "ult", x: 148, y: -64 },
  { id: "sfx", x: 148, y: 64 }
];

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

function slotList(tab, sort, filter) {
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
    if (filter === "sfx") return [];
    const filtered = filter ? rows.filter((row) => wearKindOf(row.id) === filter) : rows;
    filtered.sort((a, b) => {
      if (sort === "char") {
        const ca = wearCharOf(a.id) || "zzzz";
        const cb = wearCharOf(b.id) || "zzzz";
        const ia = ROSTER_IDS.indexOf(ca);
        const ib = ROSTER_IDS.indexOf(cb);
        if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        return wearKindRank(wearKindOf(a.id)) - wearKindRank(wearKindOf(b.id));
      }
      const ka = wearKindRank(wearKindOf(a.id));
      const kb = wearKindRank(wearKindOf(b.id));
      if (ka !== kb) return ka - kb;
      const ca = wearCharOf(a.id);
      const cb = wearCharOf(b.id);
      return ROSTER_IDS.indexOf(ca) - ROSTER_IDS.indexOf(cb);
    });
    return filtered;
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
  if (row && (row.effect === "ballFx" || row.effect === "ultFx") && scene.textures.exists("ball")) {
    if (row.effect === "ultFx" && scene.textures.exists(row.icon)) return row.icon;
    if (row.effect === "ballFx") return scene.textures.exists(row.icon) ? row.icon : "ball";
  }
  if (row && row.charId && scene.textures.exists("vis_select_" + row.charId)) return "vis_select_" + row.charId;
  return "item-stone";
}

function isWear(id) {
  return Boolean(wearKindOf(id));
}

function unlockedChars() {
  return ROSTER_IDS.filter((id) => SaveSystem.isUnlocked(id));
}

function gearItem(charId, kind) {
  if (kind === "look") return SaveSystem.outfitIdOf(charId);
  if (kind === "ball") return SaveSystem.armedBallFx(charId);
  if (kind === "ult") return SaveSystem.gearOf(charId).ult;
  if (kind === "sfx") return SaveSystem.gearOf(charId).sfx;
  return "";
}

export class BagScene extends Phaser.Scene {
  constructor() { super("bag"); }

  init(data) {
    this.bootTab = data && data.tab;
    this.bootChar = data && data.charId;
  }

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

    const chars = unlockedChars();
    this.dressChar = chars.includes(this.bootChar) ? this.bootChar
      : (chars.includes(SaveSystem.data.showcaseId) ? SaveSystem.data.showcaseId : (chars[0] || SaveSystem.data.starterId || "ignis"));
    this.tab = ["look", "use", "mat"].indexOf(this.bootTab) >= 0 ? this.bootTab : startTab();
    this.page = 0;
    this.pick = 0;
    this.wearSort = "slot";
    this.gearSlot = "";
    this.focusId = "";
    this.charOpen = false;
    this.bits = [];
    this.paintGrid();
    AudioSystem.playMenu();
    void ArtLoad.ensureWorn(this, this.dressChar).then(() => {
      if (this.sys && this.sys.isActive()) this.paintGrid();
    });
  }

  paintGrid() {
    this.bits.forEach((o) => { if (o && o.destroy) o.destroy(); });
    this.bits = [];
    const W = this.scale.width;
    const keep = (o) => { this.bits.push(o); return o; };
    this.paintDress(keep);

    BAG_TABS.forEach((row, i) => {
      const on = this.tab === row.id;
      const btn = makeButton(this, 560 + i * 148, 88, 136, 34, t("bag.tab" + row.id.charAt(0).toUpperCase() + row.id.slice(1)), () => {
        AudioSystem.ui();
        this.tab = row.id;
        this.page = 0;
        this.pick = 0;
        this.focusId = "";
        this.charOpen = false;
        this.paintGrid();
      }, on ? row.color : 0xc8bdd8);
      this.bits.push(btn.gfx, btn.text, btn.bg);
    });

    if (this.tab === "look") {
      const slotOn = this.wearSort === "slot";
      const bySlot = makeButton(this, 560, 128, 136, 30, t("bag.sortSlot"), () => {
        AudioSystem.ui();
        this.wearSort = "slot";
        this.page = 0;
        this.paintGrid();
      }, slotOn ? 0xff6a22 : 0xffe08a);
      const byChar = makeButton(this, 708, 128, 136, 30, t("bag.sortChar"), () => {
        AudioSystem.ui();
        this.wearSort = "char";
        this.page = 0;
        this.paintGrid();
      }, !slotOn ? 0xff6a22 : 0xffe08a);
      this.bits.push(bySlot.gfx, bySlot.text, bySlot.bg, byChar.gfx, byChar.text, byChar.bg);
    }

    const all = slotList(this.tab, this.wearSort, this.tab === "look" ? this.gearSlot : "");
    const pages = Math.max(1, Math.ceil(all.length / BAG_SLOTS) || 1);
    if (this.focusId) {
      const idx = all.findIndex((row) => row && row.id === this.focusId);
      if (idx >= 0) {
        this.page = Math.floor(idx / BAG_SLOTS);
        this.pick = idx % BAG_SLOTS;
      }
    }
    if (this.page >= pages) this.page = pages - 1;
    const start = this.page * BAG_SLOTS;
    const slots = all.slice(start, start + BAG_SLOTS);
    while (slots.length < BAG_SLOTS) slots.push(null);
    if (this.pick >= BAG_SLOTS) this.pick = 0;

    const size = 92;
    const gap = 10;
    const x0 = 488 + size / 2;
    const y0 = this.tab === "look" ? 248 : 168;

    slots.forEach((row, i) => {
      const col = i % BAG_COLS;
      const r = Math.floor(i / BAG_COLS);
      const x = x0 + col * (size + gap);
      const y = y0 + r * (size + gap);
      const on = i === this.pick && row;
      const g = keep(this.add.graphics().setDepth(6));
      g.fillStyle(on ? 0xffe8c8 : 0xfff6ea, 0.96);
      g.fillRoundedRect(x - size / 2, y - size / 2, size, size, 14);
      g.lineStyle(3, on ? 0xff6a22 : 0xffb14a, on ? 1 : 0.55);
      g.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 14);
      if (row) {
        keep(this.add.image(x, y - 4, iconKey(this, row.id)).setDisplaySize(58, 58).setDepth(7));
        keep(this.add.text(x + 34, y + 32, "x" + row.n, {
          fontFamily: UI_FONT, fontSize: "13px", fontStyle: "900", color: "#3a2418"
        }).setOrigin(1, 1).setDepth(8));
      }
      keep(this.add.zone(x, y, size, size).setInteractive({ useHandCursor: true }).setDepth(9)
        .on("pointerdown", () => {
          AudioSystem.ui();
          this.pick = i;
          this.focusId = row ? row.id : "";
          if (row && this.tab === "look") this.gearSlot = wearKindOf(row.id) || this.gearSlot;
          this.paintGrid();
        }));
    });

    if (pages > 1) {
      const prev = makeButton(this, 980, 88, 56, 34, "‹", () => {
        AudioSystem.ui();
        this.page = Math.max(0, this.page - 1);
        this.pick = 0;
        this.focusId = "";
        this.paintGrid();
      }, 0xff6a22);
      const next = makeButton(this, 1124, 88, 56, 34, "›", () => {
        AudioSystem.ui();
        this.page = Math.min(pages - 1, this.page + 1);
        this.pick = 0;
        this.focusId = "";
        this.paintGrid();
      }, 0xff6a22);
      this.bits.push(prev.gfx, prev.text, prev.bg, next.gfx, next.text, next.bg);
      keep(this.add.text(1052, 88, (this.page + 1) + "/" + pages, {
        fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#7a4a30"
      }).setOrigin(0.5).setDepth(8));
    }

    const panelX = 230;
    const panelY = 624;
    const pg = keep(this.add.graphics().setDepth(6));
    pg.fillStyle(0xfff6ea, 0.98);
    pg.fillRoundedRect(24, 552, 412, 144, 22);
    pg.lineStyle(3, 0xff6a22, 0.8);
    pg.strokeRoundedRect(24, 552, 412, 144, 22);

    const chosen = slots[this.pick];
    if (!chosen) {
      keep(this.add.text(panelX, panelY, t("bag.slotEmpty"), {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#8a5a38", align: "center", wordWrap: { width: 360 }
      }).setOrigin(0.5).setDepth(8));
      return;
    }
    keep(this.add.image(panelX - 148, panelY - 8, iconKey(this, chosen.id)).setDisplaySize(56, 56).setDepth(8));
    keep(this.add.text(panelX + 20, panelY - 52, itemCopy(chosen.id, "name"), {
      fontFamily: UI_FONT, fontSize: "17px", fontStyle: "900", color: "#3a2418", wordWrap: { width: 280 }
    }).setOrigin(0.5, 0).setDepth(8));
    const fxRow = ITEMS[chosen.id];
    if (fxRow && (fxRow.effect === "ballFx" || fxRow.effect === "ultFx")) {
      keep(this.add.text(panelX + 20, panelY - 26, fxRow.char ? t("shop.fxFor", { name: charName(fxRow.char) }) : t("shop.fxForAll"), {
        fontFamily: UI_FONT, fontSize: "12px", fontStyle: "800", color: "#c45a16"
      }).setOrigin(0.5, 0).setDepth(8));
    }
    keep(this.add.text(panelX + 20, panelY - 4, t("bag.held", { n: chosen.n }), {
      fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
    }).setOrigin(0.5, 0).setDepth(8));

    if (chosen.material) return;

    if (chosen.id === "bodyfruit") this.useChar = this.dressChar;

    const wear = isWear(chosen.id);
    const ballFx = ITEMS[chosen.id] && ITEMS[chosen.id].effect === "ballFx";
    const ultFx = ITEMS[chosen.id] && ITEMS[chosen.id].effect === "ultFx";
    const armed = (ballFx && SaveSystem.armedBallFx(this.dressChar) === chosen.id)
      || (ultFx && SaveSystem.armedUlt(this.dressChar) === chosen.id);
    const useX = wear || armed ? panelX - 70 : panelX;
    const useW = wear || armed ? 128 : 200;
    const use = makeButton(this, useX, panelY + 42, useW, 36, armed ? t("shop.using") : t("bag.use"), () => this.tryUse(chosen.id), 0x7d5cff);
    this.bits.push(use.gfx, use.text, use.bg);
    if (wear || armed) {
      const off = makeButton(this, panelX + 78, panelY + 42, 128, 36, t("bag.unequip"), () => this.tryOff(chosen.id), 0xff6a22);
      this.bits.push(off.gfx, off.text, off.bg);
    }
  }

  paintDress(keep) {
    const cx = 230;
    const cy = 268;
    const g = keep(this.add.graphics().setDepth(5));
    g.fillStyle(0xfff6ea, 0.98);
    g.fillRoundedRect(24, 72, 412, 456, 22);
    g.lineStyle(3, 0xff8ab8, 0.9);
    g.strokeRoundedRect(24, 72, 412, 456, 22);

    const chars = unlockedChars();
    const drop = makeButton(this, cx, 108, 240, 36, "▾  " + charName(this.dressChar), () => {
      AudioSystem.ui();
      this.charOpen = !this.charOpen;
      this.paintGrid();
    }, 0xff8ab8);
    this.bits.push(drop.gfx, drop.text, drop.bg);
    keep(this.add.text(cx, 140, t("bag.charPick"), {
      fontFamily: UI_FONT, fontSize: "12px", fontStyle: "700", color: "#8a5a38"
    }).setOrigin(0.5).setDepth(8));

    const plate = keep(this.add.circle(cx, cy, 92, 0xffe8c8, 1).setStrokeStyle(4, 0xfff6ea, 0.95).setDepth(6));
    void plate;
    const key = texHeroSelect(this, this.dressChar);
    keep(this.add.image(cx, cy + 4, key).setDisplaySize(168, 168).setDepth(10));

    GEAR_SLOTS.forEach((slot) => {
      const x = cx + slot.x;
      const y = cy + slot.y;
      const filled = gearItem(this.dressChar, slot.id);
      const on = this.gearSlot === slot.id;
      const sg = keep(this.add.graphics().setDepth(7));
      sg.fillStyle(on ? 0xffe8c8 : 0xffffff, 0.96);
      sg.fillRoundedRect(x - 44, y - 44, 88, 88, 16);
      sg.lineStyle(3, on ? 0xff6a22 : 0xffb14a, on ? 1 : 0.7);
      sg.strokeRoundedRect(x - 44, y - 44, 88, 88, 16);
      if (filled) {
        keep(this.add.image(x, y - 4, iconKey(this, filled)).setDisplaySize(52, 52).setDepth(8));
      } else {
        keep(this.add.text(x, y - 2, "＋", {
          fontFamily: UI_FONT, fontSize: "26px", fontStyle: "800", color: "#d8b090"
        }).setOrigin(0.5).setDepth(8));
      }
      keep(this.add.text(x, y + 54, t("bag.slot" + slot.id.charAt(0).toUpperCase() + slot.id.slice(1)), {
        fontFamily: UI_FONT, fontSize: "13px", fontStyle: "800", color: "#7a4a30"
      }).setOrigin(0.5).setDepth(8));
      keep(this.add.zone(x, y, 88, 88).setInteractive({ useHandCursor: true }).setDepth(12)
        .on("pointerdown", () => this.tapGear(slot.id)));
    });

    if (this.charOpen) {
      const menu = keep(this.add.graphics().setDepth(30));
      const h = 12 + chars.length * 36;
      menu.fillStyle(0xfff6ea, 1);
      menu.fillRoundedRect(cx - 120, 128, 240, h, 14);
      menu.lineStyle(2, 0xff8ab8, 1);
      menu.strokeRoundedRect(cx - 120, 128, 240, h, 14);
      chars.forEach((id, i) => {
        const y = 148 + i * 36;
        const on = id === this.dressChar;
        keep(this.add.text(cx, y, charName(id), {
          fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: on ? "#c45a16" : "#3a2418"
        }).setOrigin(0.5).setDepth(31));
        keep(this.add.zone(cx, y, 220, 34).setInteractive({ useHandCursor: true }).setDepth(32)
          .on("pointerdown", () => {
            AudioSystem.ui();
            this.dressChar = id;
            this.charOpen = false;
            this.paintGrid();
            void ArtLoad.ensureWorn(this, id).then(() => {
              if (this.sys && this.sys.isActive() && this.dressChar === id) this.paintGrid();
            });
          }));
      });
    }
  }

  tapGear(kind) {
    AudioSystem.ui();
    this.charOpen = false;
    if (kind === "sfx") {
      this.flash(t("bag.gearSoon"), false);
      return;
    }
    this.tab = "look";
    this.gearSlot = kind;
    this.focusId = gearItem(this.dressChar, kind) || "";
    this.page = 0;
    this.pick = 0;
    this.paintGrid();
  }

  flash(note, ok) {
    const msg = this.add.text(860, 680, note, {
      fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: ok ? "#1a7a48" : "#c45a16"
    }).setOrigin(0.5).setDepth(40);
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
    const kind = wearKindOf(id);
    const ctx = id === "bodyfruit"
      ? { charId: this.useChar }
      : ((kind === "ball" || kind === "ult") ? { charId: this.dressChar } : {});
    const res = SaveSystem.useItem(id, ctx);
    let note = res.ok ? t("bag.used") : t("bag.err." + (res.reason || "no"));
    if (res.ok && id === "stone") note = t("bag.usedStone");
    if (res.ok && res.charId && res.effect === "respecLevel") note = t("bag.usedFruit", { name: charName(res.charId) });
    if (res.ok && id === "namestone") note = t("bag.usedRename");
    if (res.ok && (res.effect === "champSkin" || res.effect === "shopLook" || res.effect === "ballFx" || res.effect === "ultFx")) {
      note = t("bag.wornOn");
      if (res.charId) this.dressChar = res.charId;
    }
    this.paintGrid();
    this.flash(note, res.ok);
  }

  tryOff(id) {
    AudioSystem.ui();
    const row = ITEMS[id];
    if (row && row.effect === "ballFx") {
      const onChar = ROSTER_IDS.find((charId) => SaveSystem.armedBallFx(charId) === id) || this.dressChar;
      SaveSystem.clearBallFx(onChar);
      this.paintGrid();
      this.flash(t("bag.takenOff"), true);
      return;
    }
    if (row && row.effect === "ultFx") {
      const onChar = ROSTER_IDS.find((charId) => SaveSystem.armedUlt(charId) === id) || this.dressChar;
      SaveSystem.clearUlt(onChar);
      this.paintGrid();
      this.flash(t("bag.takenOff"), true);
      return;
    }
    const charId = (row && row.charId) || wearCharOf(id) || this.dressChar;
    const res = SaveSystem.unequipOutfit(charId);
    const note = res.ok ? t("bag.takenOff") : t("bag.err." + (res.reason || "no"));
    this.paintGrid();
    this.flash(note, res.ok);
  }

  shutdown() {
    hideRename();
  }
}
