import { ROSTER_IDS } from "./roster.js";

export const CHAMP_LOOK_SETS = [1, 2, 3];

export const CHAMP_LOOK_POSES = [
  { id: "select", tex: (id, n) => "vis_select_champ_" + id + "_" + n },
  { id: "left", tex: (id, n) => "vis_champ_" + id + "_" + n + "_l" },
  { id: "right", tex: (id, n) => "vis_champ_" + id + "_" + n + "_r" },
  { id: "dive", tex: (id, n) => "vis_champ_" + id + "_" + n + "_dive_l" },
  { id: "diveR", tex: (id, n) => "vis_champ_" + id + "_" + n + "_dive_r" },
  { id: "cheer", tex: (id, n) => "vis_cheer_champ_" + id + "_" + n }
];

export function champLookCards() {
  const rows = [];
  CHAMP_LOOK_SETS.forEach((n) => {
    ROSTER_IDS.forEach((id) => {
      rows.push({ charId: id, set: n, select: "vis_select_champ_" + id + "_" + n });
    });
  });
  return rows;
}

export function champLookPoses(scene, charId, set) {
  return CHAMP_LOOK_POSES.filter((pose) => scene.textures.exists(pose.tex(charId, set)));
}
