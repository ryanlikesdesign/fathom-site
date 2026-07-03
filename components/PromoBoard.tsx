"use client";

import { useCallback, useMemo, useState } from "react";
import posthog from "posthog-js";
import { PROMO_TIERS, type PromoTier } from "@/lib/promo";
import { qrShape } from "@/lib/qr";
import { useOrigin, useSessionValue } from "@/lib/useSession";

const SHARED_KEY = "fathom-promo-shared";

export function PromoBoard({ rep, onSignOut }: { rep: string; onSignOut: () => void }) {
  const origin = useOrigin();
  const [sharedRaw, setSharedRaw] = useSessionValue(SHARED_KEY);

  const shared = useMemo<Set<string>>(() => {
    try {
      return new Set(sharedRaw ? (JSON.parse(sharedRaw) as string[]) : []);
    } catch {
      return new Set();
    }
  }, [sharedRaw]);

  const markShared = useCallback(
    (codeId: string) => {
      if (shared.has(codeId)) return;
      setSharedRaw(JSON.stringify([...shared, codeId]));
    },
    [shared, setSharedRaw],
  );

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border bg-[var(--bg-raised)] px-4 py-3">
        <p className="text-sm text-[var(--text-secondary)]">
          {rep ? (
            <>
              Sharing as <strong className="text-[var(--text-primary)]">{rep}</strong>
            </>
          ) : (
            "Sharing without a name"
          )}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="text-sm underline underline-offset-4"
        >
          {rep ? "Not you? Switch" : "Add your name"}
        </button>
      </div>

      <details className="mt-6 rounded-[var(--radius-card)] border px-4 py-2">
        <summary className="cursor-pointer py-2 font-medium [&::-webkit-details-marker]:hidden">
          How sharing and tracking works
        </summary>
        <div className="pb-3 text-[var(--text-secondary)]">
          <p>
            Each code has three ways to hand it out: a <strong>QR code</strong> to scan, a{" "}
            <strong>link</strong> to send, and the <strong>raw code</strong> to type. Pick whatever
            suits the person in front of you.
          </p>
          <p className="mt-2">
            <strong>Share</strong> opens your phone&apos;s share sheet with a friendly message and
            the code ready to send. <strong>Copy</strong> puts that same message on your clipboard to
            paste into a text or email. When the person opens the QR or link, they land on a branded
            page — which shows a nice preview in Messages and email — with the code and a big Redeem
            button. We record both the share and the open, so the team can see which codes get used.
          </p>
        </div>
      </details>

      <div className="mt-8 space-y-10">
        {PROMO_TIERS.map((tier) => (
          <TierSpotlight
            key={tier.id}
            tier={tier}
            rep={rep}
            origin={origin}
            shared={shared}
            onShared={markShared}
          />
        ))}
      </div>
    </div>
  );
}

function TierSpotlight({
  tier,
  rep,
  origin,
  shared,
  onShared,
}: {
  tier: PromoTier;
  rep: string;
  origin: string;
  shared: Set<string>;
  onShared: (codeId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");

  const total = tier.codes.length;
  const current = tier.codes[index];
  const sharedInTier = tier.codes.filter((c) => shared.has(c.id)).length;

  const trackingUrl = useMemo(() => {
    if (!current) return "";
    const base = `${origin}/promo/r/${current.id}`;
    return rep ? `${base}?rep=${encodeURIComponent(rep)}` : base;
  }, [origin, current, rep]);

  const qr = useMemo(
    () => (trackingUrl ? qrShape(trackingUrl) : null),
    [trackingUrl],
  );

  const announce = useCallback((msg: string) => setMessage(msg), []);

  const fireShared = useCallback(
    (method: string) => {
      if (!current) return;
      posthog.capture("promo_shared", {
        code_id: current.id,
        code: current.code,
        tier_id: tier.id,
        tier_name: tier.name,
        rep_name: rep || null,
        method,
      });
      onShared(current.id);
    },
    [current, tier, rep, onShared],
  );

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      setIndex(clamped);
      announce(`Now showing code ${clamped + 1} of ${total} for ${tier.name}.`);
    },
    [total, tier.name, announce],
  );

  async function onShare() {
    if (!current) return;
    // Native share: the message carries the code; the URL is passed
    // separately so Messages/Mail can unfurl it into a rich preview card.
    const shareText = `Here's your ${tier.name} of Fathom — the AI navigation app for blind and low-vision iPhone users. Your code: ${current.code}.`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `Fathom — ${tier.name}`, text: shareText, url: trackingUrl });
        fireShared("web_share");
        announce("Shared.");
      } catch (err) {
        // User cancelled the share sheet — not an error worth reporting.
        if ((err as Error)?.name !== "AbortError") announce("Sharing was cancelled.");
      }
    } else {
      await copy(shareMessage(), "Message copied — paste it into a text or email.", "copy_message");
    }
  }

  // A ready-to-paste message with the code and link inline, for email/SMS.
  function shareMessage() {
    return `Here's your ${tier.name} of Fathom — the AI navigation app for blind and low-vision iPhone users.\n\nYour code: ${current!.code}\nRedeem it here: ${trackingUrl}`;
  }

  async function copy(text: string, okMsg: string, method: string) {
    try {
      await navigator.clipboard.writeText(text);
      fireShared(method);
      announce(okMsg);
    } catch {
      announce("Couldn't copy automatically — select the text to copy it.");
    }
  }

  if (!current) {
    return (
      <section aria-labelledby={`tier-${tier.id}`} className="rounded-[var(--radius-card)] border p-6">
        <h2 id={`tier-${tier.id}`} className="font-display text-2xl">
          {tier.name}
        </h2>
        <p className="mt-2 text-[var(--text-secondary)]">No codes loaded for this offer yet.</p>
      </section>
    );
  }

  const isShared = shared.has(current.id);

  return (
    <section
      aria-labelledby={`tier-${tier.id}`}
      className="rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`tier-${tier.id}`} className="font-display text-3xl">
          {tier.name}
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {sharedInTier} of {total} shared
        </p>
      </div>
      <p className="mt-1 text-[var(--text-secondary)]">{tier.blurb}</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
        {/* QR — a visual aid for sighted recipients. The link + code below
            are the accessible equivalents for screen-reader users. */}
        <div className="justify-self-center">
          <div className="rounded-[var(--radius-card)] bg-white p-3 shadow-[var(--shadow-floating)]">
            {qr && (
              <svg
                viewBox={`-4 -4 ${qr.size + 8} ${qr.size + 8}`}
                width="176"
                height="176"
                role="img"
                aria-label={`QR code linking to the ${tier.short} redeem page for code ${current.code}. The same link is written below.`}
                shapeRendering="crispEdges"
              >
                <rect x={-4} y={-4} width={qr.size + 8} height={qr.size + 8} fill="#ffffff" />
                <path d={qr.path} fill="#0e1013" />
              </svg>
            )}
          </div>
          <p className="mt-2 text-center text-sm text-[var(--text-muted)]">Scan to redeem</p>
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Code {index + 1} of {total}
            {isShared && <span className="ml-2 text-[var(--accent-signal)]">· Shared ✓</span>}
          </p>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">The code</p>
          <p
            className="mt-1 select-all font-display text-2xl tracking-wide text-[var(--text-primary)]"
            style={{ wordBreak: "break-all" }}
          >
            {current.code}
          </p>

          <p className="mt-4 text-sm text-[var(--text-secondary)]">The link</p>
          <p className="mt-1 break-all text-sm text-[var(--text-muted)]" title={trackingUrl}>
            {trackingUrl || "…"}
          </p>

          <div className="mt-5 flex items-stretch gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[var(--radius-btn)] bg-[var(--text-primary)] px-3 py-3 text-sm font-medium text-[var(--bg)] sm:text-base"
              style={{ transitionDuration: "var(--dur)" }}
            >
              Share
            </button>
            <button
              type="button"
              aria-label="Copy a ready-to-send message with the code and link"
              onClick={() => copy(shareMessage(), "Message copied — paste it into a text or email.", "copy_message")}
              className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[var(--radius-btn)] border bg-[rgba(var(--glass)/0.5)] px-3 py-3 text-sm font-medium backdrop-blur sm:text-base"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => copy(current.code, "Code copied to your clipboard.", "copy_code")}
              className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[var(--radius-btn)] border bg-[rgba(var(--glass)/0.5)] px-3 py-3 text-sm font-medium backdrop-blur sm:text-base"
            >
              Copy code
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border px-4 py-2 text-sm disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index >= total - 1}
              className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border px-4 py-2 text-sm disabled:opacity-40"
            >
              Next code →
            </button>
          </div>
        </div>
      </div>

      {/* Live region: announces copy / share / navigation to screen readers. */}
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </section>
  );
}
