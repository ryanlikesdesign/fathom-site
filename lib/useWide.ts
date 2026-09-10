"use client";

import { useSyncExternalStore } from "react";

/**
 * Is the viewport wide enough for the sticky-phone scrolly? Same 861px line
 * as fathom-landing.css, so the two phone sets (one sticky stack on desktop,
 * one inline phone per step on phones) are decided by one number.
 *
 * `null` on the server and during hydration: both sets are in the server
 * HTML and the CSS breakpoint shows one, so a no-JS load still has its
 * mockups and the hydration render matches the markup; the real answer
 * arrives in the same pass as every other client snapshot, before paint,
 * and unmounts the other set. A fresh client mount (a Link from a subpage)
 * reads the media query at once.
 */
const QUERY = "(min-width:861px)";

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => null;

export function useWide(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
