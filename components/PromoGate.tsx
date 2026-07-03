"use client";

import { useRef, useState } from "react";
import posthog from "posthog-js";
import { SHARE_PASSWORD } from "@/lib/promo";
import { useMounted, useSessionValue } from "@/lib/useSession";
import { PromoBoard } from "@/components/PromoBoard";

const UNLOCK_KEY = "fathom-promo-unlocked";
const REP_KEY = "fathom-promo-rep";

export function PromoGate() {
  const mounted = useMounted();
  const [unlock, setUnlock] = useSessionValue(UNLOCK_KEY);
  const [rep, setRep] = useSessionValue(REP_KEY);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("rep") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    if (password.trim() !== SHARE_PASSWORD) {
      setError("That password isn't right. Please check with the Fathom team and try again.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setError(null);
    setRep(name);
    setUnlock("1");
    if (name) {
      posthog.identify(`rep:${name.toLowerCase()}`, { rep_name: name });
    }
    posthog.capture("promo_page_unlocked", { rep_name: name || null });
  }

  function signOut() {
    setUnlock(null);
    setRep(null);
    posthog.reset();
  }

  // Until mounted we can't read sessionStorage, so show a stable placeholder
  // that matches the server render (no hydration flash).
  if (!mounted) {
    return (
      <p className="mt-10 text-[var(--text-secondary)]" role="status">
        Loading…
      </p>
    );
  }

  if (unlock === "1") {
    return <PromoBoard rep={rep ?? ""} onSignOut={signOut} />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 max-w-md space-y-6" aria-labelledby="promo-h">
      <p className="text-[var(--text-secondary)]">
        This page is for people sharing Fathom at events. Enter the access password to open it.
      </p>

      {error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-[var(--radius-card)] border p-4 text-[var(--text-primary)]"
        >
          {error}
        </p>
      )}

      <div>
        <label htmlFor="rep" className="block text-sm font-medium">
          Your name
        </label>
        <p id="rep-hint" className="mt-1 text-sm text-[var(--text-muted)]">
          So shares get credited to you. You can leave this blank.
        </p>
        <input
          id="rep"
          name="rep"
          type="text"
          autoComplete="name"
          maxLength={120}
          aria-describedby="rep-hint"
          className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-raised)] px-4 py-3 text-[var(--text-primary)]"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Access password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "password-err" : undefined}
          className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-raised)] px-4 py-3 text-[var(--text-primary)]"
        />
        {error && (
          <span id="password-err" className="sr-only">
            Password incorrect.
          </span>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-[var(--radius-btn)] bg-[var(--text-primary)] px-6 py-3 font-medium text-[var(--bg)]"
        style={{ transitionDuration: "var(--dur)" }}
      >
        Open the codes
      </button>
    </form>
  );
}
