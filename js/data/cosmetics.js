import { CHEER_THEMES } from "./cheers.js";
import { FREE_AVATARS, DEFAULT_AVATAR, isFreeAvatar } from "./avatars.js";

/** Visual-only loadout slots. None of these change physics or MMR. */
export const COSMETIC_SLOTS = ["avatar", "cheer", "hit", "ult", "plate"];

export const COSMETIC_DEFAULTS = {
  avatar: DEFAULT_AVATAR,
  cheer: "classic",
  hit: "hit-spark",
  ult: "ult-burst",
  plate: "plate-cream"
};

function row(item) {
  return {
    visible: true,
    comingSoon: false,
    starter: false,
    price: 0,
    currency: "free",
    fx: {},
    ...item
  };
}

const CHEER_ITEMS = Object.keys(CHEER_THEMES).map((id) => {
  const theme = CHEER_THEMES[id];
  return row({
    id,
    slot: "cheer",
    skin: id,
    th: theme.th,
    en: theme.en,
    blurb: theme.blurb,
    blurbEn: theme.blurbEn,
    price: theme.price | 0,
    currency: theme.price ? "premium" : "free",
    starter: !theme.price,
    comingSoon: Boolean(theme.comingSoon),
    fx: { stroke: theme.stroke, glow: theme.glow, panel: theme.panel, bits: theme.bits }
  });
});

const AVATAR_ITEMS = FREE_AVATARS.map((av) => row({
  id: av.id,
  slot: "avatar",
  skin: av.id,
  th: av.th,
  en: av.en,
  blurb: "อวาตาร์ฟรีติดบัญชี",
  blurbEn: "Free account avatar",
  starter: true,
  currency: "free",
  fx: { element: av.element }
}));

const EXTRA_ITEMS = [
  row({
    id: "hit-spark",
    slot: "hit",
    skin: "spark",
    th: "ประกายตบ",
    en: "Spark pop",
    blurb: "เอฟเฟกต์ตบชุดแรก ติดตัวมาฟรี",
    blurbEn: "The default hit burst. Free with your account.",
    starter: true
  }),
  row({
    id: "hit-petal",
    slot: "hit",
    skin: "petal",
    th: "กลีบซากุระ",
    en: "Petal burst",
    blurb: "ตบแล้วมีกลีบโปรย รอใส่ในแมตช์รอบร้าน",
    blurbEn: "Petals on contact. Match FX comes with the shop pass.",
    price: 60,
    currency: "premium",
    comingSoon: true
  }),
  row({
    id: "ult-burst",
    slot: "ult",
    skin: "burst",
    th: "คัทอินอัลติ",
    en: "Ult cut-in",
    blurb: "คัทอินอัลติชุดแรก ติดตัวมาฟรี",
    blurbEn: "The default ult cut-in. Free with your account.",
    starter: true
  }),
  row({
    id: "ult-ribbon",
    slot: "ult",
    skin: "ribbon",
    th: "ริบบิ้นอัลติ",
    en: "Ribbon ult",
    blurb: "คัทอินโทนเทศกาล รอใส่ในแมตช์รอบร้าน",
    blurbEn: "Festival-style ult banner. Match FX comes with the shop pass.",
    price: 80,
    currency: "premium",
    comingSoon: true
  }),
  row({
    id: "plate-cream",
    slot: "plate",
    skin: "cream",
    th: "ป้ายครีม",
    en: "Cream plate",
    blurb: "ป้ายชื่อล็อบบี้ชุดแรก ติดตัวมาฟรี",
    blurbEn: "The default name plate. Free with your account.",
    starter: true
  }),
  row({
    id: "plate-gold",
    slot: "plate",
    skin: "gold",
    th: "ป้ายทอง",
    en: "Gold plate",
    blurb: "กรอบชื่อโทนเหรียญ รอใส่ในล็อบบี้รอบร้าน",
    blurbEn: "A medal-tint name plate. Lobby FX comes with the shop pass.",
    price: 100,
    currency: "tokens",
    comingSoon: true
  })
];

export const COSMETIC_ITEMS = [...AVATAR_ITEMS, ...CHEER_ITEMS, ...EXTRA_ITEMS];

const BY_ID = {};
COSMETIC_ITEMS.forEach((item) => { BY_ID[item.id] = item; });

export function emptyLoadout() {
  return { ...COSMETIC_DEFAULTS };
}

export function emptyCosmetics() {
  return {
    owned: starterIds(),
    equipped: emptyLoadout()
  };
}

export function starterIds() {
  return COSMETIC_ITEMS.filter((item) => item.starter).map((item) => item.id);
}

export function getCosmetic(id) {
  return BY_ID[id] || null;
}

export function cosmeticsInSlot(slot) {
  return COSMETIC_ITEMS.filter((item) => item.slot === slot);
}

export function cosmeticLabel(item, lang) {
  if (!item) return "";
  return lang === "en" ? item.en : item.th;
}

export function cosmeticBlurb(item, lang) {
  if (!item) return "";
  return lang === "en" ? item.blurbEn : item.blurb;
}

export function isStarterCosmetic(id) {
  const item = BY_ID[id];
  return Boolean(item && item.starter) || isFreeAvatar(id);
}

export function ownsCosmetic(save, id) {
  if (!id) return false;
  if (isStarterCosmetic(id)) return true;
  const owned = (save && save.cosmetics && save.cosmetics.owned) || [];
  if (owned.includes(id)) return true;
  const item = BY_ID[id];
  if (item && item.slot === "cheer") return ((save && save.unlockedCheers) || []).includes(id);
  if (item && item.slot === "avatar") return ((save && save.unlockedAvatars) || []).includes(id);
  return false;
}

export function equippedCosmetic(save, slot) {
  const fallback = COSMETIC_DEFAULTS[slot];
  const equipped = save && save.cosmetics && save.cosmetics.equipped;
  const id = (equipped && equipped[slot]) || (slot === "cheer" ? save && save.equippedCheer : slot === "avatar" ? save && save.avatarId : fallback);
  if (ownsCosmetic(save, id) && BY_ID[id] && BY_ID[id].slot === slot) return id;
  return fallback;
}

export function packLoadout(save) {
  const out = {};
  COSMETIC_SLOTS.forEach((slot) => {
    out[slot] = equippedCosmetic(save, slot);
  });
  return out;
}

function uniqueIds(list) {
  const seen = {};
  const out = [];
  (list || []).forEach((id) => {
    if (!id || seen[id] || !BY_ID[id]) return;
    seen[id] = true;
    out.push(id);
  });
  return out;
}

export function migrateCosmetics(save) {
  if (!save || typeof save !== "object") return save;
  const bag = save.cosmetics && typeof save.cosmetics === "object" ? save.cosmetics : {};
  const owned = uniqueIds([
    ...starterIds(),
    ...(bag.owned || []),
    ...(save.unlockedCheers || []),
    ...(save.unlockedAvatars || [])
  ]);
  const equipped = { ...COSMETIC_DEFAULTS, ...(bag.equipped || {}) };
  if (save.equippedCheer) equipped.cheer = save.equippedCheer;
  if (save.avatarId) equipped.avatar = save.avatarId;
  COSMETIC_SLOTS.forEach((slot) => {
    if (!ownsCosmetic({ ...save, cosmetics: { owned, equipped } }, equipped[slot])) {
      equipped[slot] = COSMETIC_DEFAULTS[slot];
    }
  });
  save.cosmetics = { owned, equipped };
  save.equippedCheer = equipped.cheer;
  save.avatarId = equipped.avatar;
  if (!Array.isArray(save.unlockedCheers)) save.unlockedCheers = [];
  cosmeticsInSlot("cheer").forEach((item) => {
    if (ownsCosmetic(save, item.id) && !save.unlockedCheers.includes(item.id)) save.unlockedCheers.push(item.id);
  });
  if (!Array.isArray(save.unlockedAvatars)) save.unlockedAvatars = [];
  return save;
}

function canSpend(save, currency, price) {
  if (!price) return true;
  const bag = save.currencies || {};
  if (currency === "premium") return (bag.premium | 0) >= price;
  if (currency === "tokens") return (bag.tokens | 0) >= price;
  if (currency === "pvp") return (bag.pvp | 0) >= price;
  return false;
}

function spend(save, currency, price) {
  if (!price) return;
  const bag = save.currencies;
  if (currency === "premium") bag.premium -= price;
  else if (currency === "tokens") bag.tokens -= price;
  else if (currency === "pvp") bag.pvp -= price;
}

export function grantCosmetic(save, id) {
  const item = BY_ID[id];
  if (!item || item.comingSoon) return { ok: false, reason: "missing" };
  migrateCosmetics(save);
  if (ownsCosmetic(save, id)) return { ok: false, reason: "owned" };
  save.cosmetics.owned.push(id);
  if (item.slot === "cheer" && !save.unlockedCheers.includes(id)) save.unlockedCheers.push(id);
  if (item.slot === "avatar" && !save.unlockedAvatars.includes(id) && !isFreeAvatar(id)) save.unlockedAvatars.push(id);
  return { ok: true, item };
}

export function buyCosmetic(save, id) {
  const item = BY_ID[id];
  if (!item) return { ok: false, reason: "missing" };
  if (item.comingSoon) return { ok: false, reason: "soon" };
  migrateCosmetics(save);
  if (ownsCosmetic(save, id)) return { ok: false, reason: "owned" };
  if (!canSpend(save, item.currency, item.price | 0)) return { ok: false, reason: item.currency };
  spend(save, item.currency, item.price | 0);
  save.cosmetics.owned.push(id);
  if (item.slot === "cheer" && !save.unlockedCheers.includes(id)) save.unlockedCheers.push(id);
  if (item.slot === "avatar" && !save.unlockedAvatars.includes(id) && !isFreeAvatar(id)) save.unlockedAvatars.push(id);
  save.cosmetics.equipped[item.slot] = id;
  if (item.slot === "cheer") save.equippedCheer = id;
  if (item.slot === "avatar") save.avatarId = id;
  return { ok: true, item };
}

export function equipCosmetic(save, id) {
  const item = BY_ID[id];
  if (!item) return { ok: false, reason: "missing" };
  migrateCosmetics(save);
  if (!ownsCosmetic(save, id)) return { ok: false, reason: "locked" };
  save.cosmetics.equipped[item.slot] = id;
  if (item.slot === "cheer") save.equippedCheer = id;
  if (item.slot === "avatar") save.avatarId = id;
  return { ok: true, item };
}
