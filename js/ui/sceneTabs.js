import { makeButton } from "./Ui.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";

export function paintTabs(scene, y, items, activeId, padLeft) {
  const n = items.length;
  if (!n) return;
  const gap = 10;
  const inset = padLeft | 0;
  const w = Math.min(210, Math.max(100, Math.floor((scene.scale.width - 48 - inset) / n) - gap));
  const total = n * w + (n - 1) * gap;
  const x0 = inset + (scene.scale.width - inset) / 2 - total / 2 + w / 2;
  items.forEach((it, i) => {
    const on = it.id === activeId;
    makeButton(scene, x0 + i * (w + gap), y, w, 36, it.label, () => {
      if (on && !it.again) return;
      AudioSystem.ui();
      it.go();
    }, on ? (it.color || 0xffb14a) : 0xc8bdd8);
  });
}

export function paintFighterTabs(scene, active) {
  paintTabs(scene, 36, [
    { id: "dress", label: t("fighter.tabDress"), color: 0xff8ab8, go: () => scene.scene.start("dress") },
    { id: "growth", label: t("fighter.tabGrowth"), color: 0x7d5cff, go: () => scene.scene.start("growth") },
    { id: "bag", label: t("fighter.tabBag"), color: 0xffb14a, go: () => scene.scene.start("bag") }
  ], active);
}

export function paintSettingsTabs(scene, active) {
  const from = scene.backTo || "hub";
  paintTabs(scene, 36, [
    { id: "general", label: t("settings.tabGeneral"), color: 0xff8a3a, go: () => scene.scene.start("settings", { from, tab: "general" }) },
    { id: "video", label: t("settings.tabVideo"), color: 0x7d5cff, go: () => scene.scene.start("settings", { from, tab: "video" }) },
    { id: "audio", label: t("settings.tabAudio"), color: 0x3ad6ff, go: () => scene.scene.start("settings", { from, tab: "audio" }) },
    { id: "controls", label: t("settings.tabControls"), color: 0xffe08a, go: () => scene.scene.start("settings", { from, tab: "controls" }) }
  ], active);
}

export function paintRankTabs(scene, active) {
  const from = scene.from || "hub";
  paintTabs(scene, 36, [
    { id: "pvp", label: t("rank.tabPvp"), color: 0x7d5cff, go: () => scene.scene.start("rankinfo", { from, tab: "pvp" }) },
    { id: "special", label: t("rank.tabSpecial"), color: 0xffd24a, go: () => scene.scene.start("rankinfo", { from, tab: "special" }) },
    { id: "rules", label: t("rank.tabRules"), color: 0xff8a3a, go: () => scene.scene.start("rankinfo", { from, tab: "rules" }) }
  ], active);
}
