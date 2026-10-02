/** Parses "900", "15m", "1h", "7d" into seconds. Returns null when invalid. */
export function parseDurationToSeconds(input: string | number): number | null {
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? Math.floor(input) : null;
  const match = /^(\d+)\s*(s|m|h|d)?$/i.exec(input.trim());
  if (!match) return null;
  const value = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase() as 's' | 'm' | 'h' | 'd';
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
  return value > 0 ? value * factor : null;
}
