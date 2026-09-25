import "./LookNow.css";
import { LOOK_NOW, STAGE } from "@/lib/app-facts";
import {
  AppHeader,
  Composer,
  defineScene,
  Orb,
  Screen,
  SheetFrame,
  SheetGroup,
  SheetRow,
  Stage,
  StageHeadline,
  StatusBar,
  TAP_MS,
  type GlyphName,
} from "@/components/phone";
import type { ScreenProps } from "../types";

/* ================================================================
   Step 2, Look Now: the More sheet (AssistantAddSheet.swift) over the
   idle conversation screen. Every string is an app fact: the stage's
   idle lines, the composer, the sheet's title, Close, the Look Now
   section and its six rows (LOOK_NOW, in the app's order), and the Saved
   section under it, which the sheet shows while nothing runs. The Look
   Now rows arrive in turn; Saved is drawn with the sheet, as a still.
   ================================================================ */

/**
 * Step 2, "Tap More. Six ways to look."
 *   idle      the idle stage: the orb, Ready, "Ask by voice, type, or tap More to look now."
 *   tap-more  a finger taps More
 *   sheet     the scrim fades in, "More ways to start" rises over the header, the six Look Now
 *             rows arrive one by one, Saved below them
 *   tap-read  a finger presses "Read text"; the row takes its pressed state
 *   read      (rests) the sheet open, "Read text" held highlighted: the way the next step starts
 */
export const LOOK_NOW_SHEET = defineScene([
  { id: "idle", ms: 1400 },
  { id: "tap-more", ms: TAP_MS },
  { id: "sheet", ms: 2600 },
  { id: "tap-read", ms: TAP_MS },
  { id: "read", ms: 0 },
]);

/** The beats the sheet and its rows are up for. */
const SHEET_BEATS = "sheet tap-read read";

/**
 * Each row's stand-in for the SF Symbol the app draws (AssistantAddSheet.swift):
 * camera.viewfinder, text.viewfinder, viewfinder.circle, display,
 * hand.point.up.left, plus.magnifyingglass. Same order as LOOK_NOW.rows.
 */
const ROW_GLYPHS: readonly GlyphName[] = [
  "camera-viewfinder",
  "text-viewfinder",
  "viewfinder-circle",
  "display",
  "hand-point-up",
  "magnifier-plus",
];

/** The Saved rows' stand-ins: checklist, location, arrow.counterclockwise (AssistantAddSheet.swift:110-116). */
const SAVED_GLYPHS: readonly GlyphName[] = ["checklist", "location", "repeat"];

/** The row the finger picks: "Read text", which step 3 goes on to read. */
const PICKED = 1;

/** Step 2. */
export function LookNowScreen({ active }: ScreenProps) {
  return (
    <Screen name="look-now" scene={LOOK_NOW_SHEET} active={active} className="look-now">
      <StatusBar />
      <AppHeader />
      <div className="ph-body">
        <Stage>
          <Orb />
          <StageHeadline eyebrow={STAGE.idle.eyebrow.value} headline={STAGE.idle.headline.value} />
        </Stage>
      </div>
      <Composer moreTouch="tap-more" />
      <SheetFrame title={LOOK_NOW.title.value} show={SHEET_BEATS}>
        <SheetGroup label={LOOK_NOW.section.value}>
          {LOOK_NOW.rows.map((row, i) => (
            <SheetRow
              key={row.title.value}
              glyph={ROW_GLYPHS[i]}
              title={row.title.value}
              detail={row.detail.value}
              show={SHEET_BEATS}
              touch={i === PICKED ? "tap-read" : undefined}
            />
          ))}
        </SheetGroup>
        <SheetGroup label={LOOK_NOW.saved.section.value}>
          {LOOK_NOW.saved.rows.map((row, i) => (
            <SheetRow key={row.title.value} glyph={SAVED_GLYPHS[i]} title={row.title.value} detail={row.detail.value} />
          ))}
        </SheetGroup>
      </SheetFrame>
    </Screen>
  );
}
