import Link from "next/link";
import { Price } from "@/components/ui/price";
import { RatingSummaryInline } from "@/components/ui/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartImage } from "@/components/ui/smart-image";
import type { ProductCard as ProductCardType } from "@/types/api";
import { cn } from "@/utils/cn";
import { QuickAddButton } from "./quick-add-button";

export function StockHint({ product, className }: { product: Pick<ProductCardType, "stock" | "stockStatus" | "inStock">; className?: string }) {
  if (!product.inStock || product.stockStatus === "OUT_OF_STOCK") {
    return <p className={cn("text-xs font-medium text-danger-700", className)}>Out of stock</p>;
  }
  if (product.stockStatus === "LOW_STOCK") {
    return <p className={cn("text-xs font-medium text-ink", className)}>Only {product.stock} left</p>;
  }
  return <p className={cn("text-xs text-success-700", className)}>In stock</p>;
}

export function ProductCard({ product, priority, headingLevel = "h3" }: { product: ProductCardType; priority?: boolean; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  const href = `/product/${product.slug}`;
  const soldOut = !product.inStock;
  return (
    <article className="group relative flex h-full flex-col rounded-[1.75rem] border border-line bg-surface p-2 transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-transparent hover:shadow-lift sm:p-2.5">
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden rounded-[1.35rem] bg-sand"
        tabIndex={-1}
        aria-hidden="true"
      >
        <SmartImage
          src={product.thumbnailUrl}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={cn("object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]", soldOut && "opacity-55 grayscale-[35%]")}
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/[0.04] to-transparent" />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.discountPercent > 0 && !product.hasVariants && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[0.6875rem] font-bold leading-none text-midnight shadow-sm">
              −{product.discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="rounded-full bg-midnight/85 px-2.5 py-1 text-[0.6875rem] font-semibold leading-none text-white backdrop-blur">
              Bestseller
            </span>
          )}
        </div>
        {soldOut && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-surface px-2.5 py-1 text-[0.6875rem] font-semibold leading-none text-ink shadow-sm">
            Sold out
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3.5 sm:px-2">
        <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-deep">{product.category.name}</p>
        <H className="mt-1.5 font-sans text-sm font-semibold leading-snug tracking-normal text-ink sm:text-[0.9875rem]">
          <Link href={href} className="line-clamp-2 rounded after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </H>
        <RatingSummaryInline average={product.rating?.average ?? 0} count={product.rating?.count ?? 0} className="mt-1.5" />
        <div className="mt-auto pt-3">
          <Price
            price={product.price}
            effectivePrice={product.effectivePrice}
            discountPercent={product.discountPercent}
            minPrice={product.hasVariants ? product.minPrice : undefined}
            maxPrice={product.hasVariants ? product.maxPrice : undefined}
            size="md"
            showBadge={false}
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <StockHint product={product} />
            {product.hasVariants && <p className="truncate text-xs text-muted">More options</p>}
          </div>
          <div className="relative z-10 mt-3">
            <QuickAddButton product={product} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[1.75rem] border border-line bg-surface p-2 sm:p-2.5">
      <Skeleton className="aspect-square w-full rounded-[1.35rem]" />
      <div className="space-y-2 px-1.5 pb-1 pt-3.5 sm:px-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-3 h-5 w-1/2" />
        <Skeleton className="mt-3 h-9 w-full rounded-full" />
      </div>
    </div>
  );
}

export const productGridClass = {
  default: "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 2xl:grid-cols-5",
  /** home rows: always complete at 2 / 4 columns */
  home: "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4",
  /** next to a filter sidebar */
  listing: "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4 3xl:grid-cols-5",
} as const;

export function ProductGrid({
  products,
  priorityCount = 0,
  className,
  layout = "default",
}: {
  products: ProductCardType[];
  priorityCount?: number;
  className?: string;
  layout?: keyof typeof productGridClass;
}) {
  return (
    <ul className={cn(productGridClass[layout], className)}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
  layout = "default",
}: {
  count?: number;
  className?: string;
  layout?: keyof typeof productGridClass;
}) {
  return (
    <div className={cn(productGridClass[layout], className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
