"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Fades + lifts elements marked `data-reveal` into view as they scroll in.
 * Server components only add the attribute (optionally `style={{ "--reveal-delay": "120ms" }}`);
 * this single observer, mounted once in the root layout, does the rest. Styles live in globals.css
 * and only apply when the `js` class is on <html>, so content is never hidden without JS.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const show = (el: Element) => el.setAttribute("data-shown", "");
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach(show);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () =>
      document.querySelectorAll("[data-reveal]:not([data-shown])").forEach((el) => io.observe(el));
    scan();
    // content streamed in later (Suspense, client fetches) is picked up too
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
