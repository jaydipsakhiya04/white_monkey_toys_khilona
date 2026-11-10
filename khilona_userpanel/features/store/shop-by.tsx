import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import type { AgeGroupCount } from "@/types/api";
import { cn } from "@/utils/cn";
import { pluralize } from "@/utils/format";
import { AGE_GROUPS } from "@/utils/age";

/** "Shop by age": every age group that has products, linking to the filtered catalogue. */
export function ShopByAge({ groups }: { groups: AgeGroupCount[] }) {
  const live = groups.filter((g) => g.count > 0);
  if (live.length < 2) return null;
  return (
    <section aria-labelledby="age-title" className="pb-14 sm:pb-20">
      <Container>
        <SectionHeader id="age-title" eyebrow="Shop by age" title="Perfect for every age" description="Age-rated picks, from first RC to pro hobby kits." href="/products" linkLabel="All toys" />
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {live.map((g, i) => {
            const meta = AGE_GROUPS.find((a) => a.value === g.value);
            return (
              <li key={g.slug} className="w-[38vw] max-w-[11rem] shrink-0 snap-start sm:w-auto sm:max-w-none">
                <Link
                  href={`/products?age=${g.slug}`}
                  data-reveal
                  style={{ "--reveal-delay": `${(i % 6) * 60}ms` } as React.CSSProperties}
                  className={cn(
                    "group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[1.5rem] border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:aspect-[5/4] sm:p-5 lg:aspect-[4/5]",
                    i === 0 ? "border-ink bg-ink text-white" : "border-line bg-sand text-ink hover:border-line-strong",
                  )}
                >
                  <span aria-hidden="true" className={cn("pointer-events-none absolute -right-6 -top-6 size-24 rounded-full", i === 0 ? "bg-white/[0.06]" : "bg-white")} />
                  <span className="relative flex items-center justify-between">
                    <span className={cn("text-[0.625rem] font-bold uppercase tracking-[0.16em]", i === 0 ? "text-white/60" : "text-muted")}>Age</span>
                    <ArrowUpRight
                      className={cn("size-4 transition-transform duration-300 group-hover:rotate-45", i === 0 ? "text-white/70" : "text-muted group-hover:text-ink")}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="relative">
                    <span className="block font-display text-[2rem] font-extrabold leading-none tracking-[-0.04em] sm:text-[2.25rem]">{meta?.short ?? g.label}</span>
                    <span className={cn("mt-1 block text-sm font-semibold", i === 0 ? "text-white/80" : "text-ink-soft")}>{meta?.tagline ?? ""}</span>
                    <span className={cn("mt-2 block text-xs", i === 0 ? "text-white/55" : "text-muted")}>{pluralize(g.count, "toy")}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

const PRICE_BANDS = [
  { label: "Under", amount: "₹1,500", href: "/products?maxPrice=1500&sort=price_asc" },
  { label: "Under", amount: "₹3,000", href: "/products?maxPrice=3000&sort=price_asc" },
  { label: "Under", amount: "₹5,000", href: "/products?maxPrice=5000&sort=price_asc" },
  { label: "Under", amount: "₹10,000", href: "/products?maxPrice=10000&sort=price_desc" },
  { label: "Premium", amount: "₹10,000+", href: "/products?minPrice=10000&sort=price_asc" },
];

/** "Shop by price": budget bands into the filtered catalogue. */
export function ShopByPrice() {
  return (
    <section aria-labelledby="price-title" className="pb-14 sm:pb-20">
      <Container>
        <SectionHeader id="price-title" eyebrow="Shop by price" title="Big smiles, every budget" description="Gifts that fit your budget — from pocket money to premium." />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {PRICE_BANDS.map((b, i) => {
            const premium = i === PRICE_BANDS.length - 1;
            return (
              <li key={b.href} className={cn(premium && "col-span-2 sm:col-span-1")}>
                <Link
                  href={b.href}
                  data-reveal
                  style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}
                  className={cn(
                    "group flex h-full items-center justify-between gap-3 rounded-[1.25rem] border px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:flex-col sm:items-start sm:px-5 sm:py-6",
                    premium ? "border-accent-deep/20 bg-accent-tint" : "border-line bg-surface hover:border-line-strong",
                  )}
                >
                  <span className="min-w-0">
                    <span className={cn("block text-[0.6875rem] font-bold uppercase tracking-[0.16em]", premium ? "text-accent-deep" : "text-muted")}>{b.label}</span>
                    <span className="mt-1 block font-display text-[1.375rem] font-extrabold leading-none tracking-[-0.03em] text-ink sm:text-[1.75rem]">{b.amount}</span>
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sand text-ink transition-colors group-hover:bg-ink group-hover:text-white sm:mt-auto">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
