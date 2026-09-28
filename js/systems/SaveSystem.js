import { ECONOMY } from "../data/economy.js";
import { emptyCareer, tickEther } from "./Ether.js";
import { emptyRank } from "../data/ranks.js";
import { DEFAULT_AVATAR, ownedAvatar } from "../data/avatars.js";
import {
  buyCosmetic as purchaseCosmetic,
  equipCosmetic as wearCosmetic,
  equippedCosmetic as wornCosmetic,
  migrateCosmetics,
  ownsCosmetic as hasCosmetic
} from "../data/cosmetics.js";

const BASE_KEY = "elemental-volley-save-v1";

const empty = () => ({
  starterId: null,
  unlocked: [],
  currencies: { pvp: 0, premium: 0, tokens: 0 },
  firstWinDate: null,
  settings: { lang: "th", controlMode: "auto" },
  unlockedCheers: ["classic"],
  equippedCheer: "classic",
  career: emptyCareer(),
  matchLog: [],
  ether: ECONOMY.etherMax,
  etherAt: 0,
  avatarId: "av01",
  unlockedAvatars: [],
  cosmetics: { owned: [], equipped: {} },
  rank: emptyRank(),
  showcaseId: null,
  friends: []
});

function finish(data) {
  data.settings = { ...empty().settings, ...(data.settings || {}) };
  if (!Array.isArray(data.unlockedCheers) || !data.unlockedCheers.length) {
    data.unlockedCheers = ["classic"];
  }
  if (!data.equippedCheer) data.equippedCheer = "classic";
  if (!Array.isArray(data.unlocked)) data.unlocked = [];
  if (!data.currencies) data.currencies = empty().currencies;
  data.career = { ...emptyCareer(), ...(data.career || {}) };
  if (!Array.isArray(data.matchLog)) data.matchLog = [];
  if (data.ether == null) data.ether = ECONOMY.etherMax;
  if (!data.etherAt) data.etherAt = Date.now();
  if (!ownedAvatar(data, data.avatarId)) data.avatarId = DEFAULT_AVATAR;
  if (!Array.isArray(data.unlockedAvatars)) data.unlockedAvatars = [];
  migrateCosmetics(data);
  data.rank = { ...emptyRank(), ...(data.rank || {}) };
  if (!Array.isArray(data.friends)) data.friends = [];
  if (!data.showcaseId || !thisUnlock(data, data.showcaseId)) {
    data.showcaseId = data.starterId || data.showcaseId;
  }
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
    if (!save || typeof save !== "object") return;
    this.data = finish({ ...empty(), ...save });
    this.persist({ push: false });
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

  addTokens(amount) {
    this.data.currencies.tokens += amount;
    this.persist();
  },

  exchangePvpToTokens(tokenCount) {
    const cost = tokenCount * 1;
    if (this.data.currencies.pvp < cost) return false;
    this.data.currencies.pvp -= cost;
    this.data.currencies.tokens += tokenCount;
    this.persist();
    return true;
  },

  buyTokensWithPremium(tokenCount) {
    const cost = tokenCount * 1;
    if (this.data.currencies.premium < cost) return false;
    this.data.currencies.premium -= cost;
    this.data.currencies.tokens += tokenCount;
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

  equipAvatar(id) {
    const res = wearCosmetic(this.data, id);
    if (res.ok) this.persist();
    return res.ok;
  }
};
