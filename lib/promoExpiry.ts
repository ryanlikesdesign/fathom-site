/* ================================================================
   Offer-code expiry.

   Apple reports an expiration date with no time (e.g. "2026-10-31"),
   and App Store dates run on Pacific time — the app's own in-app offer
   banner ends at 2026-11-01T06:59Z, which is 23:59 on the 31st in Los
   Angeles. A code is therefore still good all through its expiration
   date and dead the day after.

   Comparing calendar dates in that zone (rather than doing instant math)
   keeps this correct across DST without a date library.
   ================================================================ */

export const OFFER_TIME_ZONE = "America/Los_Angeles";

/** Today's date in Apple's zone, as YYYY-MM-DD. */
export function todayInOfferZone(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which sorts correctly as a string.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: OFFER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toUtcDays(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/**
 * Fixed locale and zone on purpose: this renders on the server and again in
 * the browser, and `undefined` locale would differ between them and trip a
 * hydration mismatch.
 */
export function formatExpiry(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export interface ExpiryState {
  expired: boolean;
  /** Whole days remaining; 0 means it dies at the end of today. */
  daysLeft: number | null;
  /** "Expires December 20, 2026" / "Expired October 31, 2026" */
  label: string;
  /** Short badge text, or null when there's nothing worth flagging. */
  badge: string | null;
}

/** `today` is injectable so this is testable without faking the clock. */
export function expiryState(
  expiresOn: string | null,
  today: string = todayInOfferZone(),
): ExpiryState {
  if (!expiresOn) {
    return { expired: false, daysLeft: null, label: "No expiry date", badge: null };
  }

  const expired = today > expiresOn;
  const daysLeft = toUtcDays(expiresOn) - toUtcDays(today);

  if (expired) {
    return {
      expired: true,
      daysLeft,
      label: `Expired ${formatExpiry(expiresOn)}`,
      badge: "Expired",
    };
  }

  return {
    expired: false,
    daysLeft,
    label: `Expires ${formatExpiry(expiresOn)}`,
    // Only shout when it's close enough to act on.
    badge: daysLeft <= 30 ? (daysLeft === 0 ? "Expires today" : `${daysLeft} days left`) : null,
  };
}
