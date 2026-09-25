import "./ActivityGo.css";
import { ACTIVITY, EXAMPLES, GO, fill } from "@/lib/app-facts";
import {
  ActivityCard,
  AppHeader,
  Composer,
  defineScene,
  Layer,
  Orb,
  Screen,
  Stack,
  Stage,
  StageHeadline,
  StatusBar,
} from "@/components/phone";
import type { ScreenProps } from "../types";

/* ================================================================
   Step 6, Go: Go running in the conversation (GoActiveView at 6f85740).
   The stage says "Go" over "Running"; the activity card holds the 120
   orb, the proximity pill, the current instruction and "Shake when
   you've arrived". When Go thinks you're there it asks: the card reads
   "It looks like you've reached …" under a system confirmation dialog
   ("Did you arrive at …?", Yes, finished / Not yet, and the dialog's own
   Cancel). The scene stops on the question: Go never says you arrived,
   and only your yes would bring the arrival view, which is not drawn.
   ================================================================ */

/**
 * The walk to the laundry room, beat by beat:
 *   close    "Getting close" (its capsule at 80%, as the app draws it) and the
 *            instruction (EXAMPLES.laundry.goInstruction)
 *   almost   "Almost there"; a new instruction, spoken: the orb speaks, the
 *            glow comes up (EXAMPLES.activityLines.goFinalApproach)
 *   arrive   Go thinks you're there, and says so as a guess: "It looks like
 *            you've reached the laundry room"
 *   ask      (rests) the question rises over it: "Did you arrive at the
 *            laundry room?", with Yes, finished, Not yet and Cancel.
 *            Answering is yours: the scene ends asking.
 */
export const GO_ARRIVAL = defineScene([
  { id: "close", ms: 1800, set: { orb: "idle", glow: "none" } },
  { id: "almost", ms: 2400, set: { orb: "speaking", glow: "speaking" } },
  { id: "arrive", ms: 2000 },
  { id: "ask", ms: 0, set: { orb: "idle", glow: "none" } },
]);

const DESTINATION = EXAMPLES.laundry.destination;
const NAVIGATING = "close almost";
const CONFIRMING = "arrive ask";

/** Step 6. */
export function ActivityGoScreen({ active }: ScreenProps) {
  return (
    <Screen name="activity-go" scene={GO_ARRIVAL} active={active} className="activity-go">
      <StatusBar />
      <AppHeader />
      <div className="ph-body">
        <Stage top>
          <StageHeadline eyebrow={ACTIVITY.titles.go.value} headline={ACTIVITY.running.value} />
        </Stage>
        <ActivityCard className="go-card">
          <Orb size={120} />
          <Stack className="go-lines">
            <Layer show={NAVIGATING} className="go-nav">
              <Stack className="go-pills">
                <Layer as="span" show="close" className="go-pill go-pill-close">
                  {GO.gettingClose.value}
                </Layer>
                <Layer as="span" show="almost" className="go-pill">
                  {GO.almostThere.value}
                </Layer>
              </Stack>
              <Stack className="go-instructions">
                <Layer as="p" show="close" className="go-instruction">
                  {EXAMPLES.laundry.goInstruction}
                </Layer>
                <Layer as="p" show="almost" className="go-instruction">
                  {EXAMPLES.activityLines.goFinalApproach}
                </Layer>
              </Stack>
              <p className="go-shake">{GO.shake.value}</p>
            </Layer>
            <Layer as="p" show={CONFIRMING} className="go-reached">
              {EXAMPLES.laundry.arrival}
            </Layer>
          </Stack>
        </ActivityCard>
      </div>
      <Composer session="pause" />
      {/* The system confirmation dialog (.confirmationDialog, title visible),
          drawn over everything: the title and both answers in one group,
          the literal Cancel in its own below (GoActiveView.swift:56-75). */}
      <Layer show="ask" className="ph-scrim" />
      <Layer show="ask" className="go-dialog">
        <div className="go-dialog-group">
          <p className="go-dialog-title">{fill(GO.arrivalQuestion, { destination: DESTINATION })}</p>
          <span className="go-dialog-action">{GO.yes.value}</span>
          <span className="go-dialog-action">{GO.notYet.value}</span>
        </div>
        <div className="go-dialog-group">
          <span className="go-dialog-action go-dialog-cancel">{GO.cancel.value}</span>
        </div>
      </Layer>
    </Screen>
  );
}
