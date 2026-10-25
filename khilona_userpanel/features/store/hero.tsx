import Link from "next/link";
import { ArrowRight, Banknote, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import type { CategorySummary, ProductCard, PublicStore } from "@/types/api";
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

function countProducts(categories: CategorySummary[]) {
  // top-level counts already include sub-categories on the API side only sometimes; take the max of both views
  const top = categories.reduce((s, c) => s + c.productCount, 0);
  const leaves = categories.reduce((s, c) => s + (c.children?.length ? c.children.reduce((a, ch) => a + ch.productCount, 0) : c.productCount), 0);
  return Math.max(top, leaves);
}

export function Hero({
  store,
  showcase,
  categories = [],
}: {
  store: PublicStore | null;
  showcase: ProductCard[];
  categories?: CategorySummary[];
}) {
  const title = store?.heroTitle?.trim() || HERO_FALLBACK.title;
  const subtitle = store?.heroSubtitle?.trim() || HERO_FALLBACK.subtitle;
  const cta = store?.heroCtaLabel?.trim() || HERO_FALLBACK.cta;
  const tiles = showcase.filter((p) => p.thumbnailUrl).slice(0, 4);
  const [spotlight, second] = tiles;
  const { lead, tail } = splitTitle(title);
  const live = categories.filter((c) => c.productCount > 0);
  const chips = [...live].sort((a, b) => b.productCount - a.productCount).slice(0, 4);
  const productTotal = countProducts(live);
  const stats = [
    productTotal > 0 && { value: `${productTotal}+`, label: "toys in stock" },
    live.length > 0 && { value: String(live.length), label: "categories" },
    { value: "₹0", label: "paid online" },
    { value: "24/7", label: "order tracking" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-midnight text-white">
      {/* ambient glows, dot grain and a soft horizon line */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 top-[-14rem] size-[42rem] rounded-full bg-accent/25 blur-[130px]" />
        <div className="absolute -right-40 bottom-[-16rem] size-[40rem] rounded-full bg-[#6d5dfc]/25 blur-[140px]" />
        <div className="absolute left-1/2 top-1/3 size-[28rem] -translate-x-1/2 rounded-full bg-[#ff3d6e]/10 blur-[120px]" />
        <div className="bg-grain absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <Container className="grid items-center gap-14 pb-14 pt-10 sm:pt-14 md:grid-cols-[1fr_1.1fr] md:gap-10 lg:pb-16 lg:pt-20 xl:gap-16">
        <div className="relative">
          <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-1.5 pr-4 text-[0.8125rem] font-medium text-white/85 backdrop-blur">
            <span className="grid size-6 place-items-center rounded-full bg-accent text-midnight">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </span>
            {store?.tagline || "Premium toys, games & RC"}
          </p>
          <h1
            id="hero-title"
            className="mt-6 animate-rise text-[2.9rem] font-extrabold leading-[0.95] tracking-[-0.045em] [animation-delay:80ms] xs:text-[3.4rem] sm:text-[4.25rem] lg:text-[5rem] xl:text-[5.75rem]"
          >
            {lead && <>{lead} </>}
            <span className="text-gradient-accent">{tail}</span>
          </h1>
          <p className="mt-6 max-w-[30rem] animate-rise text-base leading-relaxed text-white/70 [animation-delay:160ms] sm:text-lg">{subtitle}</p>
          <div className="mt-9 flex animate-rise flex-col gap-3 [animation-delay:240ms] xs:flex-row">
            <ButtonLink href="/products" size="lg" variant="accent" className="group xs:w-auto">
              {cta}
              <ArrowRight className="size-[1.125rem] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/categories" size="lg" variant="outline-inverse">
              Explore categories
            </ButtonLink>
          </div>
          {chips.length > 0 && (
            <nav aria-label="Popular categories" className="mt-8 animate-rise [animation-delay:320ms]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Popular right now</p>
              <ul className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="group inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] pl-1 pr-3.5 text-sm font-medium text-white/85 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-white/[0.09] hover:text-white"
                    >
                      <span className="relative size-8 overflow-hidden rounded-full bg-sand">
                        {c.imageUrl && <SmartImage src={c.imageUrl} alt="" fill sizes="32px" className="object-cover" />}
                      </span>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <div className="relative animate-rise [animation-delay:200ms]">
          {store?.coverImageUrl ? (
            <div className="relative">
              {/* slowly rotating glow ring behind the frame */}
              <div
                aria-hidden="true"
                className="absolute -inset-px -z-10 rounded-[2.4rem] bg-[conic-gradient(from_var(--a),#ff5a1f,#6d5dfc,#ff3d6e,#ffb21e,#ff5a1f)] opacity-70 blur-xl [animation:hero-spin_14s_linear_infinite]"
              />
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2.25rem] bg-sand p-px shadow-[0_50px_120px_-30px_rgb(0_0_0/0.8)] md:aspect-[6/5]">
                <div className="relative h-full w-full overflow-hidden rounded-[2.2rem]">
                  <SmartImage
                    src={store.coverImageUrl}
                    alt={`Toys from ${store.name}`}
                    fill
                    priority
                    sizes="(min-width: 768px) 54vw, 100vw"
                    className="scale-[1.02] object-cover transition-transform duration-[2s] ease-out hover:scale-[1.06]"
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-midnight/25 via-transparent to-transparent" />
                </div>
              </div>
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
              className="group absolute -bottom-7 left-3 flex max-w-[17.5rem] animate-float items-center gap-3 rounded-2xl border border-white/60 bg-white/95 p-2.5 pr-4 text-ink shadow-lift backdrop-blur transition-shadow hover:shadow-[0_24px_60px_-12px_rgb(0_0_0/0.5)] sm:left-6 md:-left-8"
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
          {store?.coverImageUrl && (
            <div className="absolute -bottom-5 right-4 hidden items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-white shadow-lift backdrop-blur-xl [animation-delay:-1.5s] lg:flex lg:animate-float">
              <span className="grid size-8 place-items-center rounded-xl bg-accent text-midnight">
                <Banknote className="size-4" aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-[0.8125rem] font-semibold">Pay on delivery</span>
                <span className="block text-[0.6875rem] text-white/60">No online payment needed</span>
              </span>
            </div>
          )}
        </div>
      </Container>

      {/* stats strip */}
      <Container className="pb-12 sm:pb-14 lg:pb-16">
        <ul className="grid animate-rise grid-cols-2 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] backdrop-blur [animation-delay:400ms] md:grid-cols-4">
          {stats.slice(0, 4).map((s, i) => (
            <li
              key={s.label}
              className={`flex items-center gap-4 px-5 py-5 sm:px-7 sm:py-6 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
            >
              <span className="font-display text-[1.75rem] font-extrabold tabular-nums tracking-[-0.03em] text-white sm:text-[2.25rem]">{s.value}</span>
              <span className="text-[0.8125rem] leading-snug text-white/55">{s.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
