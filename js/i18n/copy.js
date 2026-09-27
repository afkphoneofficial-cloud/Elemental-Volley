/** All player-facing copy. Keys are dotted paths into th / en trees. */

export const COPY = {
  th: {
    web: {
      music: "♪ เพลง",
      hint: "← → ↑ ↓    ENTER ตีธรรมดา    ENTER + ทิศทาง ตบแรง",
      authNote: "รับเฉพาะบัญชี Gmail",
      authName: "ชื่อบัญชีในเกม",
      authSave: "บันทึกชื่อ",
      authGmailOnly: "เข้าสู่ระบบด้วย Gmail เท่านั้น",
      authNoBackend: "ยังไม่ได้เชื่อมฐานสมาชิก — ใส่ supabaseUrl และ anon key ใน js/config/backend.js แล้วรีเฟรช",
      authSetName: "ตั้งชื่อบัญชีที่จะแสดงในเกม",
      authWelcome: "ยินดีต้อนรับ ตั้งชื่อบัญชีได้เลย",
      authBadMail: "รับเฉพาะบัญชี @gmail.com",
      authNameLen: "ชื่อต้องมี 2–16 ตัวอักษร",
      authNameChars: "ใช้ได้เฉพาะไทย อังกฤษ ตัวเลข และ _",
      authNameTaken: "ชื่อนี้มีคนใช้แล้ว",
      authFail: "ล็อกอินไม่สำเร็จ"
    },
    menu: {
      kicker: "ELEMENTAL VOLLEY",
      title: "SPIKE IT !!",
      tag: "วอลเลย์อาร์เคด  •  อสูรธาตุจิ๋ว  •  1v1 กับบอท",
      enter: "เล่น",
      wiki: "แผนที่โลก",
      settings: "ตั้งค่า",
      signedIn: "บัญชี  ·  {name}"
    },
    auth: {
      login: "ต้องเข้าสู่ระบบด้วย Gmail ก่อน จึงจะเล่นและเห็นข้อมูลในไอดีได้",
      wikiFirst: "ดูแผนที่โลกก่อน"
    },
    hub: {
      title: "ล็อบบี้",
      stats: "{account}   ·   {name}   ·   ปลดล็อก {n}/4   ·   ตรา {tokens}   ·   PVP {pvp}",
      play: "เล่นกับบอท",
      career: "โปรไฟล์ / สถิติ",
      shop: "ร้านค้า / ปลดล็อกตัวละคร",
      wiki: "แผนที่โลก",
      home: "กลับหน้าแรก",
      settings: "ตั้งค่า",
      hint: "ลูกศรเดิน  ·  ENTER ตี  ·  ค้าง ENTER ปล่อยอัลติ",
      ether: "เอเธอร์  {n}/{max}",
      etherWait: "อีก {t}",
      etherFull: "เต็มแล้ว",
      etherBot: "บอทไม่กินเอเธอร์"
    },
    starter: {
      title: "เลือกตัวละครแรก",
      sub: "เลือกได้ 1 ตัวฟรีจากทั้ง 4 ตัว  ตัวที่เหลือค่อยปลดด้วยตราภายหลัง",
      free: "ตัวแรก ฟรี",
      hint: "แตะกรอบเพื่อเลือกคู่หูคนแรก",
      pick: "คุณเลือก: {name}",
      confirm: "ยืนยันตัวนี้",
      cheerTitle: "ยินดีด้วย!",
      cheerSub: "{name} คือคู่หูคนแรกของคุณบนเกาะอีเธเรีย",
      continue: "เข้าล็อบบี้"
    },
    career: {
      title: "โปรไฟล์",
      sub: "บัญชี  ·  {name}",
      totals: "แมตช์ {m}   ·   ชนะ {w}   ·   แพ้ {l}   ·   เอซ {aces}   ·   อัลติ {ults}   ·   เวลา {time}   ·   สตรีคสูงสุด {streak}   ·   ลูกยาวสุด {rally}",
      logHead: "แมตช์ล่าสุด  {n} เกม",
      empty: "ยังไม่มีแมตช์ในไอดีนี้",
      row: "{result}  ·  {mode}  ·  {you} {a}–{b} {foe}",
      win: "ชนะ",
      lose: "แพ้",
      bot: "บอท",
      pvp: "PVP",
      more: "อีก {n} เกมในคลัง (เก็บสูงสุด 30)"
    },
    select: {
      title: "เลือกตัวที่ปลดล็อกแล้ว แล้วสู้กับบอท",
      ready: "พร้อมลงสนาม",
      locked: "ล็อก  ·  100 ตรา",
      pick: "คุณ: {name}   ·   ความยากบอท: {diff}",
      start: "เริ่มแมตช์",
      botEasy: "บอท ง่าย",
      botNormal: "บอท ปกติ",
      botHard: "บอท ยาก",
      diffEasy: "ง่าย",
      diffNormal: "ปกติ",
      diffHard: "ยาก"
    },
    luck: {
      title: "เสี่ยงดวงก่อนแข่ง",
      sub: "ผู้ชนะเลือกสนาม  ·  ผู้แพ้เสิร์ฟก่อน",
      rolling: "กำลังทอย...",
      youWin: "คุณชนะ! เลือกสนามได้  ·  บอทเสิร์ฟก่อน",
      botWin: "บอทชนะ · เลือก {court}  ·  คุณเสิร์ฟก่อน"
    },
    shop: {
      title: "ร้านค้า",
      wallet: "ตราตัวละคร {tokens}   ·   แต้ม PVP {pvp}   ·   Premium {premium}   ·   ปลดล็อกตัวละครละ {cost} ตรา",
      owned: "เป็นเจ้าของแล้ว",
      unlock: "ปลดล็อก 100 ตรา",
      cheerHead: "ธีมฉลองแต้ม  ·  ใช้ตอนได้คะแนน",
      soon: "เร็วๆ นี้",
      using: "กำลังใช้",
      wear: "สวมใส่",
      buyPrem: "ซื้อ {price} Premium",
      exchange: "แลกแต้ม PVP เป็นตรา  (1:1)",
      topup: "เติม Premium (จำลอง) +100",
      buyTokens: "ซื้อตรา 100 ด้วย Premium",
      foot: "ชนะบอทได้แต้ม PVP แลกเป็นตรา  ·  ธีมฉลองแต้มซื้อด้วย Premium ได้เลย"
    },
    result: {
      pvp: "แต้ม PVP +{pvp}{bonus}",
      firstWin: "   ·   โบนัสชนะแรก +{n}",
      total: "รวมตอนนี้  PVP {pvp}   ·   ตรา {tokens}",
      again: "เล่นอีกครั้ง",
      shop: "ร้านค้าปลดล็อก",
      hub: "กลับล็อบบี้",
      winMark: "ชนะการแข่งขัน",
      loseMark: "แพ้การแข่งขัน",
      refLabel: "คำตัดสินจาก {name}",
      youTag: "คุณ  ·  {name}",
      botTag: "คู่แข่ง  ·  {name}",
      statsBtn: "ดูสถิติแมตช์",
      statsBack: "กลับคำตัดสิน",
      statsTitle: "สรุปแมตช์",
      statsTime: "เวลา",
      statsHits: "ตบของคุณ",
      statsPower: "ตบแรง",
      statsUlt: "อัลติที่ใช้",
      statsStreak: "สตรีคสูงสุด",
      statsRally: "ลูกยาวสุด",
      statsAce: "Ace",
      statsError: "ตีเสียเอง",
      talkAce: "Ace {n} ครั้ง คือจุดแข็งของแมตช์นี้",
      talkStreak: "สตรีค {n} แต้ม บอกว่าตอนไหลคุณหยุดไม่อยู่",
      talkRally: "ลูกยาวสุด {n} ครั้ง แปลว่าตามลูกได้เหนียว",
      talkUlt: "อัลติออก {n} ครั้ง จังหวะปล่อยได้งาน",
      talkHits: "ตบ {n} ครั้ง มีส่วนร่วมทั้งแมตช์",
      talkKeep: "แมตช์นี้ยังมีจังหวะให้เก็บต่อ",
      talkError: "ตีเสียเอง {n} ครั้ง คือจุดที่ต้องเก็บ อย่าเพิ่งปิดแต้มฝั่งตัวเอง",
      talkNeedPower: "ตบแรงน้อยไป ลองกดค้างตอนลูกสูงกว่านี้",
      talkNoAce: "ยังไม่มี Ace ลองเสิร์ฟหรือตบให้ฝั่งนั้นรับไม่ทัน",
      talkNext: "รอบหน้าเก็บจังหวะเดิม แล้วลดความเสี่ยงตอนรับ"
    },
    wiki: {
      title: "แผนที่โลก",
      sub: "เกาะอีเธเรีย  ·  แตะหมุดเพื่อดูที่อยู่",
      tabStory: "เรื่องราว",
      tabRules: "กติกา",
      tabCast: "ธาตุทั้งสี่",
      tabSecret: "แฟ้มลับ",
      tabMap: "แผนที่เกาะ",
      legendShown: "ปรากฏแล้ว",
      legendSealed: "ยังไม่ปรากฏ",
      legendFog: "ยังไม่สำรวจ",
      statusShown: "ปรากฏตัวแล้ว",
      statusSealed: "ยังไม่ปรากฏตัว",
      statusFog: "ยังไม่ได้สำรวจ",
      close: "ปิด",
      pinHint: "แตะหมุดบนแผนที่",
      scrollHint: "เลื่อนลงเพื่ออ่านต่อ",
      secretHead: "แฟ้มที่กรรมการสั่งปิด  ·  ยังไม่มีกำหนดเปิดตัว",
      from: "ที่มา {mark}"
    },
    play: {
      you: "คุณ",
      bot: "บอท",
      ready: "พร้อม",
      quit: "ออก",
      hudHint: "← → ↑ ↓   ENTER ตี   ค้าง ENTER ปล่อยอัลติ",
      hudHintTouch: "ซ้ายเลื่อนทิศทาง  ·  ขวากดตบ  ·  ค้างขวาปล่อยอัลติ",
      ultFull: "เกจเต็ม!  ค้าง ENTER แล้วตบเพื่อปล่อยอัลติ",
      matchPoint: "MATCH POINT",
      matchSub: "แต้มต่อไปจบเกมได้  ·  {who}",
      both: "ทั้งสองฝั่ง",
      pierce: "ทะลุ!",
      burn: "เผา!",
      stone: "หินติดขอบ!",
      para: "ช็อก",
      slip: "ลื่น!",
      statusBlocked: "ติดสถานะอยู่แล้ว!",
      ultReady: "พร้อมอัลติ!",
      pause: "พัก"
    },
    streak: {
      2: "{name} เริ่มไหลแล้ว!",
      3: "{name} ต่อเนื่อง!",
      4: "{name} หยุดไม่อยู่!",
      5: "{name} เดือดจัด!",
      more: "{name} แต้มไหลไม่หยุด!"
    },
    nav: { back: "กลับ" },
    touch: {
      move: "เดิน",
      hit: "ตบ",
      rotate: "หมุนจอเป็นแนวนอนจะเล่นง่ายกว่า  ·  แตะเพื่อปิด"
    },
    settings: {
      title: "ตั้งค่า",
      sub: "เซฟผูกกับบัญชี Gmail บนคลาวด์",
      auto: "อัตโนมัติ",
      pc: "คอมพิวเตอร์  ·  คีย์บอร์ด",
      mobile: "มือถือ  ·  ปุ่มสัมผัส",
      note: "มือถือใช้วงกลมซ้ายเลื่อนทิศทาง วงกลมขวากดตบ ค้างไว้เพื่ออัลติ",
      lang: "ภาษา",
      music: "เพลง",
      sfx: "เอฟเฟกต์",
      controls: "การควบคุม",
      logout: "ออกจากระบบ",
      credits: "Elemental Volley : Spike It !!  ·  เกมอาร์เคดต้นฉบับบนเว็บ"
    },
    pause: {
      title: "พักการแข่ง",
      resume: "เล่นต่อ",
      quit: "ออกจากแมตช์"
    },
    cheer: {
      classic: "คลาสสิก",
      classicBlurb: "ฉลองแต้มชุดแรก ติดตัวมาฟรี",
      festival: "เทศกาลพลุ",
      festivalBlurb: "ฉลองสีสด กระดาษโปรย อลังการ",
      starlight: "แสงดาว",
      starlightBlurb: "โทนม่วงดาว กึ่งลับ รอแพทช์ต่อ"
    },
    court: {
      summer: "ฤดูร้อน",
      summerFlavor: "ชายหาดแดดจัด",
      summerRef: "กรรมการแดด",
      rain: "ฤดูฝน",
      rainFlavor: "ฝนตกพรำๆ",
      rainRef: "กรรมการฝน",
      spring: "ฤดูใบไม้ผลิ",
      springFlavor: "กลีบซากุระร่วง",
      springRef: "กรรมการซากุระ",
      winter: "ฤดูหนาว",
      winterFlavor: "หิมะโปรยปราย",
      winterRef: "กรรมการหิมะ"
    }
  },
  en: {
    web: {
      music: "♪ Music",
      hint: "← → ↑ ↓    ENTER to hit    ENTER + direction for a power spike",
      authNote: "Gmail accounts only",
      authName: "In-game name",
      authSave: "Save name",
      authGmailOnly: "Sign in with Gmail only",
      authNoBackend: "Member cloud is not connected — paste supabaseUrl and the anon key into js/config/backend.js, then refresh",
      authSetName: "Set the name shown in-game",
      authWelcome: "Welcome. Choose a display name.",
      authBadMail: "Only @gmail.com accounts are allowed",
      authNameLen: "Name must be 2–16 characters",
      authNameChars: "Thai, English, numbers, and _ only",
      authNameTaken: "That name is already taken",
      authFail: "Sign-in failed"
    },
    menu: {
      kicker: "ELEMENTAL VOLLEY",
      title: "SPIKE IT !!",
      tag: "Arcade volleyball  •  Tiny elementals  •  1v1 vs a bot",
      enter: "Play",
      wiki: "World map",
      settings: "Settings",
      signedIn: "Signed in  ·  {name}"
    },
    auth: {
      login: "Sign in with Gmail to play and load your account",
      wikiFirst: "View the world map first"
    },
    hub: {
      title: "Lobby",
      stats: "{account}   ·   {name}   ·   Unlocked {n}/4   ·   Tokens {tokens}   ·   PVP {pvp}",
      play: "Play vs bot",
      career: "Profile / stats",
      shop: "Shop / unlock fighters",
      wiki: "World map",
      home: "Back to title",
      settings: "Settings",
      hint: "Arrows to move  ·  ENTER to hit  ·  Hold ENTER to fire your ult",
      ether: "Ether  {n}/{max}",
      etherWait: "Next in {t}",
      etherFull: "Full",
      etherBot: "Bots do not spend ether"
    },
    starter: {
      title: "Pick your first fighter",
      sub: "Any of the four is free as your starter. Unlock the rest later with character tokens.",
      free: "FREE STARTER",
      hint: "Tap a plate to choose your first partner",
      pick: "You picked: {name}",
      confirm: "Confirm this fighter",
      cheerTitle: "Welcome aboard!",
      cheerSub: "{name} is your first partner on Etheria Island",
      continue: "Enter the lobby"
    },
    career: {
      title: "Profile",
      sub: "Account  ·  {name}",
      totals: "Matches {m}   ·   Wins {w}   ·   Losses {l}   ·   Aces {aces}   ·   Ults {ults}   ·   Time {time}   ·   Best streak {streak}   ·   Longest rally {rally}",
      logHead: "Recent matches  {n}",
      empty: "No matches on this ID yet",
      row: "{result}  ·  {mode}  ·  {you} {a}–{b} {foe}",
      win: "Win",
      lose: "Loss",
      bot: "Bot",
      pvp: "PVP",
      more: "{n} more in the vault (keeps 30)"
    },
    select: {
      title: "Pick an unlocked fighter, then face a bot",
      ready: "Ready to play",
      locked: "Locked  ·  100 tokens",
      pick: "You: {name}   ·   Bot difficulty: {diff}",
      start: "Start match",
      botEasy: "Bot Easy",
      botNormal: "Bot Normal",
      botHard: "Bot Hard",
      diffEasy: "Easy",
      diffNormal: "Normal",
      diffHard: "Hard"
    },
    luck: {
      title: "Coin flip before the match",
      sub: "Winner picks the court  ·  Loser serves first",
      rolling: "Rolling...",
      youWin: "You win! Pick a court  ·  The bot serves first",
      botWin: "Bot wins · picked {court}  ·  You serve first"
    },
    shop: {
      title: "Shop",
      wallet: "Tokens {tokens}   ·   PVP {pvp}   ·   Premium {premium}   ·   Unlock cost {cost} tokens",
      owned: "Owned",
      unlock: "Unlock for 100 tokens",
      cheerHead: "Cheer themes  ·  Played when you score",
      soon: "Coming soon",
      using: "Equipped",
      wear: "Equip",
      buyPrem: "Buy {price} Premium",
      exchange: "Trade PVP points for tokens  (1:1)",
      topup: "Add Premium (mock) +100",
      buyTokens: "Buy 100 tokens with Premium",
      foot: "Beat the bot for PVP points, then trade them for tokens. Cheer themes cost Premium."
    },
    result: {
      pvp: "PVP +{pvp}{bonus}",
      firstWin: "   ·   First win bonus +{n}",
      total: "Now  PVP {pvp}   ·   Tokens {tokens}",
      again: "Play again",
      shop: "Unlock shop",
      hub: "Back to lobby",
      winMark: "Match won",
      loseMark: "Match lost",
      refLabel: "Ruling from {name}",
      youTag: "You  ·  {name}",
      botTag: "Rival  ·  {name}",
      statsBtn: "Match stats",
      statsBack: "Back to ruling",
      statsTitle: "Match recap",
      statsTime: "Time",
      statsHits: "Your hits",
      statsPower: "Power hits",
      statsUlt: "Ults used",
      statsStreak: "Best streak",
      statsRally: "Longest rally",
      statsAce: "Aces",
      statsError: "Self errors",
      talkAce: "{n} aces were the sharpest part of this match",
      talkStreak: "A streak of {n} shows you were rolling",
      talkRally: "A {n}-hit rally means you stayed in the fight",
      talkUlt: "{n} ults landed with purpose",
      talkHits: "{n} hits. You were in the rally the whole way",
      talkKeep: "There is still a better version of this match in you",
      talkError: "{n} self errors. Don't close the point on your own side",
      talkNeedPower: "Too few power hits. Hold the button when the ball is high",
      talkNoAce: "No aces yet. Serve or spike before they can set",
      talkNext: "Keep the good beats. Cut the risky receives"
    },
    wiki: {
      title: "World map",
      sub: "Etheria Island  ·  Tap a pin to see a home",
      tabStory: "Story",
      tabRules: "Rules",
      tabCast: "The four elements",
      tabSecret: "Secret files",
      tabMap: "Island map",
      legendShown: "Appeared",
      legendSealed: "Not appeared",
      legendFog: "Unexplored",
      statusShown: "Has appeared",
      statusSealed: "Has not appeared",
      statusFog: "Unexplored",
      close: "Close",
      pinHint: "Tap a pin on the map",
      scrollHint: "Scroll to read more",
      secretHead: "Files sealed by the refs  ·  No release date yet",
      from: "Origin {mark}"
    },
    play: {
      you: "YOU",
      bot: "BOT",
      ready: "READY",
      quit: "Quit",
      hudHint: "← → ↑ ↓   ENTER hit   Hold ENTER to fire ult",
      hudHintTouch: "Left stick to move  ·  Right tap to hit  ·  Hold right to fire ult",
      ultFull: "Gauge full!  Hold ENTER on a spike to fire your ult",
      matchPoint: "MATCH POINT",
      matchSub: "Next point can end the game  ·  {who}",
      both: "Both sides",
      pierce: "PIERCE!",
      burn: "BURN!",
      stone: "Stone stuck!",
      para: "SHOCK",
      slip: "SLIP!",
      statusBlocked: "Already afflicted!",
      ultReady: "ULT READY!",
      pause: "Pause"
    },
    streak: {
      2: "{name} is on a run!",
      3: "{name} keeps going!",
      4: "{name} cannot be stopped!",
      5: "{name} is on fire!",
      more: "{name} will not drop the streak!"
    },
    nav: { back: "Back" },
    touch: {
      move: "MOVE",
      hit: "HIT",
      rotate: "Turn the phone sideways for a bigger court  ·  Tap to hide"
    },
    settings: {
      title: "Settings",
      sub: "Progress is saved to your Gmail account in the cloud",
      auto: "Automatic",
      pc: "Computer  ·  Keyboard",
      mobile: "Phone  ·  Touch pads",
      note: "On phone, left stick moves, right tap hits, hold right to fire your ult.",
      lang: "Language",
      music: "Music",
      sfx: "Effects",
      controls: "Controls",
      logout: "Sign out",
      credits: "Elemental Volley : Spike It !!  ·  An original web arcade game"
    },
    pause: {
      title: "Paused",
      resume: "Resume",
      quit: "Leave match"
    },
    cheer: {
      classic: "Classic",
      classicBlurb: "The first cheer set. Free with your account.",
      festival: "Festival fireworks",
      festivalBlurb: "Bright colors and confetti",
      starlight: "Starlight",
      starlightBlurb: "Purple star glow. Semi-secret, later patch."
    },
    court: {
      summer: "Summer",
      summerFlavor: "A blazing beach",
      summerRef: "Sun ref",
      rain: "Rainy season",
      rainFlavor: "A light, steady rain",
      rainRef: "Rain ref",
      spring: "Spring",
      springFlavor: "Falling cherry petals",
      springRef: "Sakura ref",
      winter: "Winter",
      winterFlavor: "Snow drifting down",
      winterRef: "Snow ref"
    }
  }
};

export const LORE = {
  th: {
    kicker: "ตำนานเกาะอีเธเรีย",
    title: "ทำไมต้องตบลูก แทนที่จะรบ",
    story: [
      "นานมาแล้ว ธาตุทั้งสี่บนเกาะอีเธเรียอยู่ร่วมกันไม่ได้ ไฟเผาป่า น้ำท่วมหาด ฟ้าผ่าหิน ดินกลืนฟ้า โลกเกือบแตกเพียงเพราะวิญญาณธาตุอยากพิสูจน์ว่าใครคือเจ้าของฤดูกาล",
      "จนกระทั่งตาข่ายกลางผุดขึ้นจากแกนโลก เป็นพรมแดนบางๆ ที่ห้ามดาบ แต่ยังอนุญาตให้แข่งขันได้ กฎมีข้อเดียว: อย่าทำสงคราม มาตบลูกที่เรียกว่า แกนฤดูกาล แทน",
      "ผู้ชนะไม่ได้ครอบครองเกาะ แต่ได้สิทธิ์ปกป้องฤดูนั้นหนึ่งรอบปี แพ้แล้วไม่ตาย แค่เสียจังหวะ แล้วลุกขึ้นเสิร์ฟใหม่ นี่จึงเป็นที่มาของ Elemental Volley : Spike It !!",
      "กรรมการบนเสาเน็ตคือภูตฤดูกาลตัวเล็กๆ ที่ยังจำได้ว่าสงครามครั้งสุดท้ายดังอย่างไร พวกมันนั่งเฝ้าตาข่าย ไม่ได้เข้าแข่ง แต่ถ้าลูกติดเสา อย่าแปลกใจถ้ามันจะยิ้ม"
    ],
    ball: "ลูกวอลเลย์ในตำนานคือเปลือกแกนฤดูกาลที่กลั่นจากลมหายใจทั้งสี่ธาตุ ตบแรงพอ ธาตุในตัวผู้ตบจะซึมเข้าลูก แล้วปล่อยเป็นอัลติเมต",
    howTo: "ตบแรงเติมเกจ (4 ครั้งเต็มหลอด) เต็มแล้วค้าง ENTER ขณะตบเพื่อปล่อยอัลติ ลูกที่โดนหลังจบแต้มจะไม่เติมเกจจนกว่าจะเสิร์ฟใหม่  สถานะจากอัลติไม่ซ้อนกัน ถ้าคู่แข่งติดสถานะอยู่แล้ว จะติด debuff เพิ่มไม่ได้จนกว่าจะหมด"
  },
  en: {
    kicker: "The legend of Etheria Island",
    title: "Why they spike a ball instead of going to war",
    story: [
      "Long ago the four elements on Etheria Island could not share the land. Fire burned the woods, water flooded the shore, lightning split the stone, and earth swallowed the sky. The world nearly broke because the spirits wanted to own the seasons.",
      "Then a net rose from the planet’s core: a thin border that forbids blades but still allows a match. One rule: do not wage war. Spike the Season Core instead.",
      "The winner does not own the island. They only earn the right to guard that season for one year. Losing is not death, just a lost rally, then you stand up and serve again. That is how Elemental Volley: Spike It !! began.",
      "The refs on the post are tiny season sprites who still remember how loud the last war was. They watch the net. They do not play. If the ball sticks to the post, do not be surprised if they smile."
    ],
    ball: "The legendary volleyball is a Season Core shell, distilled from all four breaths. Hit it hard enough and the hitter’s element soaks into the ball, then bursts out as an ultimate.",
    howTo: "Power hits fill the gauge (4 to max). When it is full, hold ENTER during a spike to fire that element’s ult. Hits after a point is already scored do not fill the gauge until the next serve. Ult statuses do not stack: if the foe is already afflicted, a new debuff will not apply until it wears off."
  }
};

export const WIKI_CAST = {
  th: [
    {
      id: "ignis",
      title: "อิกนิส",
      tag: "ไฟ  ·  เบบี้ดรากอน",
      origin: "ฟักจากกองไฟชายหาดที่ดับไม่ได้ทั้งคืน เปลวเล็กๆ เลือกเป็นมังกรน้อยแทนที่จะเป็นไฟป่า",
      ult: "BLAZE SPIKE",
      abilities: [
        "เติมเกจ: ตบแรง 4 ครั้ง (ลูกหลังจบแต้มไม่นับ)",
        "ปล่อย: เกจเต็ม แล้วค้าง ENTER ขณะตบ",
        "อัลติ: ลูกไฟทะลุการรับแน่นอน ลูกไม่โดนบล็อก",
        "เผาไหม้ 2 แต้มถัดไป: ตบแรง 2 ครั้งได้ 1 หลอดเล็ก",
        "สถานะไม่ซ้อน: ติดอยู่แล้วจะติดเพิ่มไม่ได้จนกว่าจะหมด"
      ]
    },
    {
      id: "aqua",
      title: "อควา",
      tag: "น้ำ  ·  สไลม์หยดน้ำ",
      origin: "หยดน้ำค้างที่เด้งบนใบบอนไซจนลืมว่าเคยเป็นแค่หยด จึงกลายเป็นสไลม์หูครีบที่หัวเราะทุกครั้งที่ลื่น",
      ult: "TIDAL BREAK",
      abilities: [
        "เติมเกจ: ตบแรง 4 ครั้ง (ลูกหลังจบแต้มไม่นับ)",
        "ปล่อย: เกจเต็ม แล้วค้าง ENTER ขณะตบ",
        "อัลติ: ทำให้คู่แข่งเปียก 2 แต้ม เดินสไลด์ทิศสุ่ม",
        "ลูกที่คู่แข่งตีกลับวิถีดุ อ่านทิศยาก",
        "สถานะไม่ซ้อน: ติดอยู่แล้วจะติดเพิ่มไม่ได้จนกว่าจะหมด"
      ]
    },
    {
      id: "volt",
      title: "โวลต์",
      tag: "สายฟ้า  ·  จิ้งจอกน้อย",
      origin: "ลูกจิ้งจอกที่ถูกฟ้าผ่าแรกของพายุฤดูใบไม้ผลิฟาดแล้วยังวิ่งต่อ ขนจึงเก็บประกายไว้เป็นของเล่น",
      ult: "THUNDER GHOST",
      abilities: [
        "เติมเกจ: ตบแรง 4 ครั้ง (ลูกหลังจบแต้มไม่นับ)",
        "ปล่อย: เกจเต็ม แล้วค้าง ENTER ขณะตบ",
        "อัลติ: ลูกหายเป็นสายฟ้า ความเร็วพุ่งราว 3 เท่า มีรอยตาม",
        "ช็อกอัมพาต 2 แต้มแน่นอน: เดินช้า กระโดดต่ำ และสะดุดบ้าง",
        "สถานะไม่ซ้อน: ติดอยู่แล้วจะติดเพิ่มไม่ได้จนกว่าจะหมด"
      ]
    },
    {
      id: "terra",
      title: "เทอร์รา",
      tag: "ดิน  ·  วิญญาณมอส",
      origin: "ก้อนกรวดมอสที่ตื่นเมื่อรากไม้ร้องเพลงใต้ดิน ไม่ใช่ก้อนเหลี่ยม แต่เป็นบ้านเล็กๆ ที่เดินได้",
      ult: "QUAKE SMASH",
      abilities: [
        "เติมเกจ: ตบแรง 4 ครั้ง (ลูกหลังจบแต้มไม่นับ)",
        "ปล่อย: เกจเต็ม แล้วค้าง ENTER ขณะตบ",
        "อัลติ: ลูกกลายเป็นหิน ติดเพดาน ผนัง หรือเน็ต",
        "เมื่อหินติดขอบ จะได้แต้มทันที",
        "สถานะไม่ซ้อน: ติดอยู่แล้วจะติดเพิ่มไม่ได้จนกว่าจะหมด"
      ]
    }
  ],
  en: [
    {
      id: "ignis",
      title: "Ignis",
      tag: "Fire  ·  Baby dragon",
      origin: "Hatched from a beach fire that would not go out. The tiny flame chose to be a little dragon instead of a wildfire.",
      ult: "BLAZE SPIKE",
      abilities: [
        "Gauge: 4 power hits (hits after a scored point do not count)",
        "Fire: full gauge, then hold ENTER on a spike",
        "Ult: the fireball always pierces and skips the receive",
        "Burn for the next 2 points: 2 power hits fill 1 small pip",
        "Statuses do not stack: a new debuff will not apply until the current one ends"
      ]
    },
    {
      id: "aqua",
      title: "Aqua",
      tag: "Water  ·  Dew slime",
      origin: "A dew drop that bounced on a bonsai leaf until it forgot it was only a drop. Now it is a fin-eared slime that laughs every time someone slips.",
      ult: "TIDAL BREAK",
      abilities: [
        "Gauge: 4 power hits (hits after a scored point do not count)",
        "Fire: full gauge, then hold ENTER on a spike",
        "Ult: soaks the foe for 2 points; their walk slides off-course",
        "Returns come back wild and hard to read",
        "Statuses do not stack: a new debuff will not apply until the current one ends"
      ]
    },
    {
      id: "volt",
      title: "Volt",
      tag: "Lightning  ·  Kit fox",
      origin: "A fox kit struck by the first bolt of a spring storm, then kept running. Its fur still keeps the spark as a toy.",
      ult: "THUNDER GHOST",
      abilities: [
        "Gauge: 4 power hits (hits after a scored point do not count)",
        "Fire: full gauge, then hold ENTER on a spike",
        "Ult: the ball vanishes into lightning at about 3× speed, with a trail",
        "Always shocks for 2 points: slower walk, shorter jump, occasional stumbles",
        "Statuses do not stack: a new debuff will not apply until the current one ends"
      ]
    },
    {
      id: "terra",
      title: "Terra",
      tag: "Earth  ·  Moss spirit",
      origin: "A mossy pebble that woke when tree roots sang underground. Not a cube: a tiny walking home.",
      ult: "QUAKE SMASH",
      abilities: [
        "Gauge: 4 power hits (hits after a scored point do not count)",
        "Fire: full gauge, then hold ENTER on a spike",
        "Ult: the ball turns to stone and sticks to the ceiling, wall, or net",
        "A stuck stone scores the point at once",
        "Statuses do not stack: a new debuff will not apply until the current one ends"
      ]
    }
  ]
};

export const SECRET_CAST = {
  th: [
    {
      code: "FILE 05",
      alias: "VAPOR",
      th: "ไอหมอก",
      mark: "อิกนิส × อควา",
      rumor: "บันทึกของกรรมการเขียนไว้เพียงว่า เมื่อเปลวไฟไม่เผาน้ำ และน้ำไม่ดับไฟ มีร่างที่สามเกิดบนไอน้ำเหนือตาข่าย ยังไม่มีผู้ใดยืนยันว่าลงแข่งได้",
      hint: "สกิลยังถูกปิดไว้ รออัปเดตในอนาคต"
    },
    {
      code: "FILE 06",
      alias: "QUASAR",
      th: "ควาซาร์",
      mark: "โวลต์ × เทอร์รา",
      rumor: "ตำนานเล่าว่ามีก้อนหินก้อนหนึ่งกลืนฟ้าผ่าแล้วยังไม่แตก ข้างในมีดาวดวงเล็กสั่นอยู่ กรรมการสั่งปิดแฟ้มนี้ด้วยตราห้ามเปิด",
      hint: "สกิลยังถูกปิดไว้ รออัปเดตในอนาคต"
    }
  ],
  en: [
    {
      code: "FILE 05",
      alias: "VAPOR",
      th: "Mist",
      mark: "Ignis × Aqua",
      rumor: "The refs wrote only this: when flame will not burn water, and water will not drown flame, a third shape forms in the steam above the net. No one has confirmed it can enter a match.",
      hint: "Skills are sealed. Waiting on a future update."
    },
    {
      code: "FILE 06",
      alias: "QUASAR",
      th: "Quasar",
      mark: "Volt × Terra",
      rumor: "Legend says a stone swallowed a lightning bolt and did not crack. A tiny star still shakes inside it. The refs stamped the file shut.",
      hint: "Skills are sealed. Waiting on a future update."
    }
  ]
};

export const CHAR_COPY = {
  th: {
    ignis: {
      blurb: "เบบี้ดรากอนไฟแก้มป่อง",
      role: "สมดุล",
      spikeLabel: "Ember Charge — ค้าง ENTER แล้วปล่อยตอนวงสว่าง",
      perfect: "ควันไฟบดบังจุดตกชั่วคราว"
    },
    aqua: {
      blurb: "สไลม์ยืดหยุ่นเด้งดึ๋ง",
      role: "ความเร็ว",
      spikeLabel: "Tide Flick — กดทิศทางตอนลูกศรสว่าง",
      perfect: "วิถีโค้งอ่านทิศยากขึ้น"
    },
    volt: {
      blurb: "เบบี้จิ้งจอกสายฟ้า",
      role: "เทคนิค",
      spikeLabel: "Spark Pulse — กด ENTER ตอนวงซ้อนกัน",
      perfect: "วาร์ปซิกแซกก่อนถึงพื้น"
    },
    terra: {
      blurb: "วิญญาณดินมอสกลมๆ น่ารัก",
      role: "พลัง",
      spikeLabel: "Quake Press — กด ENTER เมื่อเข็มอยู่ในโซนเขียว",
      perfect: "แรงตบสูงสุด และกล้องสั่น"
    }
  },
  en: {
    ignis: {
      blurb: "A chubby-cheeked baby fire dragon",
      role: "Balanced",
      spikeLabel: "Ember Charge — hold ENTER, release on the glow",
      perfect: "Ember smoke hides the landing for a moment"
    },
    aqua: {
      blurb: "A bouncy, stretchy dew slime",
      role: "Speed",
      spikeLabel: "Tide Flick — tap a direction when the arrow glows",
      perfect: "The arc is harder to read"
    },
    volt: {
      blurb: "A baby lightning fox",
      role: "Technical",
      spikeLabel: "Spark Pulse — press ENTER when the rings overlap",
      perfect: "Zigzag warp before the ball hits the floor"
    },
    terra: {
      blurb: "A cute round moss spirit",
      role: "Power",
      spikeLabel: "Quake Press — press ENTER while the needle is in the green",
      perfect: "Max spike power and a camera shake"
    }
  }
};
