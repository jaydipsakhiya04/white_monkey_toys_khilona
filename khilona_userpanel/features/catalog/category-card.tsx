import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import type { CategorySummary } from "@/types/api";
import { cn } from "@/utils/cn";
import { pluralize } from "@/utils/format";

const TINTS = ["bg-coral-tint", "bg-sun-tint", "bg-teal-tint", "bg-sand"];

export function CategoryCard({ category, index = 0, className }: { category: CategorySummary; index?: number; className?: string }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-soft",
        className,
      )}
    >
      <div className={cn("relative aspect-[4/3] overflow-hidden", TINTS[index % TINTS.length])}>
        <SmartImage
          src={category.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 240px, (min-width: 768px) 25vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          fallbackClassName="bg-transparent"
        />
      </div>
      <div className="flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold leading-tight text-ink sm:text-lg">{category.name}</h3>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">{pluralize(category.productCount, "product")}</p>
        </div>
        <ArrowUpRight
          className="mt-0.5 size-5 shrink-0 text-muted transition-colors group-hover:text-coral-600"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
