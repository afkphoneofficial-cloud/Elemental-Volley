/** Weekly ranking season: Mon–Sun Bangkok. Rank Mode and Elements Rank are separate boards. */
export const SEASON_PLAY_MIN = 3;
export const SEASON_PLAY_ETHER = 10;
export const SEASON_PLACE_51_100_ETHER = 30;

const PLACE_ROWS = [
  { max: 1, shards: 80, plate: true, cheer: true },
  { max: 3, shards: 50, plate: true, cheer: false },
  { max: 10, shards: 30, plate: true, cheer: false },
  { max: 50, shards: 15, plate: false, cheer: false },
  { max: 100, shards: 0, plate: false, cheer: false, etherVial: SEASON_PLACE_51_100_ETHER }
];

function placeRow(place) {
  const p = place | 0;
  if (p < 1 || p > 100) return null;
  return PLACE_ROWS.find((row) => p <= row.max) || null;
}

export function seasonPayout(board, place, games) {
  const g = games | 0;
  const p = place | 0;
  const fruit = board === "special" && p >= 1 && p <= 10 ? 1 : 0;
  const row = placeRow(p);
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
