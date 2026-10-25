import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import type { CategorySummary } from "@/types/api";
import { cn } from "@/utils/cn";
import { pluralize } from "@/utils/format";

export function CategoryCard({ category, index = 0, className }: { category: CategorySummary; index?: number; className?: string }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      data-reveal
      style={{ "--reveal-delay": `${(index % 6) * 70}ms` } as React.CSSProperties}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface p-2 transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-transparent hover:shadow-lift",
        className,
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden rounded-[1.35rem] bg-sand">
        <SmartImage
          src={category.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 260px, (min-width: 768px) 25vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
          fallbackClassName="bg-transparent"
        />
        <span
          aria-hidden="true"
          className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full bg-surface/90 text-ink opacity-0 shadow-sm backdrop-blur transition-all duration-300 group-hover:opacity-100 max-md:opacity-100"
        >
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px" />
        </span>
      </div>
      <div className="px-2 pb-1.5 pt-3">
        <h3 className="font-display text-[0.9875rem] font-semibold leading-tight text-ink sm:text-[1.0625rem]">{category.name}</h3>
        <p className="mt-0.5 text-xs text-muted sm:text-[0.8125rem]">{pluralize(category.productCount, "product")}</p>
      </div>
    </Link>
  );
}
