import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { paintTabs } from "../ui/sceneTabs.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { itemIconKey } from "../data/items.js";
import { SHOP_TABS, SHOP_USE_GOODS, SHOP_TRADE_GOODS, EFFECT_SUBS } from "../data/shopCatalog.js?v=local203";
import { BALL_FX } from "../data/ballFx.js?v=local196";
import { ULT_ORBS } from "../data/ultOrb.js?v=local198";
import { paintWalletBar } from "../ui/walletBar.js";
import { SELECT_PLATE } from "../fx/SelectHover.js";
import { openShopBuy, closeShopBuy, closeShopNote, shopNote } from "../ui/shopBuyPopup.js";
import { openLookPreview, closeLookPreview } from "../ui/shopLookPreview.js";
import { openBallPreview, closeBallPreview } from "../ui/shopBallPreview.js?v=local196";
import { openOrbPreview, closeOrbPreview } from "../ui/shopOrbPreview.js?v=local201";
import { COSTUME_TIERS, shopLooksInTier, shopLookVis, shopLookLabel, costumeTierLabel } from "../data/costumeShop.js";

const CARD_W = 196;
const CARD_H = 236;
const CARD_GAP = 14;
const CARD_COLS = 5;

export class ShopScene extends Phaser.Scene {
  constructor() { super("shop"); }

  init(data) {
    this.from = (data && data.from) || "hub";
    this.tab = (data && data.tab) || "fighters";
    this.costumeTier = (data && data.costumeTier) || "mist";
    this.costumePage = Math.max(0, (data && data.costumePage) | 0);
    this.effectSub = ["ball", "orb", "sfx"].indexOf(data && data.effectSub) >= 0 ? data.effectSub : "ball";
    this.note = (data && data.note) || "";
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    SaveSystem.grantTryPowder();
    drawGrid(this);
    const W = this.scale.width;
    paintWalletBar(this, "shop");
    makeButton(this, 96, 40, 132, 40, t("nav.back"), () => {
      AudioSystem.ui();
      this.scene.start(this.from === "pass" ? "pass" : "hub", this.from === "pass" ? { from: "shop" } : undefined);
    }, 0x7d5cff);
    makeButton(this, 268, 40, 156, 40, t("pass.short"), () => {
      AudioSystem.ui();
      this.scene.start("pass", { from: "shop" });
    }, 0xff8ab8);
    this.add.text(W / 2, 40, t("shop.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);

    paintTabs(this, 96, SHOP_TABS.map((row) => ({
      id: row.id,
      label: t("shop.tab." + row.id),
      color: row.color,
      go: () => this.scene.start("shop", { tab: row.id, costumeTier: this.costumeTier, costumePage: 0, effectSub: this.effectSub })
    })), this.tab);

    if (this.tab === "fighters") this.paintFighters();
    else if (this.tab === "cosmetics") this.paintCosmetics();
    else if (this.tab === "effect") this.paintEffects();
    else if (this.tab === "items") this.paintItems();
    else this.paintTrade();

    if (this.note) shopNote(this, this.note, true);

    this.events.once("shutdown", () => {
      closeShopBuy(this);
      closeShopNote(this);
      closeLookPreview(this);
      closeBallPreview(this);
      closeOrbPreview(this);
    });
  }

  refresh(note) {
    this.scene.start("shop", {
      tab: this.tab,
      costumeTier: this.costumeTier,
      costumePage: this.costumePage,
      effectSub: this.effectSub,
      note: note || ""
    });
  }

  bought(name, n) {
    this.refresh(t("shop.bought", { name, n: Math.max(1, n | 0) }));
  }

  traded(name, n) {
    this.refresh(t("shop.traded", { name, n: Math.max(1, n | 0) }));
  }

  slots(n, padLeft, cols) {
    const W = this.scale.width;
    const useCols = cols || CARD_COLS;
    const inset = padLeft | 0;
    const total = useCols * CARD_W + (useCols - 1) * CARD_GAP;
    const left = Math.max(inset + 16, inset + (W - inset - total) / 2);
    const top = 132;
    const out = [];
    for (let i = 0; i < n; i++) {
      const col = i % useCols;
      const row = (i / useCols) | 0;
      out.push({
        x: left + CARD_W / 2 + col * (CARD_W + CARD_GAP),
        y: top + CARD_H / 2 + row * (CARD_H + CARD_GAP)
      });
    }
    return out;
  }

  pic(key, x, y, size, alpha) {
    const k = this.textures.exists(key) ? key : "item-shard";
    return this.add.image(x, y, k).setDisplaySize(size, size).setAlpha(alpha == null ? 1 : alpha).setDepth(8);
  }

  paintCard(x, y, spec) {
    const w = CARD_W;
    const h = CARD_H;
    const idle = spec.stroke || 0xe8c8a8;
    const accent = spec.accent || 0x4aa6e8;
    const gfx = this.add.graphics().setDepth(5);
    const draw = (hot) => {
      gfx.clear();
      gfx.fillStyle(spec.dim ? 0xe4ddd8 : 0xfffaf4, 0.98);
      gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
      gfx.lineStyle(hot ? 3 : 2, hot ? accent : idle, hot ? 1 : 0.88);
      gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
      gfx.fillStyle(0xfff3e4, spec.dim ? 0.55 : 0.95);
      gfx.fillRoundedRect(x - 50, y - 38, 100, 100, 16);
    };
    draw(false);

    this.add.text(x, y - h / 2 + 18, spec.title, {
      fontFamily: UI_FONT, fontSize: "14px", fontStyle: "800", color: "#6a4030",
      align: "center", wordWrap: { width: w - 18 }
    }).setOrigin(0.5).setDepth(8);
    if (spec.sub) {
      this.add.text(x, y - h / 2 + 40, spec.sub, {
        fontFamily: UI_FONT, fontSize: "11px", fontStyle: "700", color: "#c45a16",
        align: "center", wordWrap: { width: w - 16 }
      }).setOrigin(0.5).setDepth(8);
    }

    const ix = x;
    const iy = y + 10;
    if (spec.icon) this.pic(spec.icon, ix, iy, spec.iconSize || 86, spec.dim ? 0.42 : 1);
    if (spec.paintIcon) spec.paintIcon(ix, iy);

    if (spec.hint) {
      this.add.text(x, y + 72, spec.hint, {
        fontFamily: UI_FONT, fontSize: "11px", fontStyle: "700", color: "#c49a7a",
        align: "center", wordWrap: { width: w - 18 }
      }).setOrigin(0.5).setDepth(8);
    }

    const py = y + h / 2 - 22;
    if (spec.priceIcon) {
      this.pic(spec.priceIcon, x - (spec.price != null ? 16 : 0), py, 22);
      if (spec.price != null) {
        this.add.text(x + 14, py, String(spec.price), {
          fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#3a2418"
        }).setOrigin(0.5).setDepth(10);
      }
    } else if (spec.priceMark) {
      this.add.text(x, py, spec.priceMark, {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "900", color: "#2a7a38"
      }).setOrigin(0.5).setDepth(10);
    }

    if (spec.stamp) {
      this.add.text(x, iy, spec.stamp, {
        fontFamily: UI_FONT, fontSize: "15px", fontStyle: "900", color: spec.stampColor || "#8a7088"
      }).setOrigin(0.5).setDepth(12).setAngle(-18).setAlpha(0.94);
    }

    const zone = this.add.zone(x, y, w, h).setDepth(14);
    if (spec.onClick) {
      zone.setInteractive({ useHandCursor: true });
      zone.on("pointerover", () => draw(true));
      zone.on("pointerout", () => draw(false));
      zone.on("pointerdown", spec.onClick);
    }
    if (spec.zoom) {
      const zx = x + w / 2 - 20;
      const zy = y - h / 2 + 20;
      const zg = this.add.graphics().setDepth(18);
      zg.fillStyle(0xfff6ea, 1);
      zg.fillCircle(zx, zy, 16);
      zg.lineStyle(2, 0x4aa6e8, 0.95);
      zg.strokeCircle(zx, zy, 16);
      this.add.text(zx, zy - 1, "⌕", {
        fontFamily: UI_FONT, fontSize: "18px", fontStyle: "900", color: "#3a6aaa"
      }).setOrigin(0.5).setDepth(19);
      const zz = this.add.circle(zx, zy, 16, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(20);
      zz.on("pointerdown", (p) => {
        if (p && p.event && p.event.stopPropagation) p.event.stopPropagation();
        spec.zoom();
      });
    }
  }

  bag() {
    return SaveSystem.data.currencies || {};
  }

  paintCosmetics() {
    COSTUME_TIERS.forEach((tier, i) => {
      const on = tier.id === this.costumeTier;
      makeButton(this, 92, 168 + i * 52, 148, 44, costumeTierLabel(tier, I18n.lang), () => {
        AudioSystem.ui();
        this.scene.start("shop", { tab: "cosmetics", costumeTier: tier.id, costumePage: 0, effectSub: this.effectSub });
      }, on ? (tier.color || 0xffb14a) : 0xc8bdd8);
    });
    const tier = COSTUME_TIERS.find((row) => row.id === this.costumeTier) || COSTUME_TIERS[0];
    if (!tier.open) {
      this.add.text(this.scale.width / 2 + 70, 360, t("shop.tierSoon"), {
        fontFamily: UI_FONT, fontSize: "20px", fontStyle: "800", color: "#8a5a38", align: "center", wordWrap: { width: 640 }
      }).setOrigin(0.5);
      return;
    }
    const rows = shopLooksInTier(tier.id);
    const per = 8;
    const pages = Math.max(1, Math.ceil(rows.length / per));
    this.costumePage = Math.min(this.costumePage, pages - 1);
    const slice = rows.slice(this.costumePage * per, this.costumePage * per + per);
    const cells = this.slots(slice.length, 176, 4);
    slice.forEach((look, i) => {
      const owned = SaveSystem.ownedShopLook(look.id);
      const hasChar = SaveSystem.isUnlocked(look.charId);
      const worn = hasChar && SaveSystem.wornShopLook(look.charId) === look.id;
      const icon = this.textures.exists(shopLookVis(look.id, "select")) ? shopLookVis(look.id, "select") : "vis_select_" + look.charId;
      let stamp = null;
      let priceIcon = null;
      let price = null;
      let priceMark = null;
      let onClick = null;
      let dim = false;
      if (!hasChar) {
        dim = true;
        stamp = t("shop.needCharStamp");
        onClick = () => {
          AudioSystem.ui();
          shopNote(this, t("shop.needChar", { name: I18n.charName(look.charId) }), false);
        };
      } else if (owned) {
        dim = true;
        stamp = t("shop.owned");
        onClick = worn ? null : () => {
          SaveSystem.wearShopLook(look.id);
          AudioSystem.ui();
          this.refresh();
        };
      } else {
        priceIcon = "item-powder";
        price = look.price;
        onClick = () => {
          openShopBuy(this, {
            title: shopLookLabel(look, I18n.lang),
            icon,
            kind: t("shop.kindLook"),
            owned: 0,
            body: I18n.charName(look.charId),
            priceIcon: "item-powder",
            unitPrice: look.price,
            have: this.bag().premium | 0,
            stack: false,
            onConfirm: () => SaveSystem.buyShopLook(look.id),
            after: () => this.bought(shopLookLabel(look, I18n.lang), 1)
          });
        };
      }
      this.paintCard(cells[i].x, cells[i].y, {
        title: shopLookLabel(look, I18n.lang),
        hint: I18n.charName(look.charId),
        icon,
        iconSize: 86,
        stroke: look.stroke,
        accent: look.stroke,
        stamp,
        priceIcon,
        price,
        priceMark,
        dim,
        onClick,
        zoom: () => {
          AudioSystem.ui();
          openLookPreview(this, look.id);
        }
      });
    });
    if (pages > 1) {
      const px = this.scale.width / 2 + 70;
      const py = 668;
      makeButton(this, px - 130, py, 88, 40, "‹", () => {
        AudioSystem.ui();
        this.scene.start("shop", {
          tab: "cosmetics",
          costumeTier: this.costumeTier,
          costumePage: (this.costumePage + pages - 1) % pages,
          effectSub: this.effectSub
        });
      }, 0x4aa6e8);
      this.add.text(px, py, t("shop.page", { n: this.costumePage + 1, m: pages }), {
        fontFamily: UI_FONT, fontSize: "16px", fontStyle: "800", color: "#3a2418"
      }).setOrigin(0.5);
      makeButton(this, px + 130, py, 88, 40, "›", () => {
        AudioSystem.ui();
        this.scene.start("shop", {
          tab: "cosmetics",
          costumeTier: this.costumeTier,
          costumePage: (this.costumePage + 1) % pages,
          effectSub: this.effectSub
        });
      }, 0x4aa6e8);
    }
  }

  paintFighters() {
    const cells = this.slots(ROSTER_IDS.length);
    ROSTER_IDS.forEach((id, i) => {
      const data = ROSTER[id];
      const owned = SaveSystem.isUnlocked(id);
      const face = this.textures.exists("vis_select_" + id) ? "vis_select_" + id : "vis_" + id;
      this.paintCard(cells[i].x, cells[i].y, {
        title: I18n.charName(id),
        icon: face,
        iconSize: 90,
        hint: owned ? "" : t("shop.hintUnlock"),
        stroke: SELECT_PLATE[id] || data.colors.main,
        accent: SELECT_PLATE[id] || data.colors.main,
        dim: owned,
        stamp: owned ? t("shop.owned") : null,
        priceIcon: owned ? null : "item-shard",
        price: owned ? null : ECONOMY.unlockTokenCost,
        onClick: owned ? null : () => {
          openShopBuy(this, {
            title: I18n.charName(id),
            icon: face,
            kind: t("shop.kindFighter"),
            owned: owned ? 1 : 0,
            body: t("shop.buyUnlockBody"),
            priceIcon: "item-shard",
            unitPrice: ECONOMY.unlockTokenCost,
            have: this.bag().tokens | 0,
            stack: false,
            onConfirm: () => SaveSystem.unlockWithTokens(id, ECONOMY.unlockTokenCost),
            after: () => this.bought(I18n.charName(id), 1)
          });
        }
      });
    });
  }

  paintEffects() {
    EFFECT_SUBS.forEach((sub, i) => {
      const on = sub.id === this.effectSub;
      makeButton(this, 92, 168 + i * 52, 148, 44, t("shop.fxTab." + sub.id), () => {
        AudioSystem.ui();
        this.scene.start("shop", { tab: "effect", costumeTier: this.costumeTier, costumePage: 0, effectSub: sub.id });
      }, on ? sub.color : 0xc8bdd8);
    });
    if (this.effectSub === "sfx") {
      this.add.text(this.scale.width / 2 + 70, 360, t("shop.sfxSoon"), {
        fontFamily: UI_FONT, fontSize: "20px", fontStyle: "800", color: "#8a5a38", align: "center", wordWrap: { width: 640 }
      }).setOrigin(0.5);
      return;
    }
    const goods = (this.effectSub === "orb" ? ULT_ORBS : BALL_FX).map((row) => ({
      ...row,
      fxKind: this.effectSub === "orb" ? "orb" : "ball"
    }));
    const cells = this.slots(goods.length, 176, 4);
    goods.forEach((row, i) => {
      const have = SaveSystem.itemCount(row.id);
      const icon = this.textures.exists(row.tex) ? row.tex : "ball";
      this.paintCard(cells[i].x, cells[i].y, {
        title: t("item." + row.id + ".name"),
        sub: row.char ? t("shop.fxFor", { name: I18n.charName(row.char) }) : t("shop.fxForAll"),
        icon,
        hint: "",
        stroke: row.ring,
        accent: row.color,
        dim: have > 0,
        stamp: have > 0 ? t("shop.owned") : null,
        priceIcon: have > 0 ? null : "item-powder",
        price: have > 0 ? null : row.price,
        onClick: () => {
          if (have) {
            const charId = row.char || SaveSystem.data.showcaseId || SaveSystem.data.starterId;
            SaveSystem.useItem(row.id, { charId });
            AudioSystem.ui();
            this.refresh();
            return;
          }
          openShopBuy(this, {
            title: t("item." + row.id + ".name"),
            icon,
            kind: t(row.fxKind === "orb" ? "shop.kindOrb" : "shop.kindFx"),
            owned: have,
            body: t("item." + row.id + ".body"),
            priceIcon: "item-powder",
            unitPrice: row.price,
            have: this.bag().premium | 0,
            maxQty: 99,
            onConfirm: (qty) => SaveSystem.buyWithPremium(row.id, row.price, qty),
            after: (qty) => this.bought(t("item." + row.id + ".name"), qty)
          });
        },
        zoom: () => {
          AudioSystem.ui();
          if (row.fxKind === "orb") openOrbPreview(this, row.id);
          else openBallPreview(this, row.id);
        }
      });
    });
  }

  paintItems() {
    const cells = this.slots(SHOP_USE_GOODS.length);
    SHOP_USE_GOODS.forEach((good, i) => {
      const powder = good.currency === "premium";
      this.paintCard(cells[i].x, cells[i].y, {
        title: t("item." + good.id + ".name"),
        icon: itemIconKey(good.id),
        hint: "",
        stroke: powder ? 0x7ae8a0 : 0xffd24a,
        accent: powder ? 0x3ad68a : 0xffb14a,
        priceIcon: powder ? "item-powder" : "item-coin",
        price: good.price,
        onClick: () => {
          openShopBuy(this, {
            title: t("item." + good.id + ".name"),
            icon: itemIconKey(good.id),
            kind: t("shop.kindUse"),
            owned: SaveSystem.itemCount(good.id),
            body: t("item." + good.id + ".body"),
            priceIcon: powder ? "item-powder" : "item-coin",
            unitPrice: good.price,
            have: powder ? (this.bag().premium | 0) : (this.bag().coins | 0),
            maxQty: 99,
            onConfirm: (qty) => powder
              ? SaveSystem.buyWithPremium(good.id, good.price, qty)
              : SaveSystem.buyWithCoins(good.id, good.price, qty),
            after: (qty) => this.bought(t("item." + good.id + ".name"), qty)
          });
        }
      });
    });
  }

  paintTrade() {
    const cells = this.slots(SHOP_TRADE_GOODS.length);
    const rate = ECONOMY.pvpPerToken | 5;
    SHOP_TRADE_GOODS.forEach((good, i) => {
      const shardCard = {
        title: t("item.shard.name"),
        icon: "item-shard",
        hint: "",
        kind: t("shop.kindTrade"),
        owned: this.bag().tokens | 0
      };
      if (good.action === "exchangeShard") {
        this.paintCard(cells[i].x, cells[i].y, {
          ...shardCard,
          stroke: 0xb8a0e8,
          accent: 0x7d5cff,
          priceIcon: "item-stone",
          price: rate,
          onClick: () => {
            openShopBuy(this, {
              title: shardCard.title,
              icon: "item-shard",
              kind: shardCard.kind,
              owned: shardCard.owned,
              body: "",
              priceIcon: "item-stone",
              unitPrice: rate,
              have: this.bag().pvp | 0,
              maxQty: 99,
              onConfirm: (qty) => ({ ok: SaveSystem.exchangePvpToTokens(qty) }),
              after: (qty) => this.traded(t("item.shard.name"), qty)
            });
          }
        });
      } else if (good.itemId) {
        const id = good.itemId;
        this.paintCard(cells[i].x, cells[i].y, {
          title: t("item." + id + ".name"),
          icon: itemIconKey(id),
          hint: "",
          stroke: 0x7ae8a0,
          accent: 0x3ad68a,
          priceIcon: "item-powder",
          price: good.price,
          onClick: () => {
            openShopBuy(this, {
              title: t("item." + id + ".name"),
              icon: itemIconKey(id),
              kind: t("shop.kindTrade"),
              owned: SaveSystem.itemCount(id),
              body: "",
              priceIcon: "item-powder",
              unitPrice: good.price,
              have: this.bag().premium | 0,
              maxQty: 99,
              onConfirm: (qty) => SaveSystem.buyWithPremium(id, good.price, qty),
              after: (qty) => this.traded(t("item." + id + ".name"), qty)
            });
          }
        });
      } else {
        this.paintCard(cells[i].x, cells[i].y, {
          ...shardCard,
          stroke: 0x7ae8ff,
          accent: 0x3ad6ff,
          priceIcon: "item-powder",
          price: good.price,
          onClick: () => {
            openShopBuy(this, {
              title: shardCard.title,
              icon: "item-shard",
              kind: shardCard.kind,
              owned: shardCard.owned,
              body: "",
              priceIcon: "item-powder",
              unitPrice: good.price,
              have: this.bag().premium | 0,
              maxQty: 99,
              onConfirm: (qty) => ({ ok: SaveSystem.buyTokensWithPremium(good.shards * qty) }),
              after: (qty) => this.traded(t("item.shard.name"), (good.shards | 0) * qty)
            });
          }
        });
      }
    });
  }
}
