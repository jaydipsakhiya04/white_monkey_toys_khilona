"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { isApiError } from "@/lib/api/errors";
import { selectCount, useCartStore } from "@/features/cart/cart-store";

function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    // keep tabs in sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === "khilona-cart") void useCartStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

/** Polite live region announcing cart count changes for screen readers. */
function CartAnnouncer() {
  const count = useCartStore(selectCount);
  const hydrated = useCartStore((s) => s.hydrated);
  const prev = useRef<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (prev.current !== null && prev.current !== count) {
      setMessage(count === 0 ? "Your cart is now empty" : `Cart updated: ${count} ${count === 1 ? "item" : "items"}`);
    }
    prev.current = count;
  }, [count, hydrated]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, err) => {
              if (isApiError(err) && err.status >= 400 && err.status < 500) return false;
              return count < 2;
            },
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <CartHydrator />
      <CartAnnouncer />
      {children}
      <Toaster
        position="top-center"
        offset={16}
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !border !border-line !bg-surface !text-ink !shadow-lift !font-sans",
            description: "!text-muted",
            actionButton: "!bg-coral-600 !text-white !rounded-lg !font-semibold",
          },
        }}
      />
    </QueryClientProvider>
  );
}
