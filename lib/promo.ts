/* ================================================================
   Fathom rep promo codes — data + config.

   This is the ONE file you edit to run the tool:
     1. Paste your codes from the spreadsheets into PROMO_TIERS below.
     2. (Optional) change SHARE_PASSWORD or set NEXT_PUBLIC_PROMO_PASSWORD.
     3. Confirm APP_STORE_APP_ID and how codes redeem (redeemUrl).

   Everything else (QR codes, share buttons, tracking) is driven from here.
   ================================================================ */

/** Apple App Store numeric app id for Fathom: Visual Assistance. */
export const APP_STORE_APP_ID = "6760924183";

/** Plain App Store product page — used as the fallback destination. */
export const APP_STORE_URL = `https://apps.apple.com/us/app/fathom-visual-assistance/id${APP_STORE_APP_ID}`;

/**
 * Where a scanned QR / opened tracking link ultimately sends the recipient.
 *
 * Apple *offer codes* (the usual mechanism for "3 months free" / "1 year
 * free" on a subscription) redeem through the URL below — it deep-links
 * straight into the App Store redeem sheet with the code pre-filled.
 *
 * If your codes are a different kind of link (e.g. a plain promo/download
 * link, or a code the user types inside the app), change this one function
 * and every QR + link updates automatically.
 */
export function redeemUrl(code: string): string {
  return `https://apps.apple.com/redeem?ctx=offercodes&id=${APP_STORE_APP_ID}&code=${encodeURIComponent(
    code,
  )}`;
}

/* ---------------------------------------------------------------- */

export interface PromoCode {
  /**
   * Stable, unique, URL-safe id. Used in the tracking link (/promo/r/<id>)
   * and as the join key in analytics. Must be unique across ALL tiers.
   * Keep it short and opaque — it is visible in shared links.
   */
  id: string;
  /** The actual code the recipient redeems. */
  code: string;
}

export interface PromoTier {
  /** URL-safe tier id, also sent to analytics. */
  id: string;
  /** Full label, e.g. "3 months free". */
  name: string;
  /** Short label for compact UI, e.g. "3-month". */
  short: string;
  /** One-line description shown under the tier heading. */
  blurb: string;
  codes: PromoCode[];
}

/* ================================================================
   PASTE YOUR CODES HERE.

   The `id` is an internal tracking handle — you can keep the m3-/y1-
   numbering and just fill in `code` from each spreadsheet row. Add as
   many rows as you have codes; the tool paginates through them one at a
   time so a rep only sees the "next" code to hand out.

   The codes below are PLACEHOLDERS so the page is usable before your real
   codes arrive — replace them.
   ================================================================ */

export const PROMO_TIERS: PromoTier[] = [
  {
    id: "3-month",
    name: "3 months free",
    short: "3-month",
    blurb: "Three months of Fathom, free. Great for a first trial.",
    codes: [
      { id: "m3-001", code: "SAMPLE-3MO-0001" },
      { id: "m3-002", code: "SAMPLE-3MO-0002" },
      { id: "m3-003", code: "SAMPLE-3MO-0003" },
      { id: "m3-004", code: "SAMPLE-3MO-0004" },
      { id: "m3-005", code: "SAMPLE-3MO-0005" },
    ],
  },
  {
    id: "1-year",
    name: "1 year free",
    short: "1-year",
    blurb: "A full year of Fathom, free. Our most generous offer.",
    codes: [
      { id: "y1-001", code: "SAMPLE-1YR-0001" },
      { id: "y1-002", code: "SAMPLE-1YR-0002" },
      { id: "y1-003", code: "SAMPLE-1YR-0003" },
    ],
  },
];

/* ---------------------------------------------------------------- */

/**
 * Front-end password to open the page. This is a soft gate to keep the
 * codes out of casual view — it is NOT real security (anyone determined
 * can read the source). Do not use these codes for anything you couldn't
 * afford to have leak.
 *
 * Override without editing code by setting NEXT_PUBLIC_PROMO_PASSWORD.
 */
export const SHARE_PASSWORD =
  process.env.NEXT_PUBLIC_PROMO_PASSWORD ?? "fathom-crew";

/** PostHog — same project the rest of the site already reports to. */
export const POSTHOG_KEY = "phc_mnsvmBfVeHfbN5n6xPXVV4tvRhkv6pLJrwwfKqAzon8G";
export const POSTHOG_HOST = "https://us.i.posthog.com";

/* ---------------------------------------------------------------- */

export interface FoundCode {
  tier: PromoTier;
  code: PromoCode;
}

/** Look up a code by its tracking id across every tier. */
export function findCodeById(id: string): FoundCode | null {
  for (const tier of PROMO_TIERS) {
    const code = tier.codes.find((c) => c.id === id);
    if (code) return { tier, code };
  }
  return null;
}
