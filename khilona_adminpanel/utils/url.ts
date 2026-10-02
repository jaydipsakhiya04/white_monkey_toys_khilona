/** Only allow same-origin relative redirects (prevents open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (next.startsWith('/login')) return fallback;
  return next;
}

export function whatsappLink(phone: string, text?: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `tel:+91${digits}`;
  return `tel:+${digits}`;
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
