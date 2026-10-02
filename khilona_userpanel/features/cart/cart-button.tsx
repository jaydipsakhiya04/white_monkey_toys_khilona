"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { selectCount, useCartStore } from "./cart-store";
import { cn } from "@/utils/cn";

export function CartCountBadge({ className }: { className?: string }) {
  const count = useCartStore(selectCount);
  const hydrated = useCartStore((s) => s.hydrated);
  if (!hydrated || count === 0) return null;
  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral-600 px-1 text-[0.6875rem] font-bold leading-none text-white ring-2 ring-surface",
        className,
      )}
      aria-hidden="true"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function useCartLabel() {
  const count = useCartStore(selectCount);
  const hydrated = useCartStore((s) => s.hydrated);
  return hydrated && count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";
}

export function CartButton() {
  const label = useCartLabel();
  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative grid size-11 place-items-center rounded-xl text-ink transition-colors hover:bg-sand"
    >
      <ShoppingBag className="size-[1.375rem]" aria-hidden="true" />
      <CartCountBadge />
    </Link>
  );
}
