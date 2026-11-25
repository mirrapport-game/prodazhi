// Moscow time helpers (UTC+3, no DST) — browser-safe.
export function mskDate(offsetDays = 0) {
  const d = new Date(Date.now() + 3 * 3600_000);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
export function fmtMskDateTime(iso: string) {
  const d = new Date(new Date(iso).getTime() + 3 * 3600_000);
  return `${d.toISOString().slice(8, 10)}.${d.toISOString().slice(5, 7)} ${d.toISOString().slice(11, 16)}`;
}
export function fmtDay(date: string) {
  if (date === mskDate(0)) return "Сегодня";
  if (date === mskDate(1)) return "Завтра";
  const d = new Date(date + "T00:00:00Z");
  return d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });
}
