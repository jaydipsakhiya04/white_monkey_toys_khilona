"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** true only on the client after hydration. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
