/** Shop costume looks. Visual only. Champ season outfits still sit above these. */

export const COSTUME_TIERS = [
  { id: "mist", th: "ละออง", en: "Mist", price: 30, open: true, color: 0x7ad0ff },
  { id: "current", th: "กระแส", en: "Current", price: 80, open: true, color: 0x7d5cff },
  { id: "tempest", th: "พายุ", en: "Tempest", price: 350, open: true, color: 0xff6a22 },
  { id: "relic", th: "โบราณ", en: "Relic", price: 0, open: false, color: 0xc8a050 },
  { id: "origin", th: "ปฐม", en: "Origin", price: 0, open: false, color: 0xffe08a }
];

const SETS = [
  { id: "leafcap", tier: "mist", chars: ["ignis", "terra"], th: "หมวกใบตอง", en: "Banana-leaf cap" },
  { id: "floatie", tier: "mist", chars: ["aqua", "volt"], th: "ห่วงเป็ด", en: "Duck floatie" },
  { id: "vendor", tier: "mist", chars: ["ignis", "aqua"], th: "ผ้ากันเปื้อนมะพร้าว", en: "Coconut apron" },
  { id: "spikeband", tier: "mist", chars: ["volt", "terra"], th: "สนับเข่าซ้อม", en: "Rally pads" },
  { id: "sunhat", tier: "mist", chars: ["ignis", "volt"], th: "หมวกฟาง", en: "Straw sunhat" },
  { id: "mossbow", tier: "mist", chars: ["terra", "aqua"], th: "โบมอส", en: "Moss bow" },
  { id: "lei", tier: "mist", chars: ["aqua", "ignis"], th: "พวงดอกเกาะ", en: "Isle lei" },
  { id: "whistle", tier: "mist", chars: ["volt", "terra"], th: "หมวกโค้ช", en: "Coach cap" },
  { id: "sailor", tier: "current", chars: ["aqua"], th: "กะลาสีคลื่น", en: "Tide sailor" },
  { id: "foxcheer", tier: "current", chars: ["volt"], th: "ชุดเชียร์สายฟ้า", en: "Bolt cheer" },
  { id: "gardenmiko", tier: "current", chars: ["terra"], th: "ชุดศาลเจ้ามอส", en: "Moss shrine" },
  { id: "yukata", tier: "current", chars: ["ignis"], th: "ยูกาตะโคมไฟ", en: "Lantern yukata" },
  { id: "tidalknight", tier: "tempest", chars: ["aqua"], th: "อัศวินคลื่น", en: "Tide knight" },
  { id: "stormfox", tier: "tempest", chars: ["volt"], th: "จิ้งจอกพายุ", en: "Storm fox" },
  { id: "rootwarden", tier: "tempest", chars: ["terra"], th: "ผู้พิทักษ์ราก", en: "Root warden" },
  { id: "emberplate", tier: "tempest", chars: ["ignis"], th: "เกราะเถ้าไฟ", en: "Ember plate" }
];

export const SHOP_LOOK_POSES = [
  { id: "select", file: "select", vis: "select" },
  { id: "left", file: "left", vis: "l" },
  { id: "right", file: "", vis: "r" },
  { id: "dive", file: "dive-left", vis: "dive_l" },
  { id: "cheer", file: "cheer", vis: "cheer" }
];

function lookId(setId, charId) {
  return setId + "_" + charId;
}

export const SHOP_LOOKS = SETS.flatMap((set) => set.chars.map((charId) => {
  const tier = COSTUME_TIERS.find((row) => row.id === set.tier);
  return {
    id: lookId(set.id, charId),
    setId: set.id,
    charId,
    tier: set.tier,
    th: set.th,
    en: set.en,
    price: tier ? tier.price : 0,
    open: Boolean(tier && tier.open),
    stroke: tier ? tier.color : 0xe8c8a8
  };
}));

export function shopLookOf(id) {
  return SHOP_LOOKS.find((row) => row.id === id) || null;
}

export function shopLooksInTier(tierId) {
  return SHOP_LOOKS.filter((row) => row.tier === tierId);
}

export function shopLookSrc(id, poseFile) {
  return "assets/sprites/shopLooks/" + id + "-" + poseFile + ".png";
}

export function shopLookLoadKey(id, poseFile) {
  return "shop-" + id + "-" + poseFile;
}

export function shopLookVis(id, vis) {
  if (vis === "select") return "vis_shop_" + id + "_select";
  if (vis === "cheer") return "vis_shop_" + id + "_cheer";
  return "vis_shop_" + id + "_" + vis;
}

export function shopLookPoseTexture(scene, lookId, pose) {
  const vis = shopLookVis(lookId, pose.vis);
  if (scene.textures.exists(vis)) return vis;
  if (pose.file) {
    const raw = shopLookLoadKey(lookId, pose.file);
    if (scene.textures.exists(raw)) return raw;
  }
  return "";
}

export function emptyShopLooks() {
  return { owned: [], worn: { ignis: "", aqua: "", volt: "", terra: "" } };
}

export function costumeTierOf(id) {
  return COSTUME_TIERS.find((row) => row.id === id) || COSTUME_TIERS[0];
}

export function costumeTierLabel(tier, lang) {
  return lang === "en" ? tier.en : tier.th;
}

export function shopLookLabel(row, lang) {
  return lang === "en" ? row.en : row.th;
}
