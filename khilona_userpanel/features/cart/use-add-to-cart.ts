"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { useCartStore, type CartSnapshot } from "./cart-store";

/** Adds to the cart and shows a toast with a "View cart" action. */
export function useAddToCart() {
  const add = useCartStore((s) => s.add);
  const router = useRouter();

  return useCallback(
    (input: { productId: string; variantId: string | null; quantity: number; snapshot: CartSnapshot }, opts?: { silent?: boolean }) => {
      const res = add(input);
      if (opts?.silent) return res;
      const title = input.snapshot.variantTitle ? `${input.snapshot.name} (${input.snapshot.variantTitle})` : input.snapshot.name;
      if (res.added <= 0) {
        toast.warning(res.quantity > 0 ? "Maximum available quantity already in your cart" : "Your cart is full", {
          description: title,
          action: { label: "View cart", onClick: () => router.push("/cart") },
        });
      } else {
        toast.success(res.capped ? `Added ${res.added} (max available)` : "Added to cart", {
          description: title,
          action: { label: "View cart", onClick: () => router.push("/cart") },
        });
      }
      return res;
    },
    [add, router],
  );
}
