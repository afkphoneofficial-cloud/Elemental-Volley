import { AuthSystem } from "./AuthSystem.js";
import { SaveSystem } from "./SaveSystem.js";
import { I18n } from "../i18n/I18n.js";
import { BETA } from "../data/beta.js";

export const MAIL_KINDS = ["friend_invite", "friend_accept", "news", "server", "dev", "season", "ticket"];

function localMails() {
  return (SaveSystem.data.seasonInbox || []).map((row) => ({
    ...row,
    id: String(row.id || "").startsWith("local:") ? row.id : "local:" + row.id,
    kind: "season",
    unread: row.unread !== false && !row.claimed,
    claimed: Boolean(row.claimed)
  }));
}

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
    SaveSystem.settleSeasonMails();
    SaveSystem.purgeReadMail();
    const local = localMails();
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) {
      this.items = local;
      this.unread = this.items.filter((m) => m.unread).length;
      return { ok: false, reason: "cloud" };
    }
    await sb.rpc("purge_read_mail");
    let { data, error } = await sb.from("mail")
      .select("id, kind, title_th, title_en, body_th, body_en, payload, unread, read_at, created_at")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) {
      const retry = await sb.from("mail")
        .select("id, kind, title_th, title_en, body_th, body_en, payload, unread, created_at")
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(40);
      data = retry.data;
      error = retry.error;
    }
    if (error) {
      this.items = local;
      this.unread = this.items.filter((m) => m.unread).length;
      return { ok: false, reason: "cloud", detail: error.message };
    }
    this.items = local.concat(data || []);
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
    if (String(id).startsWith("local:")) {
      const raw = String(id).replace(/^local:/, "");
      if (raw === BETA.giftId && AuthSystem.claimBetaRestGift) {
        const r = await AuthSystem.claimBetaRestGift();
        if (r && r.ok) {
          if (!r.already && SaveSystem.data) {
            if (!SaveSystem.data.currencies) SaveSystem.data.currencies = {};
            SaveSystem.data.currencies.premium = r.premium | 0;
            SaveSystem.data.currencies.coins = r.coins | 0;
            if (!SaveSystem.data.inventory) SaveSystem.data.inventory = {};
            SaveSystem.data.inventory.bodyfruit = (SaveSystem.data.inventory.bodyfruit | 0) + 1;
            if (!SaveSystem.data.beta || typeof SaveSystem.data.beta !== "object") SaveSystem.data.beta = {};
            SaveSystem.data.beta.giftTaken = true;
          }
          const res = SaveSystem.claimSeasonMail(id, { skipPayload: true });
          await this.refresh();
          return res;
        }
      }
      const res = SaveSystem.claimSeasonMail(id);
      await this.refresh();
      return res;
    }
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const { data, error } = await sb.rpc("archive_mail", { p_mail_id: id });
    if (error) return { ok: false, reason: "cloud", detail: error.message };
    await this.refresh();
    return data || { ok: true };
  },

  async remove(id) {
    if (String(id).startsWith("local:")) {
      const res = SaveSystem.removeSeasonMail(id);
      await this.refresh();
      return res;
    }
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const { data, error } = await sb.rpc("delete_mail", { p_mail_id: id });
    if (error) return { ok: false, reason: "cloud", detail: error.message };
    await this.refresh();
    return data || { ok: true };
  }
};
