import { CHAMP_ITEMS } from "./seasonCycle.js";
import { SHOP_LOOKS, shopLookOf, shopLookVis } from "./costumeShop.js";
import { BALL_FX, BALL_FX_ITEMS } from "./ballFx.js?v=local196";

export const ITEM_IDS = ["stone", "shard", "ether_vial", "bodyfruit", "namestone"].concat(Object.keys(CHAMP_ITEMS), BALL_FX.map((row) => row.id));

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
  namestone: {
    id: "namestone",
    kind: "use",
    icon: "icon-namestone",
    effect: "rename"
  },
  ...CHAMP_ITEMS,
  ...LOOK_ITEMS,
  ...BALL_FX_ITEMS
};

ITEM_IDS.push(...Object.keys(LOOK_ITEMS));

export const BAG_COLS = 4;
export const BAG_ROWS = 3;
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
  if (!row) return String(id).indexOf("champ-") === 0 ? "look" : "";
  if (row.effect === "champSkin" || row.effect === "shopLook" || row.effect === "ballFx" || row.effect === "ultFx" || row.effect === "hitSfx") return "look";
  if (row.kind === "material") return "mat";
  return "use";
}

const KIND_RANK = { look: 0, ball: 1, ult: 2, sfx: 3 };

export function wearKindOf(id) {
  const row = ITEMS[id];
  if (row && row.effect === "ballFx") return "ball";
  if (row && row.effect === "ultFx") return "ult";
  if (row && row.effect === "hitSfx") return "sfx";
  if (row && (row.effect === "champSkin" || row.effect === "shopLook")) return "look";
  if (String(id).indexOf("champ-") === 0) return "look";
  if (shopLookOf(id)) return "look";
  return "";
}

export function wearCharOf(id) {
  const row = ITEMS[id];
  if (row && row.charId) return row.charId;
  if (row && row.char) return row.char;
  const champ = String(id || "").match(/^champ-([a-z]+)-\d+$/);
  if (champ) return champ[1];
  const look = shopLookOf(id);
  return look ? look.charId : "";
}

export function wearKindRank(kind) {
  return KIND_RANK[kind] == null ? 9 : KIND_RANK[kind];
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
