/** Weekly ranking season: Mon–Sun Bangkok. Rank Mode and Elements Rank are separate boards. */
export const SEASON_PLAY_MIN = 3;
export const SEASON_PLAY_ETHER = 10;
export const SEASON_PLACE_51_100_ETHER = 30;

export const SEASON_TABLE = [
  { id: "1", min: 1, max: 1, shards: 80, plate: true, cheer: true, etherVial: 0, fruit: "top10" },
  { id: "2-3", min: 2, max: 3, shards: 50, plate: true, cheer: false, etherVial: 0, fruit: "top10" },
  { id: "4-10", min: 4, max: 10, shards: 30, plate: true, cheer: false, etherVial: 0, fruit: "top10" },
  { id: "11-50", min: 11, max: 50, shards: 15, plate: false, cheer: false, etherVial: 0 },
  { id: "51-100", min: 51, max: 100, shards: 0, plate: false, cheer: false, etherVial: SEASON_PLACE_51_100_ETHER },
  { id: "play", play: true, matches: SEASON_PLAY_MIN, etherVial: SEASON_PLAY_ETHER }
];

function placeRow(place) {
  const p = place | 0;
  if (p < 1 || p > 100) return null;
  return SEASON_TABLE.find((row) => !row.play && p >= row.min && p <= row.max) || null;
}

export function seasonLootBits(board, row) {
  if (!row) return [];
  const bits = [];
  if (row.cheer) bits.push({ id: "cheer", n: 1, icon: "item-cheer" });
  if (row.plate) bits.push({ id: "plate", n: 1, icon: "item-plate" });
  if (row.shards) bits.push({ id: "shard", n: row.shards | 0, icon: "item-shard" });
  if (row.etherVial) bits.push({ id: "ether_vial", n: row.etherVial | 0, icon: "item-ether" });
  if (board === "special" && row.fruit === "top10") bits.push({ id: "bodyfruit", n: 1, icon: "item-fruit" });
  return bits;
}

export function seasonPayout(board, place, games) {
  const g = games | 0;
  const p = place | 0;
  const row = placeRow(p);
  const fruit = board === "special" && row && row.fruit === "top10" ? 1 : 0;
  if (row) {
    return {
      board,
      place: p,
      games: g,
      play: false,
      shards: row.shards | 0,
      etherVial: row.etherVial | 0,
      etherBar: 0,
      plate: Boolean(row.plate),
      cheer: Boolean(row.cheer),
      fruit
    };
  }
  if (g >= SEASON_PLAY_MIN) {
    return {
      board,
      place: 0,
      games: g,
      play: true,
      shards: 0,
      etherVial: SEASON_PLAY_ETHER,
      etherBar: 0,
      plate: false,
      cheer: false,
      fruit: 0
    };
  }
  return null;
}

function lootTh(pay) {
  const bits = [];
  if (pay.etherVial) bits.push("เอเธอร์ " + pay.etherVial + " ก้อน (ขวดในกระเป๋า)");
  if (pay.shards) bits.push("เศษธาตุ " + pay.shards);
  if (pay.plate) bits.push("ป้ายชื่อซีซั่น");
  if (pay.cheer) bits.push("ธีมเชียร์ซีซั่น");
  if (pay.fruit) bits.push("ผลคืนกาย " + pay.fruit);
  return bits.join(" · ");
}

function lootEn(pay) {
  const bits = [];
  if (pay.etherVial) bits.push(pay.etherVial + " Ether (vials in the bag)");
  if (pay.shards) bits.push(pay.shards + " Element Shards");
  if (pay.plate) bits.push("season nameplate");
  if (pay.cheer) bits.push("season cheer theme");
  if (pay.fruit) bits.push(pay.fruit + " Bodyfruit");
  return bits.join(" · ");
}

export function buildSeasonMail(week, pay) {
  const boardTh = pay.board === "special" ? "Elements Rank" : "Rank Mode";
  const boardEn = boardTh;
  const weekId = week && week.id ? week.id : "";
  const placeTh = pay.place >= 1 && pay.place <= 100
    ? "อันดับ " + pay.place
    : "แข่งครบ " + (pay.games | 0) + " แมตช์";
  const placeEn = pay.place >= 1 && pay.place <= 100
    ? "place #" + pay.place
    : (pay.games | 0) + " matches played";
  const lootT = lootTh(pay);
  const lootE = lootEn(pay);
  return {
    id: "season:" + pay.board + ":" + weekId,
    kind: "season",
    unread: true,
    created_at: new Date().toISOString(),
    title_th: "รางวัลซีซั่น " + boardTh,
    title_en: boardEn + " season rewards",
    body_th: weekId + " · " + placeTh + " · " + lootT + "  ใช้เอเธอร์จากกระเป๋าได้เฉพาะตอนหลอดยังไม่เต็ม",
    body_en: weekId + " · " + placeEn + " · " + lootE + "  Use Ether from the bag only when the pool is not full.",
    payload: {
      week: weekId,
      board: pay.board,
      place: pay.place | 0,
      games: pay.games | 0,
      shards: pay.shards | 0,
      etherVial: pay.etherVial | 0,
      etherBar: pay.etherBar | 0,
      fruit: pay.fruit | 0,
      plate: Boolean(pay.plate),
      cheer: Boolean(pay.cheer)
    }
  };
}
