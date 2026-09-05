/* ================================================================
   Fathom promo codes — shared config.

   The codes themselves are NOT here any more. They live in Supabase
   (`fathom_promo_codes`), because:
     - every rep needs to see the same handed-out/available state, and
     - anything in this file is shipped to the browser.

   Adding codes is an App Store Connect + database job, not a code edit.
   See docs/promo-codes.md.
   ================================================================ */

/** Apple App Store numeric app id for Fathom: Visual Assistance. */
export const APP_STORE_APP_ID = "6760924183";

/** Plain App Store product page — used as the fallback destination. */
export const APP_STORE_URL = `https://apps.apple.com/us/app/fathom-visual-assistance/id${APP_STORE_APP_ID}`;

/**
 * Deep link into the App Store redeem sheet with the code pre-filled.
 * Recipients reach this via /promo/r/<slug>/redeem so the tap is recorded.
 */
export function redeemUrl(code: string): string {
  return `https://apps.apple.com/redeem?ctx=offercodes&id=${APP_STORE_APP_ID}&code=${encodeURIComponent(
    code,
  )}`;
}

/** Where the Redeem button points — tracked, then forwarded to Apple. */
export function trackedRedeemUrl(slug: string): string {
  return `/promo/r/${encodeURIComponent(slug)}/redeem`;
}

/** PostHog — same project the rest of the site already reports to. */
export const POSTHOG_KEY = "phc_mnsvmBfVeHfbN5n6xPXVV4tvRhkv6pLJrwwfKqAzon8G";
export const POSTHOG_HOST = "https://us.i.posthog.com";
