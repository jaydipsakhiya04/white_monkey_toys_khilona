'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button';

export type MenuEntry =
  | {
      type?: 'item';
      label: string;
      icon?: ReactNode;
      onSelect?: () => void;
      href?: string;
      external?: boolean;
      danger?: boolean;
      disabled?: boolean;
      description?: string;
    }
  | { type: 'separator' }
  | { type: 'label'; label: string };

type DropdownMenuProps = {
  items: MenuEntry[];
  /** Content of the trigger button */
  trigger: ReactNode;
  /** Accessible label for the trigger (required for icon-only triggers) */
  label: string;
  align?: 'start' | 'end';
  variant?: ButtonVariant;
  size?: ButtonSize;
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
};

export function DropdownMenu({
  items,
  trigger,
  label,
  align = 'end',
  variant = 'ghost',
  size = 'icon-sm',
  triggerClassName,
  menuClassName,
  disabled,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const place = useCallback(() => {
    const t = triggerRef.current;
    const m = menuRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const mw = m?.offsetWidth ?? 200;
    const mh = m?.offsetHeight ?? 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = align === 'end' ? r.right - mw : r.left;
    left = Math.max(8, Math.min(left, vw - mw - 8));
    let top = r.bottom + 4;
    if (top + mh > vh - 8 && r.top - mh - 4 > 8) top = r.top - mh - 4;
    setPos({ top, left, minWidth: Math.max(r.width, 180) });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    // second pass after menu has measured
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close(false);
    };
    const onResize = () => close(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    const raf = requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const els = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [],
    );
    const idx = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      els[(idx + 1) % els.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      els[(idx - 1 + els.length) % els.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      els[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      els[els.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  const itemClass = (danger?: boolean, disabled?: boolean) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] outline-none transition-colors',
      '[&_svg]:size-4 [&_svg]:shrink-0',
      disabled
        ? 'cursor-not-allowed text-stone-400'
        : danger
          ? 'text-danger hover:bg-danger-tint focus:bg-danger-tint'
          : 'text-ink hover:bg-subtle focus:bg-subtle',
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={buttonClasses({ variant, size, className: triggerClassName })}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            style={{
              position: 'fixed',
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              minWidth: pos?.minWidth ?? 180,
            }}
            className={cn(
              'z-[60] max-w-[calc(100vw-16px)] animate-fade-in rounded-lg border border-line bg-surface p-1 shadow-pop',
              menuClassName,
            )}
          >
            {items.map((entry, i) => {
              if (entry.type === 'separator') return <div key={i} role="separator" className="my-1 h-px bg-line" />;
              if (entry.type === 'label')
                return (
                  <div key={i} className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {entry.label}
                  </div>
                );
              const content = (
                <>
                  {entry.icon}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{entry.label}</span>
                    {entry.description && <span className="block text-xs text-muted">{entry.description}</span>}
                  </span>
                </>
              );
              if (entry.href && !entry.disabled) {
                if (entry.external || /^(https?:|tel:|mailto:)/.test(entry.href)) {
                  return (
                    <a
                      key={i}
                      role="menuitem"
                      tabIndex={-1}
                      href={entry.href}
                      target={entry.href.startsWith('http') ? '_blank' : undefined}
                      rel={entry.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className={itemClass(entry.danger)}
                      onClick={() => close(false)}
                    >
                      {content}
                    </a>
                  );
                }
                return (
                  <Link
                    key={i}
                    role="menuitem"
                    tabIndex={-1}
                    href={entry.href}
                    className={itemClass(entry.danger)}
                    onClick={() => close(false)}
                  >
                    {content}
                  </Link>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  aria-disabled={entry.disabled || undefined}
                  className={itemClass(entry.danger, entry.disabled)}
                  onClick={() => {
                    if (entry.disabled) return;
                    close();
                    entry.onSelect?.();
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
