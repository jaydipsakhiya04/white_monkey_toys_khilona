import Link from "next/link";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartImage } from "@/components/ui/smart-image";
import type { ProductCard as ProductCardType } from "@/types/api";
import { cn } from "@/utils/cn";
import { QuickAddButton } from "./quick-add-button";

export function StockHint({ product, className }: { product: Pick<ProductCardType, "stock" | "stockStatus" | "inStock">; className?: string }) {
  if (!product.inStock || product.stockStatus === "OUT_OF_STOCK") {
    return <p className={cn("text-xs font-semibold text-danger-700", className)}>Out of stock</p>;
  }
  if (product.stockStatus === "LOW_STOCK") {
    return <p className={cn("text-xs font-semibold text-coral-700", className)}>Only {product.stock} left</p>;
  }
  return <p className={cn("text-xs font-medium text-success-700", className)}>In stock</p>;
}

export function ProductCard({ product, priority, headingLevel = "h3" }: { product: ProductCardType; priority?: boolean; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  const href = `/product/${product.slug}`;
  const soldOut = !product.inStock;
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-2 transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-soft sm:p-2.5">
      <Link href={href} className="relative block aspect-square overflow-hidden rounded-xl bg-sand" tabIndex={-1} aria-hidden="true">
        <SmartImage
          src={product.thumbnailUrl}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 280px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={cn("object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]", soldOut && "opacity-60")}
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {product.discountPercent > 0 && !product.hasVariants && (
            <span className="rounded-full bg-coral-600 px-2 py-0.5 text-[0.6875rem] font-bold text-white">-{product.discountPercent}%</span>
          )}
          {product.isFeatured && <span className="rounded-full bg-sun px-2 py-0.5 text-[0.6875rem] font-bold text-ink">Featured</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3 sm:px-1.5">
        <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">{product.category.name}</p>
        <H className="mt-1 font-sans text-sm font-semibold leading-snug tracking-normal text-ink sm:text-[0.9375rem]">
          <Link href={href} className="line-clamp-2 rounded after:absolute after:inset-0 after:content-[''] hover:text-coral-700 focus-visible:outline-none">
            {product.name}
          </Link>
        </H>
        <div className="mt-auto pt-2">
          <Price
            price={product.price}
            effectivePrice={product.effectivePrice}
            discountPercent={product.discountPercent}
            minPrice={product.hasVariants ? product.minPrice : undefined}
            maxPrice={product.hasVariants ? product.maxPrice : undefined}
            size="sm"
            showBadge={false}
          />
          <StockHint product={product} className="mt-0.5" />
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
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-2 sm:p-2.5">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2 px-1 pb-1 pt-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-3 h-5 w-1/2" />
        <Skeleton className="mt-3 h-9 w-full" />
      </div>
    </div>
  );
}

export const productGridClass = {
  default: "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5",
  /** next to a filter sidebar */
  listing: "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 3xl:grid-cols-5",
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
