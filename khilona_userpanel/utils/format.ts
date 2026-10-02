const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrFraction = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,299 — or ₹1,299.50 when the amount is not whole. */
export function formatPrice(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return inrWhole.format(0);
  return Number.isInteger(n) ? inrWhole.format(n) : inrFraction.format(n);
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** "10:00" / "21:30" (24h) → "10:00 AM" / "9:30 PM" */
export function formatTime24(t: string | null | undefined): string | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${suffix}`;
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Strip markup and collapse whitespace; used for meta descriptions. */
export function toPlainText(s: string | null | undefined, max = 160): string {
  if (!s) return "";
  const plain = s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
}
