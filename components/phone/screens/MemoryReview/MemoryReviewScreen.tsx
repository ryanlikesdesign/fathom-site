import "./MemoryReview.css";
import { EXAMPLES, MEMORY_SCREEN } from "@/lib/app-facts";
import {
  AppHeader,
  Composer,
  defineScene,
  Glyph,
  Layer,
  Screen,
  StatusBar,
  TAP_MS,
  Transcript,
  TranscriptTurn,
} from "@/components/phone";
import type { ScreenProps } from "../types";

/* ================================================================
   Step 5, Memory. Memory is free, and the free way to save one is to say
   it: "remember …" (DirectMemoryCommands.remember). The request is the
   consent, so fathom asks nothing back ("shall I remember that?" would be
   fathom pretending not to have heard, the file's own header). It says
   back exactly what it stored, "Remembered: " + the stored sentence, and
   that line is recorded in the transcript (speakAndRecord). What it keeps
   is listed in Settings, More options, Memory: the Memories tab
   (MemoryReviewList), grouped by kind, each row with its "Confirmed …"
   date and a visible trash button.

   The conversation opens where step 1 left it: the Just ask exchange in
   the transcript. The "Remember these?" checklist is the fathom plus
   flow after a long session, so it is not this screen.
   ================================================================ */

/**
 * Step 5, "It learns your world. You decide what it keeps."
 *   listening  the transcript (step 1's exchange), the mic open
 *   tap-send   a finger taps the mic to send
 *   said       your turn: "Remember my keys hang on the hook by the door."
 *   echo       fathom's turn: "Remembered: My keys hang on the hook by the door."
 *   tap-menu   a finger taps the header's menu, the way to Settings
 *   open       a cut to where it lands: the Memory screen (Settings, More
 *              options, Memory) rises over the header: Back, Memory, the
 *              three tabs on Memories
 *   saved      (rests) the new memory settles in at the top of "Where things are",
 *              with its Confirmed date, above the two it already knew
 */
export const REMEMBER_KEYS = defineScene([
  { id: "listening", ms: 1500, set: { mic: "listening", transcript: "open" } },
  { id: "tap-send", ms: TAP_MS },
  { id: "said", ms: 1200, set: { mic: "idle" } },
  { id: "echo", ms: 2400 },
  { id: "tap-menu", ms: TAP_MS },
  { id: "open", ms: 550 },
  { id: "saved", ms: 0 },
]);

const SHEET_BEATS = "open saved";

/** The Memories tab's rows, newest first (MemoryReviewList sorts by createdAt, descending). */
const ROWS = [
  { text: EXAMPLES.laundry.memories[1], note: EXAMPLES.remember.confirmed, isNew: true },
  { text: EXAMPLES.laundry.memories[2], note: EXAMPLES.remember.confirmedEarlier, isNew: false },
  { text: EXAMPLES.laundry.memories[0], note: EXAMPLES.remember.confirmedEarlier, isNew: false },
] as const;

/**
 * One memory: the words, the Confirmed footnote, and the trash button
 * (MemoryReviewList: `trash`, icon-md, color-hazard-fg, on every row so
 * deleting never depends on a swipe).
 */
function MemoryRow({ text, note }: { text: string; note: string }) {
  return (
    <>
      <span className="mr-row-text">
        <span className="mr-row-memory">{text}</span>
        <span className="mr-row-note">{note}</span>
      </span>
      <span className="mr-trash">
        <Glyph name="trash" />
      </span>
    </>
  );
}

/**
 * Settings, More options, Memory, on its Memories tab. It lives in the
 * Settings sheet's stack, so it rises as that sheet: Back (a pushed
 * screen's FathomBackButton) and the title, then FathomSegmentedControl,
 * then the list on the page ground.
 */
function MemorySheet() {
  return (
    <>
      <Layer show={SHEET_BEATS} className="ph-scrim" />
      <Layer show={SHEET_BEATS} className="ph-sheet mr-sheet">
        <div className="ph-sheet-bar">
          <span className="ph-sheet-close mr-back">
            <Glyph name="chevron-left" className="mr-back-chevron" />
            <span>{MEMORY_SCREEN.back.value}</span>
          </span>
          <span className="ph-sheet-title">{MEMORY_SCREEN.title.value}</span>
          <span />
        </div>
        <div className="mr-tabs">
          {MEMORY_SCREEN.tabs.map((tab, i) => (
            <span key={tab.value} className={i === MEMORY_SCREEN.tabs.length - 1 ? "mr-tab is-selected" : "mr-tab"}>
              {tab.value}
            </span>
          ))}
        </div>
        <div className="mr-list">
          <p className="mr-section">{MEMORY_SCREEN.whereThingsAre.value}</p>
          <div className="mr-card">
            {ROWS.map((row) =>
              row.isNew ? (
                <Layer key={row.text} show="saved" mode="flag" className="mr-row mr-row-new">
                  <MemoryRow text={row.text} note={row.note} />
                </Layer>
              ) : (
                <div key={row.text} className="mr-row">
                  <MemoryRow text={row.text} note={row.note} />
                </div>
              ),
            )}
          </div>
          <div className="mr-card mr-forget">{MEMORY_SCREEN.forgetEverything.value}</div>
        </div>
      </Layer>
    </>
  );
}

/** Step 5. */
export function MemoryReviewScreen({ active }: ScreenProps) {
  return (
    <Screen name="memory-review" scene={REMEMBER_KEYS} active={active} className="memory-review">
      <StatusBar />
      <AppHeader menuTouch="tap-menu" />
      <div className="ph-body">
        <Transcript>
          <TranscriptTurn who="user" time={EXAMPLES.time} text={EXAMPLES.justAsk.request} />
          <TranscriptTurn who="fathom" time={EXAMPLES.time} text={EXAMPLES.justAsk.answer} />
          <TranscriptTurn
            who="user"
            time={EXAMPLES.time}
            text={EXAMPLES.remember.request}
            show="said echo tap-menu open saved"
          />
          <TranscriptTurn who="fathom" time={EXAMPLES.time} text={EXAMPLES.remember.echo} show="echo tap-menu open saved" />
        </Transcript>
      </div>
      <Composer micTouch="tap-send" />
      <MemorySheet />
    </Screen>
  );
}
