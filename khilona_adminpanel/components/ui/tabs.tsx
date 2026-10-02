'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type TabItem<V extends string> = { value: V; label: ReactNode; count?: number; dotClass?: string };

/** Scrollable tab strip (role=tablist) with optional counts. Arrow keys move between tabs. */
export function Tabs<V extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (v: V) => void;
  label: string;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const idx = items.findIndex((i) => i.value === value);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % items.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = items.length - 1;
    onChange(items[next].value);
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>(`[data-value="${items[next].value}"]`)?.focus();
    });
  };

  return (
    <div className={cn('relative -mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="inline-flex min-w-full gap-1 border-b border-line sm:min-w-0"
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              data-value={item.value}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.value)}
              className={cn(
                'relative -mb-px inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-2.5 text-[13px] font-medium transition-colors',
                'focus-visible:outline-offset-[-2px]',
                active ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {item.dotClass && <span className={cn('size-1.5 rounded-full', item.dotClass)} aria-hidden />}
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    'min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-semibold tabular',
                    active ? 'bg-brand-tint text-brand-hover' : 'bg-subtle text-muted',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Small segmented control (radio group semantics). */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-subtle p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-7 rounded-md px-2.5 text-xs font-medium transition-colors',
            o.value === value ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
