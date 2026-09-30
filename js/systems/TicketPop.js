import { AuthSystem } from "./AuthSystem.js";
import { I18n, t } from "../i18n/I18n.js";
import {
  TICKET_CATS,
  TICKET_MAX_SHOTS,
  TICKET_MAX_BYTES,
  ticketCatLabel
} from "../data/tickets.js";

function lang() {
  return I18n.lang === "en" ? "en" : "th";
}

function shotUrl(path) {
  const base = (AuthSystem.backendUrl && AuthSystem.backendUrl()) || "";
  if (!path) return "";
  return base.replace(/\/$/, "") + "/storage/v1/object/public/ticket-shots/" + path;
}

export const TicketPop = {
  open: false,
  root: null,
  files: [],

  mount() {
    if (this.root) return this;
    const root = document.createElement("div");
    root.id = "ticket-overlay";
    root.hidden = true;
    root.innerHTML =
      '<div class="ticket-shell" role="dialog" aria-modal="true">' +
        '<div class="ticket-head">' +
          '<p class="ticket-kicker" id="ticket-kicker"></p>' +
          '<h2 id="ticket-title"></h2>' +
          '<button type="button" class="welcome-close" id="ticket-close"></button>' +
        "</div>" +
        '<div class="ticket-grid">' +
          '<form id="ticket-form" class="ticket-form">' +
            '<label><span id="ticket-name-lab"></span><input id="ticket-name" readonly /></label>' +
            '<label><span id="ticket-mail-lab"></span><input id="ticket-email" readonly /></label>' +
            '<label><span id="ticket-cat-lab"></span><select id="ticket-cat"></select></label>' +
            '<label><span id="ticket-body-lab"></span><textarea id="ticket-body" maxlength="4000" rows="6"></textarea></label>' +
            '<label><span id="ticket-shot-lab"></span><input id="ticket-shots" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>' +
            '<p class="ticket-hint" id="ticket-hint"></p>' +
            '<p class="ticket-msg" id="ticket-msg"></p>' +
            '<button type="submit" id="ticket-send"></button>' +
          "</form>" +
          '<div class="ticket-list" id="ticket-list"></div>' +
        "</div>" +
      "</div>";
    const host = document.getElementById("wrap") || document.body;
    host.appendChild(root);
    this.root = root;
    document.getElementById("ticket-close").addEventListener("click", () => this.hide());
    root.addEventListener("click", (ev) => {
      if (ev.target === root) this.hide();
    });
    document.getElementById("ticket-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.submit().catch((err) => this.setMsg(err.message || String(err), true));
    });
    window.addEventListener("ev-lang", () => {
      if (this.open) this.paint();
    });
    return this;
  },

  setMsg(text, bad) {
    const el = document.getElementById("ticket-msg");
    if (!el) return;
    el.textContent = text || "";
    el.className = "ticket-msg" + (bad ? " bad" : "");
  },

  show() {
    this.mount();
    this.open = true;
    this.root.hidden = false;
    this.paint();
    this.refresh().catch(() => {});
  },

  hide() {
    if (!this.root) return;
    this.open = false;
    this.root.hidden = true;
  },

  paint() {
    if (!this.root) return;
    const L = lang();
    document.getElementById("ticket-kicker").textContent = t("ticket.kicker");
    document.getElementById("ticket-title").textContent = t("ticket.title");
    document.getElementById("ticket-close").textContent = t("hub.welcomeClose");
    document.getElementById("ticket-name-lab").textContent = t("ticket.name");
    document.getElementById("ticket-mail-lab").textContent = t("ticket.email");
    document.getElementById("ticket-cat-lab").textContent = t("ticket.cat");
    document.getElementById("ticket-body-lab").textContent = t("ticket.body");
    document.getElementById("ticket-shot-lab").textContent = t("ticket.shots");
    document.getElementById("ticket-hint").textContent = t("ticket.hint");
    document.getElementById("ticket-send").textContent = t("ticket.send");
    const sel = document.getElementById("ticket-cat");
    const keep = sel.value;
    sel.innerHTML = TICKET_CATS.map((c) =>
      "<option value=\"" + c.id + "\">" + (L === "en" ? c.en : c.th) + "</option>"
    ).join("");
    if (keep) sel.value = keep;
    const prof = AuthSystem.profile && AuthSystem.profile();
    const sess = AuthSystem.session && AuthSystem.session();
    document.getElementById("ticket-name").value = (prof && prof.display_name) || AuthSystem.displayName() || "";
    document.getElementById("ticket-email").value = (sess && sess.email) || (prof && prof.email) || "";
  },

  async refresh() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    const box = document.getElementById("ticket-list");
    if (!sb || !box) return;
    const { data, error } = await sb.from("tickets")
      .select("id, category, body, status, created_at, ticket_messages(*), ticket_files(*)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      box.innerHTML = "<p class=\"ticket-empty\">" + t("ticket.needSql") + "</p>";
      return;
    }
    const rows = data || [];
    if (!rows.length) {
      box.innerHTML = "<p class=\"ticket-empty\">" + t("ticket.empty") + "</p>";
      return;
    }
    const L = lang();
    box.innerHTML = rows.map((row) => {
      const msgs = (row.ticket_messages || []).slice().sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      const files = row.ticket_files || [];
      const shots = files.map((f) =>
        "<a href=\"" + shotUrl(f.path) + "\" target=\"_blank\" rel=\"noopener\">img</a>"
      ).join(" ");
      const thread = msgs.map((m) =>
        "<p class=\"ticket-line " + (m.from_admin ? "staff" : "me") + "\">" +
          "<b>" + (m.from_admin ? t("ticket.staff") : t("ticket.you")) + "</b> " +
          escapeHtml(m.body) +
        "</p>"
      ).join("");
      return "<article class=\"ticket-card st-" + row.status + "\">" +
        "<header><span>" + escapeHtml(ticketCatLabel(row.category, L)) + "</span><em>" + row.status + "</em></header>" +
        thread +
        (shots ? "<p class=\"ticket-shots\">" + shots + "</p>" : "") +
        (row.status === "success" ? "" :
          "<form data-reply=\"" + row.id + "\"><input maxlength=\"4000\" placeholder=\"" + t("ticket.replyPh") + "\" /><button type=\"submit\">" + t("ticket.reply") + "</button></form>") +
      "</article>";
    }).join("");
    box.querySelectorAll("form[data-reply]").forEach((form) => {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const id = form.getAttribute("data-reply");
        const input = form.querySelector("input");
        this.reply(id, input && input.value).catch((err) => this.setMsg(err.message || String(err), true));
      });
    });
  },

  async reply(id, text) {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) throw new Error(t("web.authNoBackend"));
    const { data, error } = await sb.rpc("ticket_reply", { p_ticket: id, p_body: String(text || "") });
    if (error) throw new Error(error.message);
    if (data && data.ok === false) throw new Error(t("ticket.fail"));
    this.setMsg(t("ticket.sent"), false);
    await this.refresh();
  },

  async submit() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    const sess = AuthSystem.session && AuthSystem.session();
    if (!sb || !sess || !sess.id) throw new Error(t("web.authNoBackend"));
    const cat = document.getElementById("ticket-cat").value;
    const body = document.getElementById("ticket-body").value;
    const input = document.getElementById("ticket-shots");
    const files = Array.from((input && input.files) || []).slice(0, TICKET_MAX_SHOTS);
    if (files.some((f) => f.size > TICKET_MAX_BYTES)) throw new Error(t("ticket.tooBig"));
    this.setMsg(t("ticket.sending"), false);
    const { data, error } = await sb.rpc("ticket_create", { p_category: cat, p_body: body });
    if (error) throw new Error(error.message);
    if (!data || !data.ok) {
      const why = data && data.reason;
      if (why === "body") throw new Error(t("ticket.failBody"));
      if (why === "auth") throw new Error(t("web.authNoBackend"));
      throw new Error(t("ticket.fail"));
    }
    const tid = data.id;
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = sess.id + "/" + tid + "/" + i + "." + ext;
      const up = await sb.storage.from("ticket-shots").upload(path, file, { upsert: false, contentType: file.type });
      if (up.error) throw new Error(up.error.message);
      const att = await sb.rpc("ticket_attach", { p_ticket: tid, p_path: path, p_bytes: file.size | 0 });
      if (att.error) throw new Error(att.error.message);
    }
    document.getElementById("ticket-body").value = "";
    if (input) input.value = "";
    this.setMsg(t("ticket.sent"), false);
    await this.refresh();
  }
};

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[ch]));
}

window.TicketPop = TicketPop;
