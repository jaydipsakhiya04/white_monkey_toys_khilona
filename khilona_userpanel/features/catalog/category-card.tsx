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
      className={cn("group relative flex h-full flex-col", className)}
    >
      <div className="photo-stage relative aspect-[4/5] overflow-hidden rounded-[1.5rem] ring-1 ring-black/[0.04] transition-shadow duration-300 group-hover:shadow-lift">
        <SmartImage
          src={category.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 240px, (min-width: 768px) 25vw, 50vw"
          className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-[1.07] sm:p-5"
          fallbackClassName="bg-transparent"
        />
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white text-ink opacity-0 shadow-soft transition-all duration-300 group-hover:opacity-100 max-md:opacity-100"
        >
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
        </span>
      </div>
      <div className="px-1 pt-3.5">
        <h3 className="font-display text-[0.9375rem] font-semibold leading-tight text-ink underline-offset-4 group-hover:underline sm:text-base">{category.name}</h3>
        <p className="mt-1 text-xs text-muted sm:text-[0.8125rem]">{pluralize(category.productCount, "product")}</p>
      </div>
    </Link>
  );
}
