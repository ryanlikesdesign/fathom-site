import "./ActivityLive.css";
import { ACTIVITY, EXAMPLES, LIVE } from "@/lib/app-facts";
import {
  ActivityCard,
  AppHeader,
  Composer,
  defineScene,
  Layer,
  Orb,
  Screen,
  Stack,
  StatusBar,
  TAP_MS,
  TouchIndicator,
  Transcript,
  TranscriptTurn,
} from "@/components/phone";
import type { ScreenProps } from "../types";

/* ================================================================
   Step 8, Task and Live mode: a Task running in Live mode, with the
   transcript open (LiveTaskActiveView at 6f85740, hosted in the
   TranscriptView, where the activity card sits under the turns). The
   card: the goal in title-sm, "Step 2" in the accent, the 120 orb, and
   one state line. The mic is off until a tap on the card opens it
   (session.togglePTT; the card's single tap): "Microphone off", then
   "Listening…", then "Sending…". fathom's reply is spoken and lands in
   the transcript (ConversationController.appendModeNarration); what you
   said in Live mode is streamed, not written there, so it is not drawn.
   ================================================================ */

/**
 * Talking it through, beat by beat:
 *   off        the Task card, "Microphone off", the orb at rest; above it
 *              the transcript: what you asked, then the task's start row
 *   tap        a finger taps the card: a tap, never a hold
 *   listening  the mic is on: "Listening…", the orb listens
 *   sending    "Sending…", the orb works
 *   reply      (rests) fathom answers: the orb speaks, its reply arrives in
 *              the transcript whole, and the card is back to "Microphone
 *              off"; what you asked scrolls up out of the room, so the
 *              still shows the task's row, the reply and the card
 */
export const LIVE_TALK = defineScene([
  { id: "off", ms: 1600, set: { orb: "idle", transcript: "open" } },
  { id: "tap", ms: TAP_MS },
  { id: "listening", ms: 2400, set: { orb: "listening" } },
  { id: "sending", ms: 1000, set: { orb: "working" } },
  { id: "reply", ms: 0, set: { orb: "speaking" } },
]);

/** Step 8. */
export function ActivityLiveScreen({ active }: ScreenProps) {
  return (
    <Screen name="activity-live" scene={LIVE_TALK} active={active} className="activity-live">
      <StatusBar />
      <AppHeader />
      <div className="ph-body">
        <Transcript>
          {/* What came before: the spoken request that started the task, then
              the activity's start row (its title in the overline, no outcome
              yet). It sits on the card until the reply lands above the card,
              then moves up, as a bottom-anchored transcript does; the request
              leaves the top of the room as it goes. */}
          <Layer mode="flag" show="reply" className="lt-history">
            <TranscriptTurn who="user" time={EXAMPLES.time} text={EXAMPLES.activityLines.liveAsk} show="off tap listening sending" />
            <p className="lt-activity">{ACTIVITY.titles.task.value}</p>
          </Layer>
          <TranscriptTurn who="fathom" time={EXAMPLES.time} text={EXAMPLES.activityLines.liveReply} show="reply" />
          <ActivityCard className="lt-card">
            <p className="lt-goal">{EXAMPLES.laundry.task.goal}</p>
            <p className="lt-step">{EXAMPLES.laundry.task.step}</p>
            <span className="lt-orb">
              <Orb size={120} />
              <TouchIndicator show="tap" />
            </span>
            <Stack className="lt-status">
              <Layer as="p" show="off tap reply">
                {LIVE.micOff.value}
              </Layer>
              <Layer as="p" show="listening">
                {LIVE.listening.value}
              </Layer>
              <Layer as="p" show="sending">
                {LIVE.sending.value}
              </Layer>
            </Stack>
          </ActivityCard>
        </Transcript>
      </div>
      <Composer session="pause" />
    </Screen>
  );
}
