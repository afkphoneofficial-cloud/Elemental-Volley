import { CHAMP_ITEMS } from "./seasonCycle.js";

export const ITEM_IDS = ["stone", "shard", "ether_vial", "bodyfruit"].concat(Object.keys(CHAMP_ITEMS));

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
  ...CHAMP_ITEMS
};

export const BAG_COLS = 5;
export const BAG_ROWS = 4;
export const BAG_SLOTS = BAG_COLS * BAG_ROWS;

export const SHOP_GOODS = [
  { id: "stone", itemId: "stone", action: "exchangeShard" }
];

export function itemOf(id) {
  return ITEMS[id] || null;
}

export function itemIconKey(id) {
  const row = ITEMS[id];
  return row ? row.icon : "item-stone";
}
