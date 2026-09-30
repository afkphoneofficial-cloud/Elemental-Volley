export const HUB_NAV = {
  y: 48,
  w: 142,
  h: 42,
  gap: 12,
  n: 5
};

export const HUB_BAR_TOP = 24;
export const HUB_MENU = { x: 56, w: 72, h: 70 };
export const HUB_PASS_H = 75;

export function hubMenuY() {
  return HUB_BAR_TOP + HUB_MENU.h / 2;
}

export function hubNavX(i, width) {
  const total = HUB_NAV.n * HUB_NAV.w + (HUB_NAV.n - 1) * HUB_NAV.gap;
  return width / 2 - total / 2 + HUB_NAV.w / 2 + i * (HUB_NAV.w + HUB_NAV.gap);
}
