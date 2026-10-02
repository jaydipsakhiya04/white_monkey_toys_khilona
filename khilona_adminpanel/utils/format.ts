const TZ = 'Asia/Kolkata';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const num = new Intl.NumberFormat('en-IN');

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return inr.format(value);
}

export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value >= 100000 ? inrCompact.format(value) : inr.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return num.format(value);
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: TZ,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const timeFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });
const shortDayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const weekdayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short' });
const ymdFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return dateFmt.format(toDate(value));
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return dateTimeFmt.format(toDate(value));
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return timeFmt.format(toDate(value));
}

function calendarDate(isoDate: string): Date {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y || 1970, (m || 1) - 1, d || 1, 12));
}

/** "2026-10-02" (calendar date, no time) → "2 Oct" */
export function formatDayLabel(isoDate: string): string {
  return shortDayFmt.format(calendarDate(isoDate));
}

export function formatWeekday(isoDate: string): string {
  return weekdayFmt.format(calendarDate(isoDate));
}

/** Today's date in the store timezone as YYYY-MM-DD. */
export function todayInStoreTz(): string {
  return ymdFmt.format(new Date());
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = toDate(value);
  const diff = Date.now() - date.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr${hr === 1 ? '' : 's'} ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
  return formatDate(date);
}

export function discountPercent(price: number, salePrice: number | null | undefined): number {
  if (!salePrice || !price || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

/** Format an Indian mobile number for display. */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return phone;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
