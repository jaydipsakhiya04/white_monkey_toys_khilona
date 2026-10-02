"use client";

import Link from "next/link";
import { LogOut, Menu, Package, Phone, ShoppingBag, Store as StoreIcon, Truck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/overlay";
import { firstName, useAuth } from "@/features/auth/auth-provider";
import type { CategorySummary } from "@/types/api";
import { ACCOUNT_LINKS, Avatar, useLogout } from "./account-menu";
import { Wordmark } from "./logo";

const row = "flex h-12 items-center gap-3 rounded-xl px-3 font-medium text-ink transition-colors hover:bg-sand";

export function MobileMenu({ categories, storeName }: { categories: CategorySummary[]; storeName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { status, customer } = useAuth();
  const doLogout = useLogout();
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/", label: "Home", icon: StoreIcon },
    { href: "/products", label: "Shop all toys", icon: Package },
    { href: "/cart", label: "Cart", icon: ShoppingBag },
    { href: "/track-order", label: "Track your order", icon: Truck },
    { href: "/contact", label: "Contact us", icon: Phone },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
        className="grid size-11 place-items-center rounded-full text-ink hover:bg-sand"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="left" title={<Wordmark name={storeName} compact markClassName="size-6" />}>
        <nav aria-label="Mobile" className="px-3 py-3">
          {/* Account */}
          <div className="mb-3 rounded-2xl bg-sand p-3">
            {status === "authenticated" && customer ? (
              <>
                <div className="flex items-center gap-3 px-1 pb-2">
                  <Avatar name={customer.name} className="size-10" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">Hi, {firstName(customer.name)}</p>
                    <p className="truncate text-xs text-muted">{customer.email ?? customer.phone}</p>
                  </div>
                </div>
                <ul className="space-y-0.5">
                  {ACCOUNT_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={`${row} h-11 hover:bg-surface`} aria-current={pathname === l.href ? "page" : undefined}>
                        <l.icon className="size-[1.125rem] text-muted" aria-hidden="true" />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button type="button" onClick={() => void doLogout()} className={`${row} h-11 w-full hover:bg-surface`}>
                      <LogOut className="size-[1.125rem] text-muted" aria-hidden="true" />
                      Log out
                    </button>
                  </li>
                </ul>
              </>
            ) : (
              <div className="p-1">
                <p className="text-sm font-semibold text-ink">Your account</p>
                <p className="mt-0.5 text-xs text-muted">Track orders, download invoices and review your toys.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong bg-surface text-sm font-semibold text-ink">
                    Log in
                  </Link>
                  <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </div>

          <ul className="space-y-0.5">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={row} aria-current={pathname === l.href ? "page" : undefined}>
                  <l.icon className="size-5 text-muted" aria-hidden="true" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {categories.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="eyebrow px-3">Categories</p>
              <ul className="mt-2 space-y-0.5">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/category/${c.slug}`} className="flex min-h-11 items-center rounded-xl px-3 font-medium text-ink hover:bg-sand">
                      {c.name}
                    </Link>
                    {c.children.length > 0 && (
                      <ul className="mb-1 ml-3 border-l border-line pl-2">
                        {c.children.map((ch) => (
                          <li key={ch.id}>
                            <Link
                              href={`/category/${ch.slug}`}
                              className="flex min-h-10 items-center rounded-lg px-3 text-sm text-muted hover:bg-sand hover:text-ink"
                            >
                              {ch.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </Sheet>
    </>
  );
}
