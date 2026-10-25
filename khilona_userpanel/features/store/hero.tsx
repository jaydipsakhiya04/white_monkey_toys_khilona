import Link from "next/link";
import { ArrowRight, Banknote, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import type { ProductCard, PublicStore } from "@/types/api";
import { formatPrice } from "@/utils/format";
import { HERO_FALLBACK } from "./store-utils";

/** Splits the last word off so it can carry the accent gradient. */
function splitTitle(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { lead: "", tail: title };
  return { lead: words.slice(0, -1).join(" "), tail: words[words.length - 1] };
}

function priceLabel(p: ProductCard) {
  return `${p.hasVariants && p.maxPrice > p.minPrice ? "From " : ""}${formatPrice(p.hasVariants ? p.minPrice : p.effectivePrice)}`;
}

export function Hero({ store, showcase }: { store: PublicStore | null; showcase: ProductCard[] }) {
  const title = store?.heroTitle?.trim() || HERO_FALLBACK.title;
  const subtitle = store?.heroSubtitle?.trim() || HERO_FALLBACK.subtitle;
  const cta = store?.heroCtaLabel?.trim() || HERO_FALLBACK.cta;
  const tiles = showcase.filter((p) => p.thumbnailUrl).slice(0, 4);
  const [spotlight, second] = tiles;
  const { lead, tail } = splitTitle(title);

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-midnight text-white">
      {/* ambient glows + dot grain */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-[-12rem] size-[38rem] rounded-full bg-accent/25 blur-[120px]" />
        <div className="absolute -right-32 bottom-[-14rem] size-[36rem] rounded-full bg-[#6d5dfc]/25 blur-[130px]" />
        <div className="bg-grain absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
      </div>

      <Container className="grid items-center gap-12 pb-16 pt-10 sm:pb-20 sm:pt-14 md:grid-cols-[1fr_1.08fr] md:gap-10 lg:pb-28 lg:pt-20 xl:gap-16">
        <div className="relative">
          <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-2 pr-4 text-[0.8125rem] font-medium text-white/85 backdrop-blur">
            <span className="grid size-6 place-items-center rounded-full bg-accent text-midnight">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </span>
            {store?.tagline || "Premium toys, games & RC"}
          </p>
          <h1
            id="hero-title"
            className="mt-6 animate-rise text-[2.75rem] font-extrabold leading-[0.98] tracking-[-0.04em] [animation-delay:80ms] xs:text-[3.25rem] sm:text-6xl lg:text-[4.6rem] xl:text-[5.25rem]"
          >
            {lead && <>{lead} </>}
            <span className="text-gradient-accent">{tail}</span>
          </h1>
          <p className="mt-6 max-w-md animate-rise text-base leading-relaxed text-white/70 [animation-delay:160ms] sm:text-lg">{subtitle}</p>
          <div className="mt-9 flex animate-rise flex-col gap-3 [animation-delay:240ms] xs:flex-row">
            <ButtonLink href="/products" size="lg" variant="accent" className="group xs:w-auto">
              {cta}
              <ArrowRight className="size-[1.125rem] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/categories" size="lg" variant="outline-inverse">
              Explore categories
            </ButtonLink>
          </div>
          <ul className="mt-10 grid max-w-lg animate-rise gap-3 text-sm text-white/80 [animation-delay:320ms] xs:grid-cols-3 xs:gap-4">
            {[
              { Icon: Banknote, label: "Pay on delivery" },
              { Icon: Truck, label: "Track every order" },
              { Icon: ShieldCheck, label: "Verified reviews" },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] ring-1 ring-white/10">
                  <Icon className="size-4 text-accent" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative animate-rise [animation-delay:200ms]">
          {store?.coverImageUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.25rem] bg-sand shadow-[0_40px_120px_-30px_rgb(0_0_0/0.7)] ring-1 ring-white/10 md:aspect-[6/5]">
              <SmartImage
                src={store.coverImageUrl}
                alt={`Toys from ${store.name}`}
                fill
                priority
                sizes="(min-width: 768px) 52vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : tiles.length >= 2 ? (
            <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
              {tiles.map((p, i) => (
                <div
                  key={p.id}
                  className={`relative aspect-square overflow-hidden rounded-[1.75rem] bg-sand ring-1 ring-white/10 ${i % 2 === 1 ? "translate-y-8" : ""}`}
                >
                  <SmartImage src={p.thumbnailUrl} alt="" fill priority={i < 2} sizes="(min-width: 768px) 26vw, 50vw" className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[2.25rem] bg-white/5 ring-1 ring-white/10">
              <span className="font-display text-7xl font-extrabold tracking-tight text-white/80">Play.</span>
            </div>
          )}

          {spotlight && (
            <Link
              href={`/product/${spotlight.slug}`}
              className="group absolute -bottom-6 left-3 flex max-w-[17rem] animate-float items-center gap-3 rounded-2xl border border-white/60 bg-white/95 p-2.5 pr-4 text-ink shadow-lift backdrop-blur transition-shadow hover:shadow-[0_24px_60px_-12px_rgb(0_0_0/0.5)] sm:left-6 md:-left-8"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                <SmartImage src={spotlight.thumbnailUrl} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-accent-deep">Bestseller</span>
                <span className="block truncate text-sm font-semibold">{spotlight.name}</span>
                <span className="block text-sm font-medium tabular-nums text-muted">{priceLabel(spotlight)}</span>
              </span>
            </Link>
          )}
          {second && store?.coverImageUrl && (
            <Link
              href={`/product/${second.slug}`}
              className="absolute -top-5 right-3 hidden animate-float items-center gap-2.5 rounded-full border border-white/15 bg-midnight-soft/90 py-1.5 pl-1.5 pr-4 text-white shadow-lift backdrop-blur [animation-delay:-3s] hover:border-white/40 sm:flex md:-right-4"
            >
              <span className="relative size-9 overflow-hidden rounded-full bg-sand">
                <SmartImage src={second.thumbnailUrl} alt="" fill sizes="36px" className="object-cover" />
              </span>
              <span className="max-w-[10rem] truncate text-[0.8125rem] font-semibold">{second.name}</span>
              <span className="text-[0.8125rem] font-semibold tabular-nums text-accent">{priceLabel(second)}</span>
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}
