'use client';

import { Package, Search, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

const TARGETS = [
  { key: 'orders', label: 'Search orders', hint: 'Order no., customer name or phone', icon: ShoppingBag, path: '/orders' },
  { key: 'products', label: 'Search products', hint: 'Product name or SKU', icon: Package, path: '/products' },
] as const;

/** Top-bar search: jumps to the orders or products list filtered by the query. ⌘K / Ctrl+K focuses it. */
export function QuickSearch({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (index: number) => {
    const q = query.trim();
    if (!q) return;
    router.push(`${TARGETS[index].path}?search=${encodeURIComponent(q)}`);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const showList = open && query.trim().length > 0;

  return (
    <div className={cn('relative', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(active);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Quick search"
          aria-autocomplete="list"
          aria-controls={showList ? listId : undefined}
          aria-expanded={showList}
          placeholder="Search orders, customers, products…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => (a + 1) % TARGETS.length);
            } else if (e.key === 'Escape') {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          className={cn(
            'h-9 w-full rounded-[10px] border border-line bg-stone-100/70 pl-9 pr-14 text-[13px] text-ink placeholder:text-stone-400',
            'transition-[background-color,border-color,box-shadow] duration-150 hover:border-line-strong',
            'focus:border-brand/60 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/10',
            '[&::-webkit-search-cancel-button]:hidden',
          )}
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-[10px] font-medium text-stone-500 shadow-xs sm:block">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </form>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search in"
          className="absolute inset-x-0 top-full z-50 mt-1.5 animate-pop rounded-xl border border-line bg-surface p-1.5 shadow-pop"
        >
          {TARGETS.map((t, i) => {
            const Icon = t.icon;
            return (
              <li key={t.key} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                    i === active ? 'bg-stone-100' : 'hover:bg-stone-50',
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-stone-500">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {t.label} for “{query.trim()}”
                    </span>
                    <span className="block text-xs text-muted">{t.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
