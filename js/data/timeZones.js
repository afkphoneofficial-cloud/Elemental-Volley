export const SERVER_TZ = "Asia/Bangkok";

export const TIME_ZONES = [
  { id: "Bangkok", tz: "Asia/Bangkok" },
  { id: "Jakarta", tz: "Asia/Jakarta" },
  { id: "Saigon", tz: "Asia/Ho_Chi_Minh" },
  { id: "Singapore", tz: "Asia/Singapore" },
  { id: "KL", tz: "Asia/Kuala_Lumpur" },
  { id: "Manila", tz: "Asia/Manila" }
];

export function timeZoneOf(id) {
  return TIME_ZONES.find((row) => row.id === id) || TIME_ZONES[0];
}

export function formatZoneClock(tz, lang) {
  const locale = lang === "en" ? "en-GB" : "th-TH";
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
  } catch (e) {
    return "";
  }
}
