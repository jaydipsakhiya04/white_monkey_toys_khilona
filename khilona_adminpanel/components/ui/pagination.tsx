'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/types/api';
import { formatNumber } from '@/utils/format';
import { Button } from './button';

function pageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page, page - 1, page + 1]);
  const pages = Array.from(set)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export function Pagination({
  meta,
  onPageChange,
  noun = 'results',
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  noun?: string;
}) {
  if (meta.total === 0) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row"
    >
      <p className="text-xs text-muted tabular">
        Showing <span className="font-medium text-ink">{formatNumber(from)}</span>–
        <span className="font-medium text-ink">{formatNumber(to)}</span> of{' '}
        <span className="font-medium text-ink">{formatNumber(meta.total)}</span> {noun}
      </p>
      {meta.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={!meta.hasPrevPage}
            onClick={() => onPageChange(meta.page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <div className="hidden items-center gap-1 sm:flex">
            {pageList(meta.page, meta.totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} className="px-1 text-xs text-muted" aria-hidden>
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === meta.page ? 'subtle' : 'ghost'}
                  size="icon-sm"
                  aria-current={p === meta.page ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                  onClick={() => onPageChange(p)}
                  className="tabular text-xs"
                >
                  {p}
                </Button>
              ),
            )}
          </div>
          <span className="px-2 text-xs text-muted tabular sm:hidden">
            {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={!meta.hasNextPage}
            onClick={() => onPageChange(meta.page + 1)}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </nav>
  );
}
