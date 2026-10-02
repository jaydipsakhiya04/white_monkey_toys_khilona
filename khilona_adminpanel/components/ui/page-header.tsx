import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type Crumb = { label: string; href?: string };

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  meta,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-5 sm:mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
            {breadcrumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3 text-stone-400" aria-hidden />}
                {c.href ? (
                  <Link href={c.href} className="rounded hover:text-ink">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-ink-soft">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-[22px]">{title}</h1>
            {meta}
          </div>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
