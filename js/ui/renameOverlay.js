import { AuthSystem } from "../systems/AuthSystem.js";
import { t } from "../i18n/I18n.js";

let done = null;
let bound = false;
let busy = false;

function els() {
  return {
    root: document.getElementById("rename-overlay"),
    msg: document.getElementById("rename-msg"),
    input: document.getElementById("rename-input"),
    ok: document.getElementById("rename-ok"),
    cancel: document.getElementById("rename-cancel")
  };
}

function tap(el, fn) {
  if (!el) return;
  let last = 0;
  const go = (ev) => {
    const now = Date.now();
    if (now - last < 400) return;
    last = now;
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    fn();
  };
  el.addEventListener("pointerup", go);
  el.addEventListener("click", go);
}

export function hideRename() {
  const ui = els();
  done = null;
  busy = false;
  if (ui.ok) ui.ok.disabled = false;
  if (ui.root) ui.root.hidden = true;
}

function cancel() {
  if (busy) return;
  const fn = done;
  hideRename();
  if (fn) fn(false);
}

function save() {
  if (busy) return;
  const ui = els();
  busy = true;
  if (ui.ok) ui.ok.disabled = true;
  if (ui.msg) ui.msg.textContent = t("web.authSaving");
  AuthSystem.changeName(ui.input && ui.input.value).then((name) => {
    const fn = done;
    hideRename();
    if (fn) fn(true, name);
  }).catch((err) => {
    busy = false;
    if (ui.ok) ui.ok.disabled = false;
    if (ui.msg) ui.msg.textContent = err.message || t("web.authFail");
  });
}

export function mountRename() {
  if (bound) return;
  bound = true;
  const ui = els();
  if (!ui.root) return;
  tap(ui.ok, save);
  tap(ui.cancel, cancel);
  ui.root.addEventListener("click", (ev) => {
    if (ev.target === ui.root) cancel();
  });
  if (ui.input) {
    ui.input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") save();
    });
  }
}

export function openRename(onDone) {
  mountRename();
  const ui = els();
  if (!ui.root) return;
  done = onDone;
  busy = false;
  ui.root.hidden = false;
  if (ui.ok) ui.ok.disabled = false;
  if (ui.msg) ui.msg.textContent = t("career.renameHint");
  if (ui.input) {
    ui.input.value = AuthSystem.displayName() || "";
    ui.input.placeholder = t("web.authName");
    window.setTimeout(() => {
      try {
        ui.input.focus();
        ui.input.select();
      } catch (e) {}
    }, 40);
  }
  if (ui.ok) ui.ok.textContent = t("career.renameOk");
  if (ui.cancel) ui.cancel.textContent = t("career.close");
}
