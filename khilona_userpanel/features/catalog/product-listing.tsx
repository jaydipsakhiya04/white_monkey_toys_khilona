import { PackageSearch, SearchX } from "lucide-react";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { safe } from "@/lib/api/server";
import { getFacets, getProducts } from "@/services/catalog.server";
import { countActiveFilters, toProductQuery, type ListingParams, type RawSearchParams } from "@/utils/listing";
import { FilterPanel } from "./filter-panel";
import { ListingNavProvider, PendingRegion } from "./listing-nav";
import { ListingToolbar } from "./listing-toolbar";
import { Pagination } from "./pagination";
import { ProductGrid } from "./product-card";
import { ClearFiltersButton } from "./clear-filters-button";

function toURLSearchParams(sp: RawSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") out.set(k, v);
    else if (Array.isArray(v) && v[0]) out.set(k, v[0]);
  }
  return out;
}

export async function ProductListing({
  basePath,
  params,
  rawSearchParams,
  category,
  showCategories,
  searchLabel,
}: {
  basePath: string;
  params: ListingParams;
  rawSearchParams: RawSearchParams;
  category?: string;
  showCategories?: boolean;
  searchLabel: string;
}) {
  const [productsRes, facetsRes] = await Promise.all([
    safe(getProducts(toProductQuery(params, category))),
    safe(getFacets({ category, search: params.search })),
  ]);
  const facets = facetsRes.data;
  const result = productsRes.data;
  const hasFilters = countActiveFilters(params) > 0;

  return (
    <Suspense>
      <ListingNavProvider>
        <div className="grid gap-8 lg:grid-cols-[15.5rem_1fr] xl:grid-cols-[17rem_1fr] xl:gap-10">
          <aside aria-label="Filters" className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-1">
              <h2 className="mb-5 text-lg font-bold">Filters</h2>
              <FilterPanel facets={facets} current={params} mode="sidebar" showCategories={showCategories} />
            </div>
          </aside>
          <div className="min-w-0">
            <ListingToolbar
              current={params}
              total={result?.meta.total ?? null}
              facets={facets}
              searchLabel={searchLabel}
              showCategories={showCategories}
            />
            <PendingRegion className="mt-6">
              {productsRes.error ? (
                <ErrorState
                  title="Products couldn't be loaded"
                  description="We're having trouble reaching the store. Please try again in a moment."
                  showHome={false}
                />
              ) : !result || result.items.length === 0 ? (
                params.page > 1 && result && result.meta.total > 0 ? (
                  <EmptyState icon={<PackageSearch />} title="This page is empty" description="There are fewer products than this page number.">
                    <ButtonLink href={basePath}>Go to first page</ButtonLink>
                  </EmptyState>
                ) : params.search ? (
                  <EmptyState
                    icon={<SearchX />}
                    title="No search results"
                    description={`We couldn't find anything for “${params.search}”. Try a different word or check the spelling.`}
                  >
                    <ButtonLink href={basePath}>Clear search</ButtonLink>
                    <ButtonLink href="/categories" variant="outline">
                      Browse categories
                    </ButtonLink>
                  </EmptyState>
                ) : (
                  <EmptyState
                    icon={<PackageSearch />}
                    title="No products found"
                    description={hasFilters ? "No products match these filters. Try removing a few." : "New products are on their way. Check back soon!"}
                  >
                    {hasFilters ? <ClearFiltersButton /> : <ButtonLink href="/products">Shop all products</ButtonLink>}
                  </EmptyState>
                )
              ) : (
                <>
                  <ProductGrid products={result.items} priorityCount={4} layout="listing" />
                  <Pagination meta={result.meta} basePath={basePath} searchParams={toURLSearchParams(rawSearchParams)} />
                </>
              )}
            </PendingRegion>
          </div>
        </div>
      </ListingNavProvider>
    </Suspense>
  );
}
