import { botSheet } from "../data/growth.js?v=local206";
import { bangkokWall, isRankWindowOpen } from "../data/rankWindows.js";
import { Session } from "./Session.js";
import { SaveSystem } from "./SaveSystem.js";
import { champSetOf } from "../data/seasonLooks.js";

const FIGHTERS = ["ignis", "aqua", "volt", "terra"];
const BOARD_N = 61;

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
  "ปิงปิง",
  "Teez", "Offz", "Timmy", "Benny", "Chloe",
  "Ivy", "Maxx", "Cole", "Nico", "Elio",
  "Vera", "Sage", "Wren", "Palo", "Kira",
  "Nori", "Tobi", "Mika", "Rene", "Quin",
  "Faye", "Lars", "Theo", "Nyla", "Coco",
  "Yok", "Nan", "Jin", "Pai", "Deww"
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

function mmrOf(i) {
  if (i < MMRS.length) return MMRS[i];
  const v = 638 + ((i * 47 + 23) % 1171);
  return v % 10 === 0 ? v + 3 : v;
}

function gamesOf(i) {
  if (i < GAMES.length) return GAMES[i];
  return 5 + ((i * 13 + 7) % 68);
}

const ISLE = NAMES.map((name, i) => {
  const mmr = mmrOf(i);
  const games = gamesOf(i);
  const hand = handOf(i, mmr);
  const wins = winsOf(games, hand);
  return {
    id: uid(i),
    i,
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

const SLOT_H = [7, 13, 18, 22];

function seedNum(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function boardStamp(kind, ms = Date.now()) {
  const key = kind === "special" ? "special" : "pvp";
  let at = ms;
  let freeze = false;
  if (!isRankWindowOpen(key, new Date(ms))) {
    freeze = true;
    for (let i = 1; i <= 10; i += 1) {
      const prev = ms - i * 86400000;
      if (isRankWindowOpen(key, new Date(prev))) {
        at = prev;
        break;
      }
    }
  }
  const wall = bangkokWall(new Date(at));
  let slot = SLOT_H.length - 1;
  if (!freeze) {
    slot = 0;
    const hm = wall.h + wall.min / 60 + wall.s / 3600;
    for (let i = 0; i < SLOT_H.length; i += 1) {
      if (hm >= SLOT_H[i]) slot = i;
    }
  }
  return { kind: key, y: wall.y, m: wall.m, d: wall.d, slot };
}

function boardSeed(kind) {
  const s = boardStamp(kind);
  return seedNum(s.kind + "-" + s.y + "-" + s.m + "-" + s.d + "-" + s.slot);
}

function exhibitPool() {
  return shuffle(ISLE, bangkokDay() + 19).slice(0, BOARD_N);
}

function boardPool(kind) {
  return shuffle(ISLE, boardSeed(kind)).slice(0, BOARD_N);
}

function liveMmr(i, seed) {
  const t = hash01(Math.imul(seed, 13) + i * 97 + 5);
  const u = hash01(Math.imul(seed, 29) + i * 61 + 11);
  let v = mmrOf(i) + Math.round((t - 0.5) * 64) + Math.round((u - 0.5) * 18);
  if (v % 10 === 0) v += 1;
  return Math.max(412, Math.min(1897, v));
}

function liveGames(i, seed, slot) {
  const wave = Math.floor(hash01(seed + i * 17 + 3) * 3);
  return gamesOf(i) + (slot | 0) * 2 + wave;
}

const TITLE_PVP = [
  "rp-first", "rp-w1", "rp-w10", "rp-cal", "rp-g25", "rp-ws3", "rp-l1",
  "ex-first", "ex-g10", "ex-w1", "ex-w5", "ex-sweep",
  "rk-sandling", "rk-netling", "rk-server", "rk-setter", "rk-ace", "rk-mmr1200",
  "cr-m25", "cr-ace5", "cr-ult10", "ex-ignis", "ex-aqua", "ex-volt", "ex-terra"
];
const TITLE_SPECIAL = [
  "sp-first", "sp-g10", "sp-g25", "sp-w1", "sp-w10", "cr-both",
  "ex-first", "rk-setter", "rk-ace", "rp-first", "cr-m25", "ex-w5"
];
const TITLE_PVP_HIGH = ["rk-ace", "rk-island", "rp-w25", "rk-mmr1200", "rp-cal"];
const TITLE_SP_HIGH = ["sp-w10", "sp-g25", "rk-ace", "cr-both"];
const TITLE_PVP_LOW = ["rp-first", "ex-first", "rk-sandling", "ex-w1"];
const TITLE_SP_LOW = ["sp-first", "ex-first", "sp-w1"];

function boardTitle(i, mmr, kind) {
  const wear = hash01(i * 91 + 19);
  if (wear > 0.5) return "";
  if (hash01(i * 131 + 41) < 0.035) return "beta-tester";
  const special = kind === "special";
  let pool = special ? TITLE_SPECIAL : TITLE_PVP;
  if (mmr >= 1580) pool = special ? TITLE_SP_HIGH : TITLE_PVP_HIGH;
  else if (mmr < 880) pool = special ? TITLE_SP_LOW : TITLE_PVP_LOW;
  return pool[Math.floor(hash01(i * 53 + 11) * pool.length)] || "";
}

function asRow(p, seed, slot, kind) {
  const i = p.i | 0;
  const mmr = liveMmr(i, seed);
  const games = liveGames(i, seed, slot);
  const hand = handOf(i, mmr);
  const wins = winsOf(games, hand);
  const titleId = boardTitle(i, mmr, kind);
  return {
    id: p.id,
    display_name: p.name,
    mmr,
    games,
    wins,
    losses: Math.max(0, games - wins),
    avatar_id: p.avatar,
    season_mark: null,
    title_id: titleId || null
  };
}

export function mixRankRows(rows, kind) {
  const stamp = boardStamp(kind);
  const seed = boardSeed(kind);
  const real = Array.isArray(rows) ? rows.slice() : [];
  const taken = new Set(real.map((r) => String(r.display_name || "").trim().toLowerCase()));
  const extra = boardPool(kind).filter((p) => !taken.has(p.name.toLowerCase())).map((p) => asRow(p, seed, stamp.slot, stamp.kind));
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

function hash01(seed) {
  let s = seed | 0;
  s = Math.imul(s ^ (s >>> 16), 0x7feb352d);
  s = Math.imul(s ^ (s >>> 15), 0x846ca68b);
  return ((s ^ (s >>> 16)) >>> 0) % 10000 / 10000;
}

function crowdAt(ms) {
  const bkk = new Date(ms + 7 * 3600000);
  const hm = bkk.getUTCHours() + bkk.getUTCMinutes() / 60;
  const dow = bkk.getUTCDay();
  const weekend = dow === 0 || dow === 6;
  const friday = dow === 5;
  let lo = 22;
  let hi = 36;
  if (hm >= 1.5 && hm < 7) {
    lo = 21;
    hi = 33;
  } else if (hm >= 7 && hm < 12) {
    lo = weekend ? 28 : 22;
    hi = weekend ? 46 : 38;
  } else if (hm >= 12 && hm < 14) {
    lo = weekend ? 40 : 36;
    hi = weekend ? 58 : 51;
  } else if (hm >= 14 && hm < 16) {
    lo = weekend ? 44 : 32;
    hi = weekend ? 62 : 46;
  } else if (hm >= 16 && hm < 19) {
    lo = weekend || friday ? 50 : 42;
    hi = weekend || friday ? 70 : 58;
  } else if (hm >= 19 && hm < 23.5) {
    lo = weekend || friday ? 61 : 52;
    hi = weekend || friday ? 79 : 73;
  } else {
    lo = weekend || friday ? 48 : 38;
    hi = weekend || friday ? 68 : 54;
  }
  const slot = Math.floor(ms / 180000);
  const t = hash01(slot * 17 + bangkokDay() * 31);
  let n = Math.round(lo + (hi - lo) * t);
  if (n % 10 === 0) n += t > 0.5 ? 1 : -1;
  return Math.max(21, Math.min(79, n));
}

export function presenceCount(realOrLive) {
  const n = typeof realOrLive === "number" || realOrLive == null
    ? Math.max(0, realOrLive | 0)
    : liveHeadcount(realOrLive);
  return Math.max(n, crowdAt(Date.now()));
}

function exhibitCrowdAt(ms) {
  const day = bangkokDay();
  const slot = Math.floor(ms / 10000);
  const from = Math.max(0, slot - 24);
  let n = Math.floor(hash01(from * 41 + day * 19) * 13);
  for (let s = from + 1; s <= slot; s += 1) {
    const step = Math.floor(hash01(s * 97 + day * 11) * 7) - 3;
    n = Math.max(0, Math.min(12, n + step));
  }
  return n;
}

export function exhibitWaitShown(real, self) {
  const crowd = exhibitCrowdAt(Date.now());
  let n = Math.min(12, Math.max(real | 0, crowd));
  if (self && n < 1) n = 1;
  return n;
}

export function exhibitFillMs() {
  return (3 + Math.floor(Math.random() * 13)) * 1000;
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
  return pickFrom(useBoard ? exhibitPool() : ISLE, avoidId, avoidName);
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
