/** Bangkok calendar for the Oct 2026 test wave. */
export const BETA = {
  testStart: "2026-10-01",
  testEnd: "2026-10-07",
  restStart: "2026-10-08",
  restEnd: "2026-10-09",
  live: "2026-10-10",
  giftId: "beta-gift-2026",
  powder: 80,
  coins: 200,
  fruit: 1,
  titleId: "beta-tester",
  wipeId: "live-2026-10-10",
  shopTryPowder: 2000
};

export function onBetaDay(key, start, end) {
  return key >= start && key <= end;
}

export function liveWipeDue(key, wipeId) {
  return key >= BETA.live && wipeId !== BETA.wipeId;
}
