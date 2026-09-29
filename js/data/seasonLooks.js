import { SaveSystem } from "../systems/SaveSystem.js";
import { texSelect, texFace, texDive, texCheer } from "./skins.js";

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

export function texHeroSelect(scene, id, champSet, skinTier) {
  const set = champSet != null ? champSet | 0 : champSetOf(id);
  if (set >= 1 && set <= 3) {
    const k = champTex(scene, "vis_select_champ_" + id + "_" + set);
    if (k) return k;
  }
  return texSelect(scene, id, skinTier != null ? skinTier : SaveSystem.skinOf(id));
}

export function texHeroFace(scene, id, courtSide, tier, champSet) {
  const set = champSet != null ? champSet | 0 : champSetOf(id);
  if (set >= 1 && set <= 3) {
    const side = courtSide === 1 ? "_r" : "_l";
    const k = champTex(scene, "vis_champ_" + id + "_" + set + side);
    if (k) return k;
  }
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
  return texDive(scene, id, courtSide, tier);
}

export function texHeroCheer(scene, id, tier, champSet) {
  const set = champSet != null ? champSet | 0 : champSetOf(id);
  if (set >= 1 && set <= 3) {
    const k = champTex(scene, "vis_cheer_champ_" + id + "_" + set);
    if (k) return k;
    return texHeroSelect(scene, id, set);
  }
  return texCheer(scene, id, tier);
}

export function champAuraTier(id, fallback, champSet) {
  const set = champSet != null ? champSet | 0 : champSetOf(id);
  return set ? 5 : fallback;
}
