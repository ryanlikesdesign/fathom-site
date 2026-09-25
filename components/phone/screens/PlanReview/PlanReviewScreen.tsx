import "./PlanReview.css";
import { EXAMPLES, PLAN } from "@/lib/app-facts";
import {
  AppHeader,
  Composer,
  defineScene,
  Layer,
  PhoneButton,
  PlanStepRow,
  PlanSteps,
  Screen,
  StatusBar,
  TAP_MS,
  Transcript,
  TranscriptTurn,
  type GlyphName,
} from "@/components/phone";
import type { ScreenProps } from "../types";

/* ================================================================
   Step 7, Step-by-step plans. You ask for the whole job; fathom lays the
   plan out in the "Your plan" takeover (ConversationScreen.swift:1087, a
   full-screen cover hosting AssistantPlanCard): the goal in title-sm, a
   hairline, the steps in one card (number, mode glyph, description, mode
   name), then Accept plan, and Edit and Dismiss side by side. Nothing
   starts until you accept, so the scene stops on the review with all
   three answers open: the running plan is not drawn.

   The transcript opens where step 5 left it (the memory exchange), so
   the page reads as one conversation.
   ================================================================ */

/**
 * Step 7, "See the plan before you start."
 *   listening   the transcript, the mic open
 *   tap-send    a finger taps the mic to send
 *   asked       your turn: "Help me do a load of laundry."
 *   review      the "Your plan" cover rises: its title, the goal
 *   steps       (rests) the card, its four steps arriving one by one, then
 *               Accept plan, Edit, Dismiss: the plan waits for you
 */
export const PLAN_REVIEW = defineScene([
  { id: "listening", ms: 1600, set: { mic: "listening" } },
  { id: "tap-send", ms: TAP_MS },
  { id: "asked", ms: 1400, set: { mic: "idle" } },
  { id: "review", ms: 1000 },
  { id: "steps", ms: 0 },
]);

const COVER_BEATS = "review steps";

const LAUNDRY = EXAMPLES.laundry.plan;

/** Each step mode's glyph (AssistantEnums.swift, iconName): Go's is the filled location. */
const MODE_GLYPH: Readonly<Record<string, GlyphName>> = {
  [PLAN.stepModes.go.value]: "location-fill",
  [PLAN.stepModes.task.value]: "checklist",
  [PLAN.stepModes.lookNow.value]: "camera-viewfinder",
  [PLAN.stepModes.lookout.value]: "eye",
};

/** The plan takeover: a full-screen cover titled "Your plan" in its bar. */
function PlanCover() {
  return (
    <Layer show={COVER_BEATS} className="pr-cover">
      <div className="pr-cover-bar">
        <span className="pr-cover-title">{PLAN.title.value}</span>
      </div>
      <div className="pr-cover-body">
        <p className="pr-cover-goal">{LAUNDRY.goal}</p>
        <span className="pr-rule" />
        <PlanSteps show="steps">
          {LAUNDRY.steps.map((step) => (
            <PlanStepRow key={step.text} glyph={MODE_GLYPH[step.mode]} text={step.text} mode={step.mode} show="steps" />
          ))}
        </PlanSteps>
        <Layer show="steps" className="pr-actions">
          <PhoneButton>{PLAN.accept.value}</PhoneButton>
          <span className="pr-actions-row">
            <PhoneButton kind="secondary">{PLAN.edit.value}</PhoneButton>
            <PhoneButton kind="secondary">{PLAN.dismiss.value}</PhoneButton>
          </span>
        </Layer>
      </div>
    </Layer>
  );
}

/** Step 7. */
export function PlanReviewScreen({ active }: ScreenProps) {
  return (
    <Screen name="plan-review" scene={PLAN_REVIEW} active={active} className="plan-review">
      <StatusBar />
      <AppHeader transcript="open" />
      <div className="ph-body">
        <Transcript>
          <TranscriptTurn who="user" time={EXAMPLES.time} text={EXAMPLES.remember.request} />
          <TranscriptTurn who="fathom" time={EXAMPLES.time} text={EXAMPLES.remember.echo} />
          <TranscriptTurn who="user" time={EXAMPLES.time} text={EXAMPLES.planRequest} show="asked review steps" />
        </Transcript>
      </div>
      <Composer micTouch="tap-send" />
      <PlanCover />
    </Screen>
  );
}
