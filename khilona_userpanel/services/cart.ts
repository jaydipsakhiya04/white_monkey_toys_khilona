import { api } from "@/lib/api/client";
import type { CartItemInput, CartValidation } from "@/types/api";

export function validateCart(items: CartItemInput[]) {
  return api.post<CartValidation>("/cart/validate", { items });
}
