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
        {/* phones: compact 3-across grid (every group visible, no sideways scrolling); desktop: one row */}
        <ul className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-6">
          {live.map((g, i) => {
            const meta = AGE_GROUPS.find((a) => a.value === g.value);
            const dark = i === 0;
            return (
              <li key={g.slug} className="min-w-0">
                <Link
                  href={`/products?age=${g.slug}`}
                  data-reveal
                  style={{ "--reveal-delay": `${(i % 6) * 50}ms` } as React.CSSProperties}
                  aria-label={`${g.label}: ${pluralize(g.count, "toy")}`}
                  className={cn(
                    "group flex h-full flex-col rounded-2xl border px-3 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:rounded-[1.5rem] sm:px-5 sm:py-5",
                    dark ? "border-ink bg-ink text-white" : "border-line bg-sand text-ink hover:border-line-strong",
                  )}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className={cn("text-[0.5625rem] font-bold uppercase tracking-[0.14em] sm:text-[0.625rem]", dark ? "text-white/60" : "text-muted")}>Age</span>
                    <ArrowUpRight
                      className={cn("size-3.5 shrink-0 transition-transform duration-300 group-hover:rotate-45 sm:size-4", dark ? "text-white/70" : "text-muted group-hover:text-ink")}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-3 block whitespace-nowrap font-display text-[1.375rem] font-extrabold leading-none tracking-[-0.04em] min-[380px]:text-[1.5rem] sm:mt-6 sm:text-[2rem]">
                    {meta?.short ?? g.label}
                  </span>
                  <span className={cn("mt-1 block text-xs font-semibold sm:text-sm", dark ? "text-white/80" : "text-ink-soft")}>{meta?.tagline ?? ""}</span>
                  <span className={cn("mt-auto block pt-2 text-[0.6875rem] sm:pt-3 sm:text-xs", dark ? "text-white/55" : "text-muted")}>{pluralize(g.count, "toy")}</span>
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
