"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";

/**
 * Recipient-facing redeem panel. Shows the code, a copy button, and the big
 * "Redeem" call-to-action. Fires `promo_link_opened` once when the page loads
 * (our proxy for "the code was used") and `promo_redeem_clicked` when they tap
 * through to the App Store. The redeem link is a real <a href>, so it works
 * with JavaScript disabled — the tracking is purely additive.
 */
export function RedeemActions({
  codeId,
  code,
  tierId,
  tierName,
  rep,
  href,
}: {
  codeId: string;
  code: string;
  tierId: string;
  tierName: string;
  rep: string | null;
  href: string;
}) {
  const [message, setMessage] = useState("");
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    posthog.capture("promo_link_opened", {
      code_id: codeId,
      code,
      tier_id: tierId,
      tier_name: tierName,
      rep_name: rep,
    });
  }, [codeId, code, tierId, tierName, rep]);

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
      code_id: codeId,
      code,
      tier_id: tierId,
      tier_name: tierName,
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
          aria-label={`Your ${tierName} code is ${code.split("").join(" ")}`}
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
