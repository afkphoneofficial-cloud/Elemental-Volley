const BASE_KEY = "elemental-volley-save-v1";

const empty = () => ({
  starterId: null,
  unlocked: [],
  currencies: { pvp: 0, premium: 0, tokens: 0 },
  firstWinDate: null,
  settings: { lang: "th", controlMode: "auto" },
  unlockedCheers: ["classic"],
  equippedCheer: "classic"
});

function finish(data) {
  data.settings = { ...empty().settings, ...(data.settings || {}) };
  if (!Array.isArray(data.unlockedCheers) || !data.unlockedCheers.length) {
    data.unlockedCheers = ["classic"];
  }
  if (!data.equippedCheer) data.equippedCheer = "classic";
  if (!Array.isArray(data.unlocked)) data.unlocked = [];
  if (!data.currencies) data.currencies = empty().currencies;
  return data;
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
    return this.data.equippedCheer || "classic";
  },

  isCheerUnlocked(id) {
    return (this.data.unlockedCheers || []).includes(id);
  },

  unlockCheer(id, premiumCost) {
    if (this.isCheerUnlocked(id)) return { ok: false, reason: "owned" };
    if (this.data.currencies.premium < premiumCost) return { ok: false, reason: "premium" };
    this.data.currencies.premium -= premiumCost;
    this.data.unlockedCheers.push(id);
    this.data.equippedCheer = id;
    this.persist();
    return { ok: true };
  },

  equipCheer(id) {
    if (!this.isCheerUnlocked(id)) return false;
    this.data.equippedCheer = id;
    this.persist();
    return true;
  }
};
