import type { CategoryListParams, OrderListParams, ProductListParams } from '@/types/api';

export const qk = {
  me: ['auth', 'me'] as const,
  dashboard: ['dashboard'] as const,
  store: ['store'] as const,
  orders: {
    all: ['orders'] as const,
    list: (p: OrderListParams) => ['orders', 'list', p] as const,
    counts: ['orders', 'status-counts'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  products: {
    all: ['products'] as const,
    list: (p: ProductListParams) => ['products', 'list', p] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (p: CategoryListParams) => ['categories', 'list', p] as const,
    options: ['categories', 'options'] as const,
  },
  admins: ['admins'] as const,
};
