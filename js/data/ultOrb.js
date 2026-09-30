/** Visual-only ult orbs. Same skill rules as default ults. Grand FX only. */

export const ULT_ORBS = [
  { id: "orb_ember", char: "ignis", price: 80, color: 0xff6a22, ring: 0xffb14a, tex: "vis_orb_ember", src: "assets/sprites/orbs/orb_ember.png" },
  { id: "orb_mist", char: "aqua", price: 80, color: 0x3ad6ff, ring: 0x7ae8ff, tex: "vis_orb_mist", src: "assets/sprites/orbs/orb_mist.png" },
  { id: "orb_volt", char: "volt", price: 80, color: 0xffe08a, ring: 0x7d5cff, tex: "vis_orb_volt", src: "assets/sprites/orbs/orb_volt.png" },
  { id: "orb_terra", char: "terra", price: 80, color: 0x7ad06a, ring: 0xc07830, tex: "vis_orb_terra", src: "assets/sprites/orbs/orb_terra.png" }
];

export const ULT_ORB_ITEMS = {};
ULT_ORBS.forEach((row) => {
  ULT_ORB_ITEMS[row.id] = {
    id: row.id,
    kind: "use",
    icon: row.tex,
    effect: "ultFx",
    ultFx: row.id,
    char: row.char
  };
});

export function ultOrbOf(id) {
  return ULT_ORBS.find((row) => row.id === id) || null;
}

export function ultOrbFitsChar(row, charId) {
  if (!row) return false;
  return row.char === charId;
}
