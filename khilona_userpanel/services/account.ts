import { authedApi, authedBlob } from "@/lib/api/authed";
import { request } from "@/lib/api/request";
import { PUBLIC_API_URL } from "@/lib/env";
import type {
  CustomerAuthResponse,
  CustomerOrder,
  CustomerOrderListItem,
  CustomerOrderSummary,
  CustomerProfile,
  DocumentKind,
  MyReview,
  OwnReview,
  Paginated,
  SignupInput,
} from "@/types/api";

/** Auth endpoints need cookies (httpOnly refresh token), so they always use credentials. */
const authPost = <T>(path: string, body: unknown) =>
  request<T>(`${PUBLIC_API_URL}/auth/customer${path}`, { method: "POST", credentials: "include", body: JSON.stringify(body) });

export const customerAuth = {
  signup: (input: SignupInput) => authPost<CustomerAuthResponse>("/signup", input),
  login: (identifier: string, password: string) => authPost<CustomerAuthResponse>("/login", { identifier, password }),
  logout: () => authPost<null>("/logout", {}),
  forgotPassword: (identifier: string) => authPost<{ deliveryAvailable: boolean }>("/forgot-password", { identifier }),
  resetPassword: (token: string, password: string) => authPost<null>("/reset-password", { token, password }),
  /** Under /auth/customer so the refresh cookie keeps this session signed in. */
  changePassword: (currentPassword: string, newPassword: string) =>
    authedApi.patch<null>("/auth/customer/password", { currentPassword, newPassword }),
};

export type OrderFilter = "active" | "delivered" | "cancelled" | undefined;

export const accountService = {
  profile: () => authedApi.get<CustomerProfile>("/customer/profile"),
  updateProfile: (body: { name?: string; email?: string; phone?: string }) => authedApi.patch<CustomerProfile>("/customer/profile", body),
  summary: () => authedApi.get<CustomerOrderSummary>("/customer/orders/summary"),
  orders: (page = 1, status?: OrderFilter, limit = 10) =>
    authedApi.get<Paginated<CustomerOrderListItem>>("/customer/orders", { page, limit, status }),
  order: (orderNumber: string) => authedApi.get<CustomerOrder>(`/customer/orders/${encodeURIComponent(orderNumber)}`),
  cancel: (orderNumber: string, reason?: string) =>
    authedApi.post<CustomerOrder>(`/customer/orders/${encodeURIComponent(orderNumber)}/cancel`, reason ? { reason } : {}),
  claim: (orderNumber: string) => authedApi.post<CustomerOrder>("/customer/orders/claim", { orderNumber }),
  document: (orderNumber: string, kind: DocumentKind) => authedBlob(`/customer/orders/${encodeURIComponent(orderNumber)}/${kind}`),
  guestDocument: (orderNumber: string, phone: string, kind: DocumentKind) =>
    authedBlob(`/orders/track/${kind}`, { method: "POST", json: { orderNumber, phone } }),
};

export const reviewService = {
  mine: (page = 1) => authedApi.get<Paginated<MyReview>>("/customer/reviews", { page, limit: 10 }),
  create: (body: { orderNumber: string; productId: string; rating: number; comment?: string | null }) =>
    authedApi.post<OwnReview>("/customer/reviews", body),
  update: (id: string, body: { rating?: number; comment?: string | null }) => authedApi.patch<OwnReview>(`/customer/reviews/${id}`, body),
  remove: (id: string) => authedApi.delete<null>(`/customer/reviews/${id}`),
};
