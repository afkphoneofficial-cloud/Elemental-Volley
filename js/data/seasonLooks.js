import { SaveSystem } from "../systems/SaveSystem.js";
import { texSelect } from "./skins.js";

export function champSetOf(id) {
  return (SaveSystem.data.champEquipped || {})[id] | 0;
}

export function texHeroSelect(scene, id) {
  const set = champSetOf(id);
  if (set >= 1 && set <= 3) {
    const k = "vis_select_champ_" + id + "_" + set;
    if (scene.textures.exists(k)) return k;
  }
  return texSelect(scene, id, SaveSystem.skinOf(id));
}

export function champAuraTier(id, fallback) {
  return champSetOf(id) ? 5 : fallback;
}
