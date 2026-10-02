import { api, apiRequest, uploadWithProgress } from '@/lib/api-client';
import type {
  AdminCategory,
  AdminCreateInput,
  AdminOrderDetail,
  AdminOrderListItem,
  AdminProductDetail,
  AdminProductListItem,
  AdminProfile,
  AdminReviewList,
  AdminUpdateInput,
  AuthResponse,
  BulkProductAction,
  CategoryInput,
  CategoryListParams,
  CategoryOption,
  Dashboard,
  OrderListParams,
  OrderStatus,
  OrderStatusCounts,
  Paginated,
  PaymentStatus,
  ProductInput,
  ProductListParams,
  ReviewListParams,
  Store,
  StoreInput,
  UploadFolder,
  UploadResult,
} from '@/types/api';

export const authService = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  logout: () => apiRequest<null>('/auth/logout', { method: 'POST', auth: false }),
  me: () => api.get<AdminProfile>('/auth/me'),
  updateMe: (body: { name?: string; phone?: string | null }) => api.patch<AdminProfile>('/auth/me', body),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.patch<null>('/auth/me/password', body),
};

export const dashboardService = {
  get: () => api.get<Dashboard>('/admin/dashboard'),
};

export const storeService = {
  get: () => api.get<Store>('/admin/store'),
  update: (body: StoreInput) => api.put<Store>('/admin/store', body),
};

export const uploadService = {
  image: (file: File, folder: UploadFolder, onProgress?: (p: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return uploadWithProgress<UploadResult>('/admin/uploads/image', form, { folder }, onProgress);
  },
};

export const categoryService = {
  list: (params: CategoryListParams) => api.get<Paginated<AdminCategory>>('/admin/categories', params),
  options: () => api.get<CategoryOption[]>('/admin/categories/options'),
  get: (id: string) => api.get<AdminCategory>(`/admin/categories/${id}`),
  create: (body: CategoryInput) => api.post<AdminCategory>('/admin/categories', body),
  update: (id: string, body: Partial<CategoryInput>) => api.put<AdminCategory>(`/admin/categories/${id}`, body),
  reorder: (items: { id: string; sortOrder: number }[]) => api.patch<null>('/admin/categories/reorder', { items }),
  remove: (id: string, moveProductsTo?: string) =>
    api.delete<{ movedProducts: number }>(`/admin/categories/${id}`, { moveProductsTo }),
};

export const productService = {
  list: (params: ProductListParams) => api.get<Paginated<AdminProductListItem>>('/admin/products', params),
  get: (id: string) => api.get<AdminProductDetail>(`/admin/products/${id}`),
  create: (body: ProductInput) => api.post<AdminProductDetail>('/admin/products', body),
  update: (id: string, body: Partial<ProductInput>) => api.put<AdminProductDetail>(`/admin/products/${id}`, body),
  setStatus: (id: string, body: { isActive?: boolean; isFeatured?: boolean }) =>
    api.patch<AdminProductListItem>(`/admin/products/${id}/status`, body),
  bulk: (ids: string[], action: BulkProductAction) =>
    api.patch<{ affected: number }>('/admin/products/bulk', { ids, action }),
  remove: (id: string) => api.delete<{ mode: 'deleted' | 'archived' }>(`/admin/products/${id}`),
};

export const orderService = {
  list: (params: OrderListParams) => api.get<Paginated<AdminOrderListItem>>('/admin/orders', params),
  statusCounts: () => api.get<OrderStatusCounts>('/admin/orders/status-counts'),
  get: (id: string) => api.get<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}`),
  updateStatus: (id: string, status: OrderStatus, note?: string) =>
    api.patch<AdminOrderDetail>(`/admin/orders/${id}/status`, note ? { status, note } : { status }),
  update: (id: string, body: { adminNote?: string | null; paymentStatus?: PaymentStatus }) =>
    api.patch<AdminOrderDetail>(`/admin/orders/${id}`, body),
};

export const adminService = {
  list: () => api.get<AdminProfile[]>('/admin/admins'),
  create: (body: AdminCreateInput) => api.post<AdminProfile>('/admin/admins', body),
  update: (id: string, body: AdminUpdateInput) => api.patch<AdminProfile>(`/admin/admins/${id}`, body),
};

export const reviewService = {
  list: (params: ReviewListParams) => api.get<AdminReviewList>('/admin/reviews', params),
  /** Moderation only: admins can publish or hide a review, never edit its rating or text. */
  setStatus: (id: string, status: 'APPROVED' | 'HIDDEN') => api.patch<{ id: string; status: string }>(`/admin/reviews/${id}/status`, { status }),
};
