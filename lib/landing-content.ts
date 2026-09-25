/* ================================================================
   The few shared values other pages read: the tier type, the fathom plus
   price and trial (Terms, the FAQ), and the minimum iOS (the JSON-LD in
   app/layout.tsx). test/landing-content.test.ts holds each one to the app
   facts (lib/app-facts.ts).

   The homepage renders the 1.3 deck (lib/copy-13.ts), and its phones the
   app facts. The 1.2 deck and the 1.2 screen data (modes, Snapshot
   options, the tab bar, active-mode controls) that lived here are gone;
   P5 folds the 1.3 deck in as COPY.

   This module is in every page's client bundle (app/error.tsx imports
   lib/faq.tsx, which imports PLUS), so it stays small.
   ================================================================ */

export type Tier = "free" | "plus";

/** PaywallView.swift:135; StoreKit trial P1W */
export const PLUS = { price: "$12.99", period: "month", trialDays: 7 } as const;

/** PLUS.trialDays spelled out, so the sentence reads as prose. Tested against the number. */
export const PLUS_TRIAL_LABEL = "seven-day";

/** The one Plus sentence, everywhere the price appears. */
export const PLUS_SENTENCE = `${PLUS.price} a ${PLUS.period} after a ${PLUS_TRIAL_LABEL} free trial`;

/** project.pbxproj IPHONEOS_DEPLOYMENT_TARGET = 17.0 */
export const MIN_IOS = "17";
