import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { ProductListing } from "@/features/catalog/product-listing";
import { getStore } from "@/services/catalog.server";
import { parseListingParams, type RawSearchParams } from "@/utils/listing";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = parseListingParams(await searchParams);
  const store = await getStore();
  const storeName = store?.name ?? "KHILONA";
  if (params.search) {
    return {
      title: `Search results for “${params.search}”`,
      description: `Products matching “${params.search}” at ${storeName}.`,
      alternates: { canonical: "/products" },
      robots: { index: false, follow: true },
    };
  }
  const title = params.featured ? "Featured products" : "Shop all products";
  return {
    title,
    description: `Browse all toys, games and gifts at ${storeName}. Order online and pay on delivery.`,
    alternates: { canonical: params.page > 1 ? `/products?page=${params.page}` : "/products" },
    openGraph: { url: "/products", title },
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = parseListingParams(raw);
  const heading = params.search ? "Search results" : params.featured ? "Featured products" : "All products";

  return (
    <Container className="py-6 sm:py-10">
      <Breadcrumbs items={[{ name: params.search ? "Search" : "All products" }]} />
      <header className="mb-6 mt-4 sm:mb-8">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">{heading}</h1>
        {params.search && (
          <p className="mt-2 text-muted">
            Showing products for <span className="font-semibold text-ink">“{params.search}”</span>
          </p>
        )}
      </header>
      <ProductListing basePath="/products" params={params} rawSearchParams={raw} showCategories searchLabel="Search all products" />
    </Container>
  );
}
