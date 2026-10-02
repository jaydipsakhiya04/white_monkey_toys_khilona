"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { SmartImage } from "@/components/ui/smart-image";
import { useFocusTrap } from "@/hooks/use-focus-trap";

type Img = { url: string; alt: string };

/** Full-screen image viewer: click / tap to zoom 2.5× around the pointer, arrows to browse. */
export function ImageZoom({ images, index, onIndex, onClose }: { images: Img[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  useFocusTrap(ref, true, onClose);
  const img = images[index];

  const track = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const go = (i: number) => {
    setZoomed(false);
    onIndex((i + images.length) % images.length);
  };

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`${img.alt} — image ${index + 1} of ${images.length}`}
      tabIndex={-1}
      className="fixed inset-0 z-[90] flex animate-fade-in flex-col bg-white focus:outline-none"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-muted tabular-nums">
          {index + 1} / {images.length}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
            className="grid size-11 place-items-center rounded-full text-ink hover:bg-sand"
          >
            {zoomed ? <ZoomOut className="size-5" aria-hidden="true" /> : <ZoomIn className="size-5" aria-hidden="true" />}
          </button>
          <button type="button" onClick={onClose} aria-label="Close image viewer" className="grid size-11 place-items-center rounded-full text-ink hover:bg-sand">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        className={`relative flex-1 overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onClick={() => setZoomed((z) => !z)}
        onPointerMove={zoomed ? track : undefined}
        onPointerDown={track}
      >
        <div className="absolute inset-0 transition-transform duration-200 ease-out" style={{ transform: zoomed ? "scale(2.5)" : "none", transformOrigin: origin }}>
          <SmartImage src={img.url} alt={img.alt} fill sizes="100vw" className="object-contain p-4 sm:p-10" />
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-3 px-4 py-4">
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous image" className="grid size-11 place-items-center rounded-full border border-line hover:border-ink">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next image" className="grid size-11 place-items-center rounded-full border border-line hover:border-ink">
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
