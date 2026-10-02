import { brandName } from "@/lib/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
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

const TINTS = ["bg-sand", "bg-accent-tint", "bg-sand", "bg-sand"];

export default async function CategoriesPage() {
  const categories = await getCategoryTree();

  return (
    <Container className="py-6 sm:py-10">
      <Breadcrumbs items={[{ name: "Categories" }]} />
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">All categories</h1>
        <p className="mt-2 text-muted">Pick a category to explore, or jump into a sub-category.</p>
      </header>

      {categories === null ? (
        <ErrorState />
      ) : categories.length === 0 ? (
        <EmptyState icon={<LayoutGrid />} title="No categories yet" description="We're stocking the shelves. Please check back soon.">
          <ButtonLink href="/products">Shop all products</ButtonLink>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {categories.map((c, i) => (
            <li key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
              <Link href={`/category/${c.slug}`} className="group flex items-center gap-4 p-3 hover:bg-sand/60">
                <span className={`relative size-20 shrink-0 overflow-hidden rounded-xl sm:size-24 ${TINTS[i % TINTS.length]}`}>
                  <SmartImage src={c.imageUrl} alt="" fill sizes="96px" className="object-cover" fallbackClassName="bg-transparent" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold leading-tight text-ink group-hover:text-ink sm:text-xl">{c.name}</span>
                  <span className="mt-1 block text-sm text-muted">{pluralize(c.productCount, "product")}</span>
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
