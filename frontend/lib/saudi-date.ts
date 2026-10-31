/** Return a calendar date in Saudi Arabia for service booking. */
export function getSaudiDate(offsetDays = 0): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = (kind: string) => Number(parts.find(part => part.type === kind)?.value);
  return new Date(Date.UTC(value("year"), value("month") - 1, value("day") + offsetDays)).toISOString().slice(0, 10);
}
