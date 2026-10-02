'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { categoryService } from '@/services';
import type { CategoryInput, CategoryListParams, CategoryOption } from '@/types/api';

export function useCategories(params: CategoryListParams) {
  return useQuery({
    queryKey: qk.categories.list(params),
    queryFn: () => categoryService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCategoryOptions() {
  return useQuery({ queryKey: qk.categories.options, queryFn: categoryService.options, staleTime: 60_000 });
}

/** Options grouped as parent → children for <optgroup> selects. */
export function groupCategoryOptions(options: CategoryOption[]) {
  const sorted = [...options].sort((a, b) => a.name.localeCompare(b.name));
  const tops = sorted.filter((o) => !o.parentId);
  const childrenOf = (id: string) => sorted.filter((o) => o.parentId === id);
  const orphans = sorted.filter((o) => o.parentId && !options.some((p) => p.id === o.parentId));
  return { tops, childrenOf, orphans };
}

export function useInvalidateCategories() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.categories.all });
    void qc.invalidateQueries({ queryKey: qk.dashboard });
    void qc.invalidateQueries({ queryKey: qk.products.all });
  };
}

export function useSaveCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: CategoryInput }) =>
      id ? categoryService.update(id, body) : categoryService.create(body),
    onSuccess: invalidate,
  });
}
