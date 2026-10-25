import { FolderTree, LayoutDashboard, MessageSquareText, Package, Settings, ShoppingBag, Store, UserRound, type LucideIcon } from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: 'pendingOrders' };
export type NavGroup = { label: string; items: NavItem[] };

const DASHBOARD: NavItem = { href: '/', label: 'Dashboard', icon: LayoutDashboard };
const ORDERS: NavItem = { href: '/orders', label: 'Orders', icon: ShoppingBag, badge: 'pendingOrders' };
const PRODUCTS: NavItem = { href: '/products', label: 'Products', icon: Package };
const CATEGORIES: NavItem = { href: '/categories', label: 'Categories', icon: FolderTree };
const REVIEWS: NavItem = { href: '/reviews', label: 'Reviews', icon: MessageSquareText };
const STORE: NavItem = { href: '/store', label: 'Store', icon: Store };
const SETTINGS: NavItem = { href: '/settings', label: 'Settings', icon: Settings };
const PROFILE: NavItem = { href: '/profile', label: 'Profile', icon: UserRound };

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Overview', items: [DASHBOARD] },
  { label: 'Sales', items: [ORDERS, REVIEWS] },
  { label: 'Catalogue', items: [PRODUCTS, CATEGORIES] },
  { label: 'Shop', items: [STORE, SETTINGS, PROFILE] },
];

export const NAV_ITEMS: NavItem[] = [DASHBOARD, ORDERS, PRODUCTS, CATEGORIES, REVIEWS, STORE, SETTINGS, PROFILE];

export const BOTTOM_NAV = NAV_ITEMS.slice(0, 4);
export const MORE_NAV = NAV_ITEMS.slice(4);

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Title for the top bar, from the first matching nav item. */
export function sectionTitle(pathname: string): string {
  return NAV_ITEMS.find((i) => isActivePath(pathname, i.href))?.label ?? 'Dashboard';
}
