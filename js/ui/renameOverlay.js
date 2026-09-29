import { AuthSystem } from "../systems/AuthSystem.js";
import { t } from "../i18n/I18n.js";

let done = null;

function els() {
  return {
    root: document.getElementById("rename-overlay"),
    msg: document.getElementById("rename-msg"),
    input: document.getElementById("rename-input"),
    ok: document.getElementById("rename-ok"),
    cancel: document.getElementById("rename-cancel")
  };
}

export function hideRename() {
  const ui = els();
  done = null;
  if (ui.root) ui.root.hidden = true;
}

export function openRename(onDone) {
  const ui = els();
  if (!ui.root) return;
  done = onDone;
  ui.root.hidden = false;
  if (ui.msg) ui.msg.textContent = t("career.renameHint");
  if (ui.input) {
    ui.input.value = AuthSystem.displayName() || "";
    ui.input.placeholder = t("web.authName");
    ui.input.focus();
    ui.input.select();
  }
  if (ui.ok) ui.ok.textContent = t("career.renameOk");
  if (ui.cancel) ui.cancel.textContent = t("career.close");
  if (ui.cancel) ui.cancel.onclick = () => {
    const fn = done;
    hideRename();
    if (fn) fn(false);
  };
  if (ui.ok) ui.ok.onclick = () => {
    AuthSystem.changeName(ui.input && ui.input.value).then((name) => {
      const fn = done;
      hideRename();
      if (fn) fn(true, name);
    }).catch((err) => {
      if (ui.msg) ui.msg.textContent = err.message || t("web.authFail");
    });
  };
}
