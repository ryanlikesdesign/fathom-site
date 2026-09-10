"use client";
import { useCallback, useEffect, useState } from "react";

// Pause motion: the site-wide equivalent of the OS reduced-motion setting,
// for readers whose device does not expose one (or who want it per site).
// Sets data-motion="reduce" on <html>; fathom-landing.css mirrors its
// prefers-reduced-motion block under that attribute. The choice persists in
// localStorage and is applied before paint by the inline script in layout.tsx,
// the same way the theme is.
//
// One cue for the state, not two: the name stays "Pause motion" and
// aria-pressed carries whether motion is paused, so VoiceOver never reads
// "Resume motion, pressed" (which sounds like motion is on when it is off).
// When the OS setting is on the page is already still by CSS alone and
// nothing this control could set would resume it, so it reports that
// (aria-disabled, "Motion off, set by your device") instead of offering an
// action it cannot perform.
const STORAGE_KEY = "fathom-motion";
const OS_QUERY = "(prefers-reduced-motion: reduce)";

function storedChoice(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "reduce";
  } catch {
    return false;
  }
}

function writeAttribute(reduce: boolean) {
  if (reduce) document.documentElement.setAttribute("data-motion", "reduce");
  else document.documentElement.removeAttribute("data-motion");
}

export function MotionToggle() {
  // Start at "motion on" to match the server render, so hydration agrees.
  const [reduced, setReduced] = useState(false);
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(OS_QUERY);
    // After hydration, adopt whatever the anti-flash script put on <html>
    // (it reads the same storage key and media query before paint), and make
    // sure the OS setting is reflected even if that script did not run.
    const os = mql.matches;
    if (os) writeAttribute(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with client-only DOM state post-hydration
    setOsReduced(os);
    setReduced(os || document.documentElement.getAttribute("data-motion") === "reduce");
    // The OS setting can change while the page is open: follow it, and when
    // it goes off fall back to the reader's own stored choice.
    const onChange = () => {
      const next = mql.matches || storedChoice();
      writeAttribute(next);
      setOsReduced(mql.matches);
      setReduced(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    if (osReduced) return; // the device setting wins; nothing to do
    const next = document.documentElement.getAttribute("data-motion") !== "reduce";
    writeAttribute(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, "reduce");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable (private mode, etc.); the choice still holds for the session */
    }
    setReduced(next);
  }, [osReduced]);

  return (
    <button
      type="button"
      className="theme-toggle motion-toggle"
      aria-pressed={reduced}
      aria-label={osReduced ? "Motion off, set by your device" : "Pause motion"}
      aria-disabled={osReduced || undefined}
      onClick={toggle}
    >
      <span className="theme-icon" aria-hidden="true">
        {reduced && !osReduced ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 5v14M16 5v14" />
          </svg>
        )}
      </span>
    </button>
  );
}
