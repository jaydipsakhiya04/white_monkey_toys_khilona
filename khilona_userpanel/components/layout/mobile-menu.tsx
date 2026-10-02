"use client";

import Link from "next/link";
import { Menu, Package, Phone, ShoppingBag, Store as StoreIcon, Truck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/overlay";
import type { CategorySummary } from "@/types/api";

export function MobileMenu({ categories, storeName }: { categories: CategorySummary[]; storeName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/", label: "Home", icon: StoreIcon },
    { href: "/products", label: "All products", icon: Package },
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
        className="grid size-11 place-items-center rounded-xl text-ink hover:bg-sand"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="left" title={storeName}>
        <nav aria-label="Mobile" className="px-3 py-3">
          <ul className="space-y-0.5">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex h-12 items-center gap-3 rounded-xl px-3 font-semibold text-ink hover:bg-sand"
                  aria-current={pathname === l.href ? "page" : undefined}
                >
                  <l.icon className="size-5 text-muted" aria-hidden="true" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {categories.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-muted">Categories</p>
              <ul className="mt-2 space-y-0.5">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/category/${c.slug}`} className="flex min-h-11 items-center rounded-xl px-3 font-semibold text-ink hover:bg-sand">
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
