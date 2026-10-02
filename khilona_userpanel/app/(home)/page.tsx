import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ErrorState } from "@/components/ui/error-state";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeader } from "@/components/ui/section-header";
import { AccountCta } from "@/features/auth/account-cta";
import { CategoryCard } from "@/features/catalog/category-card";
import { ProductGrid } from "@/features/catalog/product-card";
import { Hero } from "@/features/store/hero";
import { HowOrderingWorks, WhySection } from "@/features/store/home-sections";
import { StoreInfoCard, storeJsonLd } from "@/features/store/store-info";
import { brandName } from "@/lib/brand";
import { absoluteUrl } from "@/lib/env";
import { safe } from "@/lib/api/server";
import { getCategoryTree, getProducts, getStore } from "@/services/catalog.server";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: "/" }, openGraph: { url: "/" } };
}

export default async function HomePage() {
  const [store, categories, featuredRes, popularRes] = await Promise.all([
    getStore(),
    getCategoryTree(),
    safe(getProducts({ featured: true, sort: "featured", limit: 10 })),
    safe(getProducts({ sort: "popular", limit: 10 })),
  ]);

  const name = brandName(store);
  const featured = featuredRes.data?.items ?? [];
  // empty categories make a poor first impression on the home page
  const homeCategories = (categories ?? []).filter((c) => c.productCount > 0);
  const featuredIds = new Set(featured.slice(0, 8).map((p) => p.id));
  // avoid repeating the featured row; fall back to the full list when the catalogue is small
  const popularAll = popularRes.data?.items ?? [];
  const popularFresh = popularAll.filter((p) => !featuredIds.has(p.id));
  const popular = popularFresh.length >= 4 ? popularFresh : popularAll;
  const apiDown = !store && !categories && featuredRes.error && popularRes.error;
  // Home rows use 2 / 3 / 4 columns. Show 8 or 4 cards (complete rows at 2 and 4 columns) and
  // hide the remainder on the 3-column breakpoint so no row is left half-empty.
  const fit = (list: typeof featured) => (list.length >= 8 ? list.slice(0, 8) : list.length >= 4 ? list.slice(0, 4) : list);
  const rowFit = (n: number) =>
    n >= 8 ? "sm:[&>li:nth-child(n+7)]:hidden lg:[&>li:nth-child(n+7)]:block" : n >= 4 ? "sm:[&>li:nth-child(n+4)]:hidden lg:[&>li:nth-child(n+4)]:block" : "";

  return (
    <>
      {store && (
        <JsonLd
          data={[
            storeJsonLd(store),
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name,
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

      <Hero store={store} showcase={featured.length ? featured : popular} />

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
            <section aria-labelledby="featured-title" className="py-12 sm:py-16">
              <Container>
                <SectionHeader
                  id="featured-title"
                  eyebrow="Featured"
                  title="Our favourite finds"
                  description="Hand-picked toys and games families keep coming back for."
                  href="/products?featured=true"
                />
                <ProductGrid products={fit(featured)} layout="home" className={rowFit(fit(featured).length)} />
              </Container>
            </section>
          )}

          {popular.length > 0 && (
            <section aria-labelledby="popular-title" className="py-12 sm:py-16">
              <Container>
                <SectionHeader
                  id="popular-title"
                  eyebrow="Popular"
                  title="Loved by our customers"
                  description="Ranked by verified reviews from families who received them."
                  href="/products?sort=popular"
                />
                <ProductGrid products={fit(popular)} layout="home" className={rowFit(fit(popular).length)} />
              </Container>
            </section>
          )}

          {featuredRes.error && popularRes.error && (
            <Container className="py-8">
              <ErrorState title="Something went wrong." description="We couldn't load toys right now. Please try again." />
            </Container>
          )}

          <WhySection storeName={name} />
          <HowOrderingWorks store={store} />

          {store && (
            <section aria-label="Store information" className="pt-16 sm:pt-24">
              <Container>
                <StoreInfoCard store={store} />
              </Container>
            </section>
          )}

          <AccountCta />
        </>
      )}
    </>
  );
}
