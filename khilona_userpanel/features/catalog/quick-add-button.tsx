"use client";

import Link from "next/link";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { useAddToCart } from "@/features/cart/use-add-to-cart";
import type { ProductCard } from "@/types/api";

export function QuickAddButton({ product }: { product: ProductCard }) {
  const addToCart = useAddToCart();
  const [busy, setBusy] = useState(false);

  if (product.hasVariants) {
    return (
      <Link
        href={`/product/${product.slug}`}
        className={buttonClasses({ variant: "outline", size: "card", block: true })}
        aria-label={`Choose options for ${product.name}`}
      >
        <SlidersHorizontal className="hidden size-4 min-[360px]:block" aria-hidden="true" />
        Choose options
      </Link>
    );
  }

  if (!product.inStock) {
    return (
      <button type="button" disabled className={buttonClasses({ variant: "outline", size: "card", block: true })}>
        Out of stock
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      className={buttonClasses({ variant: "secondary", size: "card", block: true })}
      aria-label={`Add ${product.name} to cart`}
      onClick={() => {
        setBusy(true);
        addToCart({
          productId: product.id,
          variantId: null,
          quantity: 1,
          snapshot: {
            name: product.name,
            slug: product.slug,
            imageUrl: product.thumbnailUrl,
            unitPrice: product.effectivePrice,
            unitMrp: product.price,
            variantTitle: null,
            options: null,
            maxQuantity: Math.min(99, product.stock),
          },
        });
        window.setTimeout(() => setBusy(false), 400);
      }}
    >
      <Plus className="hidden size-4 min-[360px]:block" aria-hidden="true" />
      Add to cart
    </button>
  );
}
