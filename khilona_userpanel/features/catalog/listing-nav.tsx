"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useTransition, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type Patch = Record<string, string | null | undefined>;

type Ctx = {
  /** merge params into the URL (null/"" removes); resets page unless provided */
  update: (patch: Patch, opts?: { keepPage?: boolean }) => void;
  clearFilters: () => void;
  isPending: boolean;
  params: URLSearchParams;
};

const ListingNavContext = createContext<Ctx | null>(null);

const FILTER_KEYS = ["minPrice", "maxPrice", "inStock", "featured", "options"];

export function ListingNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const navigate = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const update = useCallback<Ctx["update"]>(
    (patch, opts) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!opts?.keepPage && !("page" in patch)) next.delete("page");
      navigate(next);
    },
    [navigate, searchParams],
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((k) => next.delete(k));
    next.delete("page");
    navigate(next);
  }, [navigate, searchParams]);

  const value = useMemo(() => ({ update, clearFilters, isPending, params }), [update, clearFilters, isPending, params]);
  return <ListingNavContext.Provider value={value}>{children}</ListingNavContext.Provider>;
}

export function useListingNav(): Ctx {
  const ctx = useContext(ListingNavContext);
  if (!ctx) throw new Error("useListingNav must be used inside ListingNavProvider");
  return ctx;
}

/** Dims results while a filter/sort navigation is in flight. */
export function PendingRegion({ children, className }: { children: ReactNode; className?: string }) {
  const { isPending } = useListingNav();
  return (
    <div
      className={cn("transition-opacity duration-150", isPending && "pointer-events-none opacity-50", className)}
      aria-busy={isPending || undefined}
    >
      {children}
    </div>
  );
}
