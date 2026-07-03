"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Read/write a single sessionStorage key as React state, SSR-safe and without
 * setState-in-effect. The server snapshot is always null (locked/empty), so the
 * first paint matches the server; the real value hydrates in right after.
 */

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", cb);
  };
}

export function useSessionValue(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );

  const set = useCallback(
    (next: string | null) => {
      try {
        if (next === null) sessionStorage.removeItem(key);
        else sessionStorage.setItem(key, next);
      } catch {
        /* storage unavailable — ignore */
      }
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [value, set];
}

/** True only after the component has mounted in the browser. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** The browser origin (e.g. https://fathomvision.app); "" during SSR. */
export function useOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}
