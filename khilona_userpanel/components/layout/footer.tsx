import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/icons/brand";
import { OpenNowBadge } from "@/features/store/open-badge";
import { POLICY_TYPES, storeAddressLines, storeHours, storeMapUrl, storePhoneUrl, storeWhatsappUrl } from "@/features/store/store-utils";
import type { CategorySummary, PublicStore } from "@/types/api";
import { Wordmark } from "./logo";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-white/60">{children}</h2>;
}

export function Footer({ store, categories }: { store: PublicStore | null; categories: CategorySummary[] }) {
  const name = store?.name ?? "KHILONA";
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
    <footer className="mt-16 bg-ink text-white/85 md:mt-24">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 md:py-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Wordmark className="text-white" />
          {(store?.tagline || store?.description) && (
            <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-white/70">{store?.tagline ?? store?.description}</p>
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
                    className="grid size-11 place-items-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
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
          <ul className="mt-4 space-y-1">
            <li>
              <Link href="/products" className="inline-flex min-h-9 items-center hover:text-white hover:underline underline-offset-4">
                All products
              </Link>
            </li>
            {categories.slice(0, 7).map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="inline-flex min-h-9 items-center hover:text-white hover:underline underline-offset-4">
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
                <MapPin className="mt-0.5 size-5 shrink-0 text-sun" aria-hidden="true" />
                <span>
                  {address.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                  {map && (
                    <a href={map} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-sun hover:underline underline-offset-4">
                      Get directions
                    </a>
                  )}
                </span>
              </li>
            )}
            {store?.phone && phoneUrl && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-sun" aria-hidden="true" />
                <a href={phoneUrl} className="hover:text-white hover:underline underline-offset-4">
                  {store.phone}
                </a>
              </li>
            )}
            {wa && (
              <li className="flex gap-3">
                <WhatsAppIcon className="mt-0.5 size-5 shrink-0 text-sun" />
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline underline-offset-4">
                  WhatsApp us
                </a>
              </li>
            )}
            {store?.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-sun" aria-hidden="true" />
                <a href={`mailto:${store.email}`} className="break-all hover:text-white hover:underline underline-offset-4">
                  {store.email}
                </a>
              </li>
            )}
            {hours && (
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-sun" aria-hidden="true" />
                <span>{hours}</span>
              </li>
            )}
          </ul>
        </div>

        <nav aria-label="Help" className="lg:col-span-2">
          <FooterHeading>Help</FooterHeading>
          <ul className="mt-4 space-y-1">
            <li>
              <Link href="/track-order" className="inline-flex min-h-9 items-center hover:text-white hover:underline underline-offset-4">
                Track your order
              </Link>
            </li>
            <li>
              <Link href="/contact" className="inline-flex min-h-9 items-center hover:text-white hover:underline underline-offset-4">
                Contact us
              </Link>
            </li>
            {policies.map((k) => (
              <li key={k}>
                <Link href={`/policies/${k}`} className="inline-flex min-h-9 items-center hover:text-white hover:underline underline-offset-4">
                  {POLICY_TYPES[k].title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 pt-6 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between md:pb-6">
          <p>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          <p>Cash / pay on delivery · No online payment required</p>
        </Container>
      </div>
    </footer>
  );
}
