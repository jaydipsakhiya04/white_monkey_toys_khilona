import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/features/catalog/product-card";

export default function Loading() {
  return (
    <div aria-busy="true">
      <Container className="grid gap-8 py-8 sm:py-12 md:grid-cols-2 lg:py-16">
        <div className="space-y-4">
          <Skeleton className="h-14 w-4/5" />
          <Skeleton className="h-14 w-3/5" />
          <Skeleton className="h-5 w-full max-w-md" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-12 w-36" />
            <Skeleton className="h-12 w-44" />
          </div>
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
      </Container>
      <Container className="py-10">
        <Skeleton className="mb-6 h-8 w-64" />
        <ProductGridSkeleton count={8} />
      </Container>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
