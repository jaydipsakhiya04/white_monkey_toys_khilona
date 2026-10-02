/** Timezone helpers built on Intl (no external dependency). */

function partsInZone(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "YYYYMMDD" for the given instant in the timezone. */
export function compactDateInZone(date: Date, timeZone: string): string {
  return isoDateInZone(date, timeZone).replace(/-/g, '');
}

/** "YYYY-MM-DD" for the given instant in the timezone. */
export function isoDateInZone(date: Date, timeZone: string): string {
  const p = partsInZone(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Minutes since local midnight in the timezone. */
export function minutesOfDayInZone(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone);
  return p.hour * 60 + p.minute;
}

/** UTC instant corresponding to 00:00 of `isoDate` (YYYY-MM-DD) in the timezone. */
export function startOfDayInZone(isoDate: string, timeZone: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d));
  const offset = zoneOffsetMs(guess, timeZone);
  const result = new Date(guess.getTime() - offset);
  // Correct for DST transitions around the guess.
  const offset2 = zoneOffsetMs(result, timeZone);
  return offset2 === offset ? result : new Date(guess.getTime() - offset2);
}

/** Adds whole days to an ISO date string (YYYY-MM-DD). */
export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "HH:mm" -> minutes since midnight. */
export function hhmmToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
