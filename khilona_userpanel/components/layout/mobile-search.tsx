"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense, useRef } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useMounted } from "@/hooks/use-mounted";
import { SearchForm } from "./header-search";

const QUICK_LINKS = [
  { href: "/products?sort=newest", label: "New arrivals" },
  { href: "/products?featured=true", label: "Featured" },
  { href: "/category/hobby-grade-rc-cars", label: "Hobby-grade RC" },
  { href: "/category/drones-and-rc-aircraft", label: "Drones" },
  { href: "/category/action-figures", label: "Action figures" },
  { href: "/categories", label: "All categories" },
];

/**
 * Full-screen search for phones. Anchored to the top of the screen so the on-screen keyboard
 * never covers or crops the field or the results (a bottom sheet gets pushed up and clipped).
 */
export function MobileSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  useFocusTrap(ref, open, onClose);
  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Search the store"
      className="fixed inset-0 z-[90] flex animate-fade-in flex-col bg-surface"
    >
      <div className="flex items-center gap-1 border-b border-line px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="grid size-11 shrink-0 place-items-center rounded-full text-ink hover:bg-sand"
          aria-label="Close search"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <p className="text-base font-bold text-ink">Search</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4">
        <Suspense>
          <SearchForm inline autoFocus onSubmitted={onClose} inputClassName="h-12" />
        </Suspense>
        <p className="mt-6 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">Popular</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
