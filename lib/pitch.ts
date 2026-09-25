/* ================================================================
   The two sentences that describe fathom from outside the homepage:
   the JSON-LD, the promo redeem page, its preview card and the share
   text a rep sends. Both are COPY_13 (lib/copy-13.ts) put into one
   sentence each; test/metadata.test.ts rebuilds them from COPY_13 and
   fails if they drift.

   They live here, with no imports, because components/PromoBoard.tsx is
   a client component: importing lib/copy-13.ts there would ship every
   app fact to the browser.
   ================================================================ */

/** COPY_13.tagline and COPY_13.hero.eyebrow, as one sentence. */
export const PITCH = "fathom is visual assistance you can talk to, for blind and low-vision people on iPhone.";

/** The first sentence of COPY_13.download.plusLine: what fathom plus adds, without the price. */
export const PLUS_ADDS = "fathom plus adds step-by-step plans, Go, Task with Live mode, and skills.";
