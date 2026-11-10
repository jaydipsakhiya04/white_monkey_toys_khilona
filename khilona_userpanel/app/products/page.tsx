import { brandName } from "@/lib/brand";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { ProductListing } from "@/features/catalog/product-listing";
import { getStore } from "@/services/catalog.server";
import { parseListingParams, type RawSearchParams } from "@/utils/listing";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = parseListingParams(await searchParams);
  const store = await getStore();
  const storeName = brandName(store);
  if (params.search) {
    return {
      title: `Search results for “${params.search}”`,
      description: `Products matching “${params.search}” at ${storeName}.`,
      alternates: { canonical: "/products" },
      robots: { index: false, follow: true },
    };
  }
  const city = store?.city;
  const title = params.featured ? "Featured toys" : city ? `Wholesale toys from ${city}` : "Wholesale toys";
  return {
    title,
    description: city
      ? `Browse the full catalogue of ${storeName}, toy wholesaler in ${city}: RC cars, construction RC, drones and action figures for retailers and wholesalers, delivered PAN India.`
      : `Browse the full wholesale catalogue of ${storeName}, delivered PAN India.`,
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
      <PageBanner
        className="mb-8 sm:mb-10"
        eyebrow={params.search ? "Search" : params.featured ? "Bestsellers" : "Wholesale catalogue"}
        title={heading}
        description={
          params.search ? (
            <p>
              Showing products for <span className="font-semibold text-ink">“{params.search}”</span>
            </p>
          ) : (
            <p>RC cars, construction RC, drones and action figures for retailers and wholesalers. Ask for prices on WhatsApp.</p>
          )
        }
      />
      <ProductListing basePath="/products" params={params} rawSearchParams={raw} showCategories searchLabel="Search all products" />
    </Container>
  );
}
