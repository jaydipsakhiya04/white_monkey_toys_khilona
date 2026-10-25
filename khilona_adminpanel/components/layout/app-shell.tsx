'use client';

import {
  Bell,
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { Button, buttonClasses } from '@/components/ui/button';
import { ConfirmDialog, Sheet } from '@/components/ui/dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/auth-provider';
import { useOrderStatusCounts } from '@/features/orders/hooks';
import { STOREFRONT_URL } from '@/lib/env';
import { cn } from '@/utils/cn';
import { BrandLogo, BrandMark } from './brand';
import { BOTTOM_NAV, isActivePath, MORE_NAV, NAV_GROUPS, sectionTitle, type NavItem } from './nav-config';
import { QuickSearch } from './quick-search';

function initials(name: string | undefined): string {
  if (!name) return 'A';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function Avatar({ name, className }: { name: string | undefined; className?: string }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB088] to-brand text-xs font-semibold text-white ring-2 ring-white/10',
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function CountBadge({ count, className }: { count: number | undefined; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white tabular shadow-[0_0_0_3px_rgb(240_90_34/0.18)]',
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
        'group relative flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[13.5px] font-medium transition-all duration-150',
        active
          ? 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]'
          : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90',
      )}
    >
      {active && <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" aria-hidden />}
      <Icon
        className={cn('size-[18px] shrink-0 transition-colors', active ? 'text-[#FF8A55]' : 'text-white/45 group-hover:text-white/80')}
        aria-hidden
      />
      <span className={cn('flex-1 truncate', expanded ? 'inline' : 'sr-only lg:not-sr-only lg:inline')}>{item.label}</span>
      {count ? (
        expanded ? (
          <CountBadge count={count} />
        ) : (
          <>
            <span className="hidden lg:inline">
              <CountBadge count={count} />
            </span>
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
  const roleLabel = admin?.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin';

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
        <div
          className="fixed inset-0 z-30 hidden animate-fade-in bg-stone-900/40 backdrop-blur-[2px] md:block lg:hidden"
          aria-hidden
          onClick={() => setRailExpanded(false)}
        />
      )}
      <aside
        ref={asideRef}
        aria-label="Main navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-night-line bg-night text-white transition-[width] duration-200 md:flex lg:w-64',
          expanded ? 'w-64 shadow-pop lg:shadow-none' : 'w-[72px]',
        )}
      >
        {/* glow */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand/20 blur-3xl"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" aria-hidden />

        <div className="relative flex h-16 items-center justify-between gap-2 px-4">
          <Link href="/" className={cn('rounded-md', expanded ? 'block' : 'hidden lg:block')} aria-label="White Monkey Toys Admin home">
            <BrandMark tone="dark" />
          </Link>
          <Link
            href="/"
            className={cn('mx-auto rounded-md', expanded ? 'hidden' : 'block lg:hidden')}
            aria-label="White Monkey Toys Admin home"
          >
            <BrandLogo size={30} />
          </Link>
          {expanded && (
            <span className="lg:hidden">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Collapse sidebar"
                onClick={() => setRailExpanded(false)}
                className="text-white/60 hover:bg-white/10 hover:text-white"
              >
                <PanelLeftClose />
              </Button>
            </span>
          )}
        </div>
        <div className={cn('relative px-3 pt-1 lg:hidden', expanded && 'hidden')}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Expand sidebar"
            aria-expanded={expanded}
            onClick={() => setRailExpanded(true)}
            className="w-full text-white/60 hover:bg-white/10 hover:text-white"
          >
            <PanelLeftOpen />
          </Button>
        </div>
        <nav className="relative flex-1 overflow-y-auto px-3 pb-3 pt-2 scrollbar-none">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p
                className={cn(
                  'mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/30',
                  expanded ? 'block' : 'hidden lg:block',
                )}
              >
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <SidebarLink item={item} active={isActivePath(pathname, item.href)} expanded={expanded} pending={pending} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {STOREFRONT_URL && (
          <div className={cn('relative px-3 pb-2', expanded ? 'block' : 'hidden lg:block')}>
            <a
              href={STOREFRONT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-3 transition-colors hover:border-white/20"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand/20 text-[#FF8A55]">
                <ExternalLink className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-white">View storefront</span>
                <span className="block truncate text-[11px] text-white/45">See the shop as customers do</span>
              </span>
            </a>
          </div>
        )}

        <div className="relative border-t border-night-line p-3">
          <div className={cn('mb-1 items-center gap-2.5 rounded-xl px-1.5 py-1.5', expanded ? 'flex' : 'hidden lg:flex')}>
            <Avatar name={admin?.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">{admin?.name}</p>
              <p className="truncate text-[11px] text-white/45">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            title={expanded ? undefined : 'Log out'}
            className="flex h-9 w-full items-center gap-3 rounded-[10px] px-2.5 text-[13px] font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut className="size-[18px] shrink-0 text-white/40" aria-hidden />
            <span className={cn(expanded ? 'inline' : 'sr-only lg:not-sr-only lg:inline')}>Log out</span>
          </button>
        </div>
      </aside>

      <div className="md:pl-[72px] lg:pl-64">
        {/* ---------- Desktop / tablet top bar ---------- */}
        <header className="sticky top-0 z-20 hidden h-16 items-center gap-4 border-b border-line/80 px-6 md:flex lg:px-8">
          {/* blur lives on its own layer so overflowing popovers (quick search) aren't affected by backdrop-filter */}
          <div className="absolute inset-0 -z-10 bg-page/80 backdrop-blur-xl backdrop-saturate-150" aria-hidden />
          <p className="hidden shrink-0 font-display text-[15px] font-semibold text-ink xl:block">{sectionTitle(pathname)}</p>
          <QuickSearch className="w-full max-w-md xl:ml-6" />
          <div className="ml-auto flex items-center gap-2">
            {STOREFRONT_URL && (
              <a
                href={STOREFRONT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonClasses({ variant: 'ghost', size: 'sm' }), 'hidden lg:inline-flex')}
              >
                <ExternalLink aria-hidden />
                View store
              </a>
            )}
            <Link
              href="/orders?status=PENDING"
              aria-label={pending ? `${pending} pending orders` : 'Pending orders'}
              className={cn(buttonClasses({ variant: 'secondary', size: 'icon' }), 'relative')}
            >
              <Bell aria-hidden />
              {pending ? (
                <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white ring-2 ring-page tabular">
                  {pending > 99 ? '99+' : pending}
                </span>
              ) : null}
            </Link>
            <Link href="/products/new" className={cn(buttonClasses({ size: 'md' }), 'hidden lg:inline-flex')}>
              <Plus aria-hidden />
              Add product
            </Link>
            <DropdownMenu
              label="Account menu"
              variant="ghost"
              size="md"
              triggerClassName="h-10 gap-2 rounded-full pl-1 pr-2"
              trigger={
                <>
                  <Avatar name={admin?.name} />
                  <span className="hidden max-w-32 truncate text-[13px] font-medium text-ink xl:inline">{admin?.name}</span>
                  <ChevronsUpDown className="size-3.5 text-stone-400" aria-hidden />
                </>
              }
              items={[
                { type: 'label', label: admin?.email ?? 'Account' },
                { label: 'Your profile', href: '/profile', icon: <UserRound /> },
                { label: 'Settings', href: '/settings', icon: <Settings /> },
                { type: 'separator' },
                { label: 'Log out', icon: <LogOut />, danger: true, onSelect: () => setConfirmLogout(true) },
              ]}
            />
          </div>
        </header>

        {/* ---------- Mobile top bar ---------- */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line/80 bg-page/85 px-4 backdrop-blur-xl md:hidden">
          <Link href="/" aria-label="White Monkey Toys Admin home" className="rounded-md">
            <BrandMark showAdmin={false} />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/orders?status=PENDING"
              aria-label={pending ? `${pending} pending orders` : 'Pending orders'}
              className={cn(buttonClasses({ variant: 'secondary', size: 'icon-sm' }), 'relative rounded-full')}
            >
              <Bell aria-hidden />
              {pending ? (
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-brand ring-2 ring-page" aria-hidden />
              ) : null}
            </Link>
            <Link href="/profile" aria-label="Your profile" className="rounded-full">
              <Avatar name={admin?.name} />
            </Link>
          </div>
        </header>

        {/* ---------- Content ---------- */}
        <main id="main" tabIndex={-1} className="min-w-0 pb-28 outline-none md:pb-12">
          <div key={pathname} className="mx-auto w-full max-w-[1440px] animate-enter px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-3 bottom-3 z-30 overflow-hidden rounded-2xl border border-white/10 bg-night/95 pb-safe shadow-pop backdrop-blur-xl md:hidden"
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
                    'relative flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors',
                    active ? 'text-white' : 'text-white/50',
                  )}
                >
                  <span
                    className={cn(
                      'relative flex h-7 w-11 items-center justify-center rounded-full transition-colors',
                      active && 'bg-brand/90 shadow-brand',
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                    {item.badge === 'pendingOrders' && pending ? (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand tabular">
                        {pending > 99 ? '99+' : pending}
                      </span>
                    ) : null}
                  </span>
                  {item.label}
                  {item.badge === 'pendingOrders' && pending ? <span className="sr-only">({pending} pending)</span> : null}
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
                'flex h-16 w-full flex-col items-center justify-center gap-1 text-[10.5px] font-medium',
                MORE_NAV.some((i) => isActivePath(pathname, i.href)) ? 'text-white' : 'text-white/50',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-11 items-center justify-center rounded-full',
                  MORE_NAV.some((i) => isActivePath(pathname, i.href)) && 'bg-brand/90',
                )}
              >
                <MoreHorizontal className="size-[18px]" aria-hidden />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More" side="right" width="max-w-xs">
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-night p-3.5 text-white">
          <Avatar name={admin?.name} className="size-10 text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{admin?.name}</p>
            <p className="truncate text-xs text-white/50">{admin?.email}</p>
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
                    'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                    active ? 'bg-brand-tint text-brand-hover' : 'text-ink hover:bg-stone-100',
                  )}
                >
                  <Icon className={cn('size-5', active ? 'text-brand' : 'text-muted')} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
          {STOREFRONT_URL && (
            <li>
              <a
                href={STOREFRONT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink hover:bg-stone-100"
              >
                <ExternalLink className="size-5 text-muted" aria-hidden />
                View storefront
              </a>
            </li>
          )}
          <li className="mt-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setConfirmLogout(true);
              }}
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-danger hover:bg-danger-tint"
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
