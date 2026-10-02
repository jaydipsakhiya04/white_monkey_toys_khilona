import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductGrid } from "@/features/catalog/product-card";
import { ProductExperience } from "@/features/catalog/product-experience";
import { absoluteUrl } from "@/lib/env";
import { ProductReviews } from "@/features/reviews/product-reviews";
import { brandName } from "@/lib/brand";
import { getProduct, getProductReviews, getRelatedProducts, getStore } from "@/services/catalog.server";
import type { ProductDetail, ProductReviews as ProductReviewsData, PublicStore } from "@/types/api";
import { toPlainText } from "@/utils/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let product: ProductDetail | null;
  try {
    product = await getProduct(slug);
  } catch {
    return { title: "Product" };
  }
  if (!product) return { title: "Product not found", robots: { index: false } };
  const title = product.seoTitle || product.name;
  const description =
    toPlainText(product.seoDescription || product.shortDescription || product.description) ||
    `Buy ${product.name} online. Pay on delivery.`;
  const images = (product.images.length ? product.images.map((i) => i.url) : product.thumbnailUrl ? [product.thumbnailUrl] : []).slice(0, 4);
  const url = `/product/${product.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url, images: images.map((u) => ({ url: u, alt: product.name })) },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images },
  };
}

function productJsonLd(product: ProductDetail, store: PublicStore | null, reviews: ProductReviewsData | null) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const images = product.images.length ? product.images.map((i) => i.url) : product.thumbnailUrl ? [product.thumbnailUrl] : [];
  const availability = (inStock: boolean) => (inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock");
  const seller = { "@type": "Organization", name: brandName(store) };
  const offers =
    product.variants.length > 0
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: product.minPrice,
          highPrice: product.maxPrice,
          offerCount: product.variants.length,
          availability: availability(product.inStock),
          url,
          seller,
        }
      : {
          "@type": "Offer",
          priceCurrency: "INR",
          price: product.effectivePrice,
          availability: availability(product.inStock),
          itemCondition: "https://schema.org/NewCondition",
          url,
          seller,
        };
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(images.length ? { image: images } : {}),
    description: toPlainText(product.description || product.shortDescription, 5000) || product.name,
    ...(product.sku ? { sku: product.sku } : {}),
    category: product.category.name,
    url,
    brand: { "@type": "Brand", name: brandName(store) },
    offers,
    ...(product.rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count, bestRating: 5, worstRating: 1 } }
      : {}),
    ...(reviews?.items.length
      ? {
          review: reviews.items.slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            author: { "@type": "Person", name: r.authorName },
            datePublished: r.createdAt.slice(0, 10),
            ...(r.comment ? { reviewBody: r.comment } : {}),
          })),
        }
      : {}),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, store, related, reviews] = await Promise.all([getProduct(slug), getStore(), getRelatedProducts(slug, 8), getProductReviews(slug)]);
  if (!product) notFound();

  const crumbs: Crumb[] = [];
  if (product.category.parent) crumbs.push({ name: product.category.parent.name, href: `/category/${product.category.parent.slug}` });
  crumbs.push({ name: product.category.name, href: `/category/${product.category.slug}` });
  crumbs.push({ name: product.name });

  const hasSpecs = product.specifications.length > 0;

  return (
    <div className="pb-20 md:pb-0">
      <JsonLd data={productJsonLd(product, store, reviews)} />
      <Container className="py-5 sm:py-8">
        <Breadcrumbs items={crumbs} className="mb-5 sm:mb-7" />
        <ProductExperience product={product} whatsapp={store?.whatsappUrl ?? store?.whatsapp ?? null} />

        {(product.description || hasSpecs) && (
          <div className="mt-12 grid gap-8 border-t border-line pt-10 lg:mt-16 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            {product.description && (
              <section aria-labelledby="desc-title">
                <h2 id="desc-title" className="text-2xl font-bold text-ink">
                  About this product
                </h2>
                <div className="mt-4 max-w-prose whitespace-pre-line text-[0.9375rem] leading-7 text-muted sm:text-base">{product.description}</div>
              </section>
            )}
            {hasSpecs && (
              <section aria-labelledby="spec-title" className={product.description ? "" : "lg:col-span-2"}>
                <h2 id="spec-title" className="text-2xl font-bold text-ink">
                  Specifications
                </h2>
                <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Specifications of {product.name}</caption>
                    <tbody>
                      {product.specifications.map((s, i) => (
                        <tr key={`${s.label}-${i}`} className="border-b border-line last:border-0 odd:bg-sand/50">
                          <th scope="row" className="w-2/5 px-4 py-3 align-top font-semibold text-ink">
                            {s.label}
                          </th>
                          <td className="px-4 py-3 text-muted">{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}

        <ProductReviews slug={product.slug} initial={reviews} />

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-14 lg:mt-20">
            <SectionHeader id="related-title" title="You may also like" href={`/category/${product.category.slug}`} linkLabel="More like this" />
            <ProductGrid products={related.slice(0, 8)} className="[&>li:nth-child(n+9)]:hidden" />
          </section>
        )}
      </Container>
    </div>
  );
}
