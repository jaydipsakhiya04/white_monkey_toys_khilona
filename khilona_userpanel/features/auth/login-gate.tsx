"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, type AnchorHTMLAttributes, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "./auth-provider";

/** `/login?next=<here>` so customers come straight back after signing in. */
export function loginHref(next: string) {
  return `/login?next=${encodeURIComponent(next || "/")}`;
}

function currentPath(fallback: string) {
  return typeof window === "undefined" ? fallback : `${window.location.pathname}${window.location.search}`;
}

/**
 * Guests may browse everything, but actions (cart, checkout, enquiries, messaging the store) need an
 * account. Returns a guard: `true` when signed in; otherwise it explains why and sends the visitor
 * to log in, returning `false`. While the session is still loading it asks the visitor to retry in a moment.
 */
export function useRequireLogin() {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (action = "continue") => {
      if (status === "authenticated") return true;
      if (status === "loading") {
        // the session is still being restored (a fraction of a second after page load)
        toast.info("One moment — checking your account…", { id: "session-loading" });
        return false;
      }
      toast.info(`Please log in to ${action}`, { description: "It only takes a minute — new here? Create a free account." });
      router.push(loginHref(currentPath(pathname)));
      return false;
    },
    [status, router, pathname],
  );
}

/**
 * An external action link (WhatsApp, email…) that only works for signed-in customers. Guests get a
 * link to the login page instead (it works without JavaScript too), with the same look.
 */
export function GatedAnchor({
  href,
  action,
  children,
  target,
  rel,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; action: string; children: ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  if (status === "authenticated") {
    return (
      <a href={href} target={target} rel={rel} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link
      href={loginHref(pathname)}
      {...props}
      title={`Log in to ${action}`}
      onClick={(e) => {
        if (status === "loading") {
          e.preventDefault();
          return;
        }
        toast.info(`Please log in to ${action}`);
        props.onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
