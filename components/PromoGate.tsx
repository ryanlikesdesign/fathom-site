"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { PromoBoard } from "@/components/PromoBoard";
import type { CustomCodeView, PromoBatchView } from "@/components/PromoBoard";

/**
 * Password gate for the rep tools.
 *
 * The session lives in a signed httpOnly cookie the server sets, so whether
 * we're unlocked is decided on the server and arrives as `initialRep` (null
 * when locked). The password is never compared in the browser, and a locked
 * visitor is never sent any codes.
 */
export function PromoGate({
  initialRep,
  initialBatches,
  initialCustom,
  initialError,
}: {
  initialRep: string | null;
  initialBatches: PromoBatchView[];
  initialCustom: CustomCodeView[];
  initialError: string | null;
}) {
  const [rep, setRep] = useState(initialRep);
  const [batches, setBatches] = useState(initialBatches);
  const [custom, setCustom] = useState(initialCustom);
  const [error, setError] = useState<string | null>(initialError);
  // A failed password and an unreachable database are different problems:
  // only the first should mark the password field invalid.
  const [badPassword, setBadPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Unlocking replaces the form with the board, so focus would otherwise fall
  // to <body>. Errors already moved focus; success — the path that runs a
  // hundred times an event — did not.
  useEffect(() => {
    if (rep !== null) boardRef.current?.focus();
  }, [rep]);

  // rAF isn't guaranteed to run after React has committed, so the ref could be
  // null. An effect keyed on the error is.
  useEffect(() => {
    if (error && rep === null) errorRef.current?.focus();
  }, [error, rep]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/promo/codes", { cache: "no-store" });
      if (res.status === 401) {
        setRep(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't load the codes.");
        return;
      }
      setRep(data.rep ?? "");
      setBatches(data.batches ?? []);
      setCustom(data.custom ?? []);
      setError(null);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("rep") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    try {
      const res = await fetch("/api/promo/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, rep: name }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setBadPassword(res.status === 401);
        setError(data.error ?? "That password isn't right.");
        return;
      }

      setError(null);
      setBadPassword(false);
      if (name) posthog.identify(`rep:${name.toLowerCase()}`, { rep_name: name });
      posthog.capture("promo_page_unlocked", { rep_name: name || null });
      // The password was right, so open the board even if the code database is
      // briefly unreachable — refresh() surfaces that as a banner instead of
      // bouncing them back to a password form they already passed.
      setRep(data.rep ?? name);
      await refresh();
    } catch {
      setBadPassword(false);
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/promo/session", { method: "DELETE" });
    posthog.reset();
    setRep(null);
    setBatches([]);
    setCustom([]);
  }

  if (rep !== null) {
    return (
      <div ref={boardRef} tabIndex={-1}>
        {error && (
          <p role="alert" className="mt-8 rounded-[var(--radius-card)] border p-4">
            {error}
          </p>
        )}
        <PromoBoard
          rep={rep}
          batches={batches}
          custom={custom}
          onRefresh={refresh}
          onSignOut={signOut}
        />
      </div>
    );
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
          So codes you hand out get credited to you. You can leave this blank.
        </p>
        <input
          id="rep"
          name="rep"
          type="text"
          autoComplete="name"
          maxLength={120}
          aria-describedby="rep-hint"
          className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-4 py-3 text-[var(--text-primary)]"
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
          aria-invalid={badPassword ? true : undefined}
          aria-describedby={badPassword ? "password-err" : undefined}
          className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-4 py-3 text-[var(--text-primary)]"
        />
        {badPassword && (
          <span id="password-err" className="sr-only">
            Password incorrect.
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center rounded-[var(--radius-btn)] bg-[var(--text-primary)] px-6 py-3 font-medium text-[var(--bg)] disabled:opacity-60"
        style={{ transitionDuration: "var(--dur)" }}
      >
        {busy ? "Opening…" : "Open the codes"}
      </button>
    </form>
  );
}
