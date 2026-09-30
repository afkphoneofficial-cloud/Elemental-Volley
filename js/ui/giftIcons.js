import { UI_FONT } from "./Ui.js";
import { shopLookVis } from "../data/costumeShop.js";

export function giftParts(gift) {
  const bits = [];
  const g = gift || {};
  if (g.lookId) bits.push({ key: shopLookVis(g.lookId, "select"), n: 1 });
  if (g.coins) bits.push({ key: "item-coin", n: g.coins | 0 });
  if (g.shards) bits.push({ key: "item-shard", n: g.shards | 0 });
  if (g.stones) bits.push({ key: "item-stone", n: g.stones | 0 });
  if (g.vial) bits.push({ key: "item-ether", n: g.vial | 0 });
  if (g.powder) bits.push({ key: "item-powder", n: g.powder | 0 });
  if (g.fruit) bits.push({ key: "item-fruit", n: g.fruit | 0 });
  return bits;
}

export function paintGiftIcons(scene, x, y, gift, opt) {
  const o = opt || {};
  const depth = o.depth || 8;
  const size = o.size || 36;
  const gap = o.gap || 54;
  const color = o.color || "#1a1008";
  const fontSize = o.fontSize || "13px";
  const hideQty = !!o.hideQty;
  const parts = giftParts(gift);
  const out = [];
  if (!parts.length) return out;
  const start = x - ((parts.length - 1) * gap) / 2;
  parts.forEach((p, i) => {
    const px = start + i * gap;
    const key = scene.textures.exists(p.key) ? p.key : (scene.textures.exists("item-shard") ? "item-shard" : p.key);
    out.push(scene.add.image(px, y, key).setDisplaySize(size, size).setDepth(depth));
    if (!hideQty) {
      out.push(scene.add.text(px, y + size * 0.48 + 2, "×" + p.n, {
        fontFamily: UI_FONT, fontSize, fontStyle: "900", color
      }).setOrigin(0.5, 0).setDepth(depth));
    }
  });
  return out;
}
