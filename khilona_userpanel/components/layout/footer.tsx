import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/icons/brand";
import { OpenNowBadge } from "@/features/store/open-badge";
import { POLICY_TYPES, storeAddressLines, storeHours, storeMapUrl, storePhoneUrl, storeWhatsappUrl } from "@/features/store/store-utils";
import { brandName } from "@/lib/brand";
import type { CategorySummary, PublicStore } from "@/types/api";
import { Wordmark } from "./logo";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{children}</h2>;
}

const linkClass = "inline-flex min-h-9 items-center text-white/80 transition-colors hover:text-white";

export function Footer({ store, categories }: { store: PublicStore | null; categories: CategorySummary[] }) {
  const name = brandName(store);
  const address = storeAddressLines(store);
  const hours = storeHours(store);
  const phoneUrl = storePhoneUrl(store);
  const wa = storeWhatsappUrl(store);
  const map = storeMapUrl(store);
  const socials = [
    { href: store?.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: store?.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: store?.youtube, label: "YouTube", Icon: YouTubeIcon },
  ].filter((s): s is { href: string; label: string; Icon: typeof InstagramIcon } => !!s.href);
  const policies = (Object.keys(POLICY_TYPES) as (keyof typeof POLICY_TYPES)[]).filter((k) => !store || store[POLICY_TYPES[k].field]);

  return (
    <footer className="mt-20 bg-ink text-white/80 md:mt-28">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 md:py-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Wordmark name={name} inverted />
          {(store?.tagline || store?.description) && (
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-white/65">{store?.tagline ?? store?.description}</p>
          )}
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
                    className="grid size-11 place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-white/40 hover:bg-white/5"
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer categories" className="lg:col-span-3">
          <FooterHeading>Shop</FooterHeading>
          <ul className="mt-4 space-y-0.5">
            <li>
              <Link href="/products" className={linkClass}>
                All toys
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

        <div className="lg:col-span-3">
          <FooterHeading>Visit or call</FooterHeading>
          <ul className="mt-4 space-y-3.5 text-[0.9375rem]">
            {address.length > 0 && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-[1.125rem] shrink-0 text-white/50" aria-hidden="true" />
                <span>
                  {address.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                  {map && (
                    <a href={map} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-white underline-offset-4 hover:underline">
                      Get directions
                    </a>
                  )}
                </span>
              </li>
            )}
            {store?.phone && phoneUrl && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-[1.125rem] shrink-0 text-white/50" aria-hidden="true" />
                <a href={phoneUrl} className="hover:text-white">
                  {store.phone}
                </a>
              </li>
            )}
            {wa && (
              <li className="flex gap-3">
                <WhatsAppIcon className="mt-0.5 size-[1.125rem] shrink-0 text-white/50" />
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  WhatsApp us
                </a>
              </li>
            )}
            {store?.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-[1.125rem] shrink-0 text-white/50" aria-hidden="true" />
                <a href={`mailto:${store.email}`} className="break-all hover:text-white">
                  {store.email}
                </a>
              </li>
            )}
            {hours && (
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-[1.125rem] shrink-0 text-white/50" aria-hidden="true" />
                <span>{hours}</span>
              </li>
            )}
          </ul>
        </div>

        <nav aria-label="Help" className="lg:col-span-2">
          <FooterHeading>Help</FooterHeading>
          <ul className="mt-4 space-y-0.5">
            <li>
              <Link href="/account" className={linkClass}>
                My account
              </Link>
            </li>
            <li>
              <Link href="/track-order" className={linkClass}>
                Track your order
              </Link>
            </li>
            <li>
              <Link href="/contact" className={linkClass}>
                Contact us
              </Link>
            </li>
            {policies.map((k) => (
              <li key={k}>
                <Link href={`/policies/${k}`} className={linkClass}>
                  {POLICY_TYPES[k].title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 pt-6 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between md:pb-6">
          <p>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <p>Pay on delivery · Order tracking · Verified reviews</p>
        </Container>
      </div>
    </footer>
  );
}
