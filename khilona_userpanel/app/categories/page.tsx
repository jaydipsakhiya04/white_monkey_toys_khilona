import { brandName } from "@/lib/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageBanner } from "@/components/ui/page-banner";
import { SmartImage } from "@/components/ui/smart-image";
import { getCategoryTree, getStore } from "@/services/catalog.server";
import { pluralize } from "@/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore();
  return {
    title: "All categories",
    description: `Browse every toy and game category at ${brandName(store)}.`,
    alternates: { canonical: "/categories" },
    openGraph: { url: "/categories" },
  };
}

export default async function CategoriesPage() {
  const categories = await getCategoryTree();

  return (
    <Container className="py-6 sm:py-10">
      <Breadcrumbs items={[{ name: "Categories" }]} />
      <PageBanner
        className="mb-8 sm:mb-10"
        eyebrow="Explore"
        title="All categories"
        description={<p>Pick a category to explore, or jump straight into a sub-category.</p>}
      />

      {categories === null ? (
        <ErrorState />
      ) : categories.length === 0 ? (
        <EmptyState icon={<LayoutGrid />} title="No categories yet" description="We're stocking the shelves. Please check back soon.">
          <ButtonLink href="/products">Shop all products</ButtonLink>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
          {categories.map((c, i) => (
            <li
              key={c.id}
              data-reveal
              style={{ "--reveal-delay": `${(i % 4) * 70}ms` } as React.CSSProperties}
              className="flex flex-col overflow-hidden rounded-[1.5rem] border border-line bg-surface p-2 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
            >
              <Link href={`/category/${c.slug}`} className="group flex flex-1 flex-col">
                <span className="photo-stage relative block aspect-[4/3] overflow-hidden rounded-[1.1rem]">
                  <SmartImage
                    src={c.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    fallbackClassName="bg-transparent"
                  />
                </span>
                <span className="flex flex-1 flex-col px-3 pb-3 pt-4">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-lg font-bold leading-tight text-ink underline-offset-4 group-hover:underline">{c.name}</span>
                    <span className="shrink-0 text-sm text-muted">{pluralize(c.productCount, "product")}</span>
                  </span>
                  {c.description && <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{c.description}</span>}
                </span>
              </Link>
              {c.children.length > 0 && (
                <ul className="flex flex-wrap gap-2 border-t border-line px-3 py-3" aria-label={`${c.name} sub-categories`}>
                  {c.children.map((ch) => (
                    <li key={ch.id}>
                      <Link
                        href={`/category/${ch.slug}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand px-3.5 text-sm font-medium text-ink hover:bg-sand-deep"
                      >
                        {ch.name}
                        <span className="text-xs text-muted">{ch.productCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
