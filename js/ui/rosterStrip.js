export const ROSTER_STRIP = {
  visible: 4,
  gap: 300,
  startX: 190,
  y: 262
};

export function rosterPageCount(n, vis = ROSTER_STRIP.visible) {
  return Math.max(1, Math.ceil((n || 0) / vis));
}

export function rosterPageOf(index, vis = ROSTER_STRIP.visible) {
  return Math.max(0, Math.floor((index | 0) / vis));
}

export function rosterShiftX(page, n, vis = ROSTER_STRIP.visible, gap = ROSTER_STRIP.gap) {
  const start = page * vis;
  const count = Math.min(vis, Math.max(0, (n || 0) - start));
  const pad = (vis - count) * gap / 2;
  return -start * gap + pad;
}

export function rosterSlotX(index, gap = ROSTER_STRIP.gap, startX = ROSTER_STRIP.startX) {
  return startX + index * gap;
}
