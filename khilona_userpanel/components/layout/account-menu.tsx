"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Package, Truck, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { firstName, useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/utils/cn";

export const ACCOUNT_LINKS = [
  { href: "/account", label: "My Account", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/track-order", label: "Track Order", icon: Truck },
  { href: "/account/profile", label: "Profile", icon: UserRound },
] as const;

export function Avatar({ name, className }: { name: string | null | undefined; className?: string }) {
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";
  return (
    <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white", className)}>
      {initial}
    </span>
  );
}

/** Logs out, informs the user and leaves account-only pages. */
export function useLogout() {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  return async () => {
    await logout();
    toast.success("You've been logged out");
    if (pathname.startsWith("/account")) router.replace("/");
  };
}

export function AccountMenu() {
  const { status, customer } = useAuth();
  const doLogout = useLogout();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    // focus the first item when opening
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  if (status === "loading") {
    return <span className="hidden h-11 w-24 animate-pulse rounded-full bg-sand md:block" aria-hidden="true" />;
  }

  if (status !== "authenticated" || !customer) {
    return (
      <div className="hidden items-center gap-1 md:flex">
        <Link href="/login" className="inline-flex h-10 items-center rounded-full px-3.5 text-sm font-semibold text-ink hover:bg-sand">
          Log in
        </Link>
        <Link
          href="/signup"
          className="hidden h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-soft lg:inline-flex"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="inline-flex h-11 items-center gap-2 rounded-full pl-1.5 pr-3 text-sm font-semibold text-ink transition-colors hover:bg-sand"
      >
        <Avatar name={customer.name} />
        <span className="max-w-32 truncate">Hi, {firstName(customer.name)}</span>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKey}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 origin-top-right animate-pop-in overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
        >
          <div className="px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-semibold text-ink">{customer.name}</p>
            <p className="truncate text-xs text-muted">{customer.email ?? customer.phone}</p>
          </div>
          <div className="border-t border-line pt-1.5">
            {ACCOUNT_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                tabIndex={-1}
                className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink outline-none hover:bg-sand focus-visible:bg-sand"
              >
                <l.icon className="size-4 text-muted" aria-hidden="true" />
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-1.5 border-t border-line pt-1.5">
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => void doLogout()}
              className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink outline-none hover:bg-sand focus-visible:bg-sand"
            >
              <LogOut className="size-4 text-muted" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
