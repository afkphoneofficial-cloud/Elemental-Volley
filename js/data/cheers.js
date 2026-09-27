/** Point-cheer lines + skins. Skins are shop-ready; quotes stay per character. */
import { I18n } from "../i18n/I18n.js";

export const CHEERS = {
  ignis: [
    { title: "BLAZE!", th: "ร้อนนี้ฉันเท่มาก!", en: "This heat looks good on me!" },
    { title: "SPARK!", th: "ไฟไม่เคยพลาด!", en: "Fire never misses!" },
    { title: "ROAST!", th: "ฮ่า! เกรียมไปเลย~", en: "Ha! Totally roasted~" },
    { title: "POINT!", th: "มังกรน้อยขอแต้ม!", en: "Baby dragon takes the point!" },
    { title: "IGNITE!", th: "จุดประกายแล้วนะ!", en: "Spark is lit!" }
  ],
  aqua: [
    { title: "SPLASH!", th: "ดึ๋ง! ได้แล้วจ้า", en: "Boing! That's a point!" },
    { title: "DRIP!", th: "ลื่นไปสิ ฮิฮิ", en: "Slippery, hehe" },
    { title: "WAVE!", th: "น้ำชนะทุกทาง!", en: "Water wins every way!" },
    { title: "BUBBLE!", th: "ฟองนี้เพื่อชัยชนะ", en: "This bubble is for the win" },
    { title: "TIDAL!", th: "กระเซ็นแต้มแล้ว~", en: "Splashed a point~" }
  ],
  volt: [
    { title: "ZAP!", th: "ช็อกไปเลย!", en: "Zapped!" },
    { title: "BOLT!", th: "ฟ้าผ่า... แต้ม!", en: "Thunder... point!" },
    { title: "FOX!", th: "จิ้งจอกเร็วกว่านะ", en: "This fox is faster" },
    { title: "SPARK!", th: "จี๊ด! อีกแต้ม", en: "Zzt! Another point" },
    { title: "CHARGE!", th: "เก็บประจุครบ!", en: "Fully charged!" }
  ],
  terra: [
    { title: "QUAKE!", th: "แน่นหนา... ได้แต้ม", en: "Solid... that's a point" },
    { title: "ROOT!", th: "รากนี้ไม่ถอย", en: "These roots do not back down" },
    { title: "STONE!", th: "หินติด... ชนะ!", en: "Stone stuck... win!" },
    { title: "MOSS!", th: "มอสขอร่วมยินดี!", en: "Moss joins the cheer!" },
    { title: "EARTH!", th: "พื้นดินอยู่ข้างฉัน", en: "The ground is on my side" }
  ]
};

export const CHEER_THEMES = {
  classic: {
    id: "classic",
    th: "คลาสสิก",
    en: "Classic",
    blurb: "ฉลองแต้มชุดแรก ติดตัวมาฟรี",
    blurbEn: "The first cheer set. Free with your account.",
    price: 0,
    currency: "premium",
    comingSoon: false,
    stroke: 0xffe08a,
    glow: 0xff8a3a,
    panel: 0x160e14,
    bits: [0xffe08a, 0xff6a22, 0xffffff]
  },
  festival: {
    id: "festival",
    th: "เทศกาลพลุ",
    en: "Festival fireworks",
    blurb: "ฉลองสีสด กระดาษโปรย อลังการ",
    blurbEn: "Bright colors and confetti",
    price: 80,
    currency: "premium",
    comingSoon: false,
    stroke: 0xff66aa,
    glow: 0xffd24a,
    panel: 0x1a0c18,
    bits: [0xff5a8a, 0xffe08a, 0x7d5cff, 0x3ad6ff, 0xffffff]
  },
  starlight: {
    id: "starlight",
    th: "แสงดาว",
    en: "Starlight",
    blurb: "โทนม่วงดาว กึ่งลับ รอแพทช์ต่อ",
    blurbEn: "Purple star glow. Semi-secret, later patch.",
    price: 80,
    currency: "premium",
    comingSoon: true,
    stroke: 0xc8b8ff,
    glow: 0x7d5cff,
    panel: 0x100818,
    bits: [0xffffff, 0xc8b8ff, 0x7ae8ff]
  }
};

export const CHEER_THEME_IDS = Object.keys(CHEER_THEMES);

const lastLine = {};

export function pickCheer(charId) {
  const pack = CHEERS[charId] || CHEERS.ignis;
  let i = (Math.random() * pack.length) | 0;
  if (pack.length > 1 && i === lastLine[charId]) i = (i + 1) % pack.length;
  lastLine[charId] = i;
  const row = pack[i];
  return { title: row.title, line: I18n.lang === "en" ? row.en : row.th };
}

export function getCheerTheme(id) {
  return CHEER_THEMES[id] || CHEER_THEMES.classic;
}

export function cheerThemeLabel(theme) {
  return I18n.lang === "en" ? theme.en : theme.th;
}

export function cheerThemeBlurb(theme) {
  return I18n.lang === "en" ? theme.blurbEn : theme.blurb;
}
