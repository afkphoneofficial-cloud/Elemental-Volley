import { TRAIN_STAGES, TRAIN_CHARS, TRAIN_DIFFS } from "./trainStages.js";
import { RANK_TIERS, medalFromMmr } from "./ranks.js";
import { BETA, onBetaDay } from "./beta.js";
import { dayKey } from "./monthPass.js?v=local171";

export const TITLE_TIER_COLOR = {
  uncommon: "#8fd98a",
  rare: "#4aa8d8",
  epic: "#e04a4a"
};

export const TITLE_TIER_HEX = {
  uncommon: 0x8fd98a,
  rare: 0x4aa8d8,
  epic: 0xe04a4a
};

const U = "uncommon";
const R = "rare";
const E = "epic";

function logOf(save) {
  return save.matchLog || [];
}

function nMode(save, mode) {
  return logOf(save).filter((m) => m.mode === mode).length;
}

function wMode(save, mode) {
  return logOf(save).filter((m) => m.mode === mode && m.win).length;
}

function lMode(save, mode) {
  return logOf(save).filter((m) => m.mode === mode && !m.win).length;
}

function streak(save, mode, wantWin) {
  let n = 0;
  for (const m of logOf(save)) {
    if (mode && m.mode !== mode) continue;
    if (Boolean(m.win) !== wantWin) break;
    n += 1;
  }
  return n;
}

function hasTrain(save, id) {
  return (save.trainCleared || []).includes(id);
}

function charTrains(char) {
  return TRAIN_DIFFS.map((d) => char + "-" + d);
}

function medal(save) {
  return medalFromMmr((save.rank && save.rank.mmr) | 0);
}

function tierIndex(id) {
  return RANK_TIERS.findIndex((row) => row.id === id);
}

function reached(save, id) {
  const i = tierIndex(id);
  if (i < 0) return false;
  return medal(save).tier >= i;
}

function starAt(save, id, star) {
  const i = tierIndex(id);
  if (i < 0) return false;
  const m = medal(save);
  if (m.id === "eternal" || m.tier > i) return true;
  if (m.tier < i) return false;
  return (m.star | 0) >= star;
}

function uniqueFoes(save, mode) {
  const set = {};
  logOf(save).forEach((m) => {
    if (m.mode !== mode) return;
    const k = m.foe || m.foeName || "";
    if (k) set[k] = 1;
  });
  return Object.keys(set).length;
}

function playedChar(save, mode, charId) {
  return logOf(save).some((m) => m.mode === mode && m.you === charId);
}

function exhibitWinBig(save) {
  return logOf(save).some((m) => m.mode === "exhibit" && m.win && (m.youScore | 0) >= 5);
}

const TITLES = [];

function add(id, group, tier, th, en, need, hintTh, hintEn) {
  TITLES.push({ id, group, tier, th, en, need, hintTh, hintEn });
}

add("beta-tester", "beta", E, "BetaTester", "BetaTester", (s) => Boolean(s.beta && s.beta.testPlay) || onBetaDay(dayKey(), BETA.testStart, BETA.testEnd), "เล่นในช่วงทดสอบ 1–7 ต.ค. 2026", "Play in the 1–7 Oct 2026 test week");

TRAIN_STAGES.forEach((s) => {
  const th = { easy: "ฝึกง่าย", normal: "ฝึกปกติ", hard: "ฝึกยาก" };
  const en = { easy: "Easy drill", normal: "Normal drill", hard: "Hard drill" };
  const who = { ignis: "อิกนิส", aqua: "อควา", volt: "โวลต์", terra: "เทอร์รา" };
  const whoEn = { ignis: "Ignis", aqua: "Aqua", volt: "Volt", terra: "Terra" };
  add(
    "st-" + s.id,
    "train",
    s.diff === "hard" ? R : U,
    th[s.diff] + who[s.char],
    en[s.diff] + " " + whoEn[s.char],
    (save) => hasTrain(save, s.id),
    "เคลียร์ด่านฝึก " + who[s.char] + " " + s.diff,
    "Clear the " + s.diff + " " + whoEn[s.char] + " drill"
  );
});

TRAIN_CHARS.forEach((char) => {
  const who = { ignis: "สายไฟ", aqua: "สายน้ำ", volt: "สายฟ้า", terra: "สายดิน" };
  const whoEn = { ignis: "Ignis path", aqua: "Aqua path", volt: "Volt path", terra: "Terra path" };
  add("st-all-" + char, "train", R, who[char], whoEn[char], (save) => charTrains(char).every((id) => hasTrain(save, id)), "เคลียร์ฝึกครบ 3 ระดับของธาตุนี้", "Clear all 3 drills for this element");
});

TRAIN_DIFFS.forEach((diff) => {
  const th = { easy: "ท่องง่ายทั้งเกาะ", normal: "ท่องปกติทั้งเกาะ", hard: "ท่องยากทั้งเกาะ" };
  const en = { easy: "Island easy set", normal: "Island normal set", hard: "Island hard set" };
  add("st-diff-" + diff, "train", diff === "hard" ? E : R, th[diff], en[diff], (save) => TRAIN_CHARS.every((c) => hasTrain(save, c + "-" + diff)), "เคลียร์ระดับนี้ครบ 4 ธาตุ", "Clear this difficulty on all four elements");
});

add("st-island", "train", E, "นักสำรวจเกาะ", "Island scout", (save) => TRAIN_STAGES.every((s) => hasTrain(save, s.id)), "เคลียร์ด่านฝึกครบทั้งเกาะ", "Clear every training stage");

add("rp-first", "rankplay", U, "ลงสนามแรก", "First ranked", (s) => nMode(s, "pvp") >= 1, "เล่น Rank Mode 1 แมตช์", "Play 1 Rank Mode match");
add("rp-cal", "rankplay", R, "วัดมือครบ", "Calibrated", (s) => ((s.rank && s.rank.games) | 0) >= 10, "เล่นแรงก์ครบ 10 แมตช์ปรับอันดับ", "Finish 10 ranked calibration games");
add("rp-g25", "rankplay", U, "25 แมตช์แรงก์", "25 ranked", (s) => nMode(s, "pvp") >= 25, "เล่น Rank Mode 25 แมตช์", "Play 25 Rank Mode matches");
add("rp-g50", "rankplay", R, "50 แมตช์แรงก์", "50 ranked", (s) => nMode(s, "pvp") >= 50, "เล่น Rank Mode 50 แมตช์", "Play 50 Rank Mode matches");
add("rp-g100", "rankplay", R, "100 แมตช์แรงก์", "100 ranked", (s) => nMode(s, "pvp") >= 100, "เล่น Rank Mode 100 แมตช์", "Play 100 Rank Mode matches");
add("rp-g250", "rankplay", E, "แรงก์ไม่หยุด", "Rank grinder", (s) => nMode(s, "pvp") >= 250, "เล่น Rank Mode 250 แมตช์", "Play 250 Rank Mode matches");
add("rp-w1", "rankplay", U, "ชนะแรงก์แรก", "First rank win", (s) => wMode(s, "pvp") >= 1, "ชนะ Rank Mode 1 ครั้ง", "Win 1 Rank Mode match");
add("rp-w10", "rankplay", U, "10 ชัยแรงก์", "10 rank wins", (s) => wMode(s, "pvp") >= 10, "ชนะ Rank Mode 10 ครั้ง", "Win 10 Rank Mode matches");
add("rp-w25", "rankplay", R, "25 ชัยแรงก์", "25 rank wins", (s) => wMode(s, "pvp") >= 25, "ชนะ Rank Mode 25 ครั้ง", "Win 25 Rank Mode matches");
add("rp-w50", "rankplay", R, "50 ชัยแรงก์", "50 rank wins", (s) => wMode(s, "pvp") >= 50, "ชนะ Rank Mode 50 ครั้ง", "Win 50 Rank Mode matches");
add("rp-w100", "rankplay", E, "ร้อยชัยแรงก์", "100 rank wins", (s) => wMode(s, "pvp") >= 100, "ชนะ Rank Mode 100 ครั้ง", "Win 100 Rank Mode matches");
add("rp-l1", "rankplay", U, "แพ้แล้วลุก", "First rank loss", (s) => lMode(s, "pvp") >= 1, "เล่น Rank Mode จนแพ้ 1 ครั้ง", "Lose 1 Rank Mode match");
add("rp-l10", "rankplay", U, "บทเรียนสิบครั้ง", "Ten lessons", (s) => lMode(s, "pvp") >= 10, "แพ้ Rank Mode 10 ครั้ง", "Lose 10 Rank Mode matches");
add("rp-ws3", "rankplay", U, "สามต่อแรงก์", "Rank three-peat", (s) => streak(s, "pvp", true) >= 3, "ชนะ Rank Mode ติดกัน 3 แมตช์", "Win 3 Rank Mode matches in a row");
add("rp-ws5", "rankplay", R, "ห้าต่อแรงก์", "Rank heater", (s) => streak(s, "pvp", true) >= 5, "ชนะ Rank Mode ติดกัน 5 แมตช์", "Win 5 Rank Mode matches in a row");
add("rp-ws8", "rankplay", E, "แปดต่อแรงก์", "Rank on fire", (s) => streak(s, "pvp", true) >= 8, "ชนะ Rank Mode ติดกัน 8 แมตช์", "Win 8 Rank Mode matches in a row");
add("rp-ls3", "rankplay", U, "สามพ่ายแรงก์", "Rough patch", (s) => streak(s, "pvp", false) >= 3, "แพ้ Rank Mode ติดกัน 3 แมตช์", "Lose 3 Rank Mode matches in a row");
add("sp-first", "rankplay", U, "แรงก์ธาตุแรก", "First element rank", (s) => nMode(s, "special") >= 1, "เล่นแรงก์ธาตุ 1 แมตช์", "Play 1 Element Rank match");
add("sp-g10", "rankplay", U, "10 แมตช์ธาตุ", "10 element games", (s) => nMode(s, "special") >= 10, "เล่นแรงก์ธาตุ 10 แมตช์", "Play 10 Element Rank matches");
add("sp-g25", "rankplay", R, "25 แมตช์ธาตุ", "25 element games", (s) => nMode(s, "special") >= 25, "เล่นแรงก์ธาตุ 25 แมตช์", "Play 25 Element Rank matches");
add("sp-g50", "rankplay", R, "50 แมตช์ธาตุ", "50 element games", (s) => nMode(s, "special") >= 50, "เล่นแรงก์ธาตุ 50 แมตช์", "Play 50 Element Rank matches");
add("sp-w1", "rankplay", U, "ชัยธาตุแรก", "First element win", (s) => wMode(s, "special") >= 1, "ชนะแรงก์ธาตุ 1 ครั้ง", "Win 1 Element Rank match");
add("sp-w10", "rankplay", R, "10 ชัยธาตุ", "10 element wins", (s) => wMode(s, "special") >= 10, "ชนะแรงก์ธาตุ 10 ครั้ง", "Win 10 Element Rank matches");
add("sp-w25", "rankplay", E, "25 ชัยธาตุ", "25 element wins", (s) => wMode(s, "special") >= 25, "ชนะแรงก์ธาตุ 25 ครั้ง", "Win 25 Element Rank matches");

const TIER_TH = {
  sandling: "ลูกทราย",
  netling: "เฝ้าตาข่าย",
  server: "นักเสิร์ฟ",
  setter: "มือเซ็ต",
  ace: "เอซ",
  island: "เจ้าเกาะ",
  primal: "ธาตุบริสุทธิ์"
};
const TIER_EN = {
  sandling: "Sandling",
  netling: "Netling",
  server: "Server",
  setter: "Setter",
  ace: "Ace",
  island: "Island",
  primal: "Primal"
};

RANK_TIERS.filter((row) => row.id !== "eternal").forEach((row, i) => {
  const reachTier = i >= 5 ? E : i >= 3 ? R : U;
  add("rk-" + row.id, "rank", reachTier, "ถึง" + TIER_TH[row.id], "Reach " + TIER_EN[row.id], (s) => reached(s, row.id), "ขึ้นยศ " + TIER_TH[row.id], "Reach the " + TIER_EN[row.id] + " rank");
  add("rk-" + row.id + "-3", "rank", i >= 4 ? E : R, TIER_TH[row.id] + " 3 ดาว", TIER_EN[row.id] + " 3★", (s) => starAt(s, row.id, 3), "ได้ 3 ดาวที่ยศนี้หรือสูงกว่า", "Hold 3 stars at this rank or higher");
  add("rk-" + row.id + "-5", "rank", i >= 3 ? E : R, TIER_TH[row.id] + " 5 ดาว", TIER_EN[row.id] + " 5★", (s) => starAt(s, row.id, 5), "ได้ 5 ดาวที่ยศนี้หรือสูงกว่า", "Hold 5 stars at this rank or higher");
});

add("rk-eternal", "rank", E, "สไปค์นิรันดร์", "Eternal spike", (s) => medal(s).id === "eternal", "ขึ้นยศสไปค์นิรันดร์", "Reach Eternal Spike");
add("rk-mmr1200", "rank", U, "แต้ม 1200", "1200 court", (s) => ((s.rank && s.rank.mmr) | 0) >= 1200, "แต้มสนามถึง 1200", "Reach 1200 court score");
add("rk-mmr1800", "rank", U, "แต้ม 1800", "1800 court", (s) => ((s.rank && s.rank.mmr) | 0) >= 1800, "แต้มสนามถึง 1800", "Reach 1800 court score");
add("rk-mmr2500", "rank", R, "แต้ม 2500", "2500 court", (s) => ((s.rank && s.rank.mmr) | 0) >= 2500, "แต้มสนามถึง 2500", "Reach 2500 court score");
add("rk-mmr3500", "rank", E, "แต้ม 3500", "3500 court", (s) => ((s.rank && s.rank.mmr) | 0) >= 3500, "แต้มสนามถึง 3500", "Reach 3500 court score");

add("ex-first", "exhibit", U, "กระชับมิตรแรก", "First exhibition", (s) => nMode(s, "exhibit") >= 1, "เล่น Exhibition 1 แมตช์", "Play 1 Exhibition match");
add("ex-g5", "exhibit", U, "5 แมตช์มิตร", "5 exhibitions", (s) => nMode(s, "exhibit") >= 5, "เล่น Exhibition 5 แมตช์", "Play 5 Exhibition matches");
add("ex-g10", "exhibit", U, "10 แมตช์มิตร", "10 exhibitions", (s) => nMode(s, "exhibit") >= 10, "เล่น Exhibition 10 แมตช์", "Play 10 Exhibition matches");
add("ex-g25", "exhibit", R, "25 แมตช์มิตร", "25 exhibitions", (s) => nMode(s, "exhibit") >= 25, "เล่น Exhibition 25 แมตช์", "Play 25 Exhibition matches");
add("ex-g50", "exhibit", R, "50 แมตช์มิตร", "50 exhibitions", (s) => nMode(s, "exhibit") >= 50, "เล่น Exhibition 50 แมตช์", "Play 50 Exhibition matches");
add("ex-g100", "exhibit", E, "ร้อยแมตช์มิตร", "100 exhibitions", (s) => nMode(s, "exhibit") >= 100, "เล่น Exhibition 100 แมตช์", "Play 100 Exhibition matches");
add("ex-w1", "exhibit", U, "ชัยมิตรแรก", "First exhibit win", (s) => wMode(s, "exhibit") >= 1, "ชนะ Exhibition 1 ครั้ง", "Win 1 Exhibition match");
add("ex-w5", "exhibit", U, "5 ชัยมิตร", "5 exhibit wins", (s) => wMode(s, "exhibit") >= 5, "ชนะ Exhibition 5 ครั้ง", "Win 5 Exhibition matches");
add("ex-w10", "exhibit", R, "10 ชัยมิตร", "10 exhibit wins", (s) => wMode(s, "exhibit") >= 10, "ชนะ Exhibition 10 ครั้ง", "Win 10 Exhibition matches");
add("ex-w25", "exhibit", R, "25 ชัยมิตร", "25 exhibit wins", (s) => wMode(s, "exhibit") >= 25, "ชนะ Exhibition 25 ครั้ง", "Win 25 Exhibition matches");
add("ex-w50", "exhibit", E, "50 ชัยมิตร", "50 exhibit wins", (s) => wMode(s, "exhibit") >= 50, "ชนะ Exhibition 50 ครั้ง", "Win 50 Exhibition matches");
add("ex-l1", "exhibit", U, "แพ้มิตรแรก", "Friendly loss", (s) => lMode(s, "exhibit") >= 1, "แพ้ Exhibition 1 ครั้ง", "Lose 1 Exhibition match");
add("ex-l10", "exhibit", U, "แพ้มิตรสิบ", "Ten friendly losses", (s) => lMode(s, "exhibit") >= 10, "แพ้ Exhibition 10 ครั้ง", "Lose 10 Exhibition matches");
add("ex-ws3", "exhibit", U, "สามต่อมิตร", "Exhibit three-peat", (s) => streak(s, "exhibit", true) >= 3, "ชนะ Exhibition ติดกัน 3 แมตช์", "Win 3 Exhibition matches in a row");
add("ex-ws5", "exhibit", R, "ห้าต่อมิตร", "Exhibit heater", (s) => streak(s, "exhibit", true) >= 5, "ชนะ Exhibition ติดกัน 5 แมตช์", "Win 5 Exhibition matches in a row");
add("ex-ignis", "exhibit", U, "มิตรไฟ", "Fire pal", (s) => playedChar(s, "exhibit", "ignis"), "ลง Exhibition ด้วยอิกนิส", "Play Exhibition as Ignis");
add("ex-aqua", "exhibit", U, "มิตรน้ำ", "Tide pal", (s) => playedChar(s, "exhibit", "aqua"), "ลง Exhibition ด้วยอควา", "Play Exhibition as Aqua");
add("ex-volt", "exhibit", U, "มิตรฟ้า", "Spark pal", (s) => playedChar(s, "exhibit", "volt"), "ลง Exhibition ด้วยโวลต์", "Play Exhibition as Volt");
add("ex-terra", "exhibit", U, "มิตรดิน", "Grove pal", (s) => playedChar(s, "exhibit", "terra"), "ลง Exhibition ด้วยเทอร์รา", "Play Exhibition as Terra");
add("ex-foe3", "exhibit", R, "สามคู่หู", "Three partners", (s) => uniqueFoes(s, "exhibit") >= 3, "เล่น Exhibition กับคู่แข่งต่างกัน 3 คน", "Play Exhibition vs 3 different partners");
add("ex-foe8", "exhibit", E, "วงมิตรกว้าง", "Wide circle", (s) => uniqueFoes(s, "exhibit") >= 8, "เล่น Exhibition กับคู่แข่งต่างกัน 8 คน", "Play Exhibition vs 8 different partners");
add("ex-sweep", "exhibit", R, "กวาดมิตร", "Friendly sweep", (s) => exhibitWinBig(s), "ชนะ Exhibition ด้วยคะแนน 5 ขึ้นไป", "Win an Exhibition 5 points or more");

add("cr-m25", "career", U, "25 แมตช์รวม", "25 matches", (s) => ((s.career && s.career.matches) | 0) >= 25, "เล่นรวม 25 แมตช์", "Play 25 matches in total");
add("cr-m50", "career", R, "50 แมตช์รวม", "50 matches", (s) => ((s.career && s.career.matches) | 0) >= 50, "เล่นรวม 50 แมตช์", "Play 50 matches in total");
add("cr-m100", "career", E, "ร้อยแมตช์รวม", "100 matches", (s) => ((s.career && s.career.matches) | 0) >= 100, "เล่นรวม 100 แมตช์", "Play 100 matches in total");
add("cr-both", "career", R, "สองกระดาน", "Both boards", (s) => nMode(s, "pvp") >= 1 && nMode(s, "special") >= 1, "เล่นทั้ง Rank Mode และแรงก์ธาตุ", "Play both Rank Mode and Element Rank");
add("cr-ult10", "career", U, "สิบอัลติ", "Ten ults", (s) => ((s.career && s.career.ults) | 0) >= 10, "ใช้อัลติรวม 10 ครั้ง", "Use 10 ultimates");
add("cr-ace5", "career", U, "ห้าเอซ", "Five aces", (s) => ((s.career && s.career.aces) | 0) >= 5, "ทำเอซรวม 5 ครั้ง", "Score 5 aces");
add("cr-time30", "career", R, "ครึ่งชั่วโมงในสนาม", "Half-hour court", (s) => ((s.career && s.career.playMs) | 0) >= 30 * 60 * 1000, "แข่งรวม 30 นาที", "Play 30 minutes in matches");

export const TITLE_LIST = TITLES;

export function titleById(id) {
  return TITLES.find((row) => row.id === id) || null;
}

export function titleLabelOf(row, lang) {
  if (!row) return "";
  return lang === "en" ? row.en : row.th;
}

export function titleHintOf(row, lang) {
  if (!row) return "";
  return lang === "en" ? row.hintEn : row.hintTh;
}

export function emptyTitles() {
  return { owned: [], worn: "" };
}
