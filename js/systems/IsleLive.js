import { botSheet } from "../data/growth.js?v=local206";
import { Session } from "./Session.js";
import { SaveSystem } from "./SaveSystem.js";
import { champSetOf } from "../data/seasonLooks.js";

const FIGHTERS = ["ignis", "aqua", "volt", "terra"];
const BOARD_N = 23;

const NAMES = [
  "kaii", "Beamz", "firstz", "Pondd", "milkk",
  "Pimry", "Fahh", "Nicee", "Vieww", "Ohmz",
  "Force", "Perth", "Mixxi", "Aouu", "Boss",
  "Markk", "TayT", "Neww", "Phu", "Armm",
  "Kenji", "Riku", "Yunaa", "Hana", "Leo.",
  "Kris", "Nate", "Jules", "Alexx", "Samu",
  "RinRin", "Yuki", "Haru", "Soraa", "Noa",
  "Liam", "Miaa", "ZoeZ", "Ryan", "Jakee",
  "Emma", "Noel", "Lunaa", "winwin", "mildd",
  "Icee", "peach", "zomz", "gulf", "Earthh",
  "น้องมิว", "พี่แบม", "ฟ้าใส", "กอล์ฟ", "ตั้ม",
  "ปิงปิง"
];

const MMRS = [
  641, 668, 691, 717, 739, 762, 788, 804, 831, 859,
  877, 894, 913, 937, 958, 971, 994, 1006, 1023, 1048,
  1061, 1079, 1094, 1112, 1133, 1147, 1166, 1181, 1196, 1214,
  1231, 1248, 1263, 1279, 1291, 1308, 1324, 1341, 1366, 1382,
  1417, 1443, 1471, 1496, 1518, 1544, 1571, 1593, 1618, 1642,
  1669, 1694, 1721, 1758, 1784, 1813
];

const GAMES = [
  4, 7, 9, 11, 14, 6, 18, 22, 8, 27,
  31, 12, 36, 41, 16, 5, 47, 21, 53, 19,
  28, 33, 13, 39, 44, 17, 51, 24, 58, 29,
  8, 62, 34, 15, 67, 23, 71, 38, 11, 46,
  26, 54, 32, 9, 61, 42, 18, 49, 37, 14,
  56, 27, 63, 21, 44, 31
];

function uid(i) {
  const n = ((0x9e3779b9 * (i + 17)) >>> 0).toString(16).padStart(8, "0");
  const tail = (0xa3b1 + i * 97).toString(16).padStart(12, "0").slice(-12);
  return n.slice(0, 8) + "-" + n.slice(0, 4) + "-5" + n.slice(1, 4) + "-a" + n.slice(4, 7) + "-" + tail;
}

function handOf(i, mmr) {
  if (i % 11 === 3) return 2;
  if (i % 13 === 5) return 0;
  if (mmr < 860) return 0;
  if (mmr < 1180) return 1;
  return 2;
}

function winsOf(games, hand) {
  const rate = hand === 2 ? 0.61 : hand === 0 ? 0.37 : 0.49;
  return Math.max(0, Math.min(games, Math.round(games * rate)));
}

const ISLE = NAMES.map((name, i) => {
  const mmr = MMRS[i];
  const games = GAMES[i];
  const hand = handOf(i, mmr);
  const wins = winsOf(games, hand);
  return {
    id: uid(i),
    name,
    fighter: FIGHTERS[i % FIGHTERS.length],
    avatar: "av" + String((i % 20) + 1).padStart(2, "0"),
    skin: (i % 3) + 1,
    mmr,
    games,
    wins,
    losses: Math.max(0, games - wins),
    hand
  };
});

function bangkokDay() {
  return Math.floor((Date.now() + 7 * 3600000) / 86400000);
}

function shuffle(list, seed) {
  const a = list.slice();
  let s = seed | 0;
  for (let i = a.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1103515245) + 12345) | 0;
    const j = Math.abs(s) % (i + 1);
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function boardPool() {
  return shuffle(ISLE, bangkokDay() + 19).slice(0, BOARD_N);
}

function asRow(p) {
  return {
    id: p.id,
    display_name: p.name,
    mmr: p.mmr,
    games: p.games,
    wins: p.wins,
    losses: p.losses,
    avatar_id: p.avatar,
    season_mark: null
  };
}

export function mixRankRows(rows) {
  const real = Array.isArray(rows) ? rows.slice() : [];
  const taken = new Set(real.map((r) => String(r.display_name || "").trim().toLowerCase()));
  const extra = boardPool().filter((p) => !taken.has(p.name.toLowerCase())).map(asRow);
  const mixed = real.concat(extra);
  mixed.sort((a, b) => (b.mmr | 0) - (a.mmr | 0) || String(a.display_name || "").localeCompare(String(b.display_name || "")));
  mixed.forEach((row, i) => {
    row.place = i + 1;
  });
  return mixed;
}

export function placeAfterMix(me, rows) {
  if (!me || !me.id) return me;
  const hit = (rows || []).find((r) => String(r.id) === String(me.id));
  if (!hit) {
    const bump = BOARD_N;
    const place = (me.place | 0) + bump;
    return Object.assign({}, me, { place, on_board: place > 0 && place <= 100 });
  }
  return Object.assign({}, me, { place: hit.place, on_board: hit.place <= 100 });
}

export function liveHeadcount(live) {
  if (!live) return 0;
  return Math.max(0,
    ((live.exhibit) | 0) +
    ((live.ranked) | 0) +
    ((live.matches) | 0) * 2
  );
}

export function presenceCount(realOrLive) {
  const n = typeof realOrLive === "number" || realOrLive == null
    ? Math.max(0, realOrLive | 0)
    : liveHeadcount(realOrLive);
  const now = new Date();
  const hour = now.getHours();
  const day = bangkokDay();
  const slot = Math.floor(Date.now() / 120000);
  let floor = 17 + (day % 7);
  if (hour >= 19 || hour < 1) floor += 7;
  else if (hour >= 12 && hour < 15) floor += 5;
  else if (hour >= 7 && hour < 12) floor += 3;
  else if (hour >= 1 && hour < 7) floor -= 4;
  floor += slot % 5;
  if (floor % 10 === 0) floor += 1;
  return Math.max(n, floor);
}

function pickFrom(list, avoidId, avoidName) {
  const id = String(avoidId || "");
  const name = String(avoidName || "").trim().toLowerCase();
  const pool = list.filter((p) => p.id !== id && p.name.toLowerCase() !== name);
  const src = pool.length ? pool : list;
  return src[Math.floor(Math.random() * src.length)] || ISLE[0];
}

export function pickIsleFoe(avoidId, avoidName) {
  const useBoard = Math.random() < 0.58;
  return pickFrom(useBoard ? boardPool() : ISLE, avoidId, avoidName);
}

function handName(hand) {
  if (hand === 0) return "easy";
  if (hand === 2) return "hard";
  return "normal";
}

export function startIsleExhibit(scene, youId, youName) {
  const row = pickIsleFoe(youId, youName);
  const hand = handName(row.hand);
  const id = youId || Session.playerId || "ignis";
  Session.mode = "exhibit";
  Session.exhibitCasual = true;
  Session.exhibitFriendId = null;
  Session.exhibitIncoming = false;
  Session.net = false;
  Session.netHost = false;
  Session.playerId = id;
  Session.botId = row.fighter;
  Session.difficulty = hand;
  Session.botSheet = botSheet(row.fighter, hand);
  Session.trainStage = null;
  Session.youSkin = SaveSystem.skinOf(id);
  Session.youChamp = champSetOf(id);
  Session.foeSkin = row.skin;
  Session.foeChamp = 0;
  Session.youSide = Math.random() < 0.5 ? 1 : 2;
  Session.rival = {
    live: true,
    userId: row.id,
    nameTh: row.name,
    nameEn: row.name,
    mmr: row.mmr,
    fighter: row.fighter,
    avatarId: row.avatar,
    wins: row.wins,
    mostUsed: row.fighter,
    difficulty: hand,
    skin: row.skin,
    champSet: 0
  };
  scene.scene.start("luck");
}
