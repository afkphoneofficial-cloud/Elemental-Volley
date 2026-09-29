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

export function formatZoneParts(tz, lang) {
  const locale = lang === "en" ? "en-GB" : "th-TH";
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23"
    }).formatToParts(new Date());
    const grab = (type) => {
      const row = parts.find((p) => p.type === type);
      return row ? row.value : "";
    };
    const weekday = grab("weekday").replace(".", "");
    const time = grab("hour").padStart(2, "0") + ":" + grab("minute").padStart(2, "0");
    return { weekday, time };
  } catch (e) {
    return { weekday: "", time: "" };
  }
}

export function formatZoneClock(tz, lang) {
  const parts = formatZoneParts(tz, lang);
  return (parts.weekday + "  " + parts.time).trim();
}
