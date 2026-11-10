"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import type { Banner } from "@/types/api";
import { cn } from "@/utils/cn";

const INTERVAL_MS = 5500;

function SlideLink({ banner, children, className }: { banner: Banner; children: ReactNode; className?: string }) {
  const href = banner.linkUrl;
  const label = banner.title ?? banner.ctaLabel ?? "View offer";
  if (!href) return <div className={className}>{children}</div>;
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
      {children}
    </a>
  );
}

function Slide({ banner, index, total, priority }: { banner: Banner; index: number; total: number; priority: boolean }) {
  const hasText = !!(banner.title || banner.subtitle);
  return (
    <div role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${total}`} className="w-full shrink-0 snap-start snap-always">
      <SlideLink banner={banner} className="group relative block overflow-hidden rounded-2xl bg-sand ring-1 ring-black/[0.04] sm:rounded-[1.5rem]">
        {/* compact frame: phones 5:4 (or 16:9 without phone art), tablets 16:5, desktop 7:2 */}
        <div className={cn("relative w-full sm:aspect-[16/5] lg:aspect-[7/2]", banner.mobileImageUrl ? "aspect-[5/4]" : "aspect-[16/9]")}>
          {banner.mobileImageUrl && (
            <SmartImage
              src={banner.mobileImageUrl}
              alt={banner.title ?? ""}
              fill
              priority={priority}
              sizes="100vw"
              className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.02] sm:hidden"
            />
          )}
          <SmartImage
            src={banner.imageUrl}
            alt={banner.mobileImageUrl ? "" : (banner.title ?? "")}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 1232px, 100vw"
            className={cn("object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.02]", banner.mobileImageUrl && "max-sm:hidden")}
          />
          {hasText && (
            <>
              {/* light scrim only where the text sits (designed banners already carry a dark text panel) */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 via-45% to-transparent sm:bg-gradient-to-r sm:from-black/40 sm:via-black/5 sm:via-35% sm:to-transparent sm:to-55%"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:inset-y-0 sm:right-auto sm:flex sm:w-[44%] sm:flex-col sm:justify-center sm:px-8 sm:py-6 lg:px-12">
                {banner.title && (
                  <p className="text-balance text-lg font-bold leading-tight tracking-tight text-white sm:text-[1.5rem] lg:text-[1.875rem]">{banner.title}</p>
                )}
                {banner.subtitle && (
                  <p className="mt-1 line-clamp-1 max-w-[22rem] text-[0.8125rem] leading-snug text-white/80 sm:mt-2 sm:line-clamp-2 sm:text-sm">{banner.subtitle}</p>
                )}
                {banner.linkUrl && (
                  <span className="mt-3 inline-flex h-8 w-fit items-center gap-1.5 rounded-full bg-white px-3.5 text-[0.8125rem] font-semibold text-ink transition-transform group-hover:translate-x-0.5 sm:mt-4 sm:h-9 sm:px-4">
                    {banner.ctaLabel || "Shop now"}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </SlideLink>
    </div>
  );
}

/** Home page offer slider. Slides come from Admin → Banners (active and within their schedule). */
export function BannerSlider({ banners }: { banners: Banner[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const count = banners.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const on = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el || count === 0) return;
      const next = (i + count) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    },
    [count, reduceMotion],
  );

  // track the visible slide (swipe, arrows, autoplay)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // autoplay
  useEffect(() => {
    if (count < 2 || paused || userPaused || reduceMotion) return;
    const t = window.setTimeout(() => goTo(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(t);
  }, [index, count, paused, userPaused, reduceMotion, goTo]);

  if (count === 0) return null;

  return (
    <section aria-roledescription="carousel" aria-label="Offers" className="pt-5 sm:pt-8">
      <Container>
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
        >
          <div
            ref={trackRef}
            aria-live={paused || userPaused ? "polite" : "off"}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl sm:rounded-[1.5rem]"
          >
            {banners.map((b, i) => (
              <Slide key={b.id} banner={b} index={i} total={count} priority={i === 0} />
            ))}
          </div>

          {count > 1 && (
            <div className="absolute bottom-3 right-3 hidden gap-1.5 sm:flex lg:bottom-4 lg:right-4">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                className="grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow-lift backdrop-blur transition hover:bg-white"
                aria-label="Previous offer"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow-lift backdrop-blur transition hover:bg-white"
                aria-label="Next offer"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {count > 1 && (
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose offer">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Offer ${i + 1}${b.title ? `: ${b.title}` : ""}`}
                  onClick={() => goTo(i)}
                  className="grid h-6 place-items-center px-0.5"
                >
                  <span className={cn("block h-1.5 rounded-full transition-all duration-300", i === index ? "w-7 bg-ink" : "w-1.5 bg-line-strong hover:bg-muted")} />
                </button>
              ))}
            </div>
            {!reduceMotion && (
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                className="grid size-7 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink"
                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
              >
                {userPaused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
              </button>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
