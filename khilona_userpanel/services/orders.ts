import { api } from "@/lib/api/client";
import type { CreateOrderInput, PublicOrder } from "@/types/api";

export function createOrder(input: CreateOrderInput) {
  return api.post<PublicOrder>("/orders", input);
}

export function trackOrder(orderNumber: string, phone: string) {
  return api.get<PublicOrder>("/orders/track", { orderNumber, phone });
}
