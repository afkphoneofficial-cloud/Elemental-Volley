import { AuthSystem } from "./AuthSystem.js";
import { t } from "../i18n/I18n.js?v=local247";

function els() {
  return {
    root: document.getElementById("referral-overlay"),
    msg: document.getElementById("referral-msg"),
    input: document.getElementById("referral-input"),
    ok: document.getElementById("referral-ok"),
    cancel: document.getElementById("referral-cancel")
  };
}

export const Referral = {
  code: "",
  invites: 0,

  async mine() {
    if (AuthSystem.isGuest() || !AuthSystem.isLoggedIn()) {
      return { ok: false, reason: "guest" };
    }
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const { data, error } = await sb.rpc("ensure_my_referral_code");
    if (error) return { ok: false, reason: "sql", detail: error.message };
    const row = data && typeof data === "object" ? data : {};
    if (row.ok && row.code) {
      this.code = String(row.code);
      this.invites = row.invites | 0;
    }
    return row.ok ? row : { ok: false, reason: row.reason || "cloud" };
  },

  async redeem(raw) {
    if (AuthSystem.isGuest() || !AuthSystem.isLoggedIn()) {
      return { ok: false, reason: "guest" };
    }
    const sb = AuthSystem.db ? await AuthSystem.db() : null;
    if (!sb) return { ok: false, reason: "cloud" };
    const { data, error } = await sb.rpc("redeem_referral", { p_code: String(raw || "") });
    if (error) return { ok: false, reason: "sql", detail: error.message };
    const row = data && typeof data === "object" ? data : {};
    if (row.ok) {
      try { await sb.rpc("flush_referral_pending"); } catch (e) {}
      await AuthSystem.pullSave();
    }
    return row.ok ? row : { ok: false, reason: row.reason || "cloud" };
  },

  reasonText(reason) {
    const key = "refer." + (reason || "cloud");
    const msg = t(key);
    return msg === key ? t("refer.cloud") : msg;
  },

  openRedeem() {
    const ui = els();
    if (!ui.root) return;
    ui.root.hidden = false;
    if (ui.msg) ui.msg.textContent = t("refer.hint");
    if (ui.input) {
      ui.input.value = "";
      ui.input.placeholder = t("refer.placeholder");
      ui.input.focus();
      if (!ui.input.dataset.bound) {
        ui.input.dataset.bound = "1";
        ui.input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") ui.ok && ui.ok.click();
        });
      }
    }
    if (ui.ok) ui.ok.textContent = t("refer.ok");
    if (ui.cancel) ui.cancel.textContent = t("career.close");
    ui.cancel.onclick = () => { ui.root.hidden = true; };
    ui.ok.onclick = async () => {
      const res = await this.redeem(ui.input && ui.input.value);
      if (res.ok) {
        if (ui.msg) ui.msg.textContent = t("refer.okDone");
        setTimeout(() => { if (ui.root) ui.root.hidden = true; }, 900);
        return;
      }
      if (ui.msg) ui.msg.textContent = this.reasonText(res.reason);
    };
  }
};
