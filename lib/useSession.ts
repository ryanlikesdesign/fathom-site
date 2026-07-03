"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Read/write a single web-storage key as React state, SSR-safe and without
 * setState-in-effect. The server snapshot is always null (locked/empty), so the
 * first paint matches the server; the real value hydrates in right after.
 *
 * `useSessionValue` uses sessionStorage (cleared when the tab closes) — right
 * for the soft password gate. `useLocalValue` uses localStorage (persists
 * across sessions) — right for a rep's share progress during a multi-day event.
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

function storageFor(area: "session" | "local"): Storage | null {
  if (typeof window === "undefined") return null;
  return area === "local" ? window.localStorage : window.sessionStorage;
}

function useStoredValue(
  key: string,
  area: "session" | "local",
): [string | null, (value: string | null) => void] {
  const getSnapshot = useCallback(() => {
    try {
      return storageFor(area)?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }, [key, area]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const set = useCallback(
    (next: string | null) => {
      try {
        const store = storageFor(area);
        if (store) {
          if (next === null) store.removeItem(key);
          else store.setItem(key, next);
        }
      } catch {
        /* storage unavailable — ignore */
      }
      listeners.forEach((l) => l());
    },
    [key, area],
  );

  return [value, set];
}

export function useSessionValue(key: string) {
  return useStoredValue(key, "session");
}

export function useLocalValue(key: string) {
  return useStoredValue(key, "local");
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
