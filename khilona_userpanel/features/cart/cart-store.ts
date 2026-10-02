"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItemInput, CartLine } from "@/types/api";

export const MAX_LINE_QTY = 99;
export const MAX_CART_LINES = 50;

/** Display snapshot captured when the item was added. Prices are re-validated by the API. */
export type CartSnapshot = {
  name: string;
  slug: string;
  imageUrl: string | null;
  unitPrice: number;
  unitMrp: number;
  variantTitle: string | null;
  options: Record<string, string> | null;
  /** best known available stock (capped at 99) */
  maxQuantity: number;
};

export type CartItem = {
  key: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  snapshot: CartSnapshot;
  addedAt: number;
};

export const cartKey = (productId: string, variantId: string | null | undefined) => `${productId}:${variantId ?? ""}`;

type AddResult = { added: number; quantity: number; capped: boolean };

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  add: (input: { productId: string; variantId: string | null; quantity: number; snapshot: CartSnapshot }) => AddResult;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** Apply server validation: clamp quantities and refresh snapshot prices/names. */
  reconcile: (lines: CartLine[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,

      add: ({ productId, variantId, quantity, snapshot }) => {
        const key = cartKey(productId, variantId);
        const max = Math.max(1, Math.min(MAX_LINE_QTY, snapshot.maxQuantity || MAX_LINE_QTY));
        const existing = get().items.find((i) => i.key === key);
        const current = existing?.quantity ?? 0;
        const next = Math.min(max, current + Math.max(1, quantity));
        const result: AddResult = { added: next - current, quantity: next, capped: current + quantity > max };
        if (existing) {
          set({
            items: get().items.map((i) => (i.key === key ? { ...i, quantity: next, snapshot: { ...snapshot, maxQuantity: max } } : i)),
          });
        } else {
          if (get().items.length >= MAX_CART_LINES) return { added: 0, quantity: 0, capped: true };
          set({
            items: [
              ...get().items,
              { key, productId, variantId, quantity: next, snapshot: { ...snapshot, maxQuantity: max }, addedAt: Date.now() },
            ],
          });
        }
        return result;
      },

      setQuantity: (key, quantity) =>
        set({
          items: get().items.map((i) =>
            i.key === key ? { ...i, quantity: Math.max(1, Math.min(MAX_LINE_QTY, Math.floor(quantity))) } : i,
          ),
        }),

      remove: (key) => set({ items: get().items.filter((i) => i.key !== key) }),

      clear: () => set({ items: [] }),

      reconcile: (lines) => {
        let changed = false;
        const items = get().items.map((item) => {
          const line = lines.find((l) => cartKey(l.productId, l.variantId) === item.key);
          if (!line) return item;
          const next: CartItem = { ...item, snapshot: { ...item.snapshot } };
          if (line.status === "QUANTITY_ADJUSTED" && line.quantity > 0 && line.quantity !== item.quantity) {
            next.quantity = line.quantity;
            changed = true;
          }
          if (line.product) {
            if (line.product.name !== item.snapshot.name || line.product.slug !== item.snapshot.slug) changed = true;
            next.snapshot.name = line.product.name;
            next.snapshot.slug = line.product.slug;
            next.snapshot.imageUrl = line.variant?.imageUrl ?? line.product.thumbnailUrl ?? item.snapshot.imageUrl;
          }
          if (line.status === "OK" || line.status === "QUANTITY_ADJUSTED") {
            if (line.unitPrice !== item.snapshot.unitPrice || line.maxQuantity !== item.snapshot.maxQuantity) changed = true;
            next.snapshot.unitPrice = line.unitPrice;
            next.snapshot.unitMrp = line.unitMrp;
            next.snapshot.maxQuantity = line.maxQuantity;
          }
          return next;
        });
        if (changed) set({ items });
      },
    }),
    {
      name: "khilona-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hydrated: true });
      },
    },
  ),
);

export function toCartInput(items: CartItem[]): CartItemInput[] {
  return items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }));
}

export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
