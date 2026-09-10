"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/Button";
import { PromoCode, spellCode } from "@/components/PromoCode";
import { ensurePostHogReady } from "@/lib/posthog";

/**
 * Recipient-facing redeem panel. Shows the code, a copy button, and the big
 * "Redeem" call-to-action.
 *
 * The authoritative open/redeem tracking happens server-side (the page render
 * and the /redeem route). These PostHog events are the analytics view of the
 * same thing. The redeem link is a real <a href> to a server route, so it works
 * with JavaScript disabled and still records the tap.
 *
 * posthog-js loads on demand (lib/posthog.ts); the open event waits for it,
 * since a capture before init is dropped, not queued.
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
    void ensurePostHogReady().then((ready) => {
      if (!ready) return;
      posthog.capture("promo_link_opened", {
        code_slug: slug,
        code,
        offer_name: offerName,
        duration_label: durationLabel,
        rep_name: rep,
      });
    });
  }, [slug, code, offerName, durationLabel, rep]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Code copied to your clipboard.");
    } catch {
      setMessage("Couldn't copy automatically. Select the code above to copy it.");
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
      <p className="text-sm font-medium text-[var(--text-secondary)]">Your code</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {/* Was an aria-label on a <p>, which ARIA prohibits (role="paragraph"
            takes no author name); axe reports it only as "incomplete", so it
            silently did nothing. A visually-hidden sibling works everywhere. */}
        <PromoCode code={code} label={`Your ${durationLabel} code`} />
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={copyCode}
          aria-label={`Copy, code ${spellCode(code)}`}
        >
          Copy
        </Button>
      </div>

      {/* Visible as well as announced: a sighted recipient at 200% zoom needs
          to see that Copy did something, and the live region keeps reading it
          out for everyone else. The line is reserved (min-h-5 = one text-sm
          line) so the Redeem button below does not jump when it fills. */}
      <p role="status" aria-live="polite" aria-atomic="true" className="mt-2 min-h-5 text-sm text-[var(--text-secondary)]">
        {message}
      </p>

      {/* A plain anchor on purpose (external): the route it points at records
          the tap, so the router must never prefetch it or fetch it first. */}
      <Button href={href} external size="xl" className="mt-4 w-full" onClick={onRedeem}>
        Redeem in the App Store
      </Button>
    </div>
  );
}
