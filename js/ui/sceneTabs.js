import { makeButton } from "./Ui.js";
import { AudioSystem } from "../systems/AudioSystem.js";
import { t } from "../i18n/I18n.js";

export function paintTabs(scene, y, items, activeId) {
  const n = items.length;
  if (!n) return;
  const gap = 10;
  const w = Math.min(168, Math.max(108, Math.floor((scene.scale.width - 280) / n) - gap));
  const total = n * w + (n - 1) * gap;
  const x0 = scene.scale.width / 2 - total / 2 + w / 2;
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

export function paintRankTabs(scene, active) {
  paintTabs(scene, 36, [
    { id: "board", label: t("rank.tabBoard"), color: 0xffb14a, again: true, go: () => scene.openBoard() },
    { id: "rules", label: t("rank.tabRules"), color: 0x7d5cff, go: () => scene.scene.start("rankinfo", { from: scene.from || "hub" }) }
  ], active);
}
