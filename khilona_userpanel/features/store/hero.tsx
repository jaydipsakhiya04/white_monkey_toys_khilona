import Link from "next/link";
import { ArrowRight, Banknote, ShieldCheck, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import type { ProductCard, PublicStore } from "@/types/api";
import { formatPrice } from "@/utils/format";
import { HERO_FALLBACK } from "./store-utils";

export function Hero({ store, showcase }: { store: PublicStore | null; showcase: ProductCard[] }) {
  const title = store?.heroTitle?.trim() || HERO_FALLBACK.title;
  const subtitle = store?.heroSubtitle?.trim() || HERO_FALLBACK.subtitle;
  const cta = store?.heroCtaLabel?.trim() || HERO_FALLBACK.cta;
  const tiles = showcase.filter((p) => p.thumbnailUrl).slice(0, 4);
  const spotlight = tiles[0];

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <Container className="grid items-center gap-10 pb-12 pt-8 sm:pb-16 sm:pt-12 md:grid-cols-[1fr_1.05fr] md:gap-10 lg:pb-20 lg:pt-16 xl:gap-20">
        <div className="relative animate-slide-up">
          {store?.tagline && <p className="eyebrow mb-5">{store.tagline}</p>}
          <h1
            id="hero-title"
            className="text-[2.6rem] font-bold leading-[1.02] tracking-[-0.035em] text-ink xs:text-[3rem] sm:text-6xl lg:text-[4.25rem] xl:text-[4.75rem]"
          >
            {title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">{subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 xs:flex-row">
            <ButtonLink href="/products" size="lg" className="xs:w-auto">
              {cta}
              <ArrowRight className="size-[1.125rem]" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/categories" size="lg" variant="outline">
              Explore categories
            </ButtonLink>
          </div>
          <ul className="mt-9 grid max-w-lg gap-3 text-sm text-ink xs:grid-cols-3 xs:gap-4">
            <li className="flex items-center gap-2">
              <Banknote className="size-[1.125rem] shrink-0" aria-hidden="true" />
              Pay on delivery
            </li>
            <li className="flex items-center gap-2">
              <Truck className="size-[1.125rem] shrink-0" aria-hidden="true" />
              Track every order
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-[1.125rem] shrink-0" aria-hidden="true" />
              Verified reviews
            </li>
          </ul>
        </div>

        <div className="relative">
          {store?.coverImageUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-sand md:aspect-[5/4.4]">
              <SmartImage
                src={store.coverImageUrl}
                alt={`Toys from ${store.name}`}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover object-[78%_50%]"
              />
            </div>
          ) : tiles.length >= 2 ? (
            <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
              {tiles.map((p, i) => (
                <div key={p.id} className={`relative aspect-square overflow-hidden rounded-[1.75rem] bg-sand ${i === 1 ? "translate-y-6" : ""}`}>
                  <SmartImage src={p.thumbnailUrl} alt="" fill priority={i < 2} sizes="(min-width: 768px) 25vw, 50vw" className="object-contain p-5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[2rem] bg-sand">
              <span className="font-display text-6xl font-bold tracking-tight text-ink/80">Play.</span>
            </div>
          )}

          {store?.coverImageUrl && spotlight && (
            <Link
              href={`/product/${spotlight.slug}`}
              className="group absolute -bottom-5 left-4 flex max-w-[16rem] items-center gap-3 rounded-2xl border border-line bg-surface/95 p-2.5 pr-4 shadow-lift backdrop-blur transition-transform hover:-translate-y-0.5 sm:left-6 md:-left-6"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                <SmartImage src={spotlight.thumbnailUrl} alt="" fill sizes="56px" className="object-contain p-1.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">Featured</span>
                <span className="block truncate text-sm font-semibold text-ink">{spotlight.name}</span>
                <span className="block text-sm tabular-nums text-muted">
                  {spotlight.hasVariants && spotlight.maxPrice > spotlight.minPrice ? "From " : ""}
                  {formatPrice(spotlight.hasVariants ? spotlight.minPrice : spotlight.effectivePrice)}
                </span>
              </span>
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}
