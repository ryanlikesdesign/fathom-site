"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";
import { expiryState } from "@/lib/promoExpiry";
import { qrShape } from "@/lib/qr";
import { useLocalValue, useOrigin } from "@/lib/useSession";

export interface PromoBatchView {
  batch_id: string;
  offer_name: string;
  duration_label: string;
  expires_on: string | null;
  sort_order: number;
  total: number;
  available: number;
  reserved: number;
  sent: number;
  confirmed_redeemed: number;
  links_opened: number;
  redeem_clicked: number;
}

export interface CustomCodeView {
  code: string;
  offer_name: string;
  duration_label: string;
  redemption_cap: number | null;
  expires_on: string | null;
  active: boolean;
  note: string | null;
  synced_at: string;
}

/** A code this rep is currently holding, before they hand it over. */
interface HeldCode {
  code: string;
  slug: string;
}

// Which code each rep is holding per batch, so a refresh mid-event doesn't
// strand a reserved code. The server is the source of truth; this is a pointer.
const HELD_KEY = "fathom-promo-held";

export function PromoBoard({
  rep,
  batches,
  custom,
  onRefresh,
  onSignOut,
}: {
  rep: string;
  batches: PromoBatchView[];
  custom: CustomCodeView[];
  onRefresh: () => Promise<void>;
  onSignOut: () => void;
}) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [heldRaw, setHeldRaw] = useLocalValue(HELD_KEY);
  const [message, setMessage] = useState("");

  const held = useMemo<Record<string, HeldCode>>(() => {
    try {
      return heldRaw ? (JSON.parse(heldRaw) as Record<string, HeldCode>) : {};
    } catch {
      return {};
    }
  }, [heldRaw]);

  const setHeld = useCallback(
    (batchId: string, code: HeldCode | null) => {
      const next = { ...held };
      if (code) next[batchId] = code;
      else delete next[batchId];
      setHeldRaw(Object.keys(next).length ? JSON.stringify(next) : null);
    },
    [held, setHeldRaw],
  );

  // A held code may have been sent or released from another device — drop any
  // pointer the server no longer recognises as still reserved.
  const verified = useRef(false);
  useEffect(() => {
    if (verified.current) return;
    verified.current = true;

    const slugs = Object.entries(held);
    if (!slugs.length) return;

    void (async () => {
      for (const [batchId, code] of slugs) {
        try {
          const res = await fetch(`/api/promo/codes/${encodeURIComponent(code.slug)}`, {
            cache: "no-store",
          });
          if (!res.ok) {
            setHeld(batchId, null);
            continue;
          }
          const data = await res.json();
          if (data.status !== "assigned") setHeld(batchId, null);
        } catch {
          /* offline — keep what we have and let the next action reconcile */
        }
      }
    })();
  }, [held, setHeld]);

  function onTabKeyDown(e: React.KeyboardEvent) {
    const last = batches.length - 1;
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

  if (!batches.length) {
    return (
      <div className="mt-8 rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-6">
        <p className="text-[var(--text-secondary)]">
          No offers are loaded. Check that the code database is reachable.
        </p>
      </div>
    );
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
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a href="/promo/tracker" className="text-sm underline underline-offset-4">
            Code tracker
          </a>
          <button type="button" onClick={onSignOut} className="text-sm underline underline-offset-4">
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
            Tap <strong>Get a code</strong> and you&apos;ll be handed the next unused one. It&apos;s
            reserved to you the moment you take it, so nobody else can hand out the same code — even
            if you&apos;re both sharing at once.
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <strong>Share</strong> — opens your phone&apos;s share sheet with a friendly message
              and the code ready to send.
            </li>
            <li>
              <strong>Copy</strong> — puts that same message on your clipboard.
            </li>
            <li>
              Once you&apos;ve handed it over, mark it sent and take the next one. If you took a code
              and didn&apos;t use it, put it back.
            </li>
          </ul>
          <p className="mt-3">
            We record when the link is opened and when someone taps through to redeem. Apple
            doesn&apos;t tell anyone which codes were actually redeemed, so the last step is a
            person confirming it on the tracker.
          </p>
        </div>
      </details>

      <div
        role="tablist"
        aria-label="Choose an offer to share"
        className="mt-8 flex w-full gap-1 rounded-[var(--radius-full)] border bg-[var(--bg-raised)] p-1"
      >
        {batches.map((batch, i) => (
          <button
            key={batch.batch_id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            id={`tab-${batch.batch_id}`}
            aria-selected={active === i}
            aria-controls={`panel-${batch.batch_id}`}
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
            {batch.duration_label}
          </button>
        ))}
      </div>

      {batches.map((batch, i) => (
        <div
          key={batch.batch_id}
          role="tabpanel"
          id={`panel-${batch.batch_id}`}
          aria-labelledby={`tab-${batch.batch_id}`}
          hidden={active !== i}
          className="mt-6"
        >
          <BatchPanel
            batch={batch}
            rep={rep}
            held={held[batch.batch_id] ?? null}
            setHeld={(c) => setHeld(batch.batch_id, c)}
            onRefresh={onRefresh}
            announce={setMessage}
          />
        </div>
      ))}

      <CustomCodeList custom={custom} />

      <p className="mt-10">
        <a href="/promo/tracker" className="underline underline-offset-4">
          See every code that&apos;s gone out, and who has it →
        </a>
      </p>

      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function BatchPanel({
  batch,
  rep,
  held,
  setHeld,
  onRefresh,
  announce,
}: {
  batch: PromoBatchView;
  rep: string;
  held: HeldCode | null;
  setHeld: (code: HeldCode | null) => void;
  onRefresh: () => Promise<void>;
  announce: (msg: string) => void;
}) {
  const origin = useOrigin();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackingUrl = held
    ? `${origin}/promo/r/${held.slug}${rep ? `?rep=${encodeURIComponent(rep)}` : ""}`
    : "";
  const qr = useMemo(() => (trackingUrl ? qrShape(trackingUrl) : null), [trackingUrl]);

  async function getCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/promo/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: batch.batch_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't get a code.");
        return;
      }
      setHeld({ code: data.code, slug: data.slug });
      announce(`You have a ${batch.duration_label} code: ${data.code}.`);
      await onRefresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function patch(action: string, method?: string) {
    if (!held) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/promo/codes/${encodeURIComponent(held.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, method }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't update that code.");
        return;
      }
      setHeld(null);
      await onRefresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function shareMessage() {
    return `Here's your ${batch.duration_label} of Fathom — the AI navigation app for blind and low-vision iPhone users.\n\nYour code: ${held!.code}\nRedeem it here: ${trackingUrl}`;
  }

  async function recordShare(method: string, okMsg: string) {
    posthog.capture("promo_shared", {
      code_slug: held?.slug,
      batch_id: batch.batch_id,
      offer_name: batch.offer_name,
      rep_name: rep || null,
      method,
    });
    announce(okMsg);
    await patch("sent", method);
  }

  async function onShare() {
    if (!held) return;
    const text = `Here's your ${batch.duration_label} of Fathom — the AI navigation app for blind and low-vision iPhone users. Your code: ${held.code}.`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Fathom — ${batch.duration_label}`,
          text,
          url: trackingUrl,
        });
        await recordShare("web_share", "Shared, and marked as handed out.");
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") announce("Sharing was cancelled.");
      }
    } else {
      await copy(shareMessage(), "Message copied, and marked as handed out.", "copy_message");
    }
  }

  async function copy(text: string, okMsg: string, method: string) {
    try {
      await navigator.clipboard.writeText(text);
      await recordShare(method, okMsg);
    } catch {
      announce("Couldn't copy automatically — select the text to copy it.");
    }
  }

  // Apple kills these on their expiry date; handing one out afterwards just
  // wastes someone's time, so the whole panel goes read-only.
  const expiry = expiryState(batch.expires_on);

  return (
    <section
      aria-labelledby={`batch-${batch.batch_id}`}
      className="rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={`batch-${batch.batch_id}`} className="font-display text-3xl">
          {batch.duration_label}
        </h2>
        {expiry.badge && <ExpiryBadge expired={expiry.expired} label={expiry.badge} />}
      </div>
      <p className="mt-1 text-[var(--text-secondary)]">
        {batch.available} of {batch.total} still unused · {expiry.label}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--text-primary)]">
            {batch.sent + batch.confirmed_redeemed} handed out
          </span>
          <span className="text-[var(--text-muted)]">{batch.available} left</span>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-[var(--accent-signal)]"
            style={{
              width: `${batch.total ? ((batch.sent + batch.confirmed_redeemed) / batch.total) * 100 : 0}%`,
              transitionDuration: "var(--dur)",
            }}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-[var(--radius-card)] border p-4">
          {error}
        </p>
      )}

      {!held ? (
        <div className="mt-6">
          <p className="text-[var(--text-secondary)]">
            {expiry.expired
              ? `These codes stopped working on ${expiry.label.replace("Expired ", "")}. Generate a new batch in App Store Connect.`
              : batch.available > 0
                ? "Take the next unused code when you're ready to hand one out."
                : "There are no codes left in this offer."}
          </p>
          <button
            type="button"
            onClick={getCode}
            disabled={busy || batch.available === 0 || expiry.expired}
            className="mt-4 inline-flex items-center justify-center rounded-[var(--radius-btn)] bg-[var(--text-primary)] px-6 py-3 font-medium text-[var(--bg)] disabled:opacity-50"
            style={{ transitionDuration: "var(--dur)" }}
          >
            {busy ? "Getting a code…" : "Get a code"}
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
          {/* QR for sighted recipients; the link and code below are the
              accessible equivalents. */}
          <div className="justify-self-center">
            <div className="rounded-[var(--radius-card)] bg-white p-3 shadow-[var(--shadow-floating)]">
              {qr && (
                <svg
                  viewBox={`-4 -4 ${qr.size + 8} ${qr.size + 8}`}
                  width="176"
                  height="176"
                  role="img"
                  aria-label={`QR code linking to the redeem page for code ${held.code}. The same link is written below.`}
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
              Reserved for you — nobody else can hand this one out
            </p>

            <p className="mt-3 text-sm text-[var(--text-secondary)]">The code</p>
            <p
              className="mt-1 select-all font-display text-2xl tracking-wide text-[var(--text-primary)]"
              style={{ wordBreak: "break-all" }}
            >
              {held.code}
            </p>

            <p className="mt-4 text-sm text-[var(--text-secondary)]">The link</p>
            <p className="mt-1 break-all text-sm text-[var(--text-muted)]" title={trackingUrl}>
              {trackingUrl || "…"}
            </p>

            <div className="mt-5 flex items-stretch gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onShare}
                disabled={busy}
                className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[var(--radius-btn)] bg-[var(--text-primary)] px-3 py-3 text-sm font-medium text-[var(--bg)] disabled:opacity-50 sm:text-base"
                style={{ transitionDuration: "var(--dur)" }}
              >
                Share
              </button>
              <button
                type="button"
                aria-label="Copy a ready-to-send message with the code and link"
                disabled={busy}
                onClick={() =>
                  copy(shareMessage(), "Message copied, and marked as handed out.", "copy_message")
                }
                className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[var(--radius-btn)] border bg-[rgba(var(--glass)/0.5)] px-3 py-3 text-sm font-medium backdrop-blur disabled:opacity-50 sm:text-base"
              >
                Copy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  copy(held.code, "Code copied, and marked as handed out.", "copy_code")
                }
                className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-[var(--radius-btn)] border bg-[rgba(var(--glass)/0.5)] px-3 py-3 text-sm font-medium backdrop-blur disabled:opacity-50 sm:text-base"
              >
                Copy code
              </button>
            </div>

            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Sharing or copying marks this code handed out and frees you to take the next one.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => patch("sent", "manual")}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border px-4 py-2.5 text-sm disabled:opacity-50"
              >
                I handed it over
              </button>
              <button
                type="button"
                onClick={() => patch("released")}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-[var(--radius-btn)] border px-4 py-2.5 text-sm disabled:opacity-50"
              >
                Put it back
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- */

/** Colour never carries the meaning alone — the badge always says the word. */
function ExpiryBadge({ expired, label }: { expired: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={
        expired
          ? {
              color: "var(--text-primary)",
              borderColor: "var(--text-muted)",
              background: "var(--bg-hover)",
            }
          : {
              color: "var(--reed-300)",
              borderColor: "color-mix(in oklab, var(--reed-500) 55%, transparent)",
              background: "color-mix(in oklab, var(--reed-500) 16%, transparent)",
            }
      }
    >
      {label}
    </span>
  );
}

/**
 * Reusable broadcast codes. There's nothing to hand out here — one code goes to
 * everyone — so this is read-only. It exists because a live code with a
 * redemption cap and an expiry date shouldn't be invisible to the team.
 */
function CustomCodeList({ custom }: { custom: CustomCodeView[] }) {
  if (!custom.length) return null;

  return (
    <section aria-labelledby="custom-h" className="mt-10">
      <h2 id="custom-h" className="font-display text-2xl">
        Shared codes
      </h2>
      <p className="mt-2 text-[var(--text-secondary)]">
        One code that many people can redeem, up to a limit — separate from the one-per-person
        codes above. Nothing to hand out here; this is just so you know it&apos;s live.
      </p>

      <ul className="mt-5 space-y-3">
        {custom.map((item) => {
          const expiry = expiryState(item.expires_on);
          const dead = expiry.expired || !item.active;
          return (
            <li
              key={item.code}
              className="rounded-[var(--radius-card)] border bg-[var(--bg-raised)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-display text-xl tracking-wide text-[var(--text-primary)]">
                      {item.code}
                    </p>
                    {dead ? (
                      <ExpiryBadge expired label={expiry.expired ? "Expired" : "Switched off"} />
                    ) : (
                      expiry.badge && <ExpiryBadge expired={false} label={expiry.badge} />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {item.duration_label} · {item.offer_name} ·{" "}
                    {item.redemption_cap ? `up to ${item.redemption_cap} redemptions` : "no cap set"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{expiry.label}</p>
                </div>
              </div>
              <p className="mt-3 border-t pt-3 text-sm text-[var(--text-muted)]">
                Apple doesn&apos;t report how many of these have been redeemed, so the remaining
                count is unknown.
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
