"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, LayoutDashboard, LogOut, Package, Star, Truck, UserRound } from "lucide-react";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { Avatar, useLogout } from "@/components/layout/account-menu";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/utils/cn";

const NAV = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/track-order", label: "Track Order", icon: Truck },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/reviews", label: "Reviews", icon: Star },
  { href: "/account/documents", label: "Documents", icon: FileText },
];

const StoreContext = createContext<{ storeName: string; phoneUrl: string | null; whatsappUrl: string | null }>({
  storeName: "White Monkey Toys",
  phoneUrl: null,
  whatsappUrl: null,
});
export const useStoreInfo = () => useContext(StoreContext);

function isActive(pathname: string, href: string) {
  return href === "/account" ? pathname === "/account" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountShell({
  children,
  storeName,
  phoneUrl,
  whatsappUrl,
}: {
  children: ReactNode;
  storeName: string;
  phoneUrl: string | null;
  whatsappUrl: string | null;
}) {
  const { status, customer } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const doLogout = useLogout();

  // Pages here are client-guarded for UX only; every API call is authorised server-side.
  useEffect(() => {
    if (status === "guest") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status !== "authenticated" || !customer) {
    return (
      <Container className="py-8 sm:py-12" aria-busy="true">
        <Skeleton className="h-9 w-56" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
          <Skeleton className="hidden h-72 lg:block" />
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <span className="sr-only">Loading your account…</span>
      </Container>
    );
  }

  return (
    <StoreContext.Provider value={{ storeName, phoneUrl, whatsappUrl }}>
      <Container className="py-6 sm:py-10">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
          <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <div className="hidden items-center gap-3 lg:flex">
              <Avatar name={customer.name} className="size-11 text-base" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{customer.name}</p>
                <p className="truncate text-xs text-muted">{customer.email ?? customer.phone}</p>
              </div>
            </div>
            <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:mt-6 lg:overflow-visible lg:px-0">
              <ul className="flex gap-2 lg:flex-col lg:gap-0.5">
                {NAV.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href} className="shrink-0">
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-10 items-center gap-2.5 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors lg:h-11 lg:rounded-xl lg:px-3",
                          active ? "bg-ink text-white lg:bg-sand lg:font-semibold lg:text-ink" : "border border-line text-ink hover:bg-sand lg:border-0",
                        )}
                      >
                        <item.icon className={cn("hidden size-[1.125rem] lg:block", active ? "text-ink" : "text-muted")} aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
                <li className="shrink-0 lg:mt-2 lg:border-t lg:border-line lg:pt-2">
                  <button
                    type="button"
                    onClick={() => void doLogout()}
                    className="flex h-10 items-center gap-2.5 whitespace-nowrap rounded-full border border-line px-4 text-sm font-medium text-ink hover:bg-sand lg:h-11 lg:w-full lg:rounded-xl lg:border-0 lg:px-3"
                  >
                    <LogOut className="hidden size-[1.125rem] text-muted lg:block" aria-hidden="true" />
                    Log out
                  </button>
                </li>
              </ul>
            </nav>
          </aside>
          <div className="min-w-0 animate-fade-in">{children}</div>
        </div>
      </Container>
    </StoreContext.Provider>
  );
}

export function AccountHeading({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-[2.25rem]">{title}</h1>
        {description && <p className="mt-1.5 text-[0.9375rem] text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
