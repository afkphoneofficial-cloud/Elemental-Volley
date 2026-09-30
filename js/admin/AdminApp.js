import { BACKEND } from "../config/backend.js";

const KEY = "ev-admin-token";
let sb = null;
let token = sessionStorage.getItem(KEY) || "";
let tab = "overview";
let players = [];
let tickets = [];
let pick = "";

async function client() {
  if (sb) return sb;
  const mod = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  sb = mod.createClient(BACKEND.supabaseUrl, BACKEND.supabaseAnonKey);
  return sb;
}

function $(id) {
  return document.getElementById(id);
}

function shot(path) {
  return BACKEND.supabaseUrl.replace(/\/$/, "") + "/storage/v1/object/public/ticket-shots/" + path;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;"
  }[ch]));
}

async function rpc(name, args) {
  const db = await client();
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(error.message);
  if (data && data.ok === false) throw new Error(data.reason || "fail");
  return data;
}

function showDesk(on) {
  $("admin-login").hidden = on;
  $("admin-desk").hidden = !on;
}

function setMsg(id, text, bad) {
  const el = $(id);
  if (!el) return;
  el.textContent = text || "";
  el.className = bad ? "bad" : "ok";
}

function paintTabs() {
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.classList.toggle("on", btn.getAttribute("data-tab") === tab);
  });
  document.querySelectorAll("[data-panel]").forEach((p) => {
    p.hidden = p.getAttribute("data-panel") !== tab;
  });
}

async function loadOverview() {
  const d = await rpc("admin_overview", { p_token: token });
  $("ov-grid").innerHTML = [
    ["ผู้เล่น", d.players],
    ["มีชื่อ", d.named],
    ["ออนไลน์ 1 ชม.", d.online1h],
    ["ผู้ทดสอบ", d.beta],
    ["แบน", d.banned],
    ["Ticket ค้าง", d.ticketsOpen],
    ["Ticket ทั้งหมด", d.ticketsAll],
    ["ใบเสร็จ", d.purchases],
    ["จดหมายยังไม่อ่าน", d.mailUnread]
  ].map((row) => "<article><p>" + esc(row[0]) + "</p><b>" + esc(row[1]) + "</b></article>").join("");
}

async function loadPlayers() {
  const q = $("pl-q").value;
  const d = await rpc("admin_players", { p_token: token, p_q: q, p_limit: 80 });
  players = d.rows || [];
  $("pl-table").innerHTML = "<tr><th>ชื่อ</th><th>เมล</th><th>MMR</th><th>ผง</th><th>เหรียญ</th><th>เบต้า</th><th>แบน</th></tr>" +
    players.map((p) =>
      "<tr data-id=\"" + p.id + "\" class=\"" + (pick === p.id ? "on" : "") + "\">" +
        "<td>" + esc(p.display_name) + "</td>" +
        "<td>" + esc(p.email) + "</td>" +
        "<td>" + esc(p.mmr) + "</td>" +
        "<td>" + esc(p.powder) + "</td>" +
        "<td>" + esc(p.coins) + "</td>" +
        "<td>" + (p.beta ? "yes" : "") + "</td>" +
        "<td>" + (p.banned ? "BAN" : "") + "</td>" +
      "</tr>"
    ).join("");
  $("pl-table").querySelectorAll("tr[data-id]").forEach((tr) => {
    tr.addEventListener("click", () => {
      pick = tr.getAttribute("data-id");
      const row = players.find((p) => p.id === pick);
      $("pl-pick").textContent = row ? ((row.display_name || "—") + "  " + row.email) : pick;
      loadPlayers().catch(() => {});
    });
  });
}

async function loadRank() {
  const d = await rpc("admin_rank", { p_token: token });
  $("rk-table").innerHTML = "<tr><th>ชื่อ</th><th>MMR</th><th>ชนะ</th><th>เกม</th></tr>" +
    (d.rows || []).map((p) =>
      "<tr><td>" + esc(p.display_name) + "</td><td>" + esc(p.mmr) + "</td><td>" + esc(p.rank_wins) + "</td><td>" + esc(p.rank_games) + "</td></tr>"
    ).join("");
}

async function loadBuys() {
  const d = await rpc("admin_purchases", { p_token: token });
  $("by-table").innerHTML = "<tr><th>เมื่อ</th><th>ชื่อ</th><th>SKU</th><th>บาท</th><th>ช่อง</th></tr>" +
    (d.rows || []).map((p) =>
      "<tr><td>" + esc(p.created_at) + "</td><td>" + esc(p.display_name) + "</td><td>" + esc(p.sku) + "</td><td>" + esc((p.amount_cents || 0) / 100) + "</td><td>" + esc(p.provider) + "</td></tr>"
    ).join("");
}

function paintTickets() {
  $("tk-list").innerHTML = tickets.map((row) => {
    const msgs = row.messages || [];
    const files = row.files || [];
    const shots = files.map((f) => "<a href=\"" + shot(f.path) + "\" target=\"_blank\" rel=\"noopener\">ภาพ</a>").join(" ");
    const thread = msgs.map((m) =>
      "<p class=\"" + (m.from_admin ? "staff" : "me") + "\"><b>" + (m.from_admin ? "แอดมิน" : esc(row.name)) + "</b> " + esc(m.body) + "</p>"
    ).join("");
    return "<article class=\"tk st-" + row.status + "\" data-id=\"" + row.id + "\">" +
      "<header><b>" + esc(row.category) + "</b> <span>" + esc(row.name) + "</span> <em>" + esc(row.status) + "</em></header>" +
      "<p class=\"meta\">" + esc(row.email) + "</p>" +
      thread +
      (shots ? "<p class=\"shots\">" + shots + "</p>" : "<p class=\"meta\">ไม่มีภาพ (หรือถูกลบแล้วหลัง success)</p>") +
      (row.status === "success" ? "" :
        "<textarea placeholder=\"ตอบผู้เล่น\"></textarea>" +
        "<div class=\"row\"><button data-reply>ตอบกลับ</button><button data-ok class=\"ghost\">ปิด success</button></div>") +
    "</article>";
  }).join("") || "<p>ยังไม่มี Ticket</p>";
  $("tk-list").querySelectorAll("article.tk").forEach((card) => {
    const id = card.getAttribute("data-id");
    const reply = card.querySelector("[data-reply]");
    const ok = card.querySelector("[data-ok]");
    if (reply) {
      reply.addEventListener("click", async () => {
        const body = card.querySelector("textarea").value;
        try {
          await rpc("admin_ticket_reply", { p_token: token, p_ticket: id, p_body: body });
          await loadTickets();
        } catch (e) { setMsg("tk-msg", e.message, true); }
      });
    }
    if (ok) {
      ok.addEventListener("click", async () => {
        try {
          await rpc("admin_ticket_success", { p_token: token, p_ticket: id });
          await loadTickets();
        } catch (e) { setMsg("tk-msg", e.message, true); }
      });
    }
  });
}

async function loadTickets() {
  const d = await rpc("admin_tickets", { p_token: token });
  tickets = d.rows || [];
  paintTickets();
}

async function refresh() {
  if (tab === "overview") await loadOverview();
  if (tab === "players") await loadPlayers();
  if (tab === "rank") await loadRank();
  if (tab === "buys") await loadBuys();
  if (tab === "tickets") await loadTickets();
}

export async function bootAdmin() {
  $("admin-login").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    try {
      const d = await rpc("admin_login", {
        p_login: $("ad-id").value,
        p_pass: $("ad-pass").value
      });
      token = d.token;
      sessionStorage.setItem(KEY, token);
      showDesk(true);
      await refresh();
    } catch (e) {
      setMsg("ad-msg", "เข้าไม่ได้ — ตรวจ ID/รหัส หรือรัน tickets_admin.sql", true);
    }
  });
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      tab = btn.getAttribute("data-tab");
      paintTabs();
      try { await refresh(); } catch (e) { setMsg("desk-msg", e.message, true); }
    });
  });
  $("pl-search").addEventListener("click", () => loadPlayers().catch((e) => setMsg("pl-msg", e.message, true)));
  $("pl-grant").addEventListener("click", async () => {
    if (!pick) return setMsg("pl-msg", "เลือกแถวก่อน", true);
    try {
      await rpc("admin_grant", {
        p_token: token,
        p_user: pick,
        p_powder: $("g-powder").value | 0,
        p_coins: $("g-coins").value | 0,
        p_shards: $("g-shards").value | 0,
        p_stones: $("g-stones").value | 0,
        p_fruit: $("g-fruit").value | 0
      });
      setMsg("pl-msg", "ให้ของแล้ว (ผู้เล่นต้องรีเฟรชถ้าออนไลน์อยู่)", false);
      await loadPlayers();
    } catch (e) { setMsg("pl-msg", e.message, true); }
  });
  $("pl-ban").addEventListener("click", async () => {
    if (!pick) return setMsg("pl-msg", "เลือกแถวก่อน", true);
    try {
      await rpc("admin_set_ban", { p_token: token, p_user: pick, p_ban: true, p_reason: $("g-reason").value || "ban" });
      await loadPlayers();
    } catch (e) { setMsg("pl-msg", e.message, true); }
  });
  $("pl-unban").addEventListener("click", async () => {
    if (!pick) return setMsg("pl-msg", "เลือกแถวก่อน", true);
    try {
      await rpc("admin_set_ban", { p_token: token, p_user: pick, p_ban: false, p_reason: "" });
      await loadPlayers();
    } catch (e) { setMsg("pl-msg", e.message, true); }
  });
  $("mail-send").addEventListener("click", async () => {
    try {
      const all = $("mail-all").checked;
      if (!all && !pick) return setMsg("mail-msg", "เลือกผู้เล่นในแท็บผู้เล่น หรือติ๊กส่งทุกไอดี", true);
      await rpc("admin_mail", {
        p_token: token,
        p_user: all ? "00000000-0000-0000-0000-000000000000" : pick,
        p_title_th: $("mail-th").value,
        p_title_en: $("mail-en").value || $("mail-th").value,
        p_body_th: $("mail-body-th").value,
        p_body_en: $("mail-body-en").value || $("mail-body-th").value,
        p_broadcast: all
      });
      setMsg("mail-msg", "ส่งจดหมายแล้ว", false);
    } catch (e) { setMsg("mail-msg", e.message, true); }
  });
  $("ad-out").addEventListener("click", () => {
    token = "";
    sessionStorage.removeItem(KEY);
    showDesk(false);
  });
  paintTabs();
  if (token) {
    try {
      showDesk(true);
      await refresh();
    } catch (e) {
      token = "";
      sessionStorage.removeItem(KEY);
      showDesk(false);
    }
  }
}
