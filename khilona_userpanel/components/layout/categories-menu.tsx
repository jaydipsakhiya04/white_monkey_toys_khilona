"use client";

import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { CategorySummary } from "@/types/api";
import { cn } from "@/utils/cn";

/** Desktop "Categories" disclosure menu (keyboard + Esc + click-outside). */
export function CategoriesMenu({ categories }: { categories: CategorySummary[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-xl px-3.5 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-sand",
          open && "bg-sand",
        )}
      >
        <LayoutGrid className="size-[1.125rem]" aria-hidden="true" />
        Categories
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(44rem,calc(100vw-4rem))] rounded-2xl border border-line bg-surface p-5 shadow-lift"
      >
        {categories.length === 0 ? (
          <p className="text-sm text-muted">Categories are not available right now.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id} className="min-w-0">
                <Link
                  href={`/category/${c.slug}`}
                  className="block rounded-md font-display text-base font-bold text-ink hover:text-coral-600"
                >
                  {c.name}
                </Link>
                {c.children.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {c.children.map((ch) => (
                      <li key={ch.id}>
                        <Link href={`/category/${ch.slug}`} className="block rounded-md text-sm text-muted hover:text-ink">
                          {ch.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <Link href="/categories" className="text-sm font-semibold text-coral-600 hover:text-coral-700">
            Browse all categories
          </Link>
          <Link href="/products" className="text-sm font-semibold text-ink hover:text-coral-600">
            Shop all products →
          </Link>
        </div>
      </div>
    </div>
  );
}
