'use client';

import { LogOut, MoreHorizontal, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Sheet } from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/auth-provider';
import { useOrderStatusCounts } from '@/features/orders/hooks';
import { cn } from '@/utils/cn';
import { BrandMark } from './brand';
import { BOTTOM_NAV, isActivePath, MORE_NAV, NAV_ITEMS, type NavItem } from './nav-config';

function initials(name: string | undefined): string {
  if (!name) return 'A';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function CountBadge({ count, className }: { count: number | undefined; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white tabular',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
      <span className="sr-only"> pending orders</span>
    </span>
  );
}

function SidebarLink({
  item,
  active,
  expanded,
  pending,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  pending?: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const count = item.badge === 'pendingOrders' ? pending : undefined;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      title={expanded ? undefined : item.label}
      className={cn(
        'group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium transition-colors',
        active ? 'bg-brand-tint text-brand-hover' : 'text-ink-soft hover:bg-subtle hover:text-ink',
      )}
    >
      <Icon className={cn('size-[18px] shrink-0', active ? 'text-brand' : 'text-muted group-hover:text-ink')} aria-hidden />
      <span className={cn('flex-1 truncate', expanded ? 'inline' : 'sr-only lg:not-sr-only lg:inline')}>{item.label}</span>
      {count ? (
        expanded ? (
          <CountBadge count={count} />
        ) : (
          <>
            <span className="hidden lg:inline"><CountBadge count={count} /></span>
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand lg:hidden" aria-hidden />
          </>
        )
      ) : null}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const { data: counts } = useOrderStatusCounts();
  const pending = counts?.PENDING;
  const [railExpanded, setRailExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const asideRef = useRef<HTMLElement>(null);

  // close overlays on navigation
  useEffect(() => {
    setRailExpanded(false);
    setMoreOpen(false);
  }, [pathname]);

  useFocusTrap(asideRef, railExpanded, () => setRailExpanded(false), { lockScroll: false });

  const doLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setConfirmLogout(false);
  };

  const expanded = railExpanded;

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-[70] rounded-md bg-ink px-3 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      {/* ---------- Sidebar (tablet rail / desktop) ---------- */}
      {expanded && (
        <div className="fixed inset-0 z-30 hidden bg-stone-900/30 md:block lg:hidden" aria-hidden onClick={() => setRailExpanded(false)} />
      )}
      <aside
        ref={asideRef}
        aria-label="Main navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 md:flex lg:w-60',
          expanded ? 'w-60 shadow-pop lg:shadow-none' : 'w-[68px]',
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-line px-4">
          <Link href="/" className={cn('rounded-md', expanded ? 'block' : 'hidden lg:block')} aria-label="KHILONA Admin home">
            <BrandMark />
          </Link>
          <Link href="/" className={cn('rounded-md', expanded ? 'hidden' : 'block lg:hidden')} aria-label="KHILONA Admin home">
            <span className="block size-4 rounded-[4px] bg-brand" aria-hidden />
          </Link>
          {expanded && (
            <span className="lg:hidden">
              <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={() => setRailExpanded(false)}>
                <PanelLeftClose />
              </Button>
            </span>
          )}
        </div>
        <div className={cn('px-3 pt-3 lg:hidden', expanded && 'hidden')}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Expand sidebar"
            aria-expanded={expanded}
            onClick={() => setRailExpanded(true)}
            className="w-full"
          >
            <PanelLeftOpen />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <p className={cn('mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400', expanded ? 'block' : 'hidden lg:block')}>
            Manage
          </p>
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <SidebarLink item={item} active={isActivePath(pathname, item.href)} expanded={expanded} pending={pending} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-line p-3">
          <div className={cn('mb-2 items-center gap-2.5 px-1', expanded ? 'flex' : 'hidden lg:flex')}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink-soft">
              {initials(admin?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{admin?.name}</p>
              <p className="truncate text-[11px] text-muted">{admin?.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            title={expanded ? undefined : 'Log out'}
            className="flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
          >
            <LogOut className="size-[18px] shrink-0 text-muted" aria-hidden />
            <span className={cn(expanded ? 'inline' : 'sr-only lg:not-sr-only lg:inline')}>Log out</span>
          </button>
        </div>
      </aside>

      {/* ---------- Mobile top bar ---------- */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur-sm md:hidden">
        <Link href="/" aria-label="KHILONA Admin home" className="rounded-md">
          <BrandMark />
        </Link>
        <Link
          href="/profile"
          aria-label="Your profile"
          className="flex size-8 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink-soft"
        >
          {initials(admin?.name)}
        </Link>
      </header>

      {/* ---------- Content ---------- */}
      <main id="main" tabIndex={-1} className="min-w-0 pb-24 outline-none md:pb-10 md:pl-[68px] lg:pl-60">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</div>
      </main>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-safe md:hidden"
      >
        <ul className="grid grid-cols-5">
          {BOTTOM_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                    active ? 'text-brand' : 'text-muted',
                  )}
                >
                  <span className="relative">
                    <Icon className="size-5" aria-hidden />
                    {item.badge === 'pendingOrders' && pending ? (
                      <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white tabular">
                        {pending > 99 ? '99+' : pending}
                      </span>
                    ) : null}
                  </span>
                  {item.label}
                  {item.badge === 'pendingOrders' && pending ? <span className="sr-only">({pending} pending)</span> : null}
                  {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-brand" aria-hidden />}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className={cn(
                'flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium',
                MORE_NAV.some((i) => isActivePath(pathname, i.href)) ? 'text-brand' : 'text-muted',
              )}
            >
              <MoreHorizontal className="size-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More" side="right" width="max-w-xs">
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-line p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-semibold text-ink-soft">
            {initials(admin?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{admin?.name}</p>
            <p className="truncate text-xs text-muted">{admin?.email}</p>
          </div>
        </div>
        <ul className="flex flex-col gap-1">
          {MORE_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium',
                    active ? 'bg-brand-tint text-brand-hover' : 'text-ink hover:bg-subtle',
                  )}
                >
                  <Icon className="size-5 text-muted" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="mt-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setConfirmLogout(true);
              }}
              className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-danger hover:bg-danger-tint"
            >
              <LogOut className="size-5" aria-hidden />
              Log out
            </button>
          </li>
        </ul>
      </Sheet>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={doLogout}
        loading={loggingOut}
        tone="primary"
        title="Log out?"
        description="You'll need to sign in again to manage the store."
        confirmLabel="Log out"
      />
    </div>
  );
}

