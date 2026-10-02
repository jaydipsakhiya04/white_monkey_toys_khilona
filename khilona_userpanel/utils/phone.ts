/**
 * Indian mobile helpers. Mirrors backend rules: accepts "+91 98765 43210",
 * "09876543210", "9876543210" and normalises to 10 digits starting with 6-9.
 */
export function normalizeIndianMobile(input: string): string {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function isValidIndianMobile(input: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(input));
}

/** "919876543210" → "https://wa.me/919876543210?text=..." */
export function whatsappLink(numberOrUrl: string, text?: string): string {
  const base = numberOrUrl.startsWith("http")
    ? numberOrUrl.split("?")[0]
    : `https://wa.me/${numberOrUrl.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telLink(phone: string): string {
  if (phone.startsWith("tel:")) return phone;
  const d = phone.replace(/[^\d+]/g, "");
  return `tel:${d}`;
}
