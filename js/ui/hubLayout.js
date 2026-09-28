export const HUB_NAV = {
  y: 48,
  w: 164,
  h: 42,
  gap: 16,
  n: 4
};

export function hubNavX(i, width) {
  const total = HUB_NAV.n * HUB_NAV.w + (HUB_NAV.n - 1) * HUB_NAV.gap;
  return width / 2 - total / 2 + HUB_NAV.w / 2 + i * (HUB_NAV.w + HUB_NAV.gap);
}
