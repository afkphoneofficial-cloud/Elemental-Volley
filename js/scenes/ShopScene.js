import { drawGrid, makeButton, UI_FONT } from "../ui/Ui.js";
import { paintTabs } from "../ui/sceneTabs.js";
import { ROSTER_IDS, ROSTER } from "../data/roster.js";
import { ECONOMY } from "../data/economy.js";
import { SaveSystem } from "../systems/SaveSystem.js";
import { AuthSystem } from "../systems/AuthSystem.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t, I18n } from "../i18n/I18n.js";
import { itemIconKey } from "../data/items.js";
import { SHOP_TABS, SHOP_USE_GOODS, SHOP_TRADE_GOODS } from "../data/shopCatalog.js";
import { paintWalletBar } from "../ui/walletBar.js";
import { SELECT_PLATE } from "../fx/SelectHover.js";
import { openShopBuy, closeShopBuy } from "../ui/shopBuyPopup.js";
import { openLookPreview, closeLookPreview } from "../ui/shopLookPreview.js";
import { COSTUME_TIERS, shopLooksInTier, shopLookVis, shopLookLabel, costumeTierLabel } from "../data/costumeShop.js";

const CARD_W = 196;
const CARD_H = 236;
const CARD_GAP = 14;
const CARD_COLS = 5;

export class ShopScene extends Phaser.Scene {
  constructor() { super("shop"); }

  init(data) {
    this.tab = (data && data.tab) || "fighters";
    this.costumeTier = (data && data.costumeTier) || "mist";
    this.costumePage = Math.max(0, (data && data.costumePage) | 0);
  }

  create() {
    if (!AuthSystem.guard(this)) return;
    drawGrid(this);
    const W = this.scale.width;
    paintWalletBar(this, "shop");
    makeButton(this, 96, 40, 132, 40, t("nav.back"), () => this.scene.start("hub"), 0x7d5cff);
    this.add.text(W / 2, 40, t("shop.title"), {
      fontFamily: UI_FONT, fontSize: "28px", fontStyle: "900", color: "#3a2418"
    }).setOrigin(0.5);

    paintTabs(this, 96, SHOP_TABS.map((row) => ({
      id: row.id,
      label: t("shop.tab." + row.id),
      color: row.color,
      go: () => this.scene.start("shop", { tab: row.id, costumeTier: this.costumeTier, costumePage: 0 })
    })), this.tab);

    if (this.tab === "fighters") this.paintFighters();
    else if (this.tab === "cosmetics") this.paintCosmetics();
    else if (this.tab === "items") this.paintItems();
    else this.paintTrade();

    this.events.once("shutdown", () => {
      closeShopBuy(this);
      closeLookPreview(this);
    });
  }

  refresh() {
    this.scene.start("shop", { tab: this.tab, costumeTier: this.costumeTier, costumePage: this.costumePage });
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
        this.scene.start("shop", { tab: "cosmetics", costumeTier: tier.id, costumePage: 0 });
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
      const worn = SaveSystem.wornShopLook(look.charId) === look.id;
      const icon = this.textures.exists(shopLookVis(look.id, "select")) ? shopLookVis(look.id, "select") : "vis_select_" + look.charId;
      let stamp = null;
      let priceIcon = null;
      let price = null;
      let priceMark = null;
      let onClick = null;
      if (worn) stamp = t("shop.using");
      else if (owned) {
        priceMark = "▶";
        onClick = () => {
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
            after: () => this.refresh()
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
          costumePage: (this.costumePage + pages - 1) % pages
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
          costumePage: (this.costumePage + 1) % pages
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
            after: () => this.refresh()
          });
        }
      });
    });
  }

  paintItems() {
    const cells = this.slots(SHOP_USE_GOODS.length);
    SHOP_USE_GOODS.forEach((good, i) => {
      this.paintCard(cells[i].x, cells[i].y, {
        title: t("item." + good.id + ".name"),
        icon: itemIconKey(good.id),
        hint: "",
        stroke: 0xffd24a,
        accent: 0xffb14a,
        priceIcon: "item-coin",
        price: good.price,
        onClick: () => {
          openShopBuy(this, {
            title: t("item." + good.id + ".name"),
            icon: itemIconKey(good.id),
            kind: t("shop.kindUse"),
            owned: SaveSystem.itemCount(good.id),
            body: t("item." + good.id + ".body"),
            priceIcon: "item-coin",
            unitPrice: good.price,
            have: this.bag().coins | 0,
            maxQty: 99,
            onConfirm: (qty) => SaveSystem.buyWithCoins(good.id, good.price, qty),
            after: () => this.refresh()
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
              after: () => this.refresh()
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
              after: () => this.refresh()
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
              after: () => this.refresh()
            });
          }
        });
      }
    });
  }
}
