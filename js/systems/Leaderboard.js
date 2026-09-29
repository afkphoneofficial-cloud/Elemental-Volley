import { AuthSystem } from "./AuthSystem.js";
import { SaveSystem } from "./SaveSystem.js";
import { medalFromMmr, isCalibrating, RANK_CAL_GAMES, displayBadgeId } from "../data/ranks.js";
import { t, I18n } from "../i18n/I18n.js";
import { AudioSystem } from "./AudioSystem.js";

function els() {
  return {
    root: document.getElementById("board-overlay"),
    list: document.getElementById("board-list"),
    you: document.getElementById("board-you"),
    note: document.getElementById("board-note"),
    title: document.getElementById("board-title"),
    sub: document.getElementById("board-sub"),
    close: document.getElementById("board-close")
  };
}

function avSrc(id) {
  const n = String(id || "av01");
  return "assets/sprites/avatars/" + n + ".png";
}

function badgeSrc(id) {
  return "assets/sprites/ranks/" + id + ".png";
}

function starText(medal) {
  const n = medal && medal.star | 0;
  return n > 0 ? "★".repeat(n) : "";
}

function rankLabel(mmr, games) {
  const rank = { mmr: mmr | 0, games: games | 0 };
  if (isCalibrating(rank)) return t("rank.calShort", { n: rank.games, max: RANK_CAL_GAMES });
  const medal = medalFromMmr(rank.mmr);
  return t("rank.chip", { name: t("rank.tier." + medal.id), star: starText(medal) });
}

function rowHtml(row, youId) {
  const place = row.place | 0;
  const podium = place === 1 ? "gold" : place === 2 ? "silver" : place === 3 ? "bronze" : "";
  const mine = youId && row.id === youId ? " mine" : "";
  const badgeId = displayBadgeId({ mmr: row.mmr, games: row.games });
  const badge = `<img class="board-badge" alt="" src="${badgeSrc(badgeId)}" width="44" height="44" />`;
  return `<article class="board-row ${podium}${mine}" data-place="${place}">
    <span class="board-place">${place}</span>
    <img class="board-av" alt="" src="${avSrc(row.avatar_id)}" width="44" height="44" />
    ${badge}
    <div class="board-meta">
      <p class="board-name">${escapeHtml(row.display_name || "—")}</p>
      <p class="board-rank">${rankLabel(row.mmr, row.games)}</p>
    </div>
    <div class="board-stats">
      <strong>${row.mmr | 0}</strong>
      <span>${t("board.wl", { w: row.wins | 0, l: row.losses | 0 })}</span>
    </div>
  </article>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

export function boardRankLabel(mmr, games) {
  return rankLabel(mmr, games);
}

export const Leaderboard = {
  rows: [],
  me: null,
  open: false,

  mount() {
    const ui = els();
    if (!ui.root || ui.root.dataset.bound) return;
    ui.root.dataset.bound = "1";
    if (ui.close) ui.close.addEventListener("click", () => this.hide());
    ui.root.addEventListener("click", (ev) => {
      if (ev.target === ui.root) this.hide();
    });
    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && this.open) this.hide();
    });
    window.addEventListener("ev-lang", () => {
      if (this.open) this.paint();
    });
  },

  async show() {
    const g = window.game;
    const live = g && g.scene && g.scene.getScenes(true)[0];
    if (live && live.scene) {
      live.scene.start("rankinfo", { from: live.scene.key, tab: "pvp" });
      return;
    }
    this.mount();
    const ui = els();
    if (!ui.root) return;
    this.open = true;
    ui.root.hidden = false;
    if (ui.list) ui.list.innerHTML = "";
    if (ui.note) ui.note.textContent = t("board.loading");
    if (ui.you) ui.you.hidden = true;
    this.paintChrome();
    AudioSystem.ui();
    await this.load();
    this.paint();
  },

  hide() {
    const ui = els();
    this.open = false;
    if (ui.root) ui.root.hidden = true;
  },

  async load(kind) {
    this.kind = kind === "special" ? "special" : "pvp";
    if (this.kind === "special") {
      this.rows = [];
      this.me = null;
      this.fail = false;
      return;
    }
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) {
      this.rows = [];
      this.me = null;
      return;
    }
    const [board, mine] = await Promise.all([
      sb.rpc("server_leaderboard", { p_limit: 100 }),
      sb.rpc("my_board_place")
    ]);
    this.rows = !board.error && Array.isArray(board.data) ? board.data : [];
    this.fail = Boolean(board.error);
    const row = !mine.error && Array.isArray(mine.data) ? mine.data[0] : (!mine.error ? mine.data : null);
    this.me = row && typeof row === "object" ? row : null;
    if (mine.error) this.fail = true;
  },

  async peekTop(kind, n) {
    const limit = Math.max(1, Math.min(5, n | 0 || 5));
    if (kind === "special") return { rows: [], fail: false };
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { rows: [], fail: false };
    const board = await sb.rpc("server_leaderboard", { p_limit: limit });
    if (board.error) return { rows: [], fail: true };
    const rows = Array.isArray(board.data) ? board.data.slice(0, limit) : [];
    return { rows, fail: false };
  },

  paintChrome() {
    const ui = els();
    if (ui.title) ui.title.textContent = t("board.title");
    if (ui.sub) ui.sub.textContent = t("board.sub");
    if (ui.close) ui.close.textContent = t("nav.back");
  },

  paint() {
    const ui = els();
    if (!ui.list) return;
    this.paintChrome();
    const sess = AuthSystem.session && AuthSystem.session();
    const youId = sess && sess.id;
    if (this.fail) {
      ui.list.innerHTML = "";
      if (ui.note) ui.note.textContent = t("board.fail");
    } else if (!this.rows.length) {
      ui.list.innerHTML = "";
      if (ui.note) ui.note.textContent = t("board.empty");
    } else {
      if (ui.note) ui.note.textContent = "";
      ui.list.innerHTML = this.rows.map((row) => rowHtml(row, youId)).join("");
      ui.list.querySelectorAll("img").forEach((img) => {
        img.addEventListener("error", () => {
          if (img.classList.contains("board-av")) img.src = avSrc("av01");
          else img.remove();
        }, { once: true });
      });
    }
    if (!ui.you) return;
    const local = SaveSystem.data.rank || {};
    const mmr = (this.me && this.me.mmr) || local.mmr | 0;
    const games = (this.me && this.me.games) || local.games | 0;
    const wins = (this.me && this.me.wins) || local.wins | 0;
    const losses = (this.me && this.me.losses) || local.losses | 0;
    const place = this.me && this.me.place;
    const on = this.me ? this.me.on_board : games > 0;
    ui.you.hidden = false;
    const name = AuthSystem.displayName() || "—";
    let status = t("board.youOff");
    if (on && place) {
      status = place <= 100
        ? t("board.youPlace", { n: place })
        : t("board.youOut", { n: place });
    }
    const badgeId = displayBadgeId({ mmr, games });
    ui.you.innerHTML = `<span class="board-you-kicker">${status}</span>
      <span class="board-you-id">
        <img class="board-you-badge" alt="" src="${badgeSrc(badgeId)}" width="28" height="28" />
        <strong>${escapeHtml(name)}</strong>
      </span>
      <span>${rankLabel(mmr, games)}</span>
      <span>${mmr} · ${t("board.wl", { w: wins, l: losses })}</span>`;
  }
};

export function mountLeaderboard() {
  Leaderboard.mount();
}
