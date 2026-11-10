import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ErrorState } from "@/components/ui/error-state";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeader } from "@/components/ui/section-header";
import { AccountCta } from "@/features/auth/account-cta";
import { CategoryCard } from "@/features/catalog/category-card";
import { ProductGrid } from "@/features/catalog/product-card";
import { BannerSlider } from "@/features/store/banner-slider";
import { Hero } from "@/features/store/hero";
import { ShopByAge, ShopByPrice } from "@/features/store/shop-by";
import { HowOrderingWorks, PromoBanners, SocialSection, WhySection, type PromoBanner } from "@/features/store/home-sections";
import { LocalSection, WholesaleBand } from "@/features/store/local-sections";
import { StoreInfoCard, storeJsonLd } from "@/features/store/store-info";
import { brandName } from "@/lib/brand";
import { absoluteUrl } from "@/lib/env";
import { safe } from "@/lib/api/server";
import { getAgeGroups, getBanners, getCategoryTree, getProducts, getStore } from "@/services/catalog.server";
import type { CategorySummary, ProductCard } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: "/" }, openGraph: { url: "/" } };
}

function flatten(categories: CategorySummary[]): CategorySummary[] {
  return categories.flatMap((c) => [c, ...flatten(c.children ?? [])]);
}

/** Round-robin across categories so a row shows variety instead of one category's first items. */
function interleaveByCategory(products: ProductCard[], exclude: Set<string>): ProductCard[] {
  const groups = new Map<string, ProductCard[]>();
  const seen = new Set(exclude);
  for (const p of products) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    groups.set(p.category.id, [...(groups.get(p.category.id) ?? []), p]);
  }
  const queues = [...groups.values()];
  const out: ProductCard[] = [];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
}

/** Banner copy, matched to real categories by keyword (falls back to the largest categories). */
const BANNER_PLANS = [
  {
    match: /\b(rc|remote|car|vehicle|drone)/i,
    eyebrow: "Play without limits",
    title: "Adventure Starts Here",
    body: "Discover exciting RC cars, off-road trucks, drones and more.",
    cta: "Shop Toys",
    dark: true,
  },
  {
    match: /\b(figure|collect|die-?cast|model|game|puzzle|learn)/i,
    eyebrow: "Think. Play. Grow.",
    title: "Make Every Playtime Count",
    body: "Explore action figures, licensed collectibles and display scenes for every collector.",
    cta: "Explore Collection",
    dark: false,
  },
];

export default async function HomePage() {
  const [store, categories, featuredRes, popularRes, newestRes, banners, ageGroups] = await Promise.all([
    getStore(),
    getCategoryTree(),
    safe(getProducts({ featured: true, sort: "featured", limit: 12 })),
    safe(getProducts({ sort: "popular", limit: 24 })),
    safe(getProducts({ sort: "newest", limit: 16 })),
    getBanners(),
    getAgeGroups(),
  ]);

  const name = brandName(store);
  const featured = featuredRes.data?.items ?? [];
  const popularAll = popularRes.data?.items ?? [];
  // empty categories make a poor first impression on the home page
  const homeCategories = (categories ?? []).filter((c) => c.productCount > 0);
  const apiDown = !store && !categories && featuredRes.error && popularRes.error;

  // the most popular few from every top-level category, so lower rows mix the whole store
  const perCategory = await Promise.all(homeCategories.slice(0, 10).map((c) => safe(getProducts({ category: c.slug, sort: "popular", limit: 6 }))));
  const pool = [...perCategory.flatMap((r) => r.data?.items ?? []), ...popularAll];

  // "Find their next favourite": the featured products (the hero itself never depends on the catalogue)
  const favourites = featured.slice(0, 8);
  const shown = new Set(favourites.map((p) => p.id));
  const bestsellers = interleaveByCategory(pool, shown).slice(0, 8);
  bestsellers.forEach((p) => shown.add(p.id));
  const socialProducts = interleaveByCategory(pool, shown).slice(0, 6);
  // "Fresh drops": the newest listings not already shown above
  const newArrivals = interleaveByCategory(newestRes.data?.items ?? [], shown).slice(0, 8);

  // promo banners: one RC-style category and one collectibles-style category, each with its own photos
  const live = flatten(categories ?? []).filter((c) => c.productCount > 0);
  const bySize = [...live].sort((a, b) => b.productCount - a.productCount);
  const used = new Set<string>();
  const bannerCategories = BANNER_PLANS.map((plan) => {
    const category = live.find((c) => plan.match.test(`${c.name} ${c.slug}`) && !used.has(c.id)) ?? bySize.find((c) => !used.has(c.id));
    if (category) used.add(category.id);
    return category;
  });
  const bannerProducts = await Promise.all(
    bannerCategories.map((c) => (c ? safe(getProducts({ category: c.slug, sort: "featured", limit: 12 })) : Promise.resolve(null))),
  );
  const promos: PromoBanner[] = BANNER_PLANS.flatMap((plan, i) => {
    const category = bannerCategories[i];
    const items = bannerProducts[i]?.data?.items ?? [];
    // prefer photos not already shown above, but never leave a banner without one
    const fresh = items.filter((p) => !favourites.some((f) => f.id === p.id));
    return category ? [{ ...plan, category, products: (fresh.length >= 2 ? fresh : items).slice(0, 2) }] : [];
  });

  // complete rows at 2 and 4 columns; hide the remainder on the 3-column breakpoint
  const fit = (list: ProductCard[]) => (list.length >= 8 ? list.slice(0, 8) : list.length >= 4 ? list.slice(0, 4) : list);
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

      <Hero store={store} />
      <BannerSlider banners={banners} />

      {apiDown ? (
        <Container className="py-12">
          <ErrorState />
        </Container>
      ) : (
        <>
          {homeCategories.length > 0 && (
            <section aria-labelledby="cats-title" className="py-14 sm:py-20">
              <Container>
                <SectionHeader
                  id="cats-title"
                  eyebrow="Shop by category"
                  title="Explore the collection"
                  description="RC cars, construction RC, drones and action figures."
                  href="/categories"
                  linkLabel="All categories"
                />
                <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-5">
                  {homeCategories.slice(0, 14).map((c, i) => (
                    <li key={c.id} className="w-[42vw] shrink-0 snap-start sm:w-auto">
                      <CategoryCard category={c} index={i} />
                    </li>
                  ))}
                </ul>
              </Container>
            </section>
          )}

          <ShopByAge groups={ageGroups} />

          {favourites.length > 0 && (
            <section aria-labelledby="featured-title" className="pb-14 sm:pb-20">
              <Container>
                <SectionHeader
                  id="featured-title"
                  eyebrow="Featured"
                  title="Find Their Next Favourite"
                  description="Hand-picked toys our customers love."
                  href="/products?featured=true"
                />
                <ProductGrid products={fit(favourites)} layout="home" className={rowFit(fit(favourites).length)} />
              </Container>
            </section>
          )}

          <PromoBanners banners={promos} />

          {bestsellers.length > 0 && (
            <section aria-labelledby="popular-title" className="py-14 sm:py-20">
              <Container>
                <SectionHeader
                  id="popular-title"
                  eyebrow="Best sellers"
                  title="Best Selling Picks"
                  description="The most-loved toys across the store."
                  href="/products?sort=popular"
                />
                <ProductGrid products={fit(bestsellers)} layout="home" className={rowFit(fit(bestsellers).length)} />
              </Container>
            </section>
          )}

          {store?.showPrices && <ShopByPrice />}

          {newArrivals.length > 0 && (
            <section aria-labelledby="new-title" className="pb-14 sm:pb-20">
              <Container>
                <SectionHeader id="new-title" eyebrow="New arrivals" title="Fresh Drops" description="Just landed in store." href="/products?sort=newest" />
                <ProductGrid products={fit(newArrivals)} layout="home" className={rowFit(fit(newArrivals).length)} />
              </Container>
            </section>
          )}

          {featuredRes.error && popularRes.error && (
            <Container className="py-8">
              <ErrorState title="Something went wrong." description="We couldn't load products right now. Please try again." />
            </Container>
          )}

          <WholesaleBand store={store} categoryCount={homeCategories.length} />
          <WhySection storeName={name} />
          <SocialSection store={store} products={socialProducts} />
          <HowOrderingWorks store={store} />
          <LocalSection store={store} categories={homeCategories} />

          {store && (
            <section aria-label="Store information">
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
