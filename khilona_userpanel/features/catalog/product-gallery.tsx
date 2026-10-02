"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/utils/cn";

type GalleryImage = { url: string; alt: string };

export function ProductGallery({
  images,
  activeUrl,
  productName,
  badge,
}: {
  images: GalleryImage[];
  /** variant image to bring into view */
  activeUrl: string | null;
  productName: string;
  badge?: React.ReactNode;
}) {
  const list = useMemo(() => {
    if (activeUrl && !images.some((i) => i.url === activeUrl)) {
      return [{ url: activeUrl, alt: productName }, ...images];
    }
    return images;
  }, [images, activeUrl, productName]);

  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback((i: number, smooth = true) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, track.children.length - 1));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: clamped * track.clientWidth, behavior: smooth && !reduce ? "smooth" : "auto" });
    setIndex(clamped);
  }, []);

  // switch to the variant image when selection changes
  useEffect(() => {
    if (!activeUrl) return;
    const i = list.findIndex((img) => img.url === activeUrl);
    if (i >= 0) goTo(i);
  }, [activeUrl, list, goTo]);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index) setIndex(i);
  };

  if (list.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand">
        <SmartImage src={null} alt={productName} fill />
        {badge}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" aria-roledescription="carousel" aria-label={`${productName} images`}>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-3xl bg-sand"
          tabIndex={0}
          aria-label="Product images, swipe or use arrow keys"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              goTo(index + 1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              goTo(index - 1);
            }
          }}
        >
          {list.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              className="relative aspect-square w-full shrink-0 snap-center"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${list.length}`}
            >
              <SmartImage
                src={img.url}
                alt={img.alt || `${productName} – image ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(min-width: 1280px) 640px, (min-width: 768px) 50vw, 100vw"
                className="object-contain p-4 sm:p-8"
              />
            </div>
          ))}
        </div>
        {badge}
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/95 text-ink shadow-soft hover:bg-surface disabled:opacity-0 md:grid"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === list.length - 1}
              aria-label="Next image"
              className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/95 text-ink shadow-soft hover:bg-surface disabled:opacity-0 md:grid"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
              {list.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/25")} />
              ))}
            </div>
          </>
        )}
      </div>

      {list.length > 1 && (
        <ul className="no-scrollbar hidden gap-2.5 overflow-x-auto md:flex" aria-label="Choose image">
          {list.map((img, i) => (
            <li key={`t-${img.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative block size-20 overflow-hidden rounded-xl border-2 bg-sand transition-colors lg:size-[5.5rem]",
                  i === index ? "border-ink" : "border-transparent hover:border-line-strong",
                )}
              >
                <SmartImage src={img.url} alt="" fill sizes="88px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
