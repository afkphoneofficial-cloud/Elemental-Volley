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
      authNameLen: "ชื่อต้องมี 2–12 ตัวอักษร",
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
      play: "เล่น",
      playBot: "ฝึกฝน",
      playPvp: "Rank Mode",
      playExhibit: "Exhibition",
      playHint: "ฝึกฝนไม่กินเอเธอร์  ·  Rank Mode กิน 1 เอเธอร์เมื่อทั้งคู่ายอมรับ  ·  Exhibition เล่นกับเพื่อน",
      modeTitle: "เลือกโหมด",
      modeBotBody: "ซ้อมจังหวะ เลือกความยากได้เอง  ไม่กินเอเธอร์  ไม่ขยับอันดับสนาม",
      modePvpBody: "จับคู่ตามแต้มสนาม  เอเธอร์ตอนนี้ {n}/{max}  {wait}",
      modeExhibitBody: "กระชับมิตรกับเพื่อนในรายชื่อ  ไม่กินเอเธอร์  ไม่ขยับอันดับ",
      navShop: "ร้าน",
      navMap: "แผนที่",
      navSet: "ตั้งค่า",
      navFriends: "เพื่อน",
      navBoard: "อันดับ",
      navDress: "แต่งตัว",
      showcaseHint: "แตะหรือกดลูกศรเพื่อสลับตัวที่โชว์",
      chipToken: "ตรา {n}",
      chipPvp: "PVP {n}",
      etherWait: "อีก {t}",
      etherFull: "เต็มแล้ว",
      infoClose: "ปิด",
      info: {
        etherTitle: "เอเธอร์",
        etherBody: "หลอดลงสนาม PVP สูงสุด {max} ก้อน เติมอีก 1 ทุก 12 นาที ({wait}) โหมดบอทไม่กินเอเธอร์",
        tokensTitle: "ตราตัวละคร",
        tokensBody: "ใช้ปลดล็อกนักแข่งในร้านค้า แลกได้จากแต้ม PVP",
        pvpTitle: "แต้ม PVP",
        pvpBody: "ได้จากแข่ง แลกเป็นตราตัวละครได้ที่ร้าน แต้มสนามคนละอย่างกับแต้ม PVP"
      }
    },
    mail: {
      title: "จดหมาย",
      empty: "ยังไม่มีจดหมาย",
      accept: "ยอมรับ",
      decline: "ปฏิเสธ",
      ok: "อ่านแล้ว"
    },
    chat: {
      title: "แชท",
      world: "เซิร์ฟ",
      friends: "เพื่อน",
      send: "ส่ง",
      placeholder: "พิมพ์ข้อความ",
      emptyWorld: "แชททั้งเซิร์ฟ เก็บ 30 ข้อความ แล้วเคลียร์ทุก 10 นาที",
      emptyDm: "เลือกเพื่อนเพื่อคุยส่วนตัว",
      pickFriend: "ยังไม่มีเพื่อนให้แชท",
      blocked: "ข้อความนี้ไม่เหมาะสม",
      needFriend: "แชทส่วนตัวได้เฉพาะเพื่อน",
      empty: "พิมพ์ข้อความก่อนส่ง"
    },
    board: {
      title: "กระดาน 100 อันดับ",
      sub: "จัดจากแต้มสนามบนเซิร์ฟ  ·  เลื่อนดูได้",
      loading: "กำลังดึงอันดับจากเซิร์ฟ…",
      empty: "ยังไม่มีใครแข่ง Rank Mode บนเซิร์ฟนี้",
      wl: "ชนะ {w}  ·  แพ้ {l}",
      youPlace: "คุณอยู่อันดับ {n}",
      youOut: "คุณอยู่อันดับ {n}  ·  นอก 100 แรก",
      youOff: "แข่ง Rank Mode แล้วจะขึ้นกระดาน",
      fail: "ดึงกระดานจากคลาวด์ไม่สำเร็จ  ไปรัน supabase/leaderboard.sql ก่อน"
    },
    rank: {
      title: "กฎอันดับ",
      sub: "ระบบจัดอันดับ 1v1 ของเกาะอีเธเรีย",
      calShort: "กำลังวัดระดับ {n}/{max}",
      calNow: "กำลังวัดระดับ  {n} / {max}  แมตช์",
      youAre: "คุณคือ  {name}  {star}",
      noStar: "",
      mmrLine: "แต้มสนาม {n}   ·   ชนะ {w}   ·   แพ้ {l}",
      chip: "{name} {star}",
      body1: "สิบแมตช์แรกเป็นการวัดระดับ แต้มสนามขยับแรงกว่าปกติ ยังไม่โชว์เหรียญจนกว่าจะครบ {n} เกม",
      body2: "แต่ละเหรียญมีประกาย 1–5 ขยับประมาณ {star} แต้มสนามต่อประกาย จากลูกทรายไปถึงธาตุบริสุทธิ์ แล้วจึงเป็นสไปค์นิรันดร์",
      body3: "ชนะคู่ที่แต้มสูงกว่าได้แต้มมาก แพ้คู่ที่แต้มต่ำกว่าเสียมาก คิดจากโอกาสชนะคาดหวังตามช่องว่างแต้มสนาม",
      body4: "คิวขยายวงแต้มทุก 1.8 วินาที หาคนในคิวที่แต้มใกล้กันก่อน ถ้าเกาะยังว่างจะจับคู่แข่งเกาะในวงเดียวกัน เพื่อวัดอันดับได้เลย",
      body5: "โหมดบอทไม่ขยับอันดับและไม่กินเอเธอร์  สนามจัดอันดับกิน 1 เอเธอร์ตอนเจอคู่  กระดานเซิร์ฟโชว์ 100 อันดับแรกจากแต้มสนามที่บันทึกจริง",
      tier: {
        sandling: "ลูกทราย",
        netling: "เฝ้าตาข่าย",
        server: "นักเสิร์ฟ",
        setter: "มือเซ็ต",
        ace: "เอซ",
        island: "เจ้าเกาะ",
        primal: "ธาตุบริสุทธิ์",
        eternal: "สไปค์นิรันดร์"
      }
    },
    queue: {
      title: "กำลังหาคู่แข่ง",
      searching: "กำลังหาคู่ในวงแต้มใกล้เคียง…",
      window: "วงค้น ±{n} แต้ม",
      foundLive: "เจอคู่แล้ว  ตัดสินใจสู้หรือยัง",
      foundIsle: "พบคู่แข่งเกาะ  ·  แต้มสนามใกล้กัน",
      noEther: "เอเธอร์ไม่พอ กลับล็อบบี้",
      noServer: "เซิร์ฟแมตช์ยังไม่เปิด  ตั้ง matchWsUrl แล้วรอเครื่องไทย",
      cooldown: "ปฏิเสธแมตช์แล้ว  พักค้น {n} นาที",
      waitAccept: "รออีกฝ่ายยอมรับ…",
      fightAsk: "สู้ไหม?",
      accept: "ยอมรับ",
      decline: "ปฏิเสธ",
      wins: "ชนะแรงก์ {n} แมตช์",
      mostUsed: "ใช้บ่อยสุด  {name}",
      offline: "เพื่อนออฟไลน์อยู่  ลองใหม่เมื่อออนไลน์",
      busy: "เพื่อนกำลังแข่งอยู่",
      declined: "อีกฝ่ายไม่รับ Exhibition",
      invite: "{name} ชวน Exhibition",
      cancel: "ยกเลิก",
      how: "กฎอันดับ"
    },
    friends: {
      title: "เพื่อน",
      cap: "{n} / {max} คน",
      add: "เชิญด้วยชื่อ",
      addOne: "เชิญ",
      pending: "รออยู่",
      suggest: "สุ่มจากเซิร์ฟ",
      suggestHead: "ผู้เล่นในเซิร์ฟ · กดสุ่มใหม่ได้เรื่อยๆ",
      suggestOk: "เจอ {n} คน ลองส่งคำเชิญได้เลย",
      suggestWait: "กำลังสุ่มรายชื่อจากเซิร์ฟ…",
      suggestNone: "ยังสุ่มไม่เจอคนใหม่ ลองอีกครั้งภายหลัง",
      empty: "ยังไม่มีเพื่อนในรายชื่อ",
      emptySub: "สุ่มจากเซิร์ฟหรือพิมพ์ชื่อ แล้วส่งคำเชิญ อีกฝ่ายต้องยอมรับจากจดหมายก่อน",
      pickHint: "เลือกเพื่อนเพื่อเข้า Exhibition",
      exhibit: "Exhibition",
      chat: "แชท",
      remove: "ลบ",
      rowSub: "กระชับมิตรได้ทุกเมื่อ",
      formHint: "พิมพ์ชื่อบัญชีในเกมให้ตรงทุกตัว",
      formName: "ชื่อบัญชีเพื่อน",
      added: "ส่งคำเชิญถึง {name} แล้ว",
      acceptedNow: "เป็นเพื่อนกับ {name} แล้ว",
      errLen: "ชื่อสั้นเกินไป",
      errFull: "เพื่อนเต็ม 50 คนแล้ว",
      errCloud: "ค้นจากคลาวด์ไม่สำเร็จ",
      errMissing: "ไม่พบบัญชีนี้",
      errSelf: "เพิ่มตัวเองไม่ได้",
      errDup: "เป็นเพื่อนกันอยู่แล้ว",
      errPending: "ส่งคำเชิญไปแล้ว รออีกฝ่ายตอบ"
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
    dress: {
      title: "ห้องแต่งตัว",
      sub: "เลือกชุดทั้งตัว แล้วลงสนามชุดนั้นเลย  ·  แตะตัวละครเพื่อดูกระโดด",
      wear: "ใส่ชุดนี้",
      using: "กำลังใส่ชุดนี้",
      locked: "ปลดล็อกตัวละครก่อน",
      tier: "ชุด {n}",
      tierLine: "ชุด {n}  ·  {name}",
      viewL: "ซ้าย",
      viewF: "หน้าตรง",
      viewR: "ขวา"
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
      pvp: "จัดอันดับ",
      exhibit: "กระชับมิตร",
      more: "อีก {n} เกมในคลัง (เก็บสูงสุด 30)",
      change: "เปลี่ยนอวาตาร์",
      pickTitle: "เลือกอวาตาร์ฟรี",
      freeNote: "เปลี่ยนได้ตลอด  ·  ของพิเศษจะมาในร้านค้าภายหลัง",
      close: "ปิด",
      howRank: "กฎอันดับ",
      board: "กระดานอันดับ"
    },
    select: {
      title: "เลือกตัวที่ปลดล็อกแล้ว แล้วสู้กับบอท",
      titlePvp: "เลือกตัว แล้วเข้าคิว Rank Mode",
      titleExhibit: "เลือกตัว แล้วกระชับมิตรกับเพื่อน",
      ready: "พร้อมลงสนาม",
      locked: "ล็อก  ·  100 ตรา",
      pick: "คุณ: {name}   ·   ความยากบอท: {diff}",
      pickPvp: "คุณ: {name}   ·   คิวจะจับคู่ตามแต้มสนาม",
      pickExhibit: "คุณ: {name}   ·   กระชับมิตร ไม่ขยับอันดับ",
      start: "เริ่มแมตช์",
      startPvp: "เข้าคิว",
      startExhibit: "เริ่ม Exhibition",
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
      youWin: "คุณชนะ! เลือกสนามได้  ·  ฝั่งนั้นเสิร์ฟก่อน",
      botWin: "ฝั่งนั้นชนะ · เลือก {court}  ·  คุณเสิร์ฟก่อน",
      waitFoe: "รออีกฝ่ายเลือกสนาม…",
      waitGo: "กำลังเข้าสนาม…"
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
      rank: "แต้มสนาม {delta}   ·   {name} {star}",
      calLeft: "วัดระดับเหลืออีก {n} เกม",
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
      rival: "คู่แข่ง",
      modeTrain: "ฝึกฝน",
      modeRank: "Rank Mode",
      modeExhibit: "Exhibition",
      ready: "พร้อม",
      quit: "ออก",
      hudHint: "← → ↑ ↓   ENTER ตี   ค้าง ENTER ปล่อยอัลติ",
      linkWait: "กำลังวัด",
      linkBest: "ดีเยี่ยม",
      linkGood: "ดี",
      linkMeh: "ค่อนข้างแย่",
      linkBad: "แย่",
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
      quit: "ออกจากแมตช์",
      player: "พักของผู้เล่น",
      system: "พักจากระบบ · การเชื่อมต่อไม่ปกติ",
      left: "เหลือ {n} วินาที",
      note: "แข่งจริงพักได้ 1 ครั้ง ครั้งละ 20 วินาที  และพักได้หลังทำแต้มแล้วเท่านั้น",
      none: "ใช้โควตาพักแล้ว",
      waitPoint: "พักเมื่อจบ rally",
      dropWait: "คู่แข่งหลุด · รอ {n} วินาที",
      rivalBack: "คู่แข่งกลับมาแล้ว"
    },
    cheer: {
      classic: "คลาสสิก",
      classicBlurb: "ฉลองแต้มชุดแรก ติดตัวมาฟรี",
      festival: "เทศกาลพลุ",
      festivalBlurb: "ฉลองสีสด กระดาษโปรย อลังการ",
      starlight: "แสงดาว",
      starlightBlurb: "โทนม่วงดาว กึ่งลับ รอแพทช์ต่อ"
    },
    cosmetics: {
      slotAvatar: "อวาตาร์",
      slotCheer: "ฉลองแต้ม",
      slotHit: "เอฟเฟกต์ตบ",
      slotUlt: "เอฟเฟกต์อัลติ",
      slotPlate: "ป้ายชื่อ",
      fxOnly: "ของสวมใส่เป็นแค่ภาพและเอฟเฟกต์ ไม่เปลี่ยนพลังในสนาม"
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
      authNameLen: "Name must be 2–12 characters",
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
      play: "Play",
      playBot: "Training",
      playPvp: "Rank Mode",
      playExhibit: "Exhibition",
      playHint: "Training skips Ether  ·  Rank Mode spends 1 Ether when both accept  ·  Exhibition is with friends",
      modeTitle: "Choose a mode",
      modeBotBody: "Practice with a difficulty you pick. No Ether. Rank does not move.",
      modePvpBody: "Match nearby court scores. Ether now {n}/{max}  {wait}",
      modeExhibitBody: "Friendly match with someone on your friend list. No Ether. Rank does not move.",
      navShop: "Shop",
      navMap: "Map",
      navSet: "Settings",
      navFriends: "Friends",
      navBoard: "Ranks",
      navDress: "Dress",
      showcaseHint: "Tap or use the arrows to swap the showcase fighter",
      chipToken: "Tokens {n}",
      chipPvp: "PVP {n}",
      etherWait: "Next in {t}",
      etherFull: "Full",
      infoClose: "Close",
      info: {
        etherTitle: "Ether",
        etherBody: "PVP court charge. Cap {max}. Gain 1 every 12 minutes ({wait}). Bots do not spend Ether.",
        tokensTitle: "Character tokens",
        tokensBody: "Spend these in the shop to unlock fighters. Exchange them from PVP points.",
        pvpTitle: "PVP points",
        pvpBody: "Earned from matches. Trade them for character tokens. Court rating is a separate ranked score."
      }
    },
    mail: {
      title: "Mail",
      empty: "No letters yet",
      accept: "Accept",
      decline: "Decline",
      ok: "Got it"
    },
    chat: {
      title: "Chat",
      world: "Server",
      friends: "Friends",
      send: "Send",
      placeholder: "Type a message",
      emptyWorld: "Server chat keeps 30 lines, then clears every 10 minutes",
      emptyDm: "Pick a friend for a private chat",
      pickFriend: "No friends to chat with yet",
      blocked: "That message is not allowed",
      needFriend: "Private chat is for friends only",
      empty: "Type a message first"
    },
    board: {
      title: "Top 100",
      sub: "Live court scores on this server  ·  scroll the list",
      loading: "Loading the server board…",
      empty: "No Rank Mode matches on this server yet",
      wl: "{w} wins  ·  {l} losses",
      youPlace: "You are #{n}",
      youOut: "You are #{n}  ·  outside the top 100",
      youOff: "Play Rank Mode to join the board",
      fail: "Could not load the board. Run supabase/leaderboard.sql in the SQL editor first."
    },
    rank: {
      title: "Rank rules",
      sub: "Etheria’s 1v1 court ranking",
      calShort: "Calibrating {n}/{max}",
      calNow: "Calibrating  {n} / {max}  matches",
      youAre: "You are  {name}  {star}",
      noStar: "",
      mmrLine: "Court score {n}   ·   Wins {w}   ·   Losses {l}",
      chip: "{name} {star}",
      body1: "Your first {n} ranked matches calibrate. Court score moves harder, and no medal shows until those games are done.",
      body2: "Each medal has sparks 1–5, about {star} court score per spark, from Sandling up to Primal Tide, then Eternal Spike.",
      body3: "Beating a higher-rated rival pays more. Losing to a lower-rated rival costs more. The swing follows expected win chance from the court-score gap.",
      body4: "The queue widens every 1.8s. It prefers a live player in range. If the island is quiet, you get a court-matched island rival so rank still moves.",
      body5: "Bots never change rank and never spend Ether. Ranked spends 1 Ether when a rival is found. The server board shows the top 100 from saved court scores.",
      tier: {
        sandling: "Sandling",
        netling: "Netling",
        server: "Rally Server",
        setter: "Court Setter",
        ace: "Ace",
        island: "Island Lord",
        primal: "Primal Tide",
        eternal: "Eternal Spike"
      }
    },
    queue: {
      title: "Finding a rival",
      searching: "Searching nearby court scores…",
      window: "Search window ±{n}",
      foundLive: "Rival found  ·  accept or decline",
      foundIsle: "Found an island rival  ·  nearby court score",
      noEther: "Not enough Ether. Back to lobby.",
      noServer: "Match server is not up yet. Set matchWsUrl first.",
      cooldown: "You declined. Search locked for {n} min.",
      waitAccept: "Waiting for the other player…",
      fightAsk: "Ready to fight?",
      accept: "Accept",
      decline: "Decline",
      wins: "{n} ranked wins",
      mostUsed: "Most used  {name}",
      offline: "That friend is offline",
      busy: "That friend is in a match",
      declined: "They passed on Exhibition",
      invite: "{name} invited you to Exhibition",
      cancel: "Cancel",
      how: "Rank rules"
    },
    friends: {
      title: "Friends",
      cap: "{n} / {max}",
      add: "Invite by name",
      addOne: "Invite",
      pending: "Waiting",
      suggest: "Find on server",
      suggestHead: "Players on the server · tap again for a new batch",
      suggestOk: "Found {n} players you can invite",
      suggestWait: "Rolling players from the server…",
      suggestNone: "No new players this roll. Try again later.",
      empty: "No friends yet",
      emptySub: "Roll from the server or type a name, then send an invite. They accept from mail.",
      pickHint: "Pick a friend for Exhibition",
      exhibit: "Exhibition",
      chat: "Chat",
      remove: "Remove",
      rowSub: "Friendly matches anytime",
      formHint: "Enter their exact in-game name",
      formName: "Friend's name",
      added: "Invite sent to {name}",
      acceptedNow: "You are now friends with {name}",
      errLen: "Name is too short",
      errFull: "Friend list is full (50)",
      errCloud: "Cloud lookup failed",
      errMissing: "No account with that name",
      errSelf: "You cannot add yourself",
      errDup: "Already on your list",
      errPending: "Invite already sent. Waiting for a reply."
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
    dress: {
      title: "Dressing room",
      sub: "Pick a full set, then take that look onto the court  ·  Tap the fighter to preview a hop",
      wear: "Wear this set",
      using: "Wearing this set",
      locked: "Unlock this fighter first",
      tier: "Set {n}",
      tierLine: "Set {n}  ·  {name}",
      viewL: "Left",
      viewF: "Front",
      viewR: "Right"
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
      pvp: "Ranked",
      exhibit: "Exhibition",
      more: "{n} more in the vault (keeps 30)",
      change: "Change avatar",
      pickTitle: "Free avatars",
      freeNote: "Swap anytime  ·  Shop extras come later",
      close: "Close",
      howRank: "Rank rules",
      board: "Leaderboard"
    },
    select: {
      title: "Pick an unlocked fighter, then face a bot",
      titlePvp: "Pick a fighter, then queue for Rank Mode",
      titleExhibit: "Pick a fighter for a friendly Exhibition",
      ready: "Ready to play",
      locked: "Locked  ·  100 tokens",
      pick: "You: {name}   ·   Bot difficulty: {diff}",
      pickPvp: "You: {name}   ·   Queue matches nearby court score",
      pickExhibit: "You: {name}   ·   Exhibition, rank does not move",
      start: "Start match",
      startPvp: "Find rival",
      startExhibit: "Start Exhibition",
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
      youWin: "You win! Pick a court  ·  They serve first",
      botWin: "They win · picked {court}  ·  You serve first",
      waitFoe: "Waiting for their court pick…",
      waitGo: "Entering the court…"
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
      rank: "Court score {delta}   ·   {name} {star}",
      calLeft: "Calibration {n} matches left",
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
      rival: "RIVAL",
      modeTrain: "Training",
      modeRank: "Rank Mode",
      modeExhibit: "Exhibition",
      ready: "READY",
      quit: "Quit",
      hudHint: "← → ↑ ↓   ENTER hit   Hold ENTER to fire ult",
      linkWait: "checking",
      linkBest: "excellent",
      linkGood: "good",
      linkMeh: "spotty",
      linkBad: "bad",
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
      quit: "Leave match",
      player: "Player timeout",
      system: "System timeout · connection issue",
      left: "{n} seconds left",
      note: "Live matches get 1 pause of 20 seconds, only after a point is scored.",
      none: "No pauses left",
      waitPoint: "Pauses after this rally",
      dropWait: "Rival dropped · {n}s",
      rivalBack: "Rival is back"
    },
    cheer: {
      classic: "Classic",
      classicBlurb: "The first cheer set. Free with your account.",
      festival: "Festival fireworks",
      festivalBlurb: "Bright colors and confetti",
      starlight: "Starlight",
      starlightBlurb: "Purple star glow. Semi-secret, later patch."
    },
    cosmetics: {
      slotAvatar: "Avatar",
      slotCheer: "Point cheer",
      slotHit: "Hit FX",
      slotUlt: "Ult FX",
      slotPlate: "Name plate",
      fxOnly: "Wearables are visuals and effects only. They never change court stats."
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
