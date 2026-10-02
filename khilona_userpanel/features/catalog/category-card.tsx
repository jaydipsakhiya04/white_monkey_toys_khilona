import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import type { CategorySummary } from "@/types/api";
import { cn } from "@/utils/cn";
import { pluralize } from "@/utils/format";

const TINTS = ["bg-sand"];

export function CategoryCard({ category, index = 0, className }: { category: CategorySummary; index?: number; className?: string }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl bg-surface",
        className,
      )}
    >
      <div className={cn("relative aspect-[4/3] overflow-hidden rounded-2xl", TINTS[index % TINTS.length])}>
        <SmartImage
          src={category.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 240px, (min-width: 768px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          fallbackClassName="bg-transparent"
        />
      </div>
      <div className="flex items-start justify-between gap-2 px-0.5 pt-3">
        <div className="min-w-0">
          <h3 className="font-display text-[0.9375rem] font-semibold leading-tight text-ink sm:text-base">{category.name}</h3>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">{pluralize(category.productCount, "product")}</p>
        </div>
        <ArrowUpRight
          className="mt-0.5 size-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
