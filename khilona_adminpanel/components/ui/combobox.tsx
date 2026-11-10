'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';

export type ComboboxOption = { value: string; label: string; hint?: string; group?: string; disabled?: boolean };

type ComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  /** Visual size of the trigger */
  size?: 'md' | 'lg';
  'aria-label'?: string;
  'aria-describedby'?: string;
  onBlur?: () => void;
  /** Leading content inside the trigger (e.g. a label like 'Sort by') */
  prefix?: ReactNode;
};

const normalize = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Builds options from <option>/<optgroup> children so existing <select> markup keeps working. */
export function optionsFromChildren(children: ReactNode, group?: string): ComboboxOption[] {
  const out: ComboboxOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: unknown; children?: ReactNode; label?: string; disabled?: boolean };
    if (child.type === 'option') {
      const label = Children.toArray(props.children).join('');
      out.push({ value: String(props.value ?? label), label, group, disabled: props.disabled });
    } else if (child.type === 'optgroup') {
      out.push(...optionsFromChildren(props.children, props.label));
    } else if (props.children) {
      out.push(...optionsFromChildren(props.children, group));
    }
  });
  return out;
}

type Placement = { mode: 'popover'; top: number; left: number; width: number; maxHeight: number; up: boolean } | { mode: 'sheet' };

/**
 * Searchable dropdown (ARIA combobox + listbox). Desktop: anchored popover that flips upward when
 * there is no room below. Phones: a bottom sheet with a large search field.
 */
export function Combobox({
  value,
  onValueChange,
  options,
  id,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches',
  disabled,
  invalid,
  className,
  size = 'md',
  onBlur,
  prefix,
  ...aria
}: ComboboxProps) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const listId = `${triggerId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [sheetTitle, setSheetTitle] = useState<string | null>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options;
    return options.filter((o) => normalize(`${o.label} ${o.hint ?? ''} ${o.group ?? ''}`).includes(q));
  }, [options, query]);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    if (window.innerWidth < 640) {
      setPlacement({ mode: 'sheet' });
      return;
    }
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 260 && above > below;
    const width = Math.max(r.width, 224);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPlacement({ mode: 'popover', up, left, width, top: up ? r.top - 6 : r.bottom + 6, maxHeight: Math.min(360, Math.max(160, up ? above : below)) });
  }, []);

  const openPanel = (seed = '') => {
    if (disabled) return;
    // the visible field label (e.g. "Category") titles the phone sheet
    const label = document.querySelector(`label[for="${CSS.escape(triggerId)}"]`)?.textContent?.trim();
    setSheetTitle(aria['aria-label'] ?? (label || null));
    setQuery(seed);
    setOpen(true);
  };

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    setQuery('');
    setActive(-1);
    if (focusTrigger) triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const choose = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    onValueChange(opt.value);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, place]);

  // focus the search field and highlight the current value
  useEffect(() => {
    if (!open) return;
    const idx = filtered.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : filtered.findIndex((o) => !o.disabled));
    const t = window.setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 10);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) setActive(filtered.findIndex((o) => !o.disabled));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // outside click closes
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close(false);
      onBlur?.();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, close, onBlur]);

  // keep the active option visible
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index='${active}']`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const move = (dir: 1 | -1) => {
    if (!filtered.length) return;
    let i = active;
    for (let n = 0; n < filtered.length; n++) {
      i = (i + dir + filtered.length) % filtered.length;
      if (!filtered[i].disabled) break;
    }
    setActive(i);
  };

  const onPanelKey = (e: KeyboardEvent) => {
    // keep dialogs underneath from reacting (Escape closes only this list)
    e.stopPropagation();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(filtered.findIndex((o) => !o.disabled));
    } else if (e.key === 'End') {
      e.preventDefault();
      for (let i = filtered.length - 1; i >= 0; i--) if (!filtered[i].disabled) return setActive(i);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      close();
    }
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (open) return;
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openPanel();
    } else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      openPanel(e.key);
    }
  };

  let lastGroup: string | undefined;
  const list = (
    <ul ref={listRef} id={listId} role='listbox' aria-labelledby={triggerId} className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5'>
      {filtered.map((o, i) => {
        const header = o.group && o.group !== lastGroup ? o.group : null;
        lastGroup = o.group;
        const isSelected = o.value === value;
        return (
          <li key={`${o.group ?? ''}:${o.value}`} role='presentation'>
            {header && <p className='px-3 pb-1 pt-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted'>{header}</p>}
            <div
              id={`${listId}-${i}`}
              role='option'
              data-index={i}
              aria-selected={isSelected}
              aria-disabled={o.disabled || undefined}
              onPointerMove={() => !o.disabled && setActive(i)}
              onClick={() => choose(o)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors',
                i === active && 'bg-subtle',
                isSelected && 'font-semibold',
                o.disabled && 'cursor-not-allowed opacity-45',
              )}
            >
              <span className='min-w-0 flex-1'>
                <span className='block truncate'>{o.label}</span>
                {o.hint && <span className='block truncate text-xs font-normal text-muted'>{o.hint}</span>}
              </span>
              {isSelected && <Check className='size-4 shrink-0' aria-hidden='true' />}
            </div>
          </li>
        );
      })}
      {filtered.length === 0 && <li className='px-3 py-6 text-center text-sm text-muted'>{emptyText}</li>}
    </ul>
  );

  const search = (
    <div className='relative border-b border-line p-2'>
      <Search className='pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted' aria-hidden='true' />
      <input
        ref={searchRef}
        type='text'
        role='combobox'
        aria-expanded='true'
        aria-controls={listId}
        aria-autocomplete='list'
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onPanelKey}
        placeholder={searchPlaceholder}
        autoComplete='off'
        className='h-9 w-full rounded-lg bg-subtle pl-9 pr-9 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand/15 max-sm:h-12 max-sm:text-base'
      />
      {query && (
        <button
          type='button'
          onClick={() => {
            setQuery('');
            searchRef.current?.focus();
          }}
          className='absolute right-4 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-stone-200 hover:text-ink'
          aria-label='Clear search'
        >
          <X className='size-3.5' aria-hidden='true' />
        </button>
      )}
    </div>
  );

  const panel =
    open && placement
      ? createPortal(
          placement.mode === 'sheet' ? (
            <div className='fixed inset-0 z-[120]' onKeyDown={onPanelKey}>
              <div className='absolute inset-0 animate-fade-in bg-ink/40' aria-hidden='true' onClick={() => close()} />
              <div
                ref={panelRef}
                className='absolute inset-x-0 bottom-0 flex max-h-[80dvh] animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-pop'
              >
                <div className='flex justify-center pt-2.5' aria-hidden='true'>
                  <span className='h-1.5 w-10 rounded-full bg-line-strong' />
                </div>
                <div className='flex items-center justify-between px-5 pb-1 pt-2'>
                  <p className='text-base font-semibold text-ink'>{sheetTitle ?? placeholder}</p>
                  <button type='button' onClick={() => close()} className='-mr-2 grid size-10 place-items-center rounded-xl text-muted hover:bg-subtle' aria-label='Close'>
                    <X className='size-5' aria-hidden='true' />
                  </button>
                </div>
                {search}
                {list}
              </div>
            </div>
          ) : (
            <div
              ref={panelRef}
              onKeyDown={onPanelKey}
              style={{
                position: 'fixed',
                left: placement.left,
                width: placement.width,
                maxHeight: placement.maxHeight,
                ...(placement.up ? { bottom: window.innerHeight - placement.top } : { top: placement.top }),
              }}
              className='z-[120] flex animate-pop flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-pop'
            >
              {search}
              {list}
            </div>
          ),
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type='button'
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-invalid={invalid || undefined}
        aria-label={aria['aria-label']}
        aria-describedby={aria['aria-describedby']}
        disabled={disabled}
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={onTriggerKey}
        onBlur={(e) => {
          if (!open && !panelRef.current?.contains(e.relatedTarget as Node)) onBlur?.();
        }}
        className={cn(
          'group flex w-full items-center gap-2 rounded-[10px] border bg-surface pl-3 pr-2.5 text-left text-sm text-ink shadow-xs transition-[border-color,box-shadow] duration-150 focus:outline-none focus-visible:border-brand/70 focus-visible:ring-4 focus-visible:ring-brand/12 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted',
          size === 'lg' ? 'h-10' : 'h-9',
          invalid ? 'border-danger' : open ? 'border-brand/70 ring-4 ring-brand/12' : 'border-line hover:border-line-strong',
          className,
        )}
      >
        {prefix}
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-stone-400')}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} aria-hidden='true' />
      </button>
      {panel}
    </>
  );
}
