"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/Button";
import { PromoCode, spellCode } from "@/components/PromoCode";
import { Surface } from "@/components/Surface";
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
  // Setting the same string twice is a no-op in React, so the DOM never
  // changes and the screen reader never fires. A rep copying ten codes in a
  // row heard the confirmation once. Clearing first forces a real mutation.
  const announce = useCallback((text: string) => {
    setMessage("");
    requestAnimationFrame(() => setMessage(text));
  }, []);

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
      <Surface register="lift" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <p className="min-w-0 text-sm text-[var(--text-secondary)]">
          {rep ? (
            <>
              Sharing as{" "}
              <strong className="break-words text-[var(--text-primary)]">{rep}</strong>
            </>
          ) : (
            "Sharing without a name"
          )}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {/* inline-flex min-h-11 keeps the visual weight of a text link while
              giving it the 44px hit area the floor requires. */}
          <a
            href="/promo/tracker"
            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            Code tracker
          </a>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            {rep ? "Sign out and switch rep" : "Add your name"}
          </button>
        </div>
      </Surface>

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
        className="mt-8 flex w-full flex-wrap gap-1 rounded-[var(--radius-full)] border bg-[var(--bg-raised)] p-1"
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
            // A selected tab is a state, not the page's main action, so it
            // reads as a filled chip rather than borrowing the primary CTA's
            // treatment — otherwise three max-emphasis elements stack up.
            className={`min-h-11 flex-1 basis-32 rounded-[var(--radius-full)] px-4 py-2.5 text-sm font-medium transition-colors sm:text-base ${
              active === i
                ? "bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border)]"
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
            announce={announce}
          />
        </div>
      ))}

      <CustomCodeList custom={custom} />

      <p className="mt-10">
        <a href="/promo/tracker" className="underline underline-offset-4">
          See every code that&apos;s gone out, and who has it →
        </a>
      </p>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
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

  // Every transition here unmounts the control the rep just activated, which
  // drops VoiceOver focus to <body> — on iOS that resets the cursor to the top
  // of the page, mid-conversation with the person they're helping. So focus
  // moves deliberately: into the panel when a code is claimed, back to the
  // claim button when it's handed over or returned.
  const panelHeadingRef = useRef<HTMLHeadingElement>(null);
  const getCodeRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const prevHeld = useRef<HeldCode | null>(held);

  useEffect(() => {
    if (held && !prevHeld.current) panelHeadingRef.current?.focus();
    else if (!held && prevHeld.current) getCodeRef.current?.focus();
    prevHeld.current = held;
  }, [held]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

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
      // Spelled out: an 18-character run read as a word is useless to the
      // person whose job is to say it aloud.
      announce(`${batch.duration_label} code reserved: ${spellCode(data.code)}.`);
      await onRefresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * `okMsg` is announced only after the write succeeds. Announcing first —
   * which this used to do — could tell a rep a code went out and then render a
   * contradicting error, in a tool whose entire job is an accurate ledger.
   */
  async function patch(action: string, method?: string, okMsg?: string) {
    if (!held) return false;
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
        return false;
      }
      setHeld(null);
      if (okMsg) announce(okMsg);
      await onRefresh();
      return true;
    } catch {
      setError("Couldn't reach the server. Try again.");
      return false;
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
    await patch("sent", method, okMsg);
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
        // AbortError IS the cancellation. This was inverted, so cancelling was
        // silent and a genuine failure was reported as "cancelled" — either way
        // leaving the rep unsure whether they still held the code.
        if ((err as Error)?.name === "AbortError") {
          announce("Sharing cancelled. You still have this code.");
        } else {
          announce("Sharing didn't work. You still have this code — try Copy instead.");
        }
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
    <section aria-labelledby={`batch-${batch.batch_id}`}>
      <Surface register="lift" className="p-6">
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
          <span className="text-[var(--text-secondary)]">{batch.available} left</span>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--track)]"
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
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-5 rounded-[var(--radius-card)] border p-4"
        >
          {error}
        </p>
      )}

      {!held ? (
        <div className="mt-6">
          <p id={`why-${batch.batch_id}`} className="text-[var(--text-secondary)]">
            {expiry.expired
              ? `These codes stopped working on ${expiry.label.replace("Expired ", "")}. Generate a new batch in App Store Connect.`
              : batch.available > 0
                ? "Take the next unused code when you're ready to hand one out."
                : "There are no codes left in this offer."}
          </p>
          <Button
            ref={getCodeRef}
            size="xl"
            className="mt-4"
            onClick={getCode}
            disabled={busy || batch.available === 0 || expiry.expired}
            aria-describedby={`why-${batch.batch_id}`}
          >
            {busy ? "Getting a code…" : "Get a code"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
          {/* QR for sighted recipients; the link and code below are the
              accessible equivalents. */}
          <div className="justify-self-center">
            {/* Warm bone rather than pure #FFF: a 176px white block on a dark
                page is a halation source for exactly this audience. Still
                15.6:1 against the module colour — far past what scanners need. */}
            <div className="rounded-[var(--radius-card)] bg-[var(--qr-field)] p-3 shadow-[var(--shadow-floating)]">
              {qr && (
                <svg
                  viewBox={`-4 -4 ${qr.size + 8} ${qr.size + 8}`}
                  width="176"
                  height="176"
                  role="img"
                  aria-label="QR code for this offer. The code and link below are the same thing in text."
                  shapeRendering="crispEdges"
                >
                  <rect
                    x={-4}
                    y={-4}
                    width={qr.size + 8}
                    height={qr.size + 8}
                    fill="var(--qr-field)"
                  />
                  <path d={qr.path} fill="var(--qr-module)" />
                </svg>
              )}
            </div>
            <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">Scan to redeem</p>
          </div>

          <div>
            {/* Focus lands here when a code is claimed, so the rep arrives at
                the thing they asked for instead of the top of the document. */}
            <h3
              ref={panelHeadingRef}
              tabIndex={-1}
              className="text-sm font-medium text-[var(--text-secondary)]"
            >
              Reserved for you — nobody else can hand this one out
            </h3>

            <div role="group" aria-label="The code to give out" className="mt-3">
              <p className="text-sm text-[var(--text-secondary)]">The code</p>
              <PromoCode code={held.code} label="Code" className="mt-1" />
            </div>

            <div role="group" aria-label="The link to send" className="mt-4">
              <p className="text-sm text-[var(--text-secondary)]">The link</p>
              <a
                href={trackingUrl || "#"}
                aria-label="Open the redeem link for this code"
                className="mt-1 inline-flex min-h-11 items-center break-all text-sm text-[var(--text-secondary)] underline underline-offset-4"
              >
                {trackingUrl || "…"}
              </a>
            </div>

            {/* Stacks below sm: three nowrap buttons could not fit 320px, and
                200% zoom is how a low-vision rep runs this. */}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
              <Button
                className="flex-1"
                onClick={onShare}
                disabled={busy}
                aria-label={`Share — code ${spellCode(held.code)}`}
              >
                Share
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                aria-label="Copy the ready-to-send message with the code and link"
                disabled={busy}
                onClick={() =>
                  copy(shareMessage(), "Message copied, and marked as handed out.", "copy_message")
                }
              >
                Copy
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                aria-label={`Copy code — ${spellCode(held.code)}`}
                disabled={busy}
                onClick={() =>
                  copy(held.code, "Code copied, and marked as handed out.", "copy_code")
                }
              >
                Copy code
              </Button>
            </div>

            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Sharing or copying marks this code handed out and frees you to take the next one.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={() =>
                  patch("sent", "manual", `Code ${spellCode(held.code)} marked as handed out.`)
                }
                disabled={busy}
                aria-label={`I handed it over — code ${spellCode(held.code)}`}
              >
                I handed it over
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  patch("released", undefined, "Code returned to the pool. You no longer have it.")
                }
                disabled={busy}
                aria-label={`Put it back — code ${spellCode(held.code)}`}
              >
                Put it back
              </Button>
            </div>
          </div>
        </div>
      )}
      </Surface>
    </section>
  );
}

/* ---------------------------------------------------------------- */

/** Colour never carries the meaning alone — the badge always says the word. */
function ExpiryBadge({ expired, label }: { expired: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
      // Per-theme status tokens. The old --reed-300 lives in :root only, so one
      // value served both themes and failed contrast in each (3.83:1 / 2.69:1).
      style={
        expired
          ? {
              color: "var(--status-off-fg)",
              borderColor: "var(--status-off-border)",
              background: "var(--status-off-bg)",
            }
          : {
              color: "var(--status-live-fg)",
              borderColor: "var(--status-live-border)",
              background: "var(--status-live-bg)",
            }
      }
    >
      <span aria-hidden="true">{label}</span>
      {/* The visible text lacks a subject; spoken, it needs one. */}
      <span className="sr-only">Offer {label}</span>
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
        Group codes
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
            <Surface key={item.code} register="lift" as="li" className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <PromoCode code={item.code} label="Group code" className="text-xl" />
                    {dead ? (
                      <ExpiryBadge expired label={expiry.expired ? "Expired" : "Switched off"} />
                    ) : (
                      expiry.badge && <ExpiryBadge expired={false} label={expiry.badge} />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {item.duration_label} · {item.offer_name} ·{" "}
                    {item.redemption_cap ? `up to ${item.redemption_cap} redemptions` : "no cap set"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{expiry.label}</p>
                </div>
              </div>
              <p className="mt-3 border-t pt-3 text-sm text-[var(--text-secondary)]">
                Apple doesn&apos;t report how many of these have been redeemed, so the remaining
                count is unknown.
              </p>
            </Surface>
          );
        })}
      </ul>
    </section>
  );
}
