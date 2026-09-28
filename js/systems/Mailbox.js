import { AuthSystem } from "./AuthSystem.js";
import { I18n } from "../i18n/I18n.js";

export const MAIL_KINDS = ["friend_invite", "friend_accept", "news", "server", "dev"];

export const Mailbox = {
  items: [],
  unread: 0,
  open: false,

  titleOf(row) {
    if (!row) return "";
    return I18n.lang === "en" ? (row.title_en || row.title_th) : (row.title_th || row.title_en);
  },

  bodyOf(row) {
    if (!row) return "";
    return I18n.lang === "en" ? (row.body_en || row.body_th) : (row.body_th || row.body_en);
  },

  async refresh() {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) {
      this.items = [];
      this.unread = 0;
      return { ok: false, reason: "cloud" };
    }
    const { data, error } = await sb.from("mail")
      .select("id, kind, title_th, title_en, body_th, body_en, payload, unread, created_at")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      this.items = [];
      this.unread = 0;
      return { ok: false, reason: "cloud", detail: error.message };
    }
    this.items = data || [];
    this.unread = this.items.filter((m) => m.unread).length;
    return { ok: true };
  },

  async respond(id, accept) {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const { data, error } = await sb.rpc("respond_friend_mail", {
      p_mail_id: id,
      p_accept: Boolean(accept)
    });
    if (error) return { ok: false, reason: "cloud", detail: error.message };
    const row = data && typeof data === "object" ? data : {};
    await this.refresh();
    return row.ok ? row : { ok: false, reason: row.reason || "cloud" };
  },

  async archive(id) {
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const { data, error } = await sb.rpc("archive_mail", { p_mail_id: id });
    if (error) return { ok: false, reason: "cloud", detail: error.message };
    await this.refresh();
    return data || { ok: true };
  }
};
