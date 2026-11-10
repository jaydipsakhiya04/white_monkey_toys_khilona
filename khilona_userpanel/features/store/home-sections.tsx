import Link from "next/link";
import { ArrowRight, ArrowUpRight, Headset, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons/brand";
import { ButtonAnchor, buttonClasses } from "@/components/ui/button";
import { GatedAnchor } from "@/features/auth/login-gate";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import { WHOLESALE_INSTAGRAM } from "@/lib/brand";
import type { CategorySummary, ProductCard, PublicStore } from "@/types/api";
import { cn } from "@/utils/cn";
import { pluralize } from "@/utils/format";
import { storeWhatsappUrl } from "./store-utils";

export type PromoBanner = {
  category: CategorySummary;
  products: ProductCard[];
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  dark?: boolean;
};

/** Two editorial banners that deep-link into real categories, illustrated with that category's own products. */
export function PromoBanners({ banners }: { banners: PromoBanner[] }) {
  if (banners.length === 0) return null;
  return (
    <section aria-label="Collections" className="py-6 sm:py-10">
      <Container className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {banners.map(({ category, products, eyebrow, title, body, cta, dark }, i) => {
          const [lead, support] = products.filter((p) => p.thumbnailUrl);
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              data-reveal
              style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}
              className={cn(
                "group relative grid min-h-[20rem] overflow-hidden rounded-[2rem] sm:grid-cols-[1fr_1.05fr] sm:min-h-[24rem]",
                dark ? "bg-ink text-white" : "bg-sand text-ink",
              )}
            >
              <div className="relative z-10 flex flex-col justify-between gap-8 p-7 sm:p-9 lg:p-10">
                <div>
                  <p className={cn("eyebrow", dark && "!text-white/60")}>{eyebrow}</p>
                  <h2 className="mt-3 text-[1.375rem] font-bold leading-[1.1] sm:text-[1.75rem]">{title}</h2>
                  <p className={cn("mt-3 max-w-xs text-sm leading-relaxed", dark ? "text-white/65" : "text-muted")}>{body}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold transition-transform group-hover:-translate-y-0.5",
                    dark ? "bg-white text-ink" : "bg-ink text-white",
                  )}
                >
                  {cta}
                  <span className="hidden font-normal opacity-60 xl:inline">· {pluralize(category.productCount, "item")}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
              {lead && (
                <div className="relative min-h-[15rem] p-4 pt-0 sm:p-5 sm:pl-0">
                  <div className={cn("photo-stage relative h-full overflow-hidden rounded-[1.5rem]", !dark && "!bg-white")}>
                    <SmartImage
                      src={lead.thumbnailUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 26vw, (min-width: 640px) 48vw, 100vw"
                      className="object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                    {support && (
                      <span className="photo-stage absolute bottom-3 right-3 size-24 overflow-hidden rounded-2xl border-4 border-white shadow-soft sm:size-28">
                        <SmartImage src={support.thumbnailUrl} alt="" fill sizes="112px" className="object-contain p-1.5" />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </Container>
    </section>
  );
}

/** "Why choose White Monkey?" — only claims the store actually backs up. */
export function WhySection({ storeName }: { storeName: string }) {
  const points = [
    {
      icon: Sparkles,
      title: "Products That Sell",
      body: "RC cars, construction RC, drones and action figures picked for quality, detail and steady demand in your shop.",
    },
    {
      icon: Truck,
      title: "PAN India Delivery",
      body: "We dispatch retailer and wholesale orders across India. Delivery charges are as per actual and confirmed before dispatch.",
    },
    {
      icon: ShieldCheck,
      title: "Simple Ordering",
      body: "A free business account keeps every order in one place. No online payment, and you can track every step.",
    },
    {
      icon: Headset,
      title: "Dedicated Trade Support",
      body: "Prices, stock and bulk quantities: call or WhatsApp us on either number and a real person will help.",
    },
  ];
  return (
    <section aria-labelledby="why-title" className="border-y border-line bg-sand/60 py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <p className="eyebrow justify-center">Why {storeName}</p>
          <h2 id="why-title" className="mt-3 text-[1.5rem] font-bold leading-[1.1] text-ink sm:text-[2rem] lg:text-[2.25rem]">
            Why choose White Monkey?
          </h2>
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p, i) => (
            <li
              key={p.title}
              data-reveal
              style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
              className="group bg-white p-7 transition-colors hover:bg-sand/40 sm:p-8"
            >
              <span className="grid size-11 place-items-center rounded-full border border-line-strong text-ink transition-colors group-hover:border-ink">
                <p.icon className="size-5" aria-hidden="true" strokeWidth={1.5} />
              </span>
              <h3 className="mt-6 font-display text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** How ordering works for retailers and wholesalers (no online payment). */
export function HowOrderingWorks({ store }: { store: PublicStore | null }) {
  const steps = [
    { title: "Browse the catalogue", body: "Find RC cars, drones and figures by category, age or search, and add them to your cart." },
    { title: "Send your order", body: "Log in with your free business account and share your shop's delivery address." },
    { title: "We confirm & dispatch", body: "Our team confirms prices, payment and delivery charges on WhatsApp, then ships PAN India." },
  ];
  return (
    <section aria-labelledby="how-title" className="bg-ink py-16 text-white sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <div data-reveal>
          <p className="eyebrow !text-white/55">Ordering</p>
          <h2 id="how-title" className="mt-3 text-[1.5rem] font-bold leading-[1.1] sm:text-[2rem] lg:text-[2.25rem]">
            Simple from cart to your shop
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            {store?.isOpen === false && store.closedMessage
              ? store.closedMessage
              : "No online payment. Every order is confirmed by a real person before it ships anywhere in India."}
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties}
              className="rounded-[1.5rem] border border-white/10 p-6 transition-colors hover:border-white/25"
            >
              <span className="font-display text-sm font-semibold tabular-nums text-white/45" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 font-display text-lg font-semibold">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/** A real Instagram profile link (the seed placeholder "https://www.instagram.com/" doesn't count). */
function instagramProfile(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/+$/, "") ? url : null;
  } catch {
    return null;
  }
}

/** "Little Things. Big Smiles." — a photo wall of real products plus the store's real social links. */
export function SocialSection({ store, products }: { store: PublicStore | null; products: ProductCard[] }) {
  const tiles = products.filter((p) => p.thumbnailUrl).slice(0, 6);
  if (tiles.length < 3) return null;
  const instagram = instagramProfile(store?.instagram);
  const wa = storeWhatsappUrl(store, "Hi! Please share your wholesale / retailer price list.");
  return (
    <section aria-labelledby="social-title" className="py-16 sm:py-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end" data-reveal>
          <div className="max-w-xl">
            <p className="eyebrow">Follow the fun</p>
            <h2 id="social-title" className="mt-3 text-[1.5rem] font-bold leading-[1.1] text-ink sm:text-[2rem] lg:text-[2.25rem]">
              Little Things. Big Smiles.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              New arrivals, restocks and collector favourites — straight from our shelves.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {instagram ? (
              <ButtonAnchor href={instagram} target="_blank" rel="noopener noreferrer" variant="outline">
                <InstagramIcon className="size-[1.125rem]" />
                Follow on Instagram
              </ButtonAnchor>
            ) : (
              <ButtonAnchor href={WHOLESALE_INSTAGRAM.url} target="_blank" rel="noopener noreferrer" variant="outline">
                <InstagramIcon className="size-[1.125rem]" />
                {WHOLESALE_INSTAGRAM.handle}
              </ButtonAnchor>
            )}
            {wa && (
              <GatedAnchor href={wa} action="chat with us on WhatsApp" target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "primary" })}>
                <WhatsAppIcon className="size-[1.125rem]" />
                WhatsApp us
              </GatedAnchor>
            )}
          </div>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {tiles.map((p, i) => (
            <li key={p.id} data-reveal style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}>
              <Link href={`/product/${p.slug}`} className="photo-stage group relative block aspect-square overflow-hidden rounded-[1.25rem]">
                <SmartImage
                  src={p.thumbnailUrl}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  className="object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/55 via-black/0 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="flex w-full items-center justify-between gap-2 text-xs font-semibold text-white">
                    <span className="line-clamp-2">{p.name}</span>
                    <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
