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
export const HUB_PASS_W = 248;
export const HUB_DAILY_W = 114;
export const HUB_CLOCK_W = 200;
export const HUB_CHAT = { w: 72, h: 72, gap: 12 };
export const HUB_ONLINE_W = 208;
export const HUB_CHIP_PAD = 28;
export const HUB_CHIPS = { pvp: 108, tok: 96, ether: 108, coin: 108, gap: 12 };

export function hubMenuY() {
  return HUB_BAR_TOP + HUB_MENU.h / 2;
}

export function hubClockLeft(width) {
  return width / 2 - HUB_CLOCK_W / 2;
}

export function hubCoinLeft(width) {
  const c = HUB_CHIPS;
  return width - HUB_CHIP_PAD - c.pvp - c.gap - c.tok - c.gap - c.ether - c.gap - c.coin;
}

export function hubTopGap(width) {
  return hubCoinLeft(width) - (width / 2 + HUB_CLOCK_W / 2);
}

export function hubPassX(width) {
  return hubClockLeft(width) - hubTopGap(width) - HUB_PASS_W / 2;
}

export function hubDailyLayout(width) {
  const menuRight = HUB_MENU.x + HUB_MENU.w / 2;
  const passLeft = hubPassX(width) - HUB_PASS_W / 2;
  const w = HUB_DAILY_W;
  const gap = (passLeft - menuRight - w) / 2;
  return { x: menuRight + gap + w / 2, w, gap };
}

export function hubNavX(i, width) {
  const total = HUB_NAV.n * HUB_NAV.w + (HUB_NAV.n - 1) * HUB_NAV.gap;
  return width / 2 - total / 2 + HUB_NAV.w / 2 + i * (HUB_NAV.w + HUB_NAV.gap);
}
