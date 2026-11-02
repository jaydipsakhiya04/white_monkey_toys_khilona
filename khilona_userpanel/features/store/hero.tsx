import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Banknote, MapPin, MessageCircle, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import type { PublicStore } from "@/types/api";
import { cn } from "@/utils/cn";
import { HERO_FALLBACK, storeHours } from "./store-utils";

/** "Little Moments. Big Adventures." → one line per sentence; the final word carries the accent. */
function TitleLines({ title }: { title: string }) {
  const lines = title.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [title];
  return (
    <>
      {lines.map((line, i) => {
        const isLast = i === lines.length - 1;
        const cut = line.lastIndexOf(" ");
        if (!isLast || cut < 0) {
          return (
            <span key={i} className="block">
              {line}
            </span>
          );
        }
        return (
          <span key={i} className="block">
            {line.slice(0, cut)} <span className="text-accent">{line.slice(cut + 1)}</span>
          </span>
        );
      })}
    </>
  );
}

/**
 * Art-directed scene of brand imagery: transparent cut-outs in /public/hero, made from the store's
 * own product photography. It is deliberately independent of the catalogue — no product links,
 * names or prices — so the hero looks the same with 0 or 500 products listed. Items are drawn back
 * to front; positions are percentages of a square stage.
 */
const SCENE = [
  { src: "/hero/scene-helicopter.webp", w: 800, h: 622, style: { left: "3%", top: "5%", width: "46%" }, float: true, fadeRight: true },
  { src: "/hero/scene-jimny.webp", w: 722, h: 464, style: { left: "0%", top: "45%", width: "42%" }, shadow: true },
  { src: "/hero/scene-excavator.webp", w: 912, h: 921, style: { right: "1%", top: "15%", width: "55%" }, shadow: true },
  { src: "/hero/scene-supra.webp", w: 502, h: 239, style: { left: "30%", bottom: "5%", width: "42%" }, shadow: true },
] as const;

function Scene() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[40rem]" aria-hidden="true">
      {/* studio pedestal: a soft white disc and two hairline rings */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_50px_100px_-50px_rgb(17_17_17/0.3)]" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[98%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/[0.06]" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-black/[0.05]" />
      {SCENE.map((item, i) => (
        <div
          key={item.src}
          className={cn("absolute animate-rise", "float" in item && item.float && "lg:animate-float")}
          style={{ ...item.style, animationDelay: `${180 + i * 90}ms` }}
        >
          {/* contact shadow grounding the item on the stage */}
          {"shadow" in item && item.shadow && <span className="absolute inset-x-[14%] -bottom-[1%] h-[10%] rounded-[50%] bg-black/15 blur-xl" />}
          <Image
            src={item.src}
            alt=""
            width={item.w}
            height={item.h}
            priority={i < 2}
            sizes="(min-width: 1024px) 22rem, 50vw"
            className={cn("relative h-auto w-full", "fadeRight" in item && item.fadeRight && "[mask-image:linear-gradient(90deg,#000_82%,transparent)]")}
          />
        </div>
      ))}
    </div>
  );
}

/** The store's own cover photo (Admin → Store settings), when one is uploaded. */
function CoverPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgb(17_17_17/0.35)] sm:aspect-[5/4] lg:aspect-[4/5]">
      <SmartImage src={src} alt={alt} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
    </div>
  );
}

/** Live store status (open now · hours) — real store data, no product dependency. */
function StoreLine({ store }: { store: PublicStore }) {
  const hours = storeHours(store);
  if (!hours) return null;
  return (
    <p className="mt-6 flex animate-rise flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted [animation-delay:300ms]">
      <span className="inline-flex items-center gap-2 font-semibold text-ink">
        <span className="relative flex size-2" aria-hidden="true">
          {store.isOpenNow && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />}
          <span className={cn("relative inline-flex size-2 rounded-full", store.isOpenNow ? "bg-success" : "bg-line-strong")} />
        </span>
        {store.isOpenNow ? "Open now" : "Currently closed"}
      </span>
      <span>{hours}</span>
    </p>
  );
}

export function Hero({ store }: { store: PublicStore | null }) {
  const title = store?.heroTitle?.trim() || HERO_FALLBACK.title;
  const subtitle = store?.heroSubtitle?.trim() || HERO_FALLBACK.subtitle;
  const cta = store?.heroCtaLabel?.trim() || HERO_FALLBACK.cta;
  const city = store?.city || "Surat";
  const locality = city.toLowerCase() === "surat" ? "Varachha, Surat" : city;
  const trust = [
    { Icon: Truck, label: `Free delivery in ${city}` },
    { Icon: Banknote, label: "Cash on Delivery" },
    { Icon: MessageCircle, label: "WhatsApp support" },
  ];

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-line bg-sand">
      {/* studio backdrop: soft spotlight behind the scene and a faint dot grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-1/2 aspect-square w-[70rem] max-w-[95vw] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#fff,rgb(255_255_255/0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(17_17_17/0.05)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(90deg,#000,transparent_70%)]" />
      </div>

      <Container className="grid items-center gap-8 pb-10 pt-10 sm:pt-14 lg:min-h-[min(46rem,calc(100dvh-7rem))] lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:py-14 xl:gap-16">
        <div className="max-w-xl">
          <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-black/[0.07] bg-white/80 py-1.5 pl-2 pr-3.5 text-xs font-semibold text-ink shadow-soft backdrop-blur">
            <span className="grid size-5 place-items-center rounded-full bg-ink text-white">
              <MapPin className="size-3" strokeWidth={2} aria-hidden="true" />
            </span>
            Toy shop in {locality}
            <span className="h-3 w-px bg-black/15" aria-hidden="true" />
            <span className="text-muted">Retail &amp; Wholesale</span>
          </p>
          <h1
            id="hero-title"
            className="mt-7 animate-rise text-[2.3rem] font-extrabold leading-[0.98] tracking-[-0.05em] text-ink [animation-delay:60ms] xs:text-[3.25rem] sm:text-[4rem] xl:text-[4.9rem]"
          >
            <TitleLines title={title} />
          </h1>
          <p className="mt-6 max-w-[29rem] animate-rise text-base leading-relaxed text-muted [animation-delay:120ms] sm:text-[1.0625rem]">{subtitle}</p>
          <div className="mt-9 flex animate-rise flex-col gap-3 [animation-delay:180ms] xs:flex-row">
            <ButtonLink href="/products" size="lg" className="group">
              {cta}
              <ArrowRight className="size-[1.125rem] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/wholesale" size="lg" variant="outline" className="bg-white/70">
              Wholesale pricing
            </ButtonLink>
          </div>
          <ul className="mt-9 flex animate-rise flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-black/[0.07] pt-6 [animation-delay:240ms]">
            {trust.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium text-ink">
                <Icon className="size-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
          {store && <StoreLine store={store} />}
        </div>

        <div className="relative">
          {store?.coverImageUrl ? <CoverPhoto src={store.coverImageUrl} alt={`${store.name} store`} /> : <Scene />}

          {/* store facts floating on the scene (never products or prices) */}
          <div className="absolute right-0 top-[2%] hidden animate-rise items-center gap-2.5 rounded-full border border-white/80 bg-white/90 py-2 pl-2 pr-4 shadow-lift backdrop-blur [animation-delay:520ms] sm:flex">
            <span className="grid size-8 place-items-center rounded-full bg-sand text-ink">
              <Truck className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-[0.8125rem] font-semibold text-ink">Free delivery</span>
              <span className="block text-[0.6875rem] text-muted">Anywhere in {city}</span>
            </span>
          </div>
          <Link
            href="/wholesale#enquiry"
            className="group absolute bottom-[3%] left-0 hidden w-[16.5rem] animate-rise items-center gap-3 rounded-2xl bg-ink p-3.5 pr-4 text-white shadow-[0_30px_60px_-20px_rgb(17_17_17/0.55)] transition-transform [animation-delay:620ms] hover:-translate-y-0.5 sm:flex lg:-left-12"
          >
            <span className="min-w-0 leading-tight">
              <span className="block text-[0.625rem] font-bold uppercase tracking-[0.18em] text-white/50">For shops &amp; resellers</span>
              <span className="mt-1 block text-sm font-semibold">Retailer &amp; wholesale prices</span>
              <span className="mt-0.5 block text-xs text-white/60">Get a quote on WhatsApp</span>
            </span>
            <span className="ml-auto grid size-8 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform group-hover:rotate-45">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
