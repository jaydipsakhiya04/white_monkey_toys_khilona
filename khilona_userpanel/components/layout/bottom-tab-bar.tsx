"use client";

import Link from "next/link";
import { Home, LayoutGrid, Search, ShoppingBag, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { CartCountBadge, useCartLabel } from "@/features/cart/cart-button";
import { cn } from "@/utils/cn";
import { MobileSearch } from "./mobile-search";

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
  const tone = (active: boolean) =>
    active
      ? "text-ink before:absolute before:top-0 before:h-[3px] before:w-8 before:rounded-b-full before:bg-accent before:content-['']"
      : "text-muted hover:text-ink";

  return (
    <>
      <nav
        aria-label="Primary"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 shadow-[0_-8px_30px_-12px_rgb(17_18_26/0.12)] backdrop-blur-xl md:hidden"
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
      <MobileSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
