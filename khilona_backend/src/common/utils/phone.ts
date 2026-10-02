/**
 * Normalises an Indian mobile number to its 10 digit form.
 * Accepts "+91 98765 43210", "091-98765-43210", "09876543210", "9876543210".
 * Returns null when the number is not a valid Indian mobile number.
 */
export function normalizeIndianMobile(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = String(input).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 13 && digits.startsWith('091')) digits = digits.slice(3);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** Converts a stored phone / WhatsApp value to international digits (default country 91). */
export function toInternationalDigits(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

export function telUrl(phone: string | null | undefined): string | null {
  const intl = toInternationalDigits(phone);
  return intl ? `tel:+${intl}` : null;
}

export function whatsappUrl(phone: string | null | undefined, text?: string): string | null {
  const intl = toInternationalDigits(phone);
  if (!intl) return null;
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
