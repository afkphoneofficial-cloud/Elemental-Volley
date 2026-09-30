import { I18n } from "../i18n/I18n.js";
import { dayKey } from "../data/monthPass.js?v=local171";
import { BETA, onBetaDay } from "../data/beta.js";
import {
  TITLE_LIST,
  TITLE_TIER_COLOR,
  emptyTitles,
  titleById,
  titleHintOf,
  titleLabelOf
} from "../data/titles.js";

function bag(save) {
  if (!save) return emptyTitles();
  if (!save.titles || typeof save.titles !== "object" || Array.isArray(save.titles)) save.titles = emptyTitles();
  if (!Array.isArray(save.titles.owned)) save.titles.owned = [];
  if (typeof save.titles.worn !== "string") save.titles.worn = "";
  if (!save.beta || typeof save.beta !== "object" || Array.isArray(save.beta)) save.beta = { testPlay: false };
  return save.titles;
}

export const TitleSystem = {
  lastNew: [],

  normalize(save) {
    if (!save) return emptyTitles();
    bag(save);
    const owned = save.titles.owned.filter((id) => titleById(id));
    save.titles.owned = Array.from(new Set(owned));
    if (save.titles.worn && save.titles.owned.indexOf(save.titles.worn) < 0) save.titles.worn = "";
    return save.titles;
  },

  markTestPlay(save) {
    if (!save) return false;
    bag(save);
    if (!onBetaDay(dayKey(), BETA.testStart, BETA.testEnd)) return false;
    if (save.beta.testPlay) return false;
    save.beta.testPlay = true;
    save.beta.testAt = Date.now();
    return true;
  },

  unlock(save) {
    if (!save) return [];
    this.normalize(save);
    this.markTestPlay(save);
    const have = new Set(save.titles.owned);
    const fresh = [];
    TITLE_LIST.forEach((row) => {
      if (have.has(row.id)) return;
      let ok = false;
      try { ok = Boolean(row.need(save)); } catch (e) { ok = false; }
      if (!ok) return;
      save.titles.owned.push(row.id);
      have.add(row.id);
      fresh.push(row.id);
    });
    this.lastNew = fresh;
    return fresh;
  },

  wear(save, id) {
    if (!save) return false;
    this.normalize(save);
    if (!id) {
      save.titles.worn = "";
      return true;
    }
    if (save.titles.owned.indexOf(id) < 0) return false;
    save.titles.worn = id;
    return true;
  },

  worn(save) {
    if (!save) return null;
    this.normalize(save);
    return titleById(save.titles.worn);
  },

  label(row, lang) {
    return titleLabelOf(row, lang || I18n.lang);
  },

  hint(row, lang) {
    return titleHintOf(row, lang || I18n.lang);
  },

  colorOf(row) {
    return TITLE_TIER_COLOR[(row && row.tier) || "uncommon"] || TITLE_TIER_COLOR.uncommon;
  },

  named(save, base) {
    const name = base || "";
    const row = this.worn(save);
    if (!row) return name;
    return name + "  " + this.label(row);
  },

  boardWorn(row, youId, save) {
    if (!row) return null;
    let id = "";
    if (youId && String(row.id) === String(youId) && save && save.titles) {
      id = save.titles.worn || "";
    }
    if (!id) id = row.title_id || row.titleId || "";
    return titleById(id);
  },

  giftMail() {
    return {
      id: BETA.giftId,
      unread: true,
      at: Date.now(),
      title_th: "ของขวัญผู้ทดสอบ",
      title_en: "Beta tester gift",
      body_th: "ขอบคุณที่มาเล่นช่วงทดสอบ 1–7 ต.ค. ของขวัญนี้ส่งช่วงพักเซิร์ฟก่อนเปิดจริง พร้อมฉายา BetaTester ที่โปรไฟล์",
      body_en: "Thanks for playing the 1–7 Oct test week. This gift lands during the rest days before launch, with the BetaTester title on your profile.",
      payload: {
        powder: BETA.powder,
        coins: BETA.coins,
        fruit: BETA.fruit
      }
    };
  },

  shouldGift(save) {
    if (!save) return false;
    this.normalize(save);
    if (!save.beta.testPlay) return false;
    if (dayKey() < BETA.restStart) return false;
    if (!Array.isArray(save.seasonIssued)) save.seasonIssued = [];
    if (save.seasonIssued.includes(BETA.giftId)) return false;
    if (!Array.isArray(save.seasonInbox)) save.seasonInbox = [];
    if (save.seasonInbox.some((row) => row.id === BETA.giftId)) {
      save.seasonIssued.push(BETA.giftId);
      return false;
    }
    return true;
  }
};
