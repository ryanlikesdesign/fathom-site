"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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

  // Tabs — one offer visible at a time so there's nothing to scroll past.
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Bumping this remounts the spotlights so a reset also returns each offer
  // to its first code.
  const [resetKey, setResetKey] = useState(0);
  const sharedCount = shared.size;

  function resetShared() {
    if (sharedCount === 0) return;
    const ok = window.confirm(
      "Clear the shared markings for every code? This only affects what you see here — it doesn't un-send anything.",
    );
    if (!ok) return;
    setSharedRaw(null);
    setResetKey((k) => k + 1);
  }

  function onTabKeyDown(e: React.KeyboardEvent) {
    const last = PROMO_TIERS.length - 1;
    let next = active;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  }

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
          {sharedCount > 0 && (
            <>
              {" · "}
              <span className="text-[var(--text-primary)]">{sharedCount} marked shared</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-4">
          {sharedCount > 0 && (
            <button
              type="button"
              onClick={resetShared}
              className="text-sm underline underline-offset-4"
            >
              Reset shared
            </button>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="text-sm underline underline-offset-4"
          >
            {rep ? "Not you? Switch" : "Add your name"}
          </button>
        </div>
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
          <ul className="mt-3 space-y-2">
            <li>
              <strong>Share</strong> — opens your phone&apos;s share sheet with a friendly message
              and the code ready to send.
            </li>
            <li>
              <strong>Copy</strong> — puts that same message on your clipboard to paste into a text
              or email.
            </li>
            <li>
              When the person opens the QR or link, they land on a branded page — with a nice
              preview in Messages and email — showing the code and a big Redeem button.
            </li>
          </ul>
          <p className="mt-3">
            After you share a code, we move you to the next one automatically. We record both the
            share and the open, so the team can see which codes get used.
          </p>
        </div>
      </details>

      <div
        role="tablist"
        aria-label="Choose an offer to share"
        className="mt-8 flex w-full gap-1 rounded-[var(--radius-full)] border bg-[var(--bg-raised)] p-1"
      >
        {PROMO_TIERS.map((tier, i) => (
          <button
            key={tier.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`tab-${tier.id}`}
            aria-selected={active === i}
            aria-controls={`panel-${tier.id}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onTabKeyDown}
            className={`flex-1 whitespace-nowrap rounded-[var(--radius-full)] px-4 py-2.5 text-sm font-medium transition-colors sm:text-base ${
              active === i
                ? "bg-[var(--text-primary)] text-[var(--bg)]"
                : "text-[var(--text-secondary)]"
            }`}
            style={{ transitionDuration: "var(--dur)" }}
          >
            {tier.name}
          </button>
        ))}
      </div>

      {PROMO_TIERS.map((tier, i) => (
        <div
          key={tier.id}
          role="tabpanel"
          id={`panel-${tier.id}`}
          aria-labelledby={`tab-${tier.id}`}
          hidden={active !== i}
          className="mt-6"
        >
          <TierSpotlight
            key={resetKey}
            tier={tier}
            rep={rep}
            origin={origin}
            shared={shared}
            onShared={markShared}
          />
        </div>
      ))}
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

  const recordShare = useCallback(
    (method: string, okMsg: string) => {
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
      // Advance to the next code so the rep is ready for the next person.
      if (index < total - 1) {
        setIndex(index + 1);
        announce(`${okMsg} Now showing code ${index + 2} of ${total}.`);
      } else {
        announce(`${okMsg} That was the last ${tier.name} code.`);
      }
    },
    [current, tier, rep, onShared, index, total, announce],
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
        recordShare("web_share", "Shared.");
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
      recordShare(method, okMsg);
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
      <h2 id={`tier-${tier.id}`} className="font-display text-3xl">
        {tier.name}
      </h2>
      <p className="mt-1 text-[var(--text-secondary)]">{tier.blurb}</p>

      {/* Progress across this offer's codes. */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--text-primary)]">
            {sharedInTier} of {total} shared
          </span>
          <span className="text-[var(--text-muted)]">{total - sharedInTier} left</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[var(--accent-signal)] transition-[width]"
            style={{ width: `${total ? (sharedInTier / total) * 100 : 0}%`, transitionDuration: "var(--dur)" }}
          />
        </div>
      </div>

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
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Code {index + 1} of {total}
            </p>
            {isShared ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
                style={{
                  color: "var(--reed-300)",
                  borderColor: "color-mix(in oklab, var(--reed-500) 55%, transparent)",
                  background: "color-mix(in oklab, var(--reed-500) 16%, transparent)",
                }}
              >
                ✓ Shared
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
                Not shared yet
              </span>
            )}
          </div>

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

          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Sharing or copying marks this code <strong className="font-medium">Shared</strong> and
            moves to the next one. Use Previous / Next to move by hand.
          </p>

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
