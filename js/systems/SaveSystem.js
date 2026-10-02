import { ECONOMY } from "../data/economy.js";
import { emptyCareer, tickEther, canTakeEther } from "./Ether.js";
import { emptyRank } from "../data/ranks.js";
import { DEFAULT_AVATAR, ownedAvatar } from "../data/avatars.js";
import {
  buyCosmetic as purchaseCosmetic,
  equipCosmetic as wearCosmetic,
  equippedCosmetic as wornCosmetic,
  migrateCosmetics,
  ownsCosmetic as hasCosmetic
} from "../data/cosmetics.js";
import { emptySkins, clampSkin, skinNeedLv } from "../data/skins.js";
import { emptyGrowth, clampGrowth, sheetFromRow, normalizeRow, defaultSpent, STAT_IDS } from "../data/growth.js?v=local206";
import { isTrainOpen as trainNodeOpen, isTrainCleared as trainNodeCleared } from "../data/trainStages.js";
import { ITEMS } from "../data/items.js?v=local198";
import { ROSTER_IDS } from "../data/roster.js";
import { previousRankingWeek, rankingWeek } from "../data/rankWindows.js";
import { buildSeasonMail, seasonPayout } from "../data/seasonRewards.js";
import { seasonCycleOf } from "../data/seasonCycle.js";
import { emptyShopLooks, shopLookOf as lookRow } from "../data/costumeShop.js";
import { emptyTitles } from "../data/titles.js";
import { BETA, liveWipeDue, onBetaDay } from "../data/beta.js";
import { TitleSystem } from "./TitleSystem.js?v=local267";
import { PASS, monthId, dayKey, passLookOf, vialDayOn, elapsedDayInMonth, passDailyGiftForDay, passDayKey } from "../data/monthPass.js?v=local190";
import { emptyDaily, claimedDaysOf, dailyGiftOn, dailyLookOf, DAILY_LOOK_NEED, DAILY_DUP_POWDER } from "../data/dailyLogin.js?v=local189";

const BASE_KEY = "elemental-volley-save-v1";

const empty = () => ({
  starterId: null,
  unlocked: [],
  currencies: { pvp: 0, premium: 0, tokens: 0, coins: 0 },
  firstWinDate: null,
  settings: {
    lang: "th",
    controlMode: "auto",
    bgmMode: "all",
    bgmPages: { lobby: true, login: true, play: true, hangout: true, match: true },
    reducedFx: false,
    cameraShake: true,
    lobbyMotion: true,
    timeZone: "Bangkok",
    shell: "isle"
  },
  unlockedCheers: ["classic"],
  equippedCheer: "classic",
  career: emptyCareer(),
  matchLog: [],
  ether: ECONOMY.etherMax,
  etherAt: 0,
  inventory: {},
  avatarId: "av01",
  unlockedAvatars: [],
  cosmetics: { owned: [], equipped: {} },
  rank: emptyRank(),
  showcaseId: null,
  friends: [],
  skins: emptySkins(),
  growth: emptyGrowth(),
  trainCleared: [],
  seasonInbox: [],
  seasonIssued: [],
  seasonSnap: {},
  seasonBadges: [],
  seasonMark: null,
  champEquipped: {},
  shopLooks: emptyShopLooks(),
  topupLog: [],
  passMonths: {},
  dailyLogin: emptyDaily(),
  ballFx: "",
  gear: {},
  welcomeDay: "",
  titles: emptyTitles(),
  beta: { testPlay: false },
  wipeId: ""
});

function stackN(raw) {
  if (raw == null) return 0;
  if (typeof raw === "number" || typeof raw === "string") return raw | 0;
  if (typeof raw === "object") return (raw.n || raw.count || raw.qty || raw.amount || 0) | 0;
  return raw | 0;
}

function readInventory(raw) {
  const out = {};
  const add = (id, n) => {
    if (!id || typeof id !== "string") return;
    const v = stackN(n);
    if (v > 0) out[id] = (out[id] | 0) + v;
  };
  if (Array.isArray(raw)) {
    raw.forEach((row) => {
      if (typeof row === "string") add(row, 1);
      else if (row && typeof row === "object") add(row.id || row.itemId || row.key, row);
    });
    return out;
  }
  if (!raw || typeof raw !== "object") return out;
  Object.keys(raw).forEach((id) => add(id, raw[id]));
  return out;
}

function isLookItem(id) {
  const row = ITEMS[id];
  if (row && (row.effect === "champSkin" || row.effect === "shopLook")) return true;
  if (String(id).indexOf("champ-") === 0) return true;
  return Boolean(lookRow(id));
}

function unionIds(a, b) {
  const out = [];
  const add = (id) => {
    if (id && typeof id === "string" && out.indexOf(id) < 0) out.push(id);
  };
  (a || []).forEach(add);
  (b || []).forEach(add);
  return out;
}

function unionInv(prev, cloud) {
  const out = { ...(cloud || {}) };
  Object.keys(prev || {}).forEach((id) => {
    const n = prev[id] | 0;
    if (n <= 0) return;
    if (isLookItem(id)) out[id] = Math.max(out[id] | 0, n);
    else if (out[id] == null) out[id] = n;
  });
  return out;
}

function restoreOutfitItems(data) {
  if (!data.inventory || typeof data.inventory !== "object" || Array.isArray(data.inventory)) data.inventory = {};
  const give = (id) => {
    if (!id || typeof id !== "string") return;
    if (!(data.inventory[id] | 0)) data.inventory[id] = 1;
  };
  Object.keys(data.champEquipped || {}).forEach((charId) => {
    const set = data.champEquipped[charId] | 0;
    if (set >= 1 && set <= 3) give("champ-" + charId + "-" + set);
  });
  (data.shopLooks && data.shopLooks.owned || []).forEach(give);
  (data.seasonBadges || []).forEach((row) => {
    if (!row || !row.cheer) return;
    const cyc = seasonCycleOf(row.cycle | 0);
    if (cyc && cyc.champItem) give(cyc.champItem);
  });
}

function finish(data) {
  data.settings = { ...empty().settings, ...(data.settings || {}) };
  data.settings.bgmPages = { ...empty().settings.bgmPages, ...(data.settings.bgmPages || {}) };
  if (!Array.isArray(data.unlockedCheers) || !data.unlockedCheers.length) {
    data.unlockedCheers = ["classic"];
  }
  if (!data.equippedCheer) data.equippedCheer = "classic";
  if (!Array.isArray(data.unlocked)) data.unlocked = [];
  if (!data.currencies) data.currencies = empty().currencies;
  data.currencies = { pvp: 0, premium: 0, tokens: 0, coins: 0, ...data.currencies };
  data.currencies.pvp = data.currencies.pvp | 0;
  data.currencies.premium = data.currencies.premium | 0;
  data.currencies.tokens = data.currencies.tokens | 0;
  data.currencies.coins = data.currencies.coins | 0;
  data.career = { ...emptyCareer(), ...(data.career || {}) };
  if (!Array.isArray(data.matchLog)) data.matchLog = [];
  if (data.ether == null) data.ether = ECONOMY.etherMax;
  if (!data.etherAt) data.etherAt = Date.now();
  data.inventory = readInventory(data.inventory);
  if (!ownedAvatar(data, data.avatarId)) data.avatarId = DEFAULT_AVATAR;
  if (!Array.isArray(data.unlockedAvatars)) data.unlockedAvatars = [];
  migrateCosmetics(data);
  data.skins = { ...emptySkins(), ...(data.skins || {}) };
  Object.keys(data.skins).forEach((id) => { data.skins[id] = clampSkin(data.skins[id]); });
  const g = { ...emptyGrowth(), ...(data.growth || {}) };
  ROSTER_IDS.forEach((id) => {
    let row = clampGrowth(g[id]);
    const startSum = STAT_IDS.reduce((n, s) => n + (row.spentStart[s] | 0), 0);
    const lvSum = STAT_IDS.reduce((n, s) => n + (row.spentLevel[s] | 0), 0);
    if (!row.xp && startSum === 0 && lvSum === 0) row.spentStart = defaultSpent();
    g[id] = normalizeRow(id, row);
  });
  data.growth = g;
  data.rank = { ...emptyRank(), ...(data.rank || {}) };
  if (!Array.isArray(data.friends)) data.friends = [];
  if (!Array.isArray(data.trainCleared)) data.trainCleared = [];
  else data.trainCleared = data.trainCleared.filter((id) => typeof id === "string");
  if (!Array.isArray(data.seasonInbox)) data.seasonInbox = [];
  if (!Array.isArray(data.seasonIssued)) data.seasonIssued = [];
  if (!data.seasonSnap || typeof data.seasonSnap !== "object" || Array.isArray(data.seasonSnap)) data.seasonSnap = {};
  if (!Array.isArray(data.seasonBadges)) data.seasonBadges = [];
  if (!data.seasonMark || typeof data.seasonMark !== "object") data.seasonMark = null;
  if (!data.champEquipped || typeof data.champEquipped !== "object" || Array.isArray(data.champEquipped)) data.champEquipped = {};
  const looks = emptyShopLooks();
  const rawLooks = data.shopLooks && typeof data.shopLooks === "object" ? data.shopLooks : {};
  data.shopLooks = {
    owned: Array.isArray(rawLooks.owned) ? rawLooks.owned.filter((id) => typeof id === "string") : [],
    worn: { ...looks.worn, ...(rawLooks.worn || {}) }
  };
  if (!Array.isArray(data.topupLog)) data.topupLog = [];
  if (!data.passMonths || typeof data.passMonths !== "object" || Array.isArray(data.passMonths)) data.passMonths = {};
  if (!data.dailyLogin || typeof data.dailyLogin !== "object" || Array.isArray(data.dailyLogin)) data.dailyLogin = emptyDaily();
  data.dailyLogin = { ...emptyDaily(), ...data.dailyLogin };
  if (!data.dailyLogin.claimed || typeof data.dailyLogin.claimed !== "object" || Array.isArray(data.dailyLogin.claimed)) {
    data.dailyLogin.claimed = {};
  }
  if (data.dailyLogin.lastClaim && !data.dailyLogin.claimed[data.dailyLogin.lastClaim]) {
    data.dailyLogin.claimed[data.dailyLogin.lastClaim] = 1;
  }
  if (typeof data.welcomeDay !== "string") data.welcomeDay = "";
  if (!data.titles || typeof data.titles !== "object" || Array.isArray(data.titles)) data.titles = emptyTitles();
  data.titles = { owned: Array.isArray(data.titles.owned) ? data.titles.owned.filter((id) => typeof id === "string") : [], worn: typeof data.titles.worn === "string" ? data.titles.worn : "" };
  if (!data.beta || typeof data.beta !== "object" || Array.isArray(data.beta)) data.beta = { testPlay: false };
  data.beta.testPlay = Boolean(data.beta.testPlay);
  data.beta.shopTry = Boolean(data.beta.shopTry);
  data.tryCostumePowder = Boolean(data.tryCostumePowder);
  if (typeof data.wipeId !== "string") data.wipeId = "";
  TitleSystem.normalize(data);
  if (typeof data.ballFx !== "string") data.ballFx = "";
  if (!data.gear || typeof data.gear !== "object" || Array.isArray(data.gear)) data.gear = {};
  ROSTER_IDS.forEach((id) => {
    const g = data.gear[id] && typeof data.gear[id] === "object" ? data.gear[id] : {};
    data.gear[id] = {
      ball: typeof g.ball === "string" ? g.ball : "",
      ult: typeof g.ult === "string" ? g.ult : "",
      sfx: typeof g.sfx === "string" ? g.sfx : ""
    };
  });
  if (data.ballFx) {
    const row = ITEMS[data.ballFx];
    const only = row && row.char;
    ROSTER_IDS.forEach((id) => {
      if (data.gear[id].ball) return;
      if (only && only !== id) return;
      data.gear[id].ball = data.ballFx;
    });
  }
  data.shopLooks.owned.forEach((id) => {
    if (lookRow(id) && !(data.inventory[id] | 0)) data.inventory[id] = 1;
  });
  Object.keys(data.inventory).forEach((id) => {
    if (lookRow(id) && (data.inventory[id] | 0) > 0 && data.shopLooks.owned.indexOf(id) < 0) {
      data.shopLooks.owned.push(id);
    }
  });
  ROSTER_IDS.forEach((id) => {
    const wear = data.shopLooks.worn[id];
    if (wear && !data.shopLooks.owned.includes(wear) && !(data.inventory[wear] | 0)) data.shopLooks.worn[id] = "";
  });
  if (!data.showcaseId || !thisUnlock(data, data.showcaseId)) {
    data.showcaseId = data.starterId || data.showcaseId;
  }
  restoreOutfitItems(data);
  return data;
}

function giftWaiting(data) {
  return (data.seasonInbox || []).some((row) => row && row.id === BETA.giftId);
}

function giftPaid(data) {
  return (data.seasonIssued || []).includes(BETA.giftId) && !giftWaiting(data);
}

function applyLiveWipe(prev) {
  if (!prev || !liveWipeDue(dayKey(), prev.wipeId)) return prev;
  const keep = finish(empty());
  keep.settings = { ...empty().settings, ...(prev.settings || {}) };
  keep.settings.bgmPages = { ...empty().settings.bgmPages, ...(prev.settings && prev.settings.bgmPages || {}) };
  keep.beta = {
    testPlay: Boolean(prev.beta && prev.beta.testPlay),
    testAt: prev.beta && prev.beta.testAt ? prev.beta.testAt : 0
  };
  keep.titles = emptyTitles();
  if (keep.beta.testPlay || (prev.titles && (prev.titles.owned || []).includes(BETA.titleId))) {
    keep.titles.owned = [BETA.titleId];
    if (prev.titles && prev.titles.worn === BETA.titleId) keep.titles.worn = BETA.titleId;
  }
  keep.cosmetics = prev.cosmetics && typeof prev.cosmetics === "object" ? prev.cosmetics : keep.cosmetics;
  keep.shopLooks = prev.shopLooks && typeof prev.shopLooks === "object" ? prev.shopLooks : keep.shopLooks;
  keep.champEquipped = prev.champEquipped && typeof prev.champEquipped === "object" ? prev.champEquipped : {};
  keep.gear = prev.gear && typeof prev.gear === "object" ? prev.gear : {};
  keep.ballFx = typeof prev.ballFx === "string" ? prev.ballFx : "";
  keep.unlockedAvatars = Array.isArray(prev.unlockedAvatars) ? prev.unlockedAvatars.slice() : [];
  keep.avatarId = prev.avatarId || keep.avatarId;
  keep.topupLog = Array.isArray(prev.topupLog) ? prev.topupLog.slice() : [];
  Object.keys(prev.inventory || {}).forEach((id) => {
    if (isLookItem(id) && (prev.inventory[id] | 0) > 0) keep.inventory[id] = prev.inventory[id] | 0;
  });
  if (keep.beta.testPlay) {
    if (giftPaid(prev)) {
      keep.currencies.premium = BETA.powder;
      keep.currencies.coins = BETA.coins;
      keep.inventory.bodyfruit = BETA.fruit;
      keep.seasonIssued = [BETA.giftId];
    } else if (giftWaiting(prev) || (prev.seasonIssued || []).includes(BETA.giftId)) {
      keep.seasonIssued = [BETA.giftId];
      keep.seasonInbox = [TitleSystem.giftMail()];
    }
  }
  keep.wipeId = BETA.wipeId;
  return finish(keep);
}

function thisUnlock(data, id) {
  if (!id) return false;
  if (data.starterId === id) return true;
  return (data.unlocked || []).includes(id);
}

export const SaveSystem = {
  accountId: null,
  justLiveWipe: false,
  data: empty(),

  bootEmpty() {
    this.accountId = null;
    this.justLiveWipe = false;
    this.data = finish(empty());
    return this.data;
  },

  load() {
    return this.bootEmpty();
  },

  attachAccount(userId) {
    this.accountId = userId;
    try {
      const raw = localStorage.getItem(BASE_KEY + ":" + userId);
      if (raw) this.data = finish({ ...empty(), ...JSON.parse(raw) });
      else this.data = finish(empty());
    } catch (e) {
      this.data = finish(empty());
    }
    const before = this.data.wipeId;
    this.data = applyLiveWipe(this.data);
    this.justLiveWipe = this.data.wipeId === BETA.wipeId && before !== BETA.wipeId;
    if (this.justLiveWipe) this.persist({ push: false });
    return this.data;
  },

  applyCloud(save) {
    if (!save || typeof save !== "object" || Array.isArray(save)) return;
    const prev = this.data || empty();
    const next = finish({ ...empty(), ...save });
    next.inventory = unionInv(readInventory(prev.inventory), next.inventory);
    if (!next.shopLooks) next.shopLooks = emptyShopLooks();
    next.shopLooks.owned = unionIds(prev.shopLooks && prev.shopLooks.owned, next.shopLooks.owned);
    Object.keys((prev.champEquipped || {})).forEach((id) => {
      if (!(next.champEquipped[id] | 0) && (prev.champEquipped[id] | 0)) {
        next.champEquipped[id] = prev.champEquipped[id] | 0;
      }
    });
    if (!next.gear || typeof next.gear !== "object") next.gear = {};
    ROSTER_IDS.forEach((id) => {
      const a = prev.gear && prev.gear[id];
      const b = next.gear[id] || { ball: "", ult: "", sfx: "" };
      if (a) {
        if (!b.ball && a.ball) b.ball = a.ball;
        if (!b.ult && a.ult) b.ult = a.ult;
        if (!b.sfx && a.sfx) b.sfx = a.sfx;
      }
      next.gear[id] = b;
    });
    restoreOutfitItems(next);
    const before = next.wipeId;
    this.data = applyLiveWipe(next);
    this.justLiveWipe = this.justLiveWipe || (this.data.wipeId === BETA.wipeId && before !== BETA.wipeId);
    this.persist();
  },

  persist(opts) {
    if (!this.accountId) return;
    try {
      localStorage.setItem(BASE_KEY + ":" + this.accountId, JSON.stringify(this.data));
    } catch (e) { /* quota */ }
    if (!opts || opts.push !== false) {
      if (window.AuthSystem && window.AuthSystem.schedulePush) window.AuthSystem.schedulePush();
    }
  },

  hasStarter() {
    return Boolean(this.data.starterId);
  },

  isUnlocked(id) {
    if (this.data.starterId === id) return true;
    return (this.data.unlocked || []).includes(id);
  },

  isTrainCleared(id) {
    return trainNodeCleared(this.data.trainCleared, id);
  },

  isTrainOpen(id) {
    return trainNodeOpen(this.data.trainCleared, id);
  },

  clearTrainStage(id) {
    if (!id || this.isTrainCleared(id)) return;
    this.data.trainCleared = (this.data.trainCleared || []).concat([id]);
    TitleSystem.unlock(this.data);
    this.persist();
  },

  chooseStarter(id) {
    this.data.starterId = id;
    this.data.unlocked = [id];
    this.data.showcaseId = id;
    this.persist();
  },

  addPvp(amount) {
    this.data.currencies.pvp += amount;
    this.persist();
  },

  addPremium(amount) {
    this.data.currencies.premium += amount;
    this.persist();
  },

  recordTopup(row, persist) {
    if (!Array.isArray(this.data.topupLog)) this.data.topupLog = [];
    this.data.topupLog.unshift({
      id: "tu" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      at: Date.now(),
      kind: row && row.kind ? row.kind : "pack",
      packId: (row && row.packId) || "",
      powder: (row && row.powder) | 0,
      bonus: (row && row.bonus) | 0,
      thb: (row && row.thb) | 0
    });
    if (persist !== false) this.persist();
  },

  async grantTryPowder() {
    if (!onBetaDay(dayKey(), BETA.testStart, BETA.testEnd)) return 0;
    if (this.data.tryCostumePowder || (this.data.beta && this.data.beta.shopTry)) return 0;
    const auth = window.AuthSystem;
    if (!auth || !auth.claimBetaShopPowder) return 0;
    const r = await auth.claimBetaShopPowder();
    if (!r || !r.ok) return 0;
    if (!this.data.beta || typeof this.data.beta !== "object") this.data.beta = { testPlay: false };
    this.data.beta.shopTry = true;
    this.data.tryCostumePowder = true;
    if (r.premium != null) this.data.currencies.premium = r.premium | 0;
    if (!(r.n > 0)) {
      this.persist();
      return 0;
    }
    this.recordTopup({ kind: "try", packId: "beta-shop", powder: r.n | 0, bonus: 0, thb: 0 }, false);
    this.persist();
    return r.n | 0;
  },

  passRow(id) {
    const key = id || monthId();
    if (!this.data.passMonths || typeof this.data.passMonths !== "object") this.data.passMonths = {};
    if (!this.data.passMonths[key] || typeof this.data.passMonths[key] !== "object") {
      this.data.passMonths[key] = { bought: 0, at: 0, lookId: "", lookAsPowder: false, claimed: {} };
    }
    if (!this.data.passMonths[key].claimed || typeof this.data.passMonths[key].claimed !== "object") {
      this.data.passMonths[key].claimed = {};
    }
    return this.data.passMonths[key];
  },

  hasMonthPass(id) {
    return (this.passRow(id).bought | 0) > 0;
  },

  passClaimedToday() {
    const id = monthId();
    if (!this.hasMonthPass(id)) return false;
    return Boolean(this.passRow(id).claimed[dayKey()]);
  },

  giveShopLook(id) {
    const row = lookRow(id);
    if (!row) return false;
    if (!this.data.shopLooks) this.data.shopLooks = emptyShopLooks();
    if ((this.data.shopLooks.owned || []).indexOf(id) < 0) this.data.shopLooks.owned.push(id);
    if (!this.data.inventory) this.data.inventory = {};
    this.data.inventory[id] = Math.max(this.data.inventory[id] | 0, 1);
    return true;
  },

  catchupPassDays(id) {
    const mid = id || monthId();
    const row = this.passRow(mid);
    const last = elapsedDayInMonth(mid);
    const tot = { powder: 0, stones: 0, vial: 0, days: 0 };
    for (let d = 1; d <= last; d++) {
      const key = passDayKey(mid, d);
      if (row.claimed[key]) continue;
      const gift = passDailyGiftForDay(d);
      row.claimed[key] = gift;
      tot.powder += gift.powder | 0;
      tot.stones += gift.stones | 0;
      tot.vial += gift.vial | 0;
      tot.days += 1;
      if (gift.powder) this.data.currencies.premium = (this.data.currencies.premium | 0) + (gift.powder | 0);
      if (gift.stones) this.data.currencies.pvp = (this.data.currencies.pvp | 0) + (gift.stones | 0);
      if (gift.vial) {
        if (!this.data.inventory) this.data.inventory = {};
        this.data.inventory.ether_vial = (this.data.inventory.ether_vial | 0) + (gift.vial | 0);
      }
    }
    return tot;
  },

  passGiftOf(res) {
    const r = res || {};
    const gift = {
      powder: r.powder | 0,
      stones: r.stones | 0,
      vial: r.vial | 0
    };
    if (r.lookId && !r.lookAsPowder) gift.lookId = r.lookId;
    return gift;
  },

  buyMonthPass() {
    const id = monthId();
    const row = this.passRow(id);
    if ((row.bought | 0) > 0) {
      this.data.currencies.premium = (this.data.currencies.premium | 0) + PASS.dupBuyPowder;
      row.bought = (row.bought | 0) + 1;
      this.recordTopup({ kind: "pass-dup", packId: "pass-" + id, powder: PASS.dupBuyPowder, thb: PASS.thb }, false);
      this.persist();
      return { ok: true, dup: true, powder: PASS.dupBuyPowder, stones: 0, vial: 0, lookId: row.lookId, lookAsPowder: true, catchupDays: 0 };
    }
    const look = passLookOf(id);
    const lookId = look ? look.id : "";
    let lookAsPowder = false;
    let lookPowder = 0;
    if (lookId && this.ownedShopLook(lookId)) {
      lookPowder = PASS.ownedLookPowder;
      this.data.currencies.premium = (this.data.currencies.premium | 0) + lookPowder;
      lookAsPowder = true;
    } else if (lookId) {
      this.giveShopLook(lookId);
      if (look && this.isUnlocked(look.charId)) this.wearShopLook(lookId);
    }
    this.data.currencies.premium = (this.data.currencies.premium | 0) + PASS.instantPowder;
    row.bought = 1;
    row.at = Date.now();
    row.lookId = lookId;
    row.lookAsPowder = lookAsPowder;
    const back = this.catchupPassDays(id);
    const powder = PASS.instantPowder + lookPowder + (back.powder | 0);
    this.recordTopup({
      kind: "pass",
      packId: "pass-" + id,
      powder,
      thb: PASS.thb
    }, false);
    this.persist();
    return {
      ok: true,
      dup: false,
      powder,
      stones: back.stones | 0,
      vial: back.vial | 0,
      lookId,
      lookAsPowder,
      catchupDays: back.days | 0
    };
  },

  claimPassDay() {
    const id = monthId();
    if (!this.hasMonthPass(id)) return { ok: false, reason: "need" };
    const key = dayKey();
    const row = this.passRow(id);
    if (row.claimed[key]) return { ok: false, reason: "done" };
    const vial = vialDayOn();
    const stones = PASS.dailyStone | 0;
    row.claimed[key] = { powder: PASS.dailyPowder, stones, vial: vial ? PASS.vialN : 0 };
    this.data.currencies.premium = (this.data.currencies.premium | 0) + PASS.dailyPowder;
    if (stones) this.data.currencies.pvp = (this.data.currencies.pvp | 0) + stones;
    if (vial) {
      if (!this.data.inventory) this.data.inventory = {};
      this.data.inventory.ether_vial = (this.data.inventory.ether_vial | 0) + PASS.vialN;
    }
    this.persist();
    return { ok: true, powder: PASS.dailyPowder, stones, vial: vial ? PASS.vialN : 0 };
  },

  dailyRow() {
    if (!this.data.dailyLogin || typeof this.data.dailyLogin !== "object") this.data.dailyLogin = emptyDaily();
    const row = this.data.dailyLogin;
    if (!row.claimed || typeof row.claimed !== "object" || Array.isArray(row.claimed)) row.claimed = {};
    if (row.lastClaim && !row.claimed[row.lastClaim]) row.claimed[row.lastClaim] = 1;
    return row;
  },

  notePlayDay() {
    const today = dayKey();
    const row = this.dailyRow();
    if (row.lastSeen === today) return false;
    row.lastSeen = today;
    this.persist();
    return true;
  },

  dailyClaimedToday() {
    const row = this.dailyRow();
    const key = dayKey();
    if (row.claimed && row.claimed[key]) return true;
    return row.lastClaim === key;
  },

  dailyReady() {
    this.notePlayDay();
    return !this.dailyClaimedToday();
  },

  dailyClaimCount() {
    return claimedDaysOf(this.dailyRow(), monthId());
  },

  dailyLookGranted() {
    return this.dailyRow().costumeMonth === monthId();
  },

  giveDailyLook(id) {
    const look = lookRow(id);
    if (!look) return false;
    if (!this.data.shopLooks) this.data.shopLooks = emptyShopLooks();
    if ((this.data.shopLooks.owned || []).indexOf(id) < 0) this.data.shopLooks.owned.push(id);
    if (!this.data.inventory) this.data.inventory = {};
    this.data.inventory[id] = (this.data.inventory[id] | 0) + 1;
    if (this.isUnlocked(look.charId) && !this.wornShopLook(look.charId)) {
      if (!this.data.champEquipped) this.data.champEquipped = {};
      this.data.champEquipped[look.charId] = 0;
      this.data.shopLooks.worn[look.charId] = id;
    }
    return true;
  },

  claimDaily() {
    if (this.dailyClaimedToday()) return { ok: false, reason: "done" };
    const today = dayKey();
    const mid = monthId();
    const row = this.dailyRow();
    const gift = { ...dailyGiftOn() };
    row.claimed[today] = 1;
    row.lastClaim = today;
    row.lastSeen = today;
    if (gift.coins) this.data.currencies.coins = (this.data.currencies.coins | 0) + (gift.coins | 0);
    if (gift.shards) this.data.currencies.tokens = (this.data.currencies.tokens | 0) + (gift.shards | 0);
    if (gift.powder) this.data.currencies.premium = (this.data.currencies.premium | 0) + (gift.powder | 0);
    if (gift.vial) {
      if (!this.data.inventory) this.data.inventory = {};
      this.data.inventory.ether_vial = (this.data.inventory.ether_vial | 0) + (gift.vial | 0);
    }
    const days = claimedDaysOf(row, mid);
    if (days >= DAILY_LOOK_NEED && row.costumeMonth !== mid) {
      const look = dailyLookOf(mid);
      if (look) {
        row.costumeMonth = mid;
        if (this.ownedShopLook(look.id)) {
          this.data.currencies.premium = (this.data.currencies.premium | 0) + DAILY_DUP_POWDER;
          gift.powder = (gift.powder | 0) + DAILY_DUP_POWDER;
          gift.lookDup = true;
          row.costumeKind = "powder";
        } else {
          this.giveDailyLook(look.id);
          gift.lookId = look.id;
          row.costumeKind = "look";
        }
      }
    }
    this.persist();
    return { ok: true, days, gift };
  },

  addTokens(amount) {
    this.data.currencies.tokens += amount;
    this.persist();
  },

  addCoins(amount) {
    const n = amount | 0;
    if (!n) return;
    this.data.currencies.coins = (this.data.currencies.coins | 0) + n;
    this.persist();
  },

  buyWithCoins(id, price, qty) {
    const n = Math.max(1, qty | 0);
    const cost = Math.max(1, price | 0) * n;
    if ((this.data.currencies.coins | 0) < cost) return { ok: false, reason: "coins" };
    if (!ITEMS[id] || ITEMS[id].kind !== "use") return { ok: false, reason: "no" };
    this.data.currencies.coins -= cost;
    this.addItem(id, n);
    return { ok: true };
  },

  buyWithPremium(id, price, qty) {
    const n = Math.max(1, qty | 0);
    const cost = Math.max(1, price | 0) * n;
    if ((this.data.currencies.premium | 0) < cost) return { ok: false, reason: "premium" };
    if (!ITEMS[id] || ITEMS[id].kind !== "use") return { ok: false, reason: "no" };
    this.data.currencies.premium -= cost;
    this.addItem(id, n);
    return { ok: true };
  },

  itemCount(id) {
    if (!this.data.inventory) this.data.inventory = {};
    return this.data.inventory[id] | 0;
  },

  addItem(id, amount) {
    if (!ITEMS[id]) return 0;
    if (!this.data.inventory) this.data.inventory = {};
    const n = this.itemCount(id) + (amount | 0);
    if (n <= 0) delete this.data.inventory[id];
    else this.data.inventory[id] = n;
    this.persist();
    return this.itemCount(id);
  },

  consumeItem(id, amount) {
    const need = Math.max(1, amount | 0);
    if (this.itemCount(id) < need) return false;
    this.addItem(id, -need);
    return true;
  },

  grantEther(amount) {
    const add = Math.max(0, amount | 0);
    if (!add) return { bar: 0, vial: 0 };
    const max = ECONOMY.etherMax;
    const status = tickEther(this.data, Date.now());
    const room = Math.max(0, max - (status.n | 0));
    const bar = Math.min(room, add);
    if (bar) this.data.ether = status.n + bar;
    const vial = add - bar;
    if (vial) {
      if (!this.data.inventory) this.data.inventory = {};
      this.data.inventory.ether_vial = (this.data.inventory.ether_vial | 0) + vial;
    }
    this.persist();
    return { bar, vial };
  },

  canTakeEther(amount) {
    return canTakeEther(this.data, amount, Date.now());
  },

  fillEtherBar(amount) {
    const add = Math.max(0, amount | 0);
    if (!add) return { ok: true, bar: 0 };
    if (!canTakeEther(this.data, add, Date.now())) return { ok: false, reason: "full" };
    const status = tickEther(this.data, Date.now());
    this.data.ether = (status.n | 0) + add;
    this.persist();
    return { ok: true, bar: add };
  },

  useItem(id, ctx) {
    if (id === "stone") {
      if (!this.exchangePvpToTokens(1)) return { ok: false, reason: "none" };
      return { ok: true, effect: "toShard" };
    }
    const row = ITEMS[id];
    if (!row || row.kind !== "use") return { ok: false, reason: "no" };
    if (row.effect === "ether1") {
      if (!canTakeEther(this.data, 1, Date.now())) return { ok: false, reason: "full" };
      const status = tickEther(this.data, Date.now());
      if (!this.consumeItem(id, 1)) return { ok: false, reason: "none" };
      this.data.ether = (status.n | 0) + 1;
      this.persist();
      return { ok: true, effect: "ether1" };
    }
    if (row.effect === "respecLevel") {
      const charId = ctx && ctx.charId;
      if (!charId || !this.isUnlocked(charId)) return { ok: false, reason: "char" };
      const g = clampGrowth(this.data.growth[charId]);
      if (g.freeLevelRespec) return { ok: false, reason: "free" };
      if (!this.consumeItem(id, 1)) return { ok: false, reason: "none" };
      g.spentLevel = { spike: 0, touch: 0, aim: 0, spring: 0 };
      this.data.growth[charId] = normalizeRow(charId, g);
      this.persist();
      return { ok: true, effect: "respecLevel", charId };
    }
    if (row.effect === "rename") {
      return { ok: true, effect: "rename", hold: true };
    }
    if (row.effect === "champSkin") {
      const charId = row.charId;
      if (!charId || !this.isUnlocked(charId)) return { ok: false, reason: "char" };
      if (!this.data.champEquipped) this.data.champEquipped = {};
      this.data.champEquipped[charId] = row.set | 0;
      this.persist();
      return { ok: true, effect: "champSkin", charId, on: true, set: row.set | 0 };
    }
    if (row.effect === "shopLook") {
      const res = this.wearShopLook(row.lookId || id);
      if (!res.ok) return res;
      return { ok: true, effect: "shopLook", charId: row.charId, on: true };
    }
    if (row.effect === "ballFx") {
      if (this.itemCount(id) <= 0) return { ok: false, reason: "none" };
      const charId = ctx && ctx.charId;
      if (!charId || !this.isUnlocked(charId)) return { ok: false, reason: "char" };
      if (row.char && row.char !== charId) return { ok: false, reason: "elem" };
      this.gearOf(charId).ball = row.ballFx || id;
      this.data.ballFx = row.ballFx || id;
      this.persist();
      return { ok: true, effect: "ballFx", on: true, charId };
    }
    if (row.effect === "ultFx") {
      if (this.itemCount(id) <= 0) return { ok: false, reason: "none" };
      const charId = ctx && ctx.charId;
      if (!charId || !this.isUnlocked(charId)) return { ok: false, reason: "char" };
      if (row.char && row.char !== charId) return { ok: false, reason: "elem" };
      this.gearOf(charId).ult = row.ultFx || id;
      this.persist();
      return { ok: true, effect: "ultFx", on: true, charId };
    }
    return { ok: false, reason: "no" };
  },

  exchangePvpToTokens(tokenCount) {
    const n = Math.max(1, tokenCount | 0);
    const cost = n * (ECONOMY.pvpPerToken | 5);
    if (this.data.currencies.pvp < cost) return false;
    this.data.currencies.pvp -= cost;
    this.data.currencies.tokens += n;
    this.persist();
    return true;
  },

  buyTokensWithPremium(tokenCount) {
    const n = Math.max(1, tokenCount | 0);
    const cost = n * (ECONOMY.premiumPerToken | 2);
    if (this.data.currencies.premium < cost) return false;
    this.data.currencies.premium -= cost;
    this.data.currencies.tokens += n;
    this.persist();
    return true;
  },

  unlockWithTokens(id, cost) {
    if (this.isUnlocked(id)) return { ok: false, reason: "owned" };
    if (this.data.currencies.tokens < cost) return { ok: false, reason: "tokens" };
    this.data.currencies.tokens -= cost;
    this.data.unlocked.push(id);
    this.persist();
    return { ok: true };
  },

  takeFirstWinBonus(amount) {
    const day = new Date().toISOString().slice(0, 10);
    if (this.data.firstWinDate === day) return 0;
    this.data.firstWinDate = day;
    this.addPvp(amount);
    return amount;
  },

  equippedCheer() {
    return wornCosmetic(this.data, "cheer");
  },

  isCheerUnlocked(id) {
    return hasCosmetic(this.data, id);
  },

  unlockCheer(id) {
    const res = purchaseCosmetic(this.data, id);
    if (res.ok) this.persist();
    return res;
  },

  gearOf(charId) {
    if (!this.data.gear || typeof this.data.gear !== "object") this.data.gear = {};
    if (!this.data.gear[charId] || typeof this.data.gear[charId] !== "object") {
      this.data.gear[charId] = { ball: "", ult: "", sfx: "" };
    }
    const g = this.data.gear[charId];
    if (typeof g.ball !== "string") g.ball = "";
    if (typeof g.ult !== "string") g.ult = "";
    if (typeof g.sfx !== "string") g.sfx = "";
    return g;
  },

  outfitIdOf(charId) {
    const set = (this.data.champEquipped && this.data.champEquipped[charId]) | 0;
    if (set >= 1 && set <= 3) return "champ-" + charId + "-" + set;
    return this.wornShopLook(charId) || "";
  },

  armedBallFx(charId) {
    if (charId) return this.gearOf(charId).ball || "";
    return this.data.ballFx || "";
  },

  wearingBall(id) {
    if (!id) return false;
    if (this.data.ballFx === id) return true;
    return ROSTER_IDS.some((charId) => this.gearOf(charId).ball === id);
  },

  armedUlt(charId) {
    if (!charId) return "";
    return this.gearOf(charId).ult || "";
  },

  wearingOrb(id) {
    if (!id) return false;
    return ROSTER_IDS.some((charId) => this.gearOf(charId).ult === id);
  },

  grandUlt(charId) {
    const row = ITEMS[this.armedUlt(charId)];
    return Boolean(row && row.effect === "ultFx" && (!row.char || row.char === charId));
  },

  clearUlt(charId) {
    if (charId) this.gearOf(charId).ult = "";
    else ROSTER_IDS.forEach((id) => { this.gearOf(id).ult = ""; });
    this.persist();
    return { ok: true };
  },

  clearBallFx(charId) {
    if (charId) this.gearOf(charId).ball = "";
    else ROSTER_IDS.forEach((id) => { this.gearOf(id).ball = ""; });
    const still = ROSTER_IDS.map((id) => this.gearOf(id).ball).find(Boolean);
    this.data.ballFx = still || "";
    this.persist();
    return { ok: true };
  },

  ownedShopLook(id) {
    if (this.itemCount(id) > 0) return true;
    return ((this.data.shopLooks && this.data.shopLooks.owned) || []).indexOf(id) >= 0;
  },

  wornShopLook(charId) {
    return (this.data.shopLooks.worn && this.data.shopLooks.worn[charId]) || "";
  },

  buyShopLook(id) {
    const row = lookRow(id);
    if (!row || !row.open) return { ok: false, reason: "no" };
    if (this.ownedShopLook(id)) return { ok: false, reason: "owned" };
    if (!this.isUnlocked(row.charId)) return { ok: false, reason: "char" };
    const cost = Math.max(1, row.price | 0);
    if ((this.data.currencies.premium | 0) < cost) return { ok: false, reason: "premium" };
    this.data.currencies.premium -= cost;
    if ((this.data.shopLooks.owned || []).indexOf(id) < 0) this.data.shopLooks.owned.push(id);
    this.addItem(id, 1);
    return { ok: true };
  },

  wearShopLook(id) {
    const row = lookRow(id);
    if (!row || !this.ownedShopLook(id)) return { ok: false, reason: "no" };
    if (!this.isUnlocked(row.charId)) return { ok: false, reason: "char" };
    if (!this.data.champEquipped) this.data.champEquipped = {};
    this.data.champEquipped[row.charId] = 0;
    this.data.shopLooks.worn[row.charId] = id;
    this.persist();
    return { ok: true };
  },

  unequipOutfit(charId) {
    if (!charId) return { ok: false, reason: "char" };
    if (!this.data.champEquipped) this.data.champEquipped = {};
    this.data.champEquipped[charId] = 0;
    if (this.data.shopLooks && this.data.shopLooks.worn) this.data.shopLooks.worn[charId] = "";
    this.persist();
    return { ok: true };
  },

  clearShopLook(charId) {
    if (!this.data.shopLooks.worn) return;
    this.data.shopLooks.worn[charId] = "";
    this.persist();
  },

  equipCheer(id) {
    const res = wearCosmetic(this.data, id);
    if (res.ok) this.persist();
    return res.ok;
  },

  loadout() {
    return { ...(this.data.cosmetics && this.data.cosmetics.equipped) };
  },

  ownsCosmetic(id) {
    return hasCosmetic(this.data, id);
  },

  equippedCosmetic(slot) {
    return wornCosmetic(this.data, slot);
  },

  buyCosmetic(id) {
    const res = purchaseCosmetic(this.data, id);
    if (res.ok) this.persist();
    return res;
  },

  equipCosmetic(id) {
    const res = wearCosmetic(this.data, id);
    if (res.ok) this.persist();
    return res;
  },

  etherNow() {
    const before = this.data.ether;
    const status = tickEther(this.data, Date.now());
    if (status.n !== before) this.persist();
    return status;
  },

  spendEther(cost) {
    const need = cost | 0;
    const status = tickEther(this.data, Date.now());
    if (status.n < need) return false;
    const max = ECONOMY.etherMax;
    const wasFull = status.n >= max;
    this.data.ether = status.n - need;
    if (wasFull) this.data.etherAt = Date.now();
    this.persist();
    return true;
  },

  recordMatch(entry) {
    const stats = entry.stats || {};
    const career = this.data.career;
    career.matches += 1;
    if (entry.win) career.wins += 1;
    else career.losses += 1;
    career.aces += stats.aces | 0;
    career.ults += stats.ults | 0;
    career.hits += stats.hits | 0;
    career.powerHits += stats.powerHits | 0;
    career.errors += stats.errors | 0;
    career.playMs += stats.ms | 0;
    career.bestStreak = Math.max(career.bestStreak | 0, stats.bestStreak | 0);
    career.longestRally = Math.max(career.longestRally | 0, stats.longestRally | 0);
    this.data.matchLog.unshift({
      t: Date.now(),
      week: rankingWeek().id,
      mode: entry.mode || "bot",
      win: Boolean(entry.win),
      you: entry.youId,
      foe: entry.foeId,
      foeName: entry.foeName || "",
      youScore: entry.youScore | 0,
      foeScore: entry.foeScore | 0,
      diff: entry.diff || "normal",
      mmr: entry.mmrDelta || 0,
      stats
    });
    if (this.data.matchLog.length > ECONOMY.matchLogMax) {
      this.data.matchLog.length = ECONOMY.matchLogMax;
    }
    TitleSystem.unlock(this.data);
    this.persist();
  },

  weekGames(weekId, board) {
    return (this.data.matchLog || []).filter((m) => m.week === weekId && m.mode === board).length;
  },

  touchSeasonSnap(board, place) {
    if (board !== "pvp" && board !== "special") return;
    const week = rankingWeek().id;
    const games = this.weekGames(week, board);
    const snap = this.data.seasonSnap || {};
    const prev = snap[board] || {};
    const keep = (place | 0) > 0 ? (place | 0) : (prev.week === week ? (prev.place | 0) : 0);
    snap[board] = { week, games, place: keep };
    this.data.seasonSnap = snap;
    this.persist();
  },

  settleSeasonMails() {
    if (!Array.isArray(this.data.seasonIssued)) this.data.seasonIssued = [];
    if (!Array.isArray(this.data.seasonInbox)) this.data.seasonInbox = [];
    const last = previousRankingWeek();
    let dirty = false;
    ["pvp", "special"].forEach((board) => {
      const key = last.id + ":" + board;
      if (this.data.seasonIssued.includes(key)) return;
      this.data.seasonIssued.push(key);
      dirty = true;
      const games = this.weekGames(last.id, board);
      const snap = (this.data.seasonSnap || {})[board] || {};
      const place = snap.week === last.id ? (snap.place | 0) : 0;
      const pay = seasonPayout(board, place, games);
      if (!pay) return;
      const mail = buildSeasonMail(last, pay);
      if (this.data.seasonInbox.some((row) => row.id === mail.id)) return;
      this.data.seasonInbox.push(mail);
    });
    if (this.data.seasonIssued.length > 24) {
      const keepGift = this.data.seasonIssued.includes(BETA.giftId);
      this.data.seasonIssued = this.data.seasonIssued.slice(-24);
      if (keepGift && this.data.seasonIssued.indexOf(BETA.giftId) < 0) this.data.seasonIssued.unshift(BETA.giftId);
    }
    if (dirty) this.persist();
    this.settleBetaGift();
  },

  liveWiped() {
    return Boolean(this.data && this.data.wipeId === BETA.wipeId);
  },

  settleBetaGift() {
    const fresh = TitleSystem.unlock(this.data);
    const gift = TitleSystem.shouldGift(this.data);
    if (gift) {
      this.data.seasonIssued.push(BETA.giftId);
      this.data.seasonInbox.push(TitleSystem.giftMail());
    }
    if (fresh.length || gift) this.persist();
    return gift;
  },

  claimSeasonMail(id, opt) {
    const raw = String(id || "").replace(/^local:/, "");
    const skipPayload = Boolean(opt && opt.skipPayload);
    const list = this.data.seasonInbox || [];
    const i = list.findIndex((row) => row.id === raw || row.id === id);
    if (i < 0) return { ok: false, reason: "no" };
    const mail = list[i];
    if (mail.claimed) {
      mail.unread = false;
      mail.readAt = mail.readAt || Date.now();
      this.persist();
      return { ok: true };
    }
    const p = skipPayload ? {} : (mail.payload || {});
    const bar = p.etherBar | 0;
    const vials = p.etherVial | 0;
    if ((bar || vials) && !canTakeEther(this.data, 1, Date.now())) return { ok: false, reason: "full" };
    if (bar && !canTakeEther(this.data, bar, Date.now())) return { ok: false, reason: "full" };
    if (bar) {
      const filled = this.fillEtherBar(bar);
      if (!filled.ok) return filled;
    }
    if (p.etherVial) this.addItem("ether_vial", p.etherVial | 0);
    if (p.shards) this.addTokens(p.shards | 0);
    if (p.powder) this.addPremium(p.powder | 0);
    if (p.coins) this.addCoins(p.coins | 0);
    if (p.fruit) this.addItem("bodyfruit", p.fruit | 0);
    if (p.cheer) {
      const cyc = seasonCycleOf(p.cycle | 0);
      this.addItem(cyc.champItem, 1);
    }
    if (p.plateKind) {
      this.data.seasonMark = {
        week: p.week || "",
        board: p.board || "",
        place: p.place | 0,
        kind: p.plateKind,
        cycle: p.cycle | 0
      };
    }
    if (p.plate || p.cheer) {
      if (!Array.isArray(this.data.seasonBadges)) this.data.seasonBadges = [];
      this.data.seasonBadges.push({
        week: p.week || "",
        board: p.board || "",
        place: p.place | 0,
        plate: Boolean(p.plate),
        cheer: Boolean(p.cheer)
      });
    }
    mail.claimed = true;
    mail.unread = false;
    mail.readAt = Date.now();
    this.data.seasonInbox = list;
    this.persist();
    return { ok: true };
  },

  removeSeasonMail(id) {
    const raw = String(id || "").replace(/^local:/, "");
    const list = this.data.seasonInbox || [];
    const i = list.findIndex((row) => row.id === raw || row.id === id);
    if (i < 0) return { ok: false, reason: "no" };
    list.splice(i, 1);
    this.data.seasonInbox = list;
    this.persist();
    return { ok: true };
  },

  purgeReadMail() {
    const keep = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const list = this.data.seasonInbox || [];
    const next = list.filter((row) => {
      if (row.unread !== false && !row.claimed) return true;
      const at = row.readAt | 0;
      if (!at) return true;
      return now - at < keep;
    });
    if (next.length !== list.length) {
      this.data.seasonInbox = next;
      this.persist();
    }
  },

  setRank(rank) {
    this.data.rank = { ...emptyRank(), ...(rank || {}) };
    this.persist();
    if (window.AuthSystem && window.AuthSystem.pushSave) window.AuthSystem.pushSave();
  },

  setShowcase(id) {
    if (!this.isUnlocked(id)) return false;
    this.data.showcaseId = id;
    this.persist();
    return true;
  },

  skinOf(id) {
    const skins = this.data.skins || emptySkins();
    return clampSkin(skins[id] || 1);
  },

  setSkin(id, tier) {
    if (!this.isUnlocked(id)) return false;
    if (!this.skinOpen(id, tier)) return false;
    if (!this.data.skins) this.data.skins = emptySkins();
    this.data.skins[id] = clampSkin(tier);
    this.persist();
    return true;
  },

  skinOpen(id, tier) {
    return (this.growthOf(id).level | 0) >= skinNeedLv(tier);
  },

  growthOf(id) {
    if (!this.data.growth) this.data.growth = emptyGrowth();
    const before = JSON.stringify(clampGrowth(this.data.growth[id]));
    const row = normalizeRow(id, this.data.growth[id]);
    this.data.growth[id] = row;
    if (JSON.stringify(row) !== before) this.persist();
    return sheetFromRow(id, row);
  },

  addGrowthXp(id, amount) {
    if (!this.data.growth) this.data.growth = emptyGrowth();
    const row = clampGrowth(this.data.growth[id]);
    row.xp += Math.max(0, amount | 0);
    this.data.growth[id] = normalizeRow(id, row);
    this.persist();
    return this.growthOf(id);
  },

  commitGrowth(id, row) {
    if (!this.isUnlocked(id)) return false;
    const saved = clampGrowth(this.data.growth[id]);
    const next = normalizeRow(id, row);
    const ok = STAT_IDS.every((s) =>
      (next.spentStart[s] | 0) >= (saved.spentStart[s] | 0)
      && (next.spentLevel[s] | 0) >= (saved.spentLevel[s] | 0)
    );
    if (!ok) return false;
    next.xp = saved.xp;
    next.freeLevelRespec = saved.freeLevelRespec;
    this.data.growth[id] = next;
    this.persist();
    return true;
  },

  respecStartGrowth(id) {
    if (!this.isUnlocked(id)) return false;
    const row = clampGrowth(this.data.growth[id]);
    row.spentStart = { spike: 0, touch: 0, aim: 0, spring: 0 };
    this.data.growth[id] = normalizeRow(id, row);
    this.persist();
    return true;
  },

  respecLevelGrowth(id) {
    if (!this.isUnlocked(id)) return { ok: false };
    const row = clampGrowth(this.data.growth[id]);
    if (row.freeLevelRespec) {
      row.spentLevel = { spike: 0, touch: 0, aim: 0, spring: 0 };
      row.freeLevelRespec = false;
      this.data.growth[id] = normalizeRow(id, row);
      this.persist();
      return { ok: true };
    }
    return this.useItem("bodyfruit", { charId: id });
  },

  equipAvatar(id) {
    const res = wearCosmetic(this.data, id);
    if (res.ok) this.persist();
    return res.ok;
  }
};
