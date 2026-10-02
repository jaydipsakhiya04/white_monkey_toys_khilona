'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';
import { productService } from '@/services';
import type { AdminProductListItem, BulkProductAction, Paginated, ProductListParams } from '@/types/api';

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: qk.products.list(params),
    queryFn: () => productService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: qk.products.detail(id ?? 'new'),
    queryFn: () => productService.get(id!),
    enabled: !!id,
    // the edit form must start from fresh data
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

function useInvalidateProducts() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.products.all });
    void qc.invalidateQueries({ queryKey: qk.dashboard });
    void qc.invalidateQueries({ queryKey: qk.categories.all });
  };
}

/** Optimistic active/featured toggle with rollback. */
export function useToggleProductStatus() {
  const qc = useQueryClient();
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { isActive?: boolean; isFeatured?: boolean } }) =>
      productService.setStatus(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ['products', 'list'] });
      const snapshots = qc.getQueriesData<Paginated<AdminProductListItem>>({ queryKey: ['products', 'list'] });
      qc.setQueriesData<Paginated<AdminProductListItem>>({ queryKey: ['products', 'list'] }, (old) =>
        old ? { ...old, items: old.items.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : old,
      );
      return { snapshots };
    },
    onError: (err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(getErrorMessage(err, 'Could not update the product'));
    },
    onSuccess: (_data, { patch }) => {
      const what =
        patch.isActive !== undefined
          ? patch.isActive
            ? 'Product is now visible on the store'
            : 'Product hidden from the store'
          : patch.isFeatured
            ? 'Marked as featured'
            : 'Removed from featured';
      toast.success(what);
    },
    onSettled: invalidate,
  });
}

export function useBulkProducts() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: BulkProductAction }) => productService.bulk(ids, action),
    onSettled: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSettled: invalidate,
  });
}

export { useInvalidateProducts };
