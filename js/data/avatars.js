export const DEFAULT_AVATAR = "av01";

export const FREE_AVATARS = [
  { id: "av01", element: "ignis", th: "ด้วงโคมไฟ", en: "Lantern Beetle" },
  { id: "av02", element: "ignis", th: "ลูกเจี๊ยบพริก", en: "Chili Chick" },
  { id: "av03", element: "ignis", th: "ลูกหมีกองไฟ", en: "Campfire Cub" },
  { id: "av04", element: "ignis", th: "เต่าแมกมา", en: "Magma Tortoise" },
  { id: "av05", element: "ignis", th: "แมวกำยาน", en: "Incense Cat" },
  { id: "av06", element: "aqua", th: "นากน้ำค้าง", en: "Dew Otter" },
  { id: "av07", element: "aqua", th: "กบฝน", en: "Rain Frog" },
  { id: "av08", element: "aqua", th: "แอ็กโซลอเติลฟอง", en: "Bubble Axolotl" },
  { id: "av09", element: "aqua", th: "แมวน้ำทะเล", en: "Tide Seal" },
  { id: "av10", element: "aqua", th: "ปลาคาร์ปบัว", en: "Lotus Koi" },
  { id: "av11", element: "volt", th: "เม่นประกาย", en: "Spark Hedgehog" },
  { id: "av12", element: "volt", th: "ผึ้งละออง", en: "Pollen Bee" },
  { id: "av13", element: "volt", th: "แกะเมฆ", en: "Cloud Sheep" },
  { id: "av14", element: "volt", th: "นกจับลม", en: "Wind Finch" },
  { id: "av15", element: "volt", th: "ตุ๊กแกเลมอน", en: "Lemon Gecko" },
  { id: "av16", element: "terra", th: "เม่นมอส", en: "Moss Hedgehog" },
  { id: "av17", element: "terra", th: "นกฮูกลูกโอ๊ก", en: "Acorn Owl" },
  { id: "av18", element: "terra", th: "ตุ่นกรวด", en: "Pebble Mole" },
  { id: "av19", element: "terra", th: "ทานูกิเห็ด", en: "Mushroom Tanuki" },
  { id: "av20", element: "terra", th: "ลูกแกะน้ำค้างแข็ง", en: "Frost Ram" }
];

export function isFreeAvatar(id) {
  return FREE_AVATARS.some((a) => a.id === id);
}

export function avatarKey(id) {
  const safe = isFreeAvatar(id) ? id : DEFAULT_AVATAR;
  return "vis_" + safe;
}

export function avatarArtKey(id) {
  return "av-art-" + id;
}

export function ownedAvatar(save, id) {
  if (isFreeAvatar(id)) return true;
  return ((save && save.unlockedAvatars) || []).includes(id);
}

export function avatarLabel(id, lang) {
  const row = FREE_AVATARS.find((a) => a.id === id);
  if (!row) return id;
  return lang === "en" ? row.en : row.th;
}
