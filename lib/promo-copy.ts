import { PITCH } from "@/lib/pitch";

/* ================================================================
   Every string the promo codes put in front of a recipient: the redeem
   page's title and link-preview text (app/promo/r/[id]/page.tsx), its
   preview card's headline (app/promo/r/[id]/opengraph-image.tsx, which
   builds the card's alt from it) and the message a rep shares
   (components/PromoBoard.tsx). The codes are Apple offer codes
   for fathom plus (docs/promo-codes.md), so the trial is named as such.
   test/copy.test.ts runs the copy rules over each builder.

   `duration` is the batch's label as the database stores it ("3 months
   free", "1 year free").

   No imports beyond lib/pitch.ts: PromoBoard is a client component.
   ================================================================ */

export const TRIAL_NAME = "fathom plus";

/** The redeem page's h1 and title: "You’ve got 3 months free of fathom plus". */
export function redeemTitle(duration: string): string {
  return `You’ve got ${duration} of ${TRIAL_NAME}`;
}

/** The link-preview description. The code rides in it so it shows inside the iMessage or Mail card. */
export function redeemDescription(code: string, duration: string): string {
  return `Your code: ${code}. Tap to redeem ${duration} of ${TRIAL_NAME}. ${PITCH}`;
}

/** Title and description for a link that no longer finds a code. */
export const REDEEM_FALLBACK = {
  title: `${TRIAL_NAME} free trial`,
  description: `A free trial of ${TRIAL_NAME}. ${PITCH}`,
} as const;

/** The Web Share sheet's title. */
export function shareTitle(duration: string): string {
  return `${TRIAL_NAME}: ${duration}`;
}

/** The Web Share sheet's text; the link travels as the share's url. */
export function shareText(duration: string, code: string): string {
  return `Here’s your ${duration} of ${TRIAL_NAME}. ${PITCH} Your code: ${code}.`;
}

/** The copied message: the same words, with the tracked link on its own line. */
export function shareMessage(duration: string, code: string, url: string): string {
  return `Here’s your ${duration} of ${TRIAL_NAME}. ${PITCH}\n\nYour code: ${code}\nRedeem it here: ${url}`;
}
