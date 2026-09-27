const KEY = "elemental-volley-save-v1";

const empty = () => ({
  starterId: null,
  unlocked: [],
  currencies: { pvp: 0, premium: 0, tokens: 0 },
  firstWinDate: null,
  settings: { lang: "th", controlMode: "auto" },
  unlockedCheers: ["classic"],
  equippedCheer: "classic"
});

export const SaveSystem = {
  data: empty(),

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...empty(), ...JSON.parse(raw) };
    } catch (e) {
      this.data = empty();
    }
    this.data.settings = { ...empty().settings, ...(this.data.settings || {}) };
    if (!Array.isArray(this.data.unlockedCheers) || !this.data.unlockedCheers.length) {
      this.data.unlockedCheers = ["classic"];
    }
    if (!this.data.equippedCheer) this.data.equippedCheer = "classic";
    return this.data;
  },

  applyCloud(save) {
    if (!save || typeof save !== "object") return;
    this.data = { ...empty(), ...save };
    this.data.settings = { ...empty().settings, ...(this.data.settings || {}) };
    if (!Array.isArray(this.data.unlockedCheers) || !this.data.unlockedCheers.length) {
      this.data.unlockedCheers = ["classic"];
    }
    localStorage.setItem(KEY, JSON.stringify(this.data));
  },

  persist() {
    localStorage.setItem(KEY, JSON.stringify(this.data));
    if (window.AuthSystem && window.AuthSystem.schedulePush) window.AuthSystem.schedulePush();
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
