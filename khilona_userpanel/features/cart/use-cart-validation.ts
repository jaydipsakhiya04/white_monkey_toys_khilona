"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { validateCart } from "@/services/cart";
import type { CartLine, CartValidation } from "@/types/api";
import { cartKey, toCartInput, useCartStore, type CartItem } from "./cart-store";

export type LineView = {
  item: CartItem;
  line: CartLine | null;
  /** blocks checkout until removed / fixed */
  blocking: boolean;
};

/**
 * Validates the persisted cart against live data (POST /cart/validate),
 * auto-clamps quantities and returns per-line status.
 */
export function useCartValidation(opts?: { enabled?: boolean }) {
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s.hydrated);
  const reconcile = useCartStore((s) => s.reconcile);
  const input = useMemo(() => toCartInput(items), [items]);
  const signature = useMemo(() => input.map((i) => `${i.productId}:${i.variantId ?? ""}:${i.quantity}`).join("|"), [input]);

  const query = useQuery<CartValidation>({
    queryKey: ["cart-validate", signature],
    queryFn: () => validateCart(input),
    enabled: hydrated && input.length > 0 && (opts?.enabled ?? true),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const data = query.data;
  // reconcile clamps + fresh prices into the persisted cart (only for the current signature)
  const isCurrent = !query.isPlaceholderData;
  const [notes, setNotes] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!data || !isCurrent) return;
    const adjusted = data.items.filter((l) => l.status === "QUANTITY_ADJUSTED");
    if (adjusted.length) {
      setNotes((prev) => {
        const next = { ...prev };
        for (const l of adjusted) {
          next[cartKey(l.productId, l.variantId)] =
            l.message || `Quantity updated to ${l.quantity} (only ${l.maxQuantity} available)`;
        }
        return next;
      });
    }
    reconcile(data.items);
  }, [data, isCurrent, reconcile]);
  const dismissNote = useCallback((key: string) => {
    setNotes((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const lines: LineView[] = useMemo(
    () =>
      items.map((item) => {
        const line = data?.items.find((l) => cartKey(l.productId, l.variantId) === item.key) ?? null;
        const blocking = !!line && (line.status === "OUT_OF_STOCK" || line.status === "UNAVAILABLE" || line.status === "VARIANT_REQUIRED");
        return { item, line, blocking };
      }),
    [items, data],
  );

  const blockingCount = lines.filter((l) => l.blocking).length;
  const validatedCurrent = !!data && isCurrent && !query.isFetching;

  return {
    items,
    hydrated,
    lines,
    notes,
    dismissNote,
    summary: data?.summary ?? null,
    hasIssues: blockingCount > 0,
    blockingCount,
    isLoading: hydrated && input.length > 0 && !data,
    isFetching: query.isFetching,
    validatedCurrent,
    error: query.error,
    refetch: query.refetch,
  };
}
