import { Container } from "./container";
import { Skeleton } from "./skeleton";
import { ProductGridSkeleton } from "@/features/catalog/product-card";

export function ListingPageSkeleton({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <Container className="py-6 sm:py-10" aria-busy="true" aria-label="Loading products">
      <Skeleton className="h-4 w-48" />
      {withHeader && <Skeleton className="mt-4 h-28 w-full rounded-3xl sm:h-36" />}
      <div className="mt-8 grid gap-8 lg:grid-cols-[15.5rem_1fr] xl:grid-cols-[17rem_1fr]">
        <div className="hidden space-y-4 lg:block">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div>
          <div className="flex gap-3">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-40" />
          </div>
          <ProductGridSkeleton count={8} layout="listing" className="mt-6" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </Container>
  );
}

export function ProductPageSkeleton() {
  return (
    <Container className="py-5 sm:py-8" aria-busy="true">
      <Skeleton className="h-4 w-64" />
      <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-6 h-10 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-11 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading product…</span>
    </Container>
  );
}

export function SimplePageSkeleton() {
  return (
    <Container className="py-6 sm:py-10" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-5 h-10 w-72" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </Container>
  );
}
