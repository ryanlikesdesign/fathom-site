import "./ActivityLookout.css";
import { ACTIVITY, LOOKOUT, STAGE } from "@/lib/app-facts";
import {
  ActivityCard,
  AppHeader,
  Composer,
  defineScene,
  Layer,
  Orb,
  Screen,
  Stage,
  StageHeadline,
  StatusBar,
  StopControl,
  TAP_MS,
  TouchIndicator,
} from "@/components/phone";
import type { ScreenProps } from "../types";

/* ================================================================
   Step 4, Lookout and Point to Ask: Lookout running in the conversation
   (ConversationScreen.stageContent at 6f85740). The stage says "Lookout"
   over "Running"; under it the activity card (ActivityCard +
   LookoutActiveView) holds the 120 orb and one state line, "Listening…".
   While fathom talks the stage adds "Tap anywhere to stop" and the stop
   control (ConversationStage.silenceIsOffered), and the glow comes up.

   The app draws no narration and no Point to Ask answer: both are
   spoken, never shown (LookoutActiveView's header; appendModeNarration
   keeps Lookout out of the transcript). Nor does it draw the buzz: the
   hazard echo is mounted only in AssistantScreenV2Preview at 6f85740.
   So this phone shows fathom talking and the point; the step's own text
   carries the words (its example is EXAMPLES.oatMilk.answer), and the
   page's words carry the buzz (step 6: "buzzes when something's close").

   The point is the app's own accelerator: a long press on the center
   while the other arm points (LookoutActiveView.onLongPressGesture,
   0.5s), drawn with the kit's finger ring; a tap beat outlasts it.
   ================================================================ */

/**
 * The walk, beat by beat:
 *   walk       Lookout running, the orb at rest, "Listening…"
 *   narrate    fathom describes what's ahead: the orb speaks, the glow comes up,
 *              "Tap anywhere to stop" and the stop control appear
 *   hush       the line ends; the orb settles
 *   tap-point  a finger holds the center while the other hand points
 *   scan       fathom takes a look: the orb works
 *   name       (rests) fathom names the thing: the orb speaks again, with
 *              "Tap anywhere to stop"; Pause stays below the mic throughout
 */
export const LOOKOUT_WALK = defineScene([
  { id: "walk", ms: 1400, set: { orb: "idle", glow: "none" } },
  { id: "narrate", ms: 3200, set: { orb: "speaking", glow: "speaking" } },
  { id: "hush", ms: 900, set: { orb: "idle", glow: "none" } },
  { id: "tap-point", ms: TAP_MS },
  { id: "scan", ms: 1100, set: { orb: "working" } },
  { id: "name", ms: 0, set: { orb: "speaking", glow: "speaking" } },
]);

/** The beats in which fathom is talking. */
const SPEAKING = "narrate name";

/** Step 4. */
export function ActivityLookoutScreen({ active }: ScreenProps) {
  return (
    <Screen name="activity-lookout" scene={LOOKOUT_WALK} active={active} className="activity-lookout">
      <StatusBar />
      <AppHeader />
      <div className="ph-body">
        <Stage top>
          <StageHeadline eyebrow={ACTIVITY.titles.lookout.value} headline={ACTIVITY.running.value} />
          <Layer as="p" show={SPEAKING} className="ph-subline">
            {STAGE.speaking.subline.value}
          </Layer>
          <StopControl show={SPEAKING} />
        </Stage>
        <ActivityCard className="lo-card">
          <span className="lo-orb">
            <Orb size={120} />
            <TouchIndicator show="tap-point" />
          </span>
          <p className="lo-status">{LOOKOUT.status.value}</p>
        </ActivityCard>
      </div>
      <Composer session="pause" />
    </Screen>
  );
}
