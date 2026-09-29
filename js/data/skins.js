import { ROSTER_IDS } from "./roster.js";

export const SKIN_MAX = 5;

export const SKIN_TIERS = [
  { id: 1, th: "ต้นแบบ", en: "Origin", pieces: 0 },
  { id: 2, th: "นักซ้อม", en: "Rally kid", pieces: 1 },
  { id: 3, th: "นักเกาะ", en: "Islander", pieces: 2 },
  { id: 4, th: "เอซธาตุ", en: "Element ace", pieces: 3 },
  { id: 5, th: "ตำนานเกาะ", en: "Island legend", pieces: 4 }
];

export const SKIN_PIECES = [
  { th: "ที่คาดผม", en: "Headband" },
  { th: "เหรียญเกาะ", en: "Island medal" },
  { th: "ผ้าคลุมเล็ก", en: "Capelet" },
  { th: "มงกุฎธาตุ", en: "Element circlet" }
];

export function clampSkin(n) {
  const v = n | 0;
  if (v < 1) return 1;
  if (v > SKIN_MAX) return SKIN_MAX;
  return v;
}

export function emptySkins() {
  const out = {};
  ROSTER_IDS.forEach((id) => { out[id] = 1; });
  return out;
}

export function skinTier(n) {
  return SKIN_TIERS[clampSkin(n) - 1];
}

export function selectKey(id, tier) {
  const t = clampSkin(tier);
  return t <= 1 ? "vis_select_" + id : "vis_select_" + id + "_" + t;
}

export function faceKey(id, courtSide, tier) {
  const t = clampSkin(tier);
  const side = courtSide === 1 ? "_r" : "_l";
  if (t <= 1) return "vis_" + id + side;
  return "vis_" + id + "_" + t + side;
}

export function artSrc(id, tier) {
  const t = clampSkin(tier);
  if (t <= 1) return "assets/sprites/select-" + id + ".png";
  return "assets/sprites/skins/select-" + id + "-t" + t + ".png";
}

export function texSelect(scene, id, tier) {
  const k = selectKey(id, tier);
  if (scene.textures.exists(k)) return k;
  if (scene.textures.exists("vis_select_" + id)) return "vis_select_" + id;
  if (scene.textures.exists("vis_" + id)) return "vis_" + id;
  return "vis_ignis";
}

export function texFace(scene, id, courtSide, tier) {
  const k = faceKey(id, courtSide, tier);
  if (scene.textures.exists(k)) return k;
  const side = courtSide === 1 ? "_r" : "_l";
  if (scene.textures.exists("vis_" + id + side)) return "vis_" + id + side;
  if (scene.textures.exists("vis_" + id)) return "vis_" + id;
  return "vis_ignis";
}
