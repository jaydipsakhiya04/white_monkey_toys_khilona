import { authedApi } from "@/lib/api/authed";
import { api } from "@/lib/api/client";
import type { CreateOrderInput, PublicOrder } from "@/types/api";

/** Sends the customer token when signed in, so the order is linked to the account. Guests work as before. */
export function createOrder(input: CreateOrderInput) {
  return authedApi.post<PublicOrder>("/orders", input);
}

export function trackOrder(orderNumber: string, phone: string) {
  return api.get<PublicOrder>("/orders/track", { orderNumber, phone });
}
