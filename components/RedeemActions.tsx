"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";

/**
 * Recipient-facing redeem panel. Shows the code, a copy button, and the big
 * "Redeem" call-to-action.
 *
 * The authoritative open/redeem tracking happens server-side (the page render
 * and the /redeem route). These PostHog events are the analytics view of the
 * same thing. The redeem link is a real <a href> to a server route, so it works
 * with JavaScript disabled and still records the tap.
 */
export function RedeemActions({
  slug,
  code,
  offerName,
  durationLabel,
  rep,
  href,
}: {
  slug: string;
  code: string;
  offerName: string;
  durationLabel: string;
  rep: string | null;
  href: string;
}) {
  const [message, setMessage] = useState("");
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    posthog.capture("promo_link_opened", {
      code_slug: slug,
      code,
      offer_name: offerName,
      duration_label: durationLabel,
      rep_name: rep,
    });
  }, [slug, code, offerName, durationLabel, rep]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Code copied to your clipboard.");
    } catch {
      setMessage("Couldn't copy automatically — select the code above to copy it.");
    }
  }

  function onRedeem() {
    posthog.capture("promo_redeem_clicked", {
      code_slug: slug,
      code,
      offer_name: offerName,
      duration_label: durationLabel,
      rep_name: rep,
    });
  }

  return (
    <div>
      <p className="text-sm font-medium text-[var(--text-muted)]">Your code</p>
      <div className="mt-2 flex items-center gap-3">
        <p
          className="select-all font-display text-2xl tracking-wide text-[var(--text-primary)]"
          style={{ wordBreak: "break-all" }}
          aria-label={`Your ${durationLabel} code is ${code.split("").join(" ")}`}
        >
          {code}
        </p>
        <button
          type="button"
          onClick={copyCode}
          className="shrink-0 rounded-[var(--radius-btn)] border px-3 py-2 text-sm"
        >
          Copy
        </button>
      </div>

      <a
        href={href}
        onClick={onRedeem}
        className="mt-6 inline-flex w-full items-center justify-center rounded-[var(--radius-btn)] bg-[var(--text-primary)] px-6 py-4 text-lg font-medium text-[var(--bg)]"
        style={{ transitionDuration: "var(--dur)" }}
      >
        Redeem in the App Store
      </a>

      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}
