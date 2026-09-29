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
import { emptyGrowth, clampGrowth, sheetFromRow, normalizeRow, defaultSpent, STAT_IDS } from "../data/growth.js";
import { isTrainOpen as trainNodeOpen, isTrainCleared as trainNodeCleared } from "../data/trainStages.js";
import { ITEMS } from "../data/items.js";
import { ROSTER_IDS } from "../data/roster.js";
import { previousRankingWeek, rankingWeek } from "../data/rankWindows.js";
import { buildSeasonMail, seasonPayout } from "../data/seasonRewards.js";
import { seasonCycleOf } from "../data/seasonCycle.js";
import { emptyShopLooks, shopLookOf as lookRow } from "../data/costumeShop.js";

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
    timeZone: "Bangkok"
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
  shopLooks: emptyShopLooks()
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

function thisUnlock(data, id) {
  if (!id) return false;
  if (data.starterId === id) return true;
  return (data.unlocked || []).includes(id);
}

export const SaveSystem = {
  accountId: null,
  data: empty(),

  bootEmpty() {
    this.accountId = null;
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
    restoreOutfitItems(next);
    this.data = next;
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

  grantTryPowder() {
    if (this.data.tryCostumePowder) return 0;
    this.data.tryCostumePowder = true;
    this.data.currencies.premium = (this.data.currencies.premium | 0) + 3000;
    this.persist();
    return 3000;
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

  ownedShopLook(id) {
    if (this.itemCount(id) > 0) return true;
    return (this.data.shopLooks.owned || []).indexOf(id) >= 0;
  },

  wornShopLook(charId) {
    return (this.data.shopLooks.worn && this.data.shopLooks.worn[charId]) || "";
  },

  buyShopLook(id) {
    const row = lookRow(id);
    if (!row || !row.open) return { ok: false, reason: "no" };
    if (this.ownedShopLook(id)) return { ok: false, reason: "owned" };
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
    if (this.data.seasonIssued.length > 24) this.data.seasonIssued = this.data.seasonIssued.slice(-24);
    if (dirty) this.persist();
  },

  claimSeasonMail(id) {
    const raw = String(id || "").replace(/^local:/, "");
    const list = this.data.seasonInbox || [];
    const i = list.findIndex((row) => row.id === raw || row.id === id);
    if (i < 0) return { ok: false, reason: "no" };
    const mail = list[i];
    const p = mail.payload || {};
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
    list.splice(i, 1);
    this.data.seasonInbox = list;
    this.persist();
    return { ok: true };
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
