import { CHAMP_ITEMS } from "./seasonCycle.js";
import { SHOP_LOOKS, shopLookVis } from "./costumeShop.js";

export const ITEM_IDS = ["stone", "shard", "ether_vial", "bodyfruit"].concat(Object.keys(CHAMP_ITEMS));

export const LOOK_ITEMS = {};
SHOP_LOOKS.forEach((row) => {
  LOOK_ITEMS[row.id] = {
    id: row.id,
    kind: "use",
    icon: shopLookVis(row.id, "select"),
    effect: "shopLook",
    charId: row.charId,
    lookId: row.id
  };
});

export const ITEMS = {
  stone: {
    id: "stone",
    kind: "material",
    icon: "item-stone",
    currency: "pvp"
  },
  shard: {
    id: "shard",
    kind: "material",
    icon: "item-shard",
    currency: "tokens"
  },
  ether_vial: {
    id: "ether_vial",
    kind: "use",
    icon: "item-ether",
    effect: "ether1"
  },
  bodyfruit: {
    id: "bodyfruit",
    kind: "use",
    icon: "item-fruit",
    effect: "respecLevel"
  },
  ...CHAMP_ITEMS,
  ...LOOK_ITEMS
};

ITEM_IDS.push(...Object.keys(LOOK_ITEMS));

export const BAG_COLS = 5;
export const BAG_ROWS = 4;
export const BAG_SLOTS = BAG_COLS * BAG_ROWS;
export const BAG_STACK = 999;

export const BAG_TABS = [
  { id: "use", color: 0x3ad6ff },
  { id: "look", color: 0xff8ab8 },
  { id: "mat", color: 0xffb14a }
];

export const SHOP_GOODS = [
  { id: "stone", itemId: "stone", action: "exchangeShard" }
];

export function bagTabOf(id) {
  const row = ITEMS[id];
  if (!row) return "";
  if (row.effect === "champSkin" || row.effect === "shopLook") return "look";
  if (row.kind === "material") return "mat";
  return "use";
}

export function stackSlots(id, n) {
  const out = [];
  let left = Math.max(0, n | 0);
  while (left > 0) {
    const take = Math.min(BAG_STACK, left);
    out.push({ id, n: take });
    left -= take;
  }
  return out;
}

export function itemOf(id) {
  return ITEMS[id] || null;
}

export function itemIconKey(id) {
  const row = ITEMS[id];
  return row ? row.icon : "item-stone";
}
