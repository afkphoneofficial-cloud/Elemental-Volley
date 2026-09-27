/** Character catalog: stats stay equal. Identity is input style + perfect bonus. */
export const ROSTER = {
  ignis: {
    id: "ignis",
    name: "IGNIS",
    thName: "อิกนิส",
    element: "FIRE",
    role: "Balanced",
    blurb: "เบบี้ดรากอนไฟแก้มป่อง",
    spikeInput: "hold_release",
    spikeLabel: "Ember Charge — ค้าง ENTER แล้วปล่อยตอนวงสว่าง",
    perfect: "ควันไฟบดบังจุดตกชั่วคราว",
    colors: { main: 0xff5a1f, dark: 0x3a1208, visor: 0xffe0a0 }
  },
  aqua: {
    id: "aqua",
    name: "AQUA",
    thName: "อควา",
    element: "WATER",
    role: "Speed",
    blurb: "สไลม์ยืดหยุ่นเด้งดึ๋ง",
    spikeInput: "direction_tap",
    spikeLabel: "Tide Flick — กดทิศทางตอนลูกศรสว่าง",
    perfect: "วิถีโค้งอ่านทิศยากขึ้น",
    colors: { main: 0x3ad6ff, dark: 0x073044, visor: 0xe8ffff }
  },
  volt: {
    id: "volt",
    name: "VOLT",
    thName: "โวลต์",
    element: "VOLT",
    role: "Technical",
    blurb: "เบบี้จิ้งจอกสายฟ้า",
    spikeInput: "ring_tap",
    spikeLabel: "Spark Pulse — กด ENTER ตอนวงซ้อนกัน",
    perfect: "วาร์ปซิกแซกก่อนถึงพื้น",
    colors: { main: 0xc8ff3a, dark: 0x1c2808, visor: 0xf7ffe0 }
  },
  terra: {
    id: "terra",
    name: "TERRA",
    thName: "เทอร์รา",
    element: "EARTH",
    role: "Power",
    blurb: "วิญญาณดินมอสกลมๆ น่ารัก",
    spikeInput: "gauge_stop",
    spikeLabel: "Quake Press — กด ENTER เมื่อเข็มอยู่ในโซนเขียว",
    perfect: "แรงตบสูงสุด และกล้องสั่น",
    colors: { main: 0xe0a24a, dark: 0x2a1c0c, visor: 0xfff0d0 }
  }
};

export const ROSTER_IDS = Object.keys(ROSTER);

export function getCharacter(id) {
  return ROSTER[id] || ROSTER.ignis;
}
