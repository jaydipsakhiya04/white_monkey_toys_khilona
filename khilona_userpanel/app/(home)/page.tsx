import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ErrorState } from "@/components/ui/error-state";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeader } from "@/components/ui/section-header";
import { CategoryCard } from "@/features/catalog/category-card";
import { ProductGrid } from "@/features/catalog/product-card";
import { Hero } from "@/features/store/hero";
import { StoreInfoCard, storeJsonLd } from "@/features/store/store-info";
import { absoluteUrl } from "@/lib/env";
import { safe } from "@/lib/api/server";
import { getCategoryTree, getProducts, getStore } from "@/services/catalog.server";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: "/" }, openGraph: { url: "/" } };
}

export default async function HomePage() {
  const [store, categories, featuredRes, latestRes] = await Promise.all([
    getStore(),
    getCategoryTree(),
    safe(getProducts({ featured: true, sort: "featured", limit: 10 })),
    safe(getProducts({ sort: "newest", limit: 10 })),
  ]);

  const featured = featuredRes.data?.items ?? [];
  // empty categories make a poor first impression on the home page
  const homeCategories = (categories ?? []).filter((c) => c.productCount > 0);
  const latest = latestRes.data?.items ?? [];
  const apiDown = !store && !categories && featuredRes.error && latestRes.error;
  // hide 9th/10th cards below 2xl so rows stay complete (4 cols → 8, 5 cols → 10)
  const rowFit = "[&>li:nth-child(n+9)]:hidden 2xl:[&>li:nth-child(n+9)]:block";

  return (
    <>
      {store && (
        <JsonLd
          data={[
            storeJsonLd(store),
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: store.name,
              url: absoluteUrl("/"),
              potentialAction: {
                "@type": "SearchAction",
                target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/products")}?search={search_term_string}` },
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
      )}

      <Hero store={store} showcase={featured.length ? featured : latest} />

      {apiDown ? (
        <Container className="py-12">
          <ErrorState />
        </Container>
      ) : (
        <>
          {homeCategories.length > 0 && (
            <section aria-labelledby="cats-title" className="py-12 sm:py-16">
              <Container>
                <SectionHeader
                  id="cats-title"
                  eyebrow="Shop by category"
                  title="Find the perfect pick"
                  href="/categories"
                  linkLabel="All categories"
                />
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
                  {homeCategories.slice(0, 12).map((c, i) => (
                    <li key={c.id}>
                      <CategoryCard category={c} index={i} />
                    </li>
                  ))}
                </ul>
              </Container>
            </section>
          )}

          {featured.length > 0 && (
            <section aria-labelledby="featured-title" className="border-y border-line bg-sand/60 py-12 sm:py-16">
              <Container>
                <SectionHeader
                  id="featured-title"
                  eyebrow="Featured"
                  title="Our favourite finds"
                  description="Hand-picked toys and games families keep coming back for."
                  href="/products?featured=true"
                />
                <ProductGrid products={featured} className={rowFit} />
              </Container>
            </section>
          )}

          {latest.length > 0 && (
            <section aria-labelledby="latest-title" className="py-12 sm:py-16">
              <Container>
                <SectionHeader id="latest-title" eyebrow="Just arrived" title="Latest products" href="/products?sort=newest" />
                <ProductGrid products={latest} className={rowFit} />
              </Container>
            </section>
          )}

          {featuredRes.error && latestRes.error && (
            <Container className="py-8">
              <ErrorState title="Products are taking a nap" description="We couldn't load products right now. Please try again." />
            </Container>
          )}

          {store && (
            <section aria-label="Store information" className="pb-4 pt-4 sm:pt-8">
              <Container>
                <StoreInfoCard store={store} />
              </Container>
            </section>
          )}
        </>
      )}
    </>
  );
}
