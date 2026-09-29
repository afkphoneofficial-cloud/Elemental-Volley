import { SaveSystem } from "../systems/SaveSystem.js";
import { texSelect, texFace, texDive, texCheer } from "./skins.js";
import { shopLookVis } from "./costumeShop.js";

export function clampChamp(n) {
  n = n | 0;
  if (n < 0) return 0;
  if (n > 3) return 3;
  return n;
}

export function champSetOf(id) {
  return clampChamp((SaveSystem.data.champEquipped || {})[id]);
}

function champTex(scene, key) {
  return scene.textures.exists(key) ? key : "";
}

function shopWorn(id) {
  return SaveSystem.wornShopLook ? SaveSystem.wornShopLook(id) : "";
}

function shopTex(scene, lookId, vis) {
  if (!lookId) return "";
  const k = shopLookVis(lookId, vis);
  return scene.textures.exists(k) ? k : "";
}

export function texHeroSelect(scene, id, champSet, skinTier) {
  const set = champSet != null ? champSet | 0 : champSetOf(id);
  if (set >= 1 && set <= 3) {
    const k = champTex(scene, "vis_select_champ_" + id + "_" + set);
    if (k) return k;
  }
  const shop = shopTex(scene, shopWorn(id), "select");
  if (shop) return shop;
  return texSelect(scene, id, skinTier != null ? skinTier : SaveSystem.skinOf(id));
}

export function texHeroFace(scene, id, courtSide, tier, champSet) {
  const set = champSet != null ? champSet | 0 : champSetOf(id);
  if (set >= 1 && set <= 3) {
    const side = courtSide === 1 ? "_r" : "_l";
    const k = champTex(scene, "vis_champ_" + id + "_" + set + side);
    if (k) return k;
  }
  const side = courtSide === 1 ? "r" : "l";
  const shop = shopTex(scene, shopWorn(id), side) || shopTex(scene, shopWorn(id), "select");
  if (shop) return shop;
  return texFace(scene, id, courtSide, tier);
}

export function texHeroDive(scene, id, courtSide, tier, champSet) {
  const set = champSet != null ? champSet | 0 : champSetOf(id);
  if (set >= 1 && set <= 3) {
    const side = courtSide === 1 ? "_r" : "_l";
    const k = champTex(scene, "vis_champ_" + id + "_" + set + "_dive" + side);
    if (k) return k;
    return texHeroFace(scene, id, courtSide, tier, set);
  }
  const side = courtSide === 1 ? "dive_r" : "dive_l";
  const shop = shopTex(scene, shopWorn(id), side) || shopTex(scene, shopWorn(id), "select");
  if (shop) return shop;
  return texDive(scene, id, courtSide, tier);
}

export function texHeroCheer(scene, id, tier, champSet) {
  const set = champSet != null ? champSet | 0 : champSetOf(id);
  if (set >= 1 && set <= 3) {
    const k = champTex(scene, "vis_cheer_champ_" + id + "_" + set);
    if (k) return k;
    return texHeroSelect(scene, id, set);
  }
  const shopCheer = shopTex(scene, shopWorn(id), "cheer") || shopTex(scene, shopWorn(id), "select");
  if (shopCheer) return shopCheer;
  return texCheer(scene, id, tier);
}

export function champAuraTier(id, fallback, champSet) {
  const set = champSet != null ? champSet | 0 : champSetOf(id);
  return set ? 5 : fallback;
}
