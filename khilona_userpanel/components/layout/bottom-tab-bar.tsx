"use client";

import Link from "next/link";
import { Home, LayoutGrid, Search, ShoppingBag, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Sheet } from "@/components/ui/overlay";
import { useAuth } from "@/features/auth/auth-provider";
import { CartCountBadge, useCartLabel } from "@/features/cart/cart-button";
import { cn } from "@/utils/cn";
import { SearchForm } from "./header-search";

const item =
  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors";

/** Thumb-friendly bottom navigation for < md screens. */
export function BottomTabBar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const cartLabel = useCartLabel();
  const { isAuthenticated } = useAuth();
  const accountHref = isAuthenticated ? "/account" : "/login";
  const accountActive = ["/account", "/login", "/signup"].some((p) => pathname.startsWith(p));
  useEffect(() => setSearchOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const tone = (active: boolean) => (active ? "text-ink" : "text-muted hover:text-ink");

  return (
    <>
      <nav
        aria-label="Primary"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-sm md:hidden"
      >
        <ul className="mx-auto flex h-[var(--tabbar-h)] max-w-lg items-stretch px-1">
          <li className="flex flex-1">
            <Link href="/" className={cn(item, tone(isActive("/")))} aria-current={isActive("/") ? "page" : undefined}>
              <Home className="size-[1.375rem]" aria-hidden="true" />
              Home
            </Link>
          </li>
          <li className="flex flex-1">
            <Link
              href="/categories"
              className={cn(item, tone(isActive("/categories") || isActive("/category/")))}
              aria-current={isActive("/categories") ? "page" : undefined}
            >
              <LayoutGrid className="size-[1.375rem]" aria-hidden="true" />
              Categories
            </Link>
          </li>
          <li className="flex flex-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-haspopup="dialog"
              className={cn(item, tone(isActive("/products")))}
            >
              <Search className="size-[1.375rem]" aria-hidden="true" />
              Search
            </button>
          </li>
          <li className="flex flex-1">
            <Link href="/cart" className={cn(item, tone(isActive("/cart") || isActive("/checkout")))} aria-label={cartLabel}>
              <span className="relative">
                <ShoppingBag className="size-[1.375rem]" aria-hidden="true" />
                <CartCountBadge className="-right-2.5 -top-1.5" />
              </span>
              Cart
            </Link>
          </li>
          <li className="flex flex-1">
            <Link href={accountHref} className={cn(item, tone(accountActive))} aria-current={accountActive ? "page" : undefined}>
              <UserRound className="size-[1.375rem]" aria-hidden="true" />
              {isAuthenticated ? "Account" : "Log in"}
            </Link>
          </li>
        </ul>
      </nav>
      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} side="bottom" title="Search the store">
        <div className="px-5 pb-8 pt-4">
          <Suspense>
            <SearchForm autoFocus onSubmitted={() => setSearchOpen(false)} inputClassName="h-12 text-base" />
          </Suspense>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/products?sort=newest" className="rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink">
              New arrivals
            </Link>
            <Link href="/products?featured=true" className="rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink">
              Featured
            </Link>
            <Link href="/categories" className="rounded-full border border-line px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-ink">
              All categories
            </Link>
          </div>
        </div>
      </Sheet>
    </>
  );
}
