import "./CloudConsent.css";
import { CONSENT, STAGE, consentParagraphs } from "@/lib/app-facts";
import {
  AppHeader,
  Composer,
  defineScene,
  Glyph,
  Layer,
  Orb,
  PhoneButton,
  Screen,
  Stage,
  StageHeadline,
  StatusBar,
} from "@/components/phone";
import type { ScreenProps } from "../types";

/* ================================================================
   Step 10, Your choice. The Cloud AI consent (CloudConsentView.swift),
   a pop-up in the shape of an iOS permission request, over the
   conversation: antenna.radiowaves.left.and.right, "Allow cloud AI?",
   "Read it to me", the disclosure in three paragraphs of the app's own
   words (the headline leads the first), "Read the full Privacy Policy",
   and the two answers pinned below: "Allow cloud AI" and "Keep fathom
   on-device". Quoted, never paraphrased: the paragraphs are
   consentParagraphs(), split where the app splits them.

   The headline leads the first paragraph with a full stop between
   ("fathom uses cloud AI to describe what it sees. To do that, …",
   CloudConsentView.swift:280). The two are separate facts, so the stop
   is drawn by CSS (as the plan card draws its numbers) and the DOM holds
   only the app's strings.

   The scene stops on the question, both answers open: the step is that
   it asks, and the choice is the reader's.
   ================================================================ */

/**
 * Step 10, "Cloud or on-device. It asks before anything goes to Google."
 *   idle  the conversation, Ready
 *   rise  the pop-up rises over the header: the antenna, "Allow cloud AI?",
 *         Read it to me, the opening of the text, and both answers below
 *   read  the text scrolls to its end: the last paragraph ("Obstacle alerts
 *         run on your phone…") and the Privacy Policy link
 *   ask   (rests) back at the top: the question, Read it to me, the opening
 *         of the text, "Allow cloud AI" and "Keep fathom on-device"
 */
export const CONSENT_ASK = defineScene([
  { id: "idle", ms: 1400, set: { scroll: "top" } },
  { id: "rise", ms: 2400 },
  { id: "read", ms: 3000, set: { scroll: "end" } },
  { id: "ask", ms: 0, set: { scroll: "top" } },
]);

const SHEET_BEATS = "rise read ask";

/**
 * The pop-up. The kit's sheet rise and scrim, but its own layout: a
 * scrolling column on the gutter and the answers pinned below it on the
 * sheet's ground, with a rule while the text overflows (FathomPinnedFooter).
 */
function ConsentSheet() {
  const [first, ...rest] = consentParagraphs();
  return (
    <>
      <Layer show={SHEET_BEATS} className="ph-scrim" />
      <Layer show={SHEET_BEATS} className="ph-sheet cc-sheet">
        <div className="cc-scroll">
          <div className="cc-content">
            <Glyph name="antenna" className="cc-antenna" />
            <p className="cc-title">{CONSENT.title.value}</p>
            <PhoneButton kind="tinted" glyph="speaker-wave-fill">
              {CONSENT.readAloud.value}
            </PhoneButton>
            <div className="cc-text">
              <p>
                <span className="cc-lead">{CONSENT.subtitle.value}</span> {first}
              </p>
              {rest.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <span className="cc-policy">
              <span>{CONSENT.privacyPolicy.value}</span>
              <Glyph name="arrow-up-right" />
            </span>
          </div>
        </div>
        <div className="cc-answers">
          <PhoneButton>{CONSENT.allow.value}</PhoneButton>
          <PhoneButton kind="secondary">{CONSENT.decline.value}</PhoneButton>
        </div>
      </Layer>
    </>
  );
}

/** Step 10. */
export function CloudConsentScreen({ active }: ScreenProps) {
  return (
    <Screen name="cloud-consent" scene={CONSENT_ASK} active={active} className="cloud-consent">
      <StatusBar />
      <AppHeader />
      <div className="ph-body">
        <Stage>
          <Orb />
          <StageHeadline eyebrow={STAGE.idle.eyebrow.value} headline={STAGE.idle.headline.value} />
        </Stage>
      </div>
      <Composer />
      <ConsentSheet />
    </Screen>
  );
}
