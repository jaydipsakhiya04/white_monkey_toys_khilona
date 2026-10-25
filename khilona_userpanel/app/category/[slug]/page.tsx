import { brandName } from "@/lib/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { BannerPill, PageBanner } from "@/components/ui/page-banner";
import { ProductListing } from "@/features/catalog/product-listing";
import { getCategory, getStore } from "@/services/catalog.server";
import { pluralize, toPlainText } from "@/utils/format";
import { parseListingParams, type RawSearchParams } from "@/utils/listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = parseListingParams(await searchParams);
  let category;
  try {
    category = await getCategory(slug);
  } catch {
    return { title: "Category" };
  }
  if (!category) return { title: "Category not found", robots: { index: false } };
  const store = await getStore();
  const title = category.seoTitle || category.name;
  const description =
    toPlainText(category.seoDescription || category.description) ||
    `Shop ${category.name} at ${brandName(store)}. ${pluralize(category.productCount, "product")} available — pay on delivery.`;
  const canonical = `/category/${category.slug}${sp.page > 1 ? `?page=${sp.page}` : ""}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: sp.search || sp.options.length ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      ...(category.imageUrl ? { images: [{ url: category.imageUrl, alt: category.name }] } : {}),
    },
    twitter: { card: category.imageUrl ? "summary_large_image" : "summary", title, description },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const raw = await searchParams;
  const category = await getCategory(slug); // throws → error.tsx; null → 404
  if (!category) notFound();
  const listing = parseListingParams(raw);

  const crumbs: Crumb[] = [{ name: "Categories", href: "/categories" }];
  if (category.parent) crumbs.push({ name: category.parent.name, href: `/category/${category.parent.slug}` });
  crumbs.push({ name: category.name });

  return (
    <Container className="py-6 sm:py-10">
      <Breadcrumbs items={crumbs} />

      <PageBanner
        eyebrow={category.parent?.name ?? "Category"}
        title={category.name}
        description={category.description ? <p>{category.description}</p> : undefined}
        meta={<BannerPill>{pluralize(category.productCount, "product")}</BannerPill>}
        imageUrl={category.imageUrl}
        imageAlt={category.name}
      />

      {category.children.length > 0 && (
        <nav aria-label={`${category.name} sub-categories`} className="mt-5">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <li className="shrink-0">
              <span className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-midnight" aria-current="page">
                All {category.name}
              </span>
            </li>
            {category.children.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link
                  href={`/category/${c.slug}`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:border-ink/40 hover:bg-sand"
                >
                  {c.name}
                  <span className="text-xs font-medium text-muted">{c.productCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {category.parent && (
        <p className="mt-4 text-sm text-muted">
          Part of{" "}
          <Link href={`/category/${category.parent.slug}`} className="font-semibold text-ink underline-offset-4 hover:underline">
            {category.parent.name}
          </Link>
        </p>
      )}

      <div className="mt-8">
        <ProductListing
          basePath={`/category/${category.slug}`}
          params={listing}
          rawSearchParams={raw}
          category={category.slug}
          searchLabel={`Search in ${category.name}`}
        />
      </div>
    </Container>
  );
}
