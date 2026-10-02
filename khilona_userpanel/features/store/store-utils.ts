import type { PublicStore } from "@/types/api";
import { formatTime24 } from "@/utils/format";
import { telLink, whatsappLink } from "@/utils/phone";

export const HERO_FALLBACK = {
  title: "Find Something They’ll Love",
  subtitle: "Thoughtfully chosen toys, games and gifts — easy to order, delivered to your door, and paid for on delivery.",
  cta: "Shop toys",
};

export function storeHours(store: PublicStore | null): string | null {
  if (!store) return null;
  const open = formatTime24(store.openingTime);
  const close = formatTime24(store.closingTime);
  const time = open && close ? `${open} – ${close}` : null;
  if (store.workingDays && time) return `${store.workingDays}, ${time}`;
  return time ?? store.workingDays ?? null;
}

export function storeAddressLines(store: PublicStore | null): string[] {
  if (!store) return [];
  const lines: string[] = [];
  if (store.address) lines.push(store.address);
  const cityLine = [store.city, store.state].filter(Boolean).join(", ");
  const withPin = [cityLine, store.pincode].filter(Boolean).join(" – ");
  if (withPin) lines.push(withPin);
  return lines;
}

export function storeWhatsappUrl(store: PublicStore | null, text?: string): string | null {
  if (!store) return null;
  const base = store.whatsappUrl ?? (store.whatsapp ? whatsappLink(store.whatsapp) : null);
  if (!base) return null;
  return text ? whatsappLink(base, text) : base;
}

export function storePhoneUrl(store: PublicStore | null): string | null {
  if (!store) return null;
  return store.phoneUrl ?? (store.phone ? telLink(store.phone) : null);
}

export function storeMapUrl(store: PublicStore | null): string | null {
  if (!store) return null;
  if (store.googleMapLink) return store.googleMapLink;
  const q = [store.name, ...storeAddressLines(store)].filter(Boolean).join(", ");
  return store.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export const POLICY_TYPES = {
  shipping: { title: "Shipping Policy", field: "shippingPolicy" },
  returns: { title: "Returns & Refunds", field: "returnPolicy" },
  privacy: { title: "Privacy Policy", field: "privacyPolicy" },
  terms: { title: "Terms & Conditions", field: "termsAndConditions" },
} as const satisfies Record<string, { title: string; field: keyof PublicStore }>;

export type PolicyType = keyof typeof POLICY_TYPES;
