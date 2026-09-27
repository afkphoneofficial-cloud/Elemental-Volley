const WIN = [
  {
    titleTh: "ชนะขาด!",
    titleEn: "Clean win!",
    th: "แต้มสุดท้ายคมมาก กรรมการบนเสายกมือให้เลย!",
    en: "That last point was sharp. The ref on the post calls it yours!"
  },
  {
    titleTh: "สมแล้วที่เป็นผู้ชนะ",
    titleEn: "A win well earned",
    th: "เกมนี้ไม่ใช่ดวง กรรมการเห็นมือที่ตามลูกจนจบ",
    en: "Not luck. The ref saw you chase the ball all the way to the end."
  },
  {
    titleTh: "พลุขึ้นแล้ว!",
    titleEn: "Fireworks up!",
    th: "เสาเน็ตสั่นเพราะเสียงเชียร์ รับชัยชนะนี้ไปเต็มๆ!",
    en: "The net post is shaking from the cheer. Take this win loud and proud!"
  },
  {
    titleTh: "จบแบบมีจังหวะ",
    titleEn: "A match with rhythm",
    th: "ตบเป็นเพลง กรรมการยิ้มมุมปาก วันนี้คุณคือเจ้าของคอร์ต",
    en: "Every spike had a beat. The ref is grinning. The court is yours today."
  },
  {
    titleTh: "ยกให้ผู้ชนะ!",
    titleEn: "Awarded to the winner!",
    th: "กติกาชัด แต้มครบ กรรมการปิดแมตช์ด้วยท่าชูมือสองข้าง!",
    en: "Rules are clear, score is full. The ref shuts the match with both arms up!"
  }
];

const LOSE = [
  {
    titleTh: "ยังไม่จบที่ใจ",
    titleEn: "The heart is not done",
    th: "กรรมการเดินมาใกล้ๆ แล้วกระซิบบอกว่า ลุกขึ้นมาตบใหม่ได้เลย",
    en: "The ref steps closer and whispers: stand up. You can spike again."
  },
  {
    titleTh: "แพ้ได้ หัวไม่ต่ำ",
    titleEn: "Lose tall, not small",
    th: "แต้มไม่พอวันนี้ แต่กรรมการเห็นทุกการกระโดด ไม่มีใครหัวเราะคุณ",
    en: "The score fell short, but the ref saw every jump. Nobody is laughing at you."
  },
  {
    titleTh: "เกมหน้าเป็นของเธอ",
    titleEn: "The next game is yours",
    th: "กรรมการส่งกำลังใจมาจากเสาเน็ต เกมนี้เก็บเป็นบทเรียน ไม่ใช่จุดจบ",
    en: "A cheer from the net post. This match is a lesson, not the last page."
  },
  {
    titleTh: "ใกล้แล้ว สู้ต่อ",
    titleEn: "So close. Keep going",
    th: "อีกนิดเดียว กรรมการยังปรบมือให้จังหวะดีๆ ที่เธอทำไว้",
    en: "It was that close. The ref still claps for the good beats you found."
  },
  {
    titleTh: "พักแล้วลุยใหม่",
    titleEn: "Rest, then rally",
    th: "หายใจเข้า กรรมการยื่นมือมาแปะหลังเบาๆ แล้วบอกว่า คอร์ตยังรอเธอ",
    en: "Breathe in. A light pat from the ref. The court is still waiting for you."
  }
];

export function pickRefVerdict(didWin) {
  const pack = didWin ? WIN : LOSE;
  return pack[(Math.random() * pack.length) | 0];
}
