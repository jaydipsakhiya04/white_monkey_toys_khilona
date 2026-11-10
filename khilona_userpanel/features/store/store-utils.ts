import type { PublicStore } from "@/types/api";
import { formatTime24 } from "@/utils/format";
import { telLink, whatsappLink } from "@/utils/phone";

export const HERO_FALLBACK = {
  title: "Wholesale Toys. Delivered Across India.",
  subtitle: "RC cars, construction RC, drones and action figures for toy shops, retailers and wholesalers. Ask for our price list on WhatsApp.",
  cta: "Browse catalogue",
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

export type StoreContactNumber = { display: string; telUrl: string; whatsappUrl: string };

/** Both store mobiles; each works for calls and WhatsApp. */
export function storeContactNumbers(store: PublicStore | null): StoreContactNumber[] {
  if (!store) return [];
  const out: StoreContactNumber[] = [];
  const add = (raw: string | null | undefined, tel?: string | null, wa?: string | null) => {
    if (!raw) return;
    const digits = raw.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10 || out.some((n) => n.telUrl.endsWith(digits))) return;
    out.push({
      display: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
      telUrl: tel ?? telLink(`+91${digits}`),
      whatsappUrl: wa ?? whatsappLink(`91${digits}`),
    });
  };
  add(store.phone, store.phoneUrl, store.whatsappUrl ?? (store.whatsapp ? whatsappLink(store.whatsapp) : null));
  add(store.secondaryPhone, store.secondaryPhoneUrl, store.secondaryWhatsappUrl);
  return out;
}

export function storeMapUrl(store: PublicStore | null): string | null {
  if (!store) return null;
  if (store.googleMapLink) return store.googleMapLink;
  const q = [store.name, ...storeAddressLines(store)].filter(Boolean).join(", ");
  return store.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export const POLICY_TYPES = {
  shipping: { title: "Shipping Policy", field: "shippingPolicy" },
  privacy: { title: "Privacy Policy", field: "privacyPolicy" },
  terms: { title: "Terms & Conditions", field: "termsAndConditions" },
} as const satisfies Record<string, { title: string; field: keyof PublicStore }>;

export type PolicyType = keyof typeof POLICY_TYPES;
