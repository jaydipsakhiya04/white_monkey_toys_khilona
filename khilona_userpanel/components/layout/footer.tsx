import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/icons/brand";
import { GatedAnchor } from "@/features/auth/login-gate";
import { OpenNowBadge } from "@/features/store/open-badge";
import { POLICY_TYPES, storeAddressLines, storeHours, storeMapUrl, storePhoneUrl, storeWhatsappUrl } from "@/features/store/store-utils";
import { brandName, WHOLESALE_INSTAGRAM } from "@/lib/brand";
import type { CategorySummary, PublicStore } from "@/types/api";
import { BrandLogo } from "./logo";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-white/45">{children}</h2>;
}

const linkClass = "inline-flex min-h-9 items-center text-[0.9375rem] text-white/75 transition-colors hover:text-white";

/** Links that only point somewhere real: a bare "https://www.instagram.com/" placeholder is skipped. */
function socialProfile(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname.replace(/\/+$/, "") ? url : null;
  } catch {
    return null;
  }
}

export function Footer({ store, categories }: { store: PublicStore | null; categories: CategorySummary[] }) {
  const name = brandName(store);
  const address = storeAddressLines(store);
  const hours = storeHours(store);
  const phoneUrl = storePhoneUrl(store);
  const wa = storeWhatsappUrl(store);
  const map = storeMapUrl(store);
  const socials = [
    { href: socialProfile(store?.instagram), label: "Instagram", Icon: InstagramIcon },
    { href: socialProfile(store?.facebook), label: "Facebook", Icon: FacebookIcon },
    { href: socialProfile(store?.youtube), label: "YouTube", Icon: YouTubeIcon },
  ].filter((s): s is { href: string; label: string; Icon: typeof InstagramIcon } => !!s.href);
  const policies = (Object.keys(POLICY_TYPES) as (keyof typeof POLICY_TYPES)[]).filter((k) => !store || store[POLICY_TYPES[k].field]);

  return (
    <footer className="mt-20 bg-ink text-white/75 md:mt-28">
      <Container className="grid gap-12 py-14 sm:grid-cols-2 md:py-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <BrandLogo name={name} logoUrl={store?.logoUrl} inverted className="h-9" />
          <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-white/60">
            {store?.tagline || "RC cars, drones, action figures and collectibles — carefully selected, delivered to your door, paid for on delivery."}
          </p>
          {store && <OpenNowBadge store={store} className="mt-5" />}
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2" aria-label="Social media">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${name} on ${label} (opens in new tab)`}
                    className="grid size-10 place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-white hover:bg-white hover:text-ink"
                  >
                    <Icon className="size-[1.125rem]" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <a
            href={WHOLESALE_INSTAGRAM.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/15 py-1.5 pl-1.5 pr-4 text-sm transition-colors hover:border-white/40"
          >
            <span className="grid size-8 place-items-center rounded-full bg-white text-ink">
              <InstagramIcon className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold text-white">Wholesale &amp; bulk orders</span>
              <span className="block text-xs text-white/55">{WHOLESALE_INSTAGRAM.handle}</span>
            </span>
            <span className="sr-only">(opens in new tab)</span>
          </a>
        </div>

        <nav aria-label="Shop" className="lg:col-span-2">
          <FooterHeading>Shop</FooterHeading>
          <ul className="mt-4 space-y-0.5">
            <li>
              <Link href="/products" className={linkClass}>
                Shop All
              </Link>
            </li>
            <li>
              <Link href="/categories" className={linkClass}>
                Categories
              </Link>
            </li>
            <li>
              <Link href="/wholesale" className={linkClass}>
                Wholesale Toys
              </Link>
            </li>
            {categories.slice(0, 7).map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Customer support" className="lg:col-span-3">
          <FooterHeading>Customer Support</FooterHeading>
          <ul className="mt-4 space-y-0.5">
            <li>
              <Link href="/contact" className={linkClass}>
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/track-order" className={linkClass}>
                Track Order
              </Link>
            </li>
            {policies.map((k) => (
              <li key={k}>
                <Link href={`/policies/${k}`} className={linkClass}>
                  {POLICY_TYPES[k].title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/account" className={linkClass}>
                My Account
              </Link>
            </li>
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <FooterHeading>Contact</FooterHeading>
          <ul className="mt-4 space-y-4 text-[0.9375rem]">
            {store?.phone && phoneUrl && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-[1.125rem] shrink-0 text-white/45" strokeWidth={1.75} aria-hidden="true" />
                <a href={phoneUrl} className="font-semibold text-white hover:underline hover:underline-offset-4">
                  {store.phone}
                </a>
              </li>
            )}
            {wa && (
              <li className="flex gap-3">
                <WhatsAppIcon className="mt-0.5 size-[1.125rem] shrink-0 text-white/45" />
                <GatedAnchor href={wa} action="chat with us on WhatsApp" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  WhatsApp us
                </GatedAnchor>
              </li>
            )}
            {address.length > 0 && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-[1.125rem] shrink-0 text-white/45" strokeWidth={1.75} aria-hidden="true" />
                <span className="leading-relaxed">
                  {address.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                  {map && (
                    <a href={map} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block font-semibold text-white underline-offset-4 hover:underline">
                      Get directions
                    </a>
                  )}
                </span>
              </li>
            )}
            {store?.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-[1.125rem] shrink-0 text-white/45" strokeWidth={1.75} aria-hidden="true" />
                <GatedAnchor href={`mailto:${store.email}`} action="email us" className="break-all hover:text-white">
                  {store.email}
                </GatedAnchor>
              </li>
            )}
            {hours && (
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-[1.125rem] shrink-0 text-white/45" strokeWidth={1.75} aria-hidden="true" />
                <span>{hours}</span>
              </li>
            )}
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 pt-6 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between md:pb-6">
          <p>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <p>Cash on Delivery · Order Tracking · WhatsApp Support</p>
        </Container>
      </div>
    </footer>
  );
}
