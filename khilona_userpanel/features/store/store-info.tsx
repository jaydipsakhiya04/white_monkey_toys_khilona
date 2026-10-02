import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { ButtonAnchor } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/brand";
import { absoluteUrl } from "@/lib/env";
import type { PublicStore } from "@/types/api";
import { cn } from "@/utils/cn";
import { OpenNowBadge } from "./open-badge";
import { storeAddressLines, storeHours, storeMapUrl, storePhoneUrl, storeWhatsappUrl } from "./store-utils";

/** Store details card: address, phone, WhatsApp, hours + open badge, map link. */
export function StoreInfoCard({ store, className, headingLevel = "h2" }: { store: PublicStore; className?: string; headingLevel?: "h1" | "h2" }) {
  const H = headingLevel;
  const address = storeAddressLines(store);
  const hours = storeHours(store);
  const phoneUrl = storePhoneUrl(store);
  const wa = storeWhatsappUrl(store, `Hi ${store.name}, I have a question.`);
  const map = storeMapUrl(store);

  return (
    <div className={cn("grid gap-6 rounded-3xl border border-line bg-surface p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10", className)}>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <H className="text-2xl font-bold text-ink sm:text-3xl">Visit {store.name}</H>
          <OpenNowBadge store={store} />
        </div>
        {!store.isOpen && store.closedMessage && (
          <p className="mt-3 rounded-xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger-700">{store.closedMessage}</p>
        )}
        {store.description && <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-muted">{store.description}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          {phoneUrl && (
            <ButtonAnchor href={phoneUrl} variant="dark">
              <Phone className="size-4" aria-hidden="true" />
              Call store
            </ButtonAnchor>
          )}
          {wa && (
            <ButtonAnchor href={wa} target="_blank" rel="noopener noreferrer" variant="whatsapp">
              <WhatsAppIcon className="size-4" />
              WhatsApp
            </ButtonAnchor>
          )}
          {map && (
            <ButtonAnchor href={map} target="_blank" rel="noopener noreferrer" variant="outline">
              <Navigation className="size-4" aria-hidden="true" />
              Directions
            </ButtonAnchor>
          )}
        </div>
      </div>
      <dl className="grid gap-4 self-start rounded-2xl bg-sand p-5 text-[0.9375rem] sm:p-6">
        {address.length > 0 && (
          <div className="flex gap-3">
            <dt>
              <MapPin className="mt-0.5 size-5 text-coral-600" aria-hidden="true" />
              <span className="sr-only">Address</span>
            </dt>
            <dd className="text-ink">
              {address.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </dd>
          </div>
        )}
        {store.phone && (
          <div className="flex gap-3">
            <dt>
              <Phone className="mt-0.5 size-5 text-coral-600" aria-hidden="true" />
              <span className="sr-only">Phone</span>
            </dt>
            <dd>
              <a href={phoneUrl ?? undefined} className="font-semibold text-ink hover:underline underline-offset-4">
                {store.phone}
              </a>
            </dd>
          </div>
        )}
        {store.whatsapp && (
          <div className="flex gap-3">
            <dt>
              <WhatsAppIcon className="mt-0.5 size-5 text-coral-600" />
              <span className="sr-only">WhatsApp</span>
            </dt>
            <dd>
              <a href={wa ?? undefined} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:underline underline-offset-4">
                +{store.whatsapp.replace(/\D/g, "")}
              </a>
            </dd>
          </div>
        )}
        {hours && (
          <div className="flex gap-3">
            <dt>
              <Clock className="mt-0.5 size-5 text-coral-600" aria-hidden="true" />
              <span className="sr-only">Opening hours</span>
            </dt>
            <dd className="text-ink">{hours}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/** schema.org ToyStore (LocalBusiness) */
export function storeJsonLd(store: PublicStore): Record<string, unknown> {
  const sameAs = [store.instagram, store.facebook, store.youtube, store.website].filter(Boolean);
  const days = parseDays(store.workingDays);
  return {
    "@context": "https://schema.org",
    "@type": "ToyStore",
    "@id": absoluteUrl("/#store"),
    name: store.name,
    url: absoluteUrl("/"),
    ...(store.description ? { description: store.description } : {}),
    ...(store.logoUrl ? { logo: store.logoUrl } : {}),
    ...(store.coverImageUrl || store.logoUrl ? { image: store.coverImageUrl ?? store.logoUrl } : {}),
    ...(store.phone ? { telephone: store.phone } : {}),
    ...(store.email ? { email: store.email } : {}),
    ...(store.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: store.address,
            ...(store.city ? { addressLocality: store.city } : {}),
            ...(store.state ? { addressRegion: store.state } : {}),
            ...(store.pincode ? { postalCode: store.pincode } : {}),
            addressCountry: "IN",
          },
        }
      : {}),
    ...(store.googleMapLink ? { hasMap: store.googleMapLink } : {}),
    ...(store.openingTime && store.closingTime
      ? {
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              ...(days ? { dayOfWeek: days } : {}),
              opens: store.openingTime,
              closes: store.closingTime,
            },
          ],
        }
      : {}),
    currenciesAccepted: store.currency || "INR",
    paymentAccepted: "Cash",
    ...(sameAs.length ? { sameAs } : {}),
  };
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** "Monday – Saturday" → [Monday..Saturday]; returns null if not parseable. */
function parseDays(s: string | null): string[] | null {
  if (!s) return null;
  const found = DAY_NAMES.filter((d) => s.toLowerCase().includes(d.toLowerCase().slice(0, 3)));
  if (found.length === 2 && /[–\-to]/.test(s)) {
    const a = DAY_NAMES.indexOf(found[0]);
    const b = DAY_NAMES.indexOf(found[1]);
    if (a < b) return DAY_NAMES.slice(a, b + 1);
  }
  if (/all days|every ?day|daily|7 days/i.test(s)) return DAY_NAMES;
  return found.length ? found : null;
}
