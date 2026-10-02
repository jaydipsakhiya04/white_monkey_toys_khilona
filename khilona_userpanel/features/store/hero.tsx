import { ArrowRight, Banknote, MessageCircle, UserRoundCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import type { ProductCard, PublicStore } from "@/types/api";
import { HERO_FALLBACK } from "./store-utils";

export function Hero({ store, showcase }: { store: PublicStore | null; showcase: ProductCard[] }) {
  const title = store?.heroTitle?.trim() || HERO_FALLBACK.title;
  const subtitle = store?.heroSubtitle?.trim() || HERO_FALLBACK.subtitle;
  const cta = store?.heroCtaLabel?.trim() || HERO_FALLBACK.cta;
  const tiles = showcase.filter((p) => p.thumbnailUrl).slice(0, 4);

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line">
      <Container className="grid items-center gap-8 py-8 sm:py-12 md:grid-cols-[1.05fr_1fr] md:gap-10 lg:py-16 xl:gap-16">
        <div className="relative">
          {store?.tagline && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink sm:text-sm">
              <span className="size-2 rounded-full bg-sun" aria-hidden="true" />
              {store.tagline}
            </p>
          )}
          <h1
            id="hero-title"
            className="text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink xs:text-5xl lg:text-6xl xl:text-[4.25rem]"
          >
            {title}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">{subtitle}</p>
          <div className="mt-7 flex flex-col gap-3 xs:flex-row">
            <ButtonLink href="/products" size="lg" className="xs:w-auto">
              {cta}
              <ArrowRight className="size-[1.125rem]" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/categories" size="lg" variant="outline">
              Browse categories
            </ButtonLink>
          </div>
          <ul className="mt-8 flex max-w-lg flex-col gap-2.5 text-sm text-ink xs:flex-row xs:flex-wrap xs:gap-x-5">
            <li className="flex items-center gap-2">
              <Banknote className="size-[1.125rem] shrink-0 text-teal" aria-hidden="true" />
              Pay on delivery
            </li>
            <li className="flex items-center gap-2">
              <UserRoundCheck className="size-[1.125rem] shrink-0 text-teal" aria-hidden="true" />
              No account needed
            </li>
            {store?.whatsapp && (<li className="flex items-center gap-2">
              <MessageCircle className="size-[1.125rem] shrink-0 text-teal" aria-hidden="true" />
              Quick WhatsApp help
            </li>)}
          </ul>
        </div>

        <div className="relative">
          {/* playful accents */}
          <span aria-hidden="true" className="absolute -right-3 -top-3 hidden size-16 rounded-full bg-sun md:block" />
          <span aria-hidden="true" className="absolute -bottom-4 -left-4 hidden size-10 rounded-xl bg-teal md:block" />
          {store?.coverImageUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sand md:aspect-[5/4]">
              <SmartImage
                src={store.coverImageUrl}
                alt={`${store.name} store`}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : tiles.length >= 2 ? (
            <div className="relative grid grid-cols-2 gap-3">
              {tiles.map((p, i) => (
                <div
                  key={p.id}
                  className={`relative aspect-square overflow-hidden rounded-3xl ${["bg-coral-tint", "bg-sun-tint", "bg-teal-tint", "bg-sand"][i]}`}
                >
                  <SmartImage src={p.thumbnailUrl} alt="" fill priority={i < 2} sizes="(min-width: 768px) 25vw, 50vw" className="object-contain p-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl bg-coral-tint">
              <span className="font-display text-7xl font-extrabold tracking-tight text-coral/80">Play!</span>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
