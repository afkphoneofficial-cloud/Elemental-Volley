/** Shop tabs, IAP preview packs, and Isle Coin match drops. */

export const SHOP_TABS = [
  { id: "fighters", color: 0xff6a22 },
  { id: "cosmetics", color: 0xff8ab8 },
  { id: "items", color: 0x3ad6ff },
  { id: "trade", color: 0xc8ff3a }
];

/** Soft match coin. Exhibition never drops it. */
export function matchCoins(mode, win, youScore, foeScore) {
  if (mode === "exhibit") return 0;
  const you = Math.max(0, youScore | 0);
  const foe = Math.max(0, foeScore | 0);
  const margin = Math.max(0, you - foe);
  const scored = you >= 3;
  if (mode === "bot") {
    if (win) return Math.min(22, 10 + Math.floor(you / 2) + Math.floor(margin / 4));
    return scored ? 4 : 2;
  }
  if (mode === "pvp") {
    if (win) return Math.min(30, 18 + Math.floor(margin / 2));
    return scored ? 8 : 3;
  }
  if (mode === "special") {
    if (win) return Math.min(26, 15 + Math.floor(margin / 3));
    return scored ? 6 : 3;
  }
  return 0;
}

export const SHOP_USE_GOODS = [
  { id: "ether_vial", price: 35, currency: "coins" },
  { id: "bodyfruit", price: 120, currency: "coins" }
];

export const SHOP_TRADE_GOODS = [
  { id: "stone_trade", action: "exchangeShard" },
  { id: "shard_pack", shards: 100, price: 200, currency: "premium" },
  { id: "bodyfruit", itemId: "bodyfruit", price: 50, currency: "premium" }
];

/** Preview rates only. Payment is not live. Base ~2 powder per THB, bonus on larger packs. */
export const TOPUP_PACKS = [
  { id: "p29", thb: 29, powder: 60, bonus: 0 },
  { id: "p59", thb: 59, powder: 130, bonus: 12 },
  { id: "p149", thb: 149, powder: 350, bonus: 52 },
  { id: "p299", thb: 299, powder: 750, bonus: 152 },
  { id: "p499", thb: 499, powder: 1350, bonus: 352 },
  { id: "p999", thb: 999, powder: 3000, bonus: 1002 }
];
