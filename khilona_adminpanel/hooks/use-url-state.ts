'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

type Params = Record<string, string | undefined>;

/**
 * Filters stored in the URL query string (shareable, survives reloads / back button).
 * Any change other than `page` resets pagination to 1.
 */
export function useUrlState<K extends string>(keys: readonly K[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo(() => {
    const out = {} as Record<K, string | undefined>;
    for (const k of keys) out[k] = searchParams.get(k) ?? undefined;
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const set = useCallback(
    (patch: Partial<Record<K, string | undefined>> & Params) => {
      const next = new URLSearchParams(searchParams.toString());
      let touchedNonPage = false;
      for (const [k, v] of Object.entries(patch)) {
        if (k !== 'page') touchedNonPage = true;
        if (v === undefined || v === '' || v === null) next.delete(k);
        else next.set(k, v);
      }
      if (touchedNonPage && !('page' in patch)) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  return { values, set, reset, searchParams };
}
