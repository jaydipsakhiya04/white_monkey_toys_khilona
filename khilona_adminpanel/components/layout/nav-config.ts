import { FolderTree, LayoutDashboard, Package, Settings, ShoppingBag, Store, UserRound, type LucideIcon } from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: 'pendingOrders' };

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingBag, badge: 'pendingOrders' },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/categories', label: 'Categories', icon: FolderTree },
  { href: '/store', label: 'Store', icon: Store },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

export const BOTTOM_NAV = NAV_ITEMS.slice(0, 4);
export const MORE_NAV = NAV_ITEMS.slice(4);

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
