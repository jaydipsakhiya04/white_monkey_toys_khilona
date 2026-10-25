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
        className="inline-flex gap-1 rounded-xl border border-line bg-stone-100/70 p-1"
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
                'relative inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-[9px] px-3 text-[13px] font-medium transition-all duration-150',
                'focus-visible:outline-offset-[-2px]',
                active
                  ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(16_24_40/0.08),0_0_0_1px_rgb(16_24_40/0.04)]'
                  : 'text-muted hover:bg-white/60 hover:text-ink',
              )}
            >
              {item.dotClass && <span className={cn('size-1.5 rounded-full', item.dotClass)} aria-hidden />}
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    'min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-semibold tabular',
                    active ? 'bg-brand text-white' : 'bg-stone-200/80 text-stone-600',
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
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[10px] border border-line bg-stone-100/70 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-7 rounded-[8px] px-3 text-xs font-medium transition-all duration-150',
            o.value === value ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(16_24_40/0.1)]' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
