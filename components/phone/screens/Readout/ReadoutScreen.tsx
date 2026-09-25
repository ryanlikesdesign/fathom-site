import "./Readout.css";
import { EXAMPLES, READOUT, STAGE, fill } from "@/lib/app-facts";
import {
  AppHeader,
  Composer,
  defineScene,
  Layer,
  Orb,
  ReadoutBar,
  Screen,
  Stack,
  Stage,
  StageHeadline,
  StatusBar,
  TAP_MS,
  Transcript,
  TranscriptTurn,
} from "@/components/phone";
import type { ScreenProps } from "../types";

/* ================================================================
   Step 3, Read: a Look Now answer read as a document. The screen is the
   conversation screen while a readout plays (ConversationScreen.swift):
   the stage says Speaking with the orb in its speaking mood (a readout
   offers no tap-to-stop and draws no glow, ConversationScreen.swift:235),
   the ReadoutPlaybackBar sits above the composer on its ground, and the
   footer's session row is the transport (backward, Pause, forward).

   The transcript keeps only the Look Now turn's one line, "Document.
   5 items." (ReadoutDocument.summaryLine): the text itself is a document
   you move through, never a turn (ConversationScreen.swift:2019-2027).
   So the letter (EXAMPLES.libraryLetter) is not drawn; the bar's count
   and the transport carry where the reading is.
   ================================================================ */

/**
 * Step 3, "Long text. At your pace."
 *   summary         the transcript: "Read this text", then the Look Now turn,
 *                   "Document. 5 items."; the bar at "1 of 5"
 *   tap-transcript  a finger closes the transcript
 *   read-2          the stage: the orb speaking, "Speaking"; "2 of 5"
 *   read-3          "3 of 5"
 *   tap-back        a finger taps the transport's backward
 *   back            (rests) back on item 2, "2 of 5", still reading (Pause)
 */
export const READ_ALONG = defineScene([
  { id: "summary", ms: 2200, set: { transcript: "open" } },
  { id: "tap-transcript", ms: TAP_MS },
  { id: "read-2", ms: 2200, set: { transcript: "closed" } },
  { id: "read-3", ms: 2400 },
  { id: "tap-back", ms: TAP_MS },
  { id: "back", ms: 0 },
]);

const TRANSCRIPT_BEATS = "summary tap-transcript";
const STAGE_BEATS = "read-2 read-3 tap-back back";

const TOTAL = EXAMPLES.libraryLetter.items.length;

/** The position the bar shows, and the beats it shows it for. */
const COUNTS = [
  { text: fill(READOUT.counter, { n: 1, total: TOTAL }), show: TRANSCRIPT_BEATS },
  { text: fill(READOUT.counter, { n: 2, total: TOTAL }), show: "read-2 back" },
  { text: fill(READOUT.counter, { n: 3, total: TOTAL }), show: "read-3 tap-back" },
];

/** Step 3. */
export function ReadoutScreen({ active }: ScreenProps) {
  return (
    <Screen name="readout" scene={READ_ALONG} active={active} className="readout">
      <StatusBar />
      <AppHeader transcriptTouch="tap-transcript" />
      <div className="ph-body">
        <Stack>
          <Layer show={TRANSCRIPT_BEATS} className="rd-transcript">
            <Transcript>
              <TranscriptTurn who="user" time={EXAMPLES.time} text={EXAMPLES.libraryLetter.request} />
              <TranscriptTurn who="fathom" time={EXAMPLES.time} label={READOUT.overline.value} text={EXAMPLES.libraryLetter.summary} />
            </Transcript>
          </Layer>
          <Layer show={STAGE_BEATS} className="rd-stage">
            <Stage>
              <Orb mood="speaking" />
              <StageHeadline headline={STAGE.speaking.headline.value} />
            </Stage>
          </Layer>
        </Stack>
      </div>
      <Composer
        session="readout"
        backTouch="tap-back"
        suggestions={
          <div className="rd-bar-ground">
            <ReadoutBar counter={COUNTS} />
          </div>
        }
      />
    </Screen>
  );
}
