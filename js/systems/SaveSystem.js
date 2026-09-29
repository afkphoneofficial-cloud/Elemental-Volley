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
import { emptySkins, clampSkin } from "../data/skins.js";
import { emptyGrowth, clampGrowth, sheetFromRow, normalizeRow, defaultSpent, STAT_IDS } from "../data/growth.js";
import { ITEMS } from "../data/items.js";
import { ROSTER_IDS } from "../data/roster.js";

const BASE_KEY = "elemental-volley-save-v1";

const empty = () => ({
  starterId: null,
  unlocked: [],
  currencies: { pvp: 0, premium: 0, tokens: 0 },
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
  growth: emptyGrowth()
});

function finish(data) {
  data.settings = { ...empty().settings, ...(data.settings || {}) };
  data.settings.bgmPages = { ...empty().settings.bgmPages, ...(data.settings.bgmPages || {}) };
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
  if (!data.inventory || typeof data.inventory !== "object" || Array.isArray(data.inventory)) data.inventory = {};
  Object.keys(data.inventory).forEach((id) => {
    const n = data.inventory[id] | 0;
    if (n > 0) data.inventory[id] = n;
    else delete data.inventory[id];
  });
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

  useItem(id, ctx) {
    if (id === "stone") {
      if (!this.exchangePvpToTokens(1)) return { ok: false, reason: "none" };
      return { ok: true, effect: "toShard" };
    }
    const row = ITEMS[id];
    if (!row || row.kind !== "use") return { ok: false, reason: "no" };
    if (row.effect === "ether1") {
      const status = tickEther(this.data, Date.now());
      if (status.full) return { ok: false, reason: "full" };
      if (!this.consumeItem(id, 1)) return { ok: false, reason: "none" };
      this.data.ether = Math.min(ECONOMY.etherMax, (status.n | 0) + 1);
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
    return { ok: false, reason: "no" };
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

  skinOf(id) {
    const skins = this.data.skins || emptySkins();
    return clampSkin(skins[id] || 1);
  },

  setSkin(id, tier) {
    if (!this.isUnlocked(id)) return false;
    if (!this.data.skins) this.data.skins = emptySkins();
    this.data.skins[id] = clampSkin(tier);
    this.persist();
    return true;
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
