/** Island pins. x/y are 0–1 on the Etheria map art. */
export const MAP_LOCS = [
  {
    id: "net",
    kind: "shown",
    x: 0.50,
    y: 0.49,
    color: 0xffe08a,
    th: { name: "ตาข่ายแกนฤดูกาล", region: "ใจกลางเกาะ", body: "ตาข่ายผุดจากแกนโลก เป็นพรมแดนที่ห้ามดาบ แต่ยังให้แข่งได้ ผู้ชนะไม่ได้ครอบครองเกาะ แค่ได้สิทธิ์ปกป้องฤดูนั้นหนึ่งรอบปี" },
    en: { name: "Season Core Net", region: "Island heart", body: "A net rose from the planet’s core: no blades, only a match. The winner does not own Etheria. They guard that season for one year." }
  },
  {
    id: "ignis",
    kind: "shown",
    char: "ignis",
    x: 0.50,
    y: 0.80,
    color: 0xff5a1f,
    th: { name: "อิกนิส", region: "ชายหาดเถ้าอุ่น", body: "ฟักจากกองไฟชายหาดที่ดับไม่ได้ทั้งคืน เปลวเล็กๆ เลือกเป็นมังกรน้อยแทนไฟป่า อัลติ BLAZE SPIKE ทะลุการรับ แล้วเผาแต้มถัดไป" },
    en: { name: "Ignis", region: "Ember Shore", body: "Hatched from a beach fire that would not die. The tiny flame chose to be a dragon, not a wildfire. BLAZE SPIKE pierces the receive and burns the next points." }
  },
  {
    id: "aqua",
    kind: "shown",
    char: "aqua",
    x: 0.17,
    y: 0.52,
    color: 0x3ad6ff,
    th: { name: "อควา", region: "ลากูนน้ำค้าง", body: "หยดน้ำค้างที่เด้งบนใบบอนไซจนลืมว่าเคยเป็นแค่หยด กลายเป็นสไลม์หูครีบที่หัวเราะทุกครั้งที่ลื่น อัลติ TIDAL BREAK ทำให้คู่แข่งเปียกแล้วเดินสไลด์" },
    en: { name: "Aqua", region: "Dew Lagoon", body: "A dew drop that bounced until it forgot it was only a drop. Now a fin-eared slime that laughs at slips. TIDAL BREAK soaks the foe so their walk slides off-course." }
  },
  {
    id: "volt",
    kind: "shown",
    char: "volt",
    x: 0.81,
    y: 0.34,
    color: 0xc8ff3a,
    th: { name: "โวลต์", region: "สันฟ้าผ่าแรก", body: "ลูกจิ้งจอกที่ถูกฟ้าผ่าแรกของพายุฤดูใบไม้ผลิฟาดแล้วยังวิ่งต่อ ขนเก็บประกายไว้เป็นของเล่น อัลติ THUNDER GHOST ทำให้ลูกหายเป็นสายฟ้าแล้วช็อก" },
    en: { name: "Volt", region: "First Bolt Ridge", body: "A fox kit struck by spring’s first bolt, then kept running. Its fur keeps the spark as a toy. THUNDER GHOST turns the ball into lightning and shocks the foe." }
  },
  {
    id: "terra",
    kind: "shown",
    char: "terra",
    x: 0.36,
    y: 0.40,
    color: 0xe0a24a,
    th: { name: "เทอร์รา", region: "หุบเขารากเพลง", body: "ก้อนกรวดมอสที่ตื่นเมื่อรากไม้ร้องเพลงใต้ดิน เป็นบ้านเล็กๆ ที่เดินได้ ไม่ใช่ก้อนเหลี่ยม อัลติ QUAKE SMASH ทำลูกเป็นหินแล้วติดขอบได้แต้มทันที" },
    en: { name: "Terra", region: "Root-Song Hollow", body: "A mossy pebble that woke when roots sang underground. A tiny walking home, not a cube. QUAKE SMASH turns the ball to stone. If it sticks to an edge, the point is yours." }
  },
  {
    id: "vapor",
    kind: "sealed",
    x: 0.58,
    y: 0.42,
    color: 0xb8d4ff,
    th: { name: "VAPOR", region: "ม่านไอน้ำเหนือเน็ต", body: "แฟ้มปิด  เมื่อเปลวไฟไม่เผาน้ำ และน้ำไม่ดับไฟ มีร่างที่สามเกิดบนไอน้ำเหนือตาข่าย ยังไม่มีผู้ใดยืนยันว่าลงแข่งได้" },
    en: { name: "VAPOR", region: "Steam veil above the net", body: "Sealed file. When flame will not burn water, and water will not drown flame, a third shape forms in the steam. No one has confirmed it can enter a match." }
  },
  {
    id: "quasar",
    kind: "sealed",
    x: 0.71,
    y: 0.58,
    color: 0x7d5cff,
    th: { name: "QUASAR", region: "หินกลืนฟ้า", body: "แฟ้มปิด  ตำนานเล่าว่ามีก้อนหินกลืนฟ้าผ่าแล้วยังไม่แตก ข้างในมีดาวดวงเล็กสั่นอยู่ กรรมการสั่งปิดด้วยตราห้ามเปิด" },
    en: { name: "QUASAR", region: "Bolt-swallowed stone", body: "Sealed file. A stone swallowed lightning and did not crack. A tiny star still shakes inside. The refs stamped the file shut." }
  },
  {
    id: "pale",
    kind: "fog",
    x: 0.27,
    y: 0.14,
    color: 0x8aa0b4,
    th: { name: "ไหล่เขาสีซีด", region: "เหนือสุดของเกาะ", body: "หมอกหนาเกินกว่าที่กรรมการจะลงบันทึก ยังไม่มีการสำรวจ เป็นช่องว่างไว้สำหรับการเดินทางในซีรีส์ต่อๆ ไป" },
    en: { name: "Pale Shelf", region: "Far north", body: "Fog too thick for the refs to log. Still unsurveyed. Held open for later journeys in the series." }
  },
  {
    id: "reef",
    kind: "fog",
    x: 0.88,
    y: 0.80,
    color: 0x8aa0b4,
    th: { name: "แนวปะการังนอก", region: "ทะเลตะวันออกเฉียงใต้", body: "เกาะเล็กนอกแผนที่หลัก คลื่นกลบทุกสัญญาณ ยังไม่สำรวจ รอแพทช์และโหมดใหม่ในอนาคต" },
    en: { name: "Outer Reef", region: "Southeast sea", body: "Islets off the main chart. Waves swallow every signal. Unexplored, waiting on later patches and modes." }
  }
];
