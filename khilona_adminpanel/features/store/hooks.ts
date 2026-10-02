'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { storeService } from '@/services';
import type { StoreInput } from '@/types/api';

export function useStoreSettings() {
  return useQuery({ queryKey: qk.store, queryFn: storeService.get, refetchOnWindowFocus: false });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StoreInput) => storeService.update(body),
    onSuccess: (store) => qc.setQueryData(qk.store, store),
  });
}

/** Trim string fields. Empty strings are sent as '' — the contract maps them to null server-side. */
export function normalizeStoreInput<T extends Record<string, unknown>>(values: T): StoreInput {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    out[k] = typeof v === 'string' ? v.trim() : v === null ? '' : v;
  }
  return out as StoreInput;
}

/** Store fields come back as null; forms work with ''. */
export function nn(v: string | null | undefined): string {
  return v ?? '';
}
