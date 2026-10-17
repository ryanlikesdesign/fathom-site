/* ================================================================
   The formation registry: which reels draw with the formation engine.

   A formation file exports one MorphSource per reel; list it in SOURCES.
   The essay is one reel (formations/essay.ts): one pane on the stage, one
   pool of pieces from the hero to the summit, the pivot included, so the
   brand mark the pieces become before the pivot is the one the people
   come back out of after it.
   ================================================================ */

import { outlineOf } from "../anchors";
import { compileMorph, PHONE_VIEW, pocketPlans, type CompiledMorph, type Crop, type MorphReelId, type MorphSource, type PocketPlan, type ResolvedFormation } from "./formation";
import { essay } from "./formations/essay";
import { MARK_BANDS, MARK_UNITS } from "./brand";
import { VIEW_W } from "./pieces";

export const SOURCES: readonly MorphSource[] = [essay];

export const MORPHS: Partial<Record<MorphReelId, CompiledMorph>> = Object.fromEntries(
  SOURCES.map((s) => [s.reel, compileMorph(s)]),
);

/** The reel each still placement in the page belongs to (page.tsx's WhySceneStill scenes). */
export const STILL_REEL: Readonly<Record<string, MorphReelId>> = {
  hero: "r1",
  arrives: "r1",
  ceiling: "r1",
  pace: "r1",
  climax: "r1",
  people: "r1",
  hands: "r1",
  summit: "r1",
};

/**
 * Every placement in page.tsx, in page order (test/why/morph.test.ts
 * checks the page against this). On a phone each one a formation ends is
 * a pocket: it opens on the drawing the pocket before it ended on and
 * plays the formations after it (formation.ts pocketPlans). The hands'
 * band holds the cane and the harness while their paragraph is read,
 * reforms them into the glasses as the wearable's paragraph comes up, and
 * folds the glasses down into its line as the summit's band rises with
 * them (KEYED fold); the summit's band, before its beat, opens on those
 * glasses and lifts the horizon into the summit.
 */
export const PLACEMENTS = ["hero", "arrives", "ceiling", "pace", "climax", "people", "hands", "summit"] as const;

/**
 * The placements that are frames on a phone (page.tsx .why-frame-pin): the
 * band pins together with the text it steps through, so each step plays
 * beside the words it shows. Only the hero's: its sentences are the one
 * block of essay text Ryan allowed to pin on a phone (for 110svh, why.css
 * --why-hero-frame-run), and only where the frame fits on a portrait
 * screen (the director measures; a window wider than tall, a zoomed
 * desktop's, never pins it). Otherwise the hero's band is a plain pocket.
 * The machines and the pairs step in flow (KEYED): no other text pins.
 */
export const FRAMES = ["hero"] as const;
/**
 * The placements a phone steps by its text (WhyDirector keyed pockets):
 * the band sits in flow above its text and never pins, and each of its
 * moves after its opening one plays as its item (the last items, one per
 * move) comes up the screen to its line, a share of the viewport's height
 * from the first item's to the last item's: the machines and the pairs
 * (their later items land lower, so the band is still on screen), and the
 * hands, whose glasses form as the
 * wearable's paragraph comes up to the reading line, in the turn before
 * it. `items` finds them inside the placement's frame. `seen`: the share
 * of the band still under the header as each move lands at the latest
 * (WhyDirector KEYED_SEEN by default). The hands' is all of it: their band
 * sits above the cane's paragraph and the turn, so the wearable's paragraph
 * reaches the reading line only once the band is going under the header;
 * their glasses form instead as the cane's paragraph rises past the
 * reading line, the last moment the band is whole on screen, so the
 * reform is seen whole and the cane's paragraph is read beside the cane.
 * `fold`: after its last move the band folds its drawing down into the
 * through-line it stands on while the next band rises into view, done as
 * that band is whole on screen (WhyDirector keyedFor). The hands' does:
 * the summit's band rises as the same glasses, whole (OPEN_WHOLE), and on
 * a phone the two bands share the screen while the testing paragraph is
 * read, so without the fold one pair of glasses would show twice. The
 * glasses go down from one band into the next; only one pair is ever
 * whole on screen.
 */
export type KeyedSpec = { items: string; lines: readonly [first: number, last: number]; seen?: number; fold?: boolean };
export const KEYED: Readonly<Record<string, KeyedSpec>> = {
  arrives: { items: ".why-timeline > li", lines: [0.66, 0.84] },
  pace: { items: ".why-pair", lines: [0.66, 0.84] },
  hands: { items: '[data-why-at="hands-p2"]', lines: [0.6, 0.6], seen: 1, fold: true },
};
/**
 * The placements whose band always rises as the drawing the band before ended on, whole, even while that
 * band is still on screen (never as the through-line alone): the summit's rises as the finished glasses,
 * the same glasses the hands' band leaves with above it (nothing forms twice), and lifts the ridge into
 * the summit through them once its top has passed the reading line.
 */
export const OPEN_WHOLE: readonly string[] = ["summit"];
/**
 * A band whose opening move may start as soon as it comes into view (its top this far down the screen), not
 * only once it has passed the reading line: nothing above it is being read. The people's band rises under
 * the pivot's navy as it leaves, the pivot's line already gone above the header, so the people draw
 * themselves out of the listening orb over the whole of its rise and the ground under the navy is never
 * one small orb on an empty screen. The hands' reforms the people into the cane and the dog as it comes up
 * under its headline (the people's band long gone above), so the reform is done early and the cane and
 * the dog hold whole while their paragraph comes up, before the glasses form.
 * A keyed band with a span here plays it in place of its keyed one (WhyDirector KEYED_ENTRY).
 */
export const ENTRY_FROM_AT: Readonly<Record<string, number>> = { people: 0.95, hands: 0.85 };
/**
 * Where a band's opening move ends, its top this share of the viewport under the header (formation.ts
 * ENTRY_TO by default). The people's ends early, with the band whole on screen: drawn out of the orb over
 * the band's first rise, so the orb never rises alone on the ground under the navy. The hands' ends with
 * the band whole on screen and the cane's paragraph still low on it, so the cane and the dog are whole
 * for a few hundred px of scroll on every phone before the glasses form.
 */
export const ENTRY_TO_AT: Readonly<Record<string, number>> = { people: 0.55, hands: 0.45 };
/**
 * The hero's frame steps (formation.ts pocketAt): the night street holds
 * while the claim is read, then a beat per sentence. The climax's band holds
 * briefly between its two steps, so the iris opens soon after the mark is
 * whole.
 */
const POCKET_OPTIONS = {
  frames: FRAMES,
  lead: { hero: 0.5 },
  hold: { climax: 0.15 },
};

/** A still's key, as Formation.still and data-why-pocket spell it: "hero", "pace-0". */
export const stillKey = (scene: string, pair?: number) => (pair === undefined ? scene : `${scene}-${pair}`);

const reelOfKey = (key: string): MorphReelId | undefined => STILL_REEL[key.replace(/-\d+$/, "")];

/** Each morph reel's pockets, in page order, and any ordering problems. */
export const POCKETS: Partial<Record<MorphReelId, { plans: PocketPlan[]; problems: string[] }>> = Object.fromEntries(
  Object.entries(MORPHS).map(([reel, c]) => {
    const problems: string[] = [];
    const keys = PLACEMENTS.filter((k) => reelOfKey(k) === reel);
    return [reel, { plans: pocketPlans(c!, keys, problems, POCKET_OPTIONS), problems }];
  }),
);

/** The pocket a placement plays on a phone. */
export function pocketPlan(reel: MorphReelId, key: string): PocketPlan | undefined {
  return POCKETS[reel]?.plans.find((p) => p.key === key);
}

/* ---------------------------------------------------------------- *
 * A pocket's view: what its band shows of the phone grid
 * ---------------------------------------------------------------- */

/**
 * A stroke reaching this far past the grid's edge is a through-line (the
 * horizon, a floor, the ceiling, the people's base line, the ground): it
 * never sizes a band, and the band's edges (the text column's) cut it.
 */
const THROUGH = 60;
/** Grid units of air around a band's drawings, so a stroke on the edge is never cut by the column. */
export const VIEW_PAD = 8;
/** The mark's outer edge from its center, as a share of its size (its outer band's outer radius in the 120 master). */
const MARK_REACH = (MARK_BANDS[MARK_BANDS.length - 1]?.[1] ?? MARK_UNITS / 2) / MARK_UNITS;

/**
 * Where a formation draws on the phone grid: the box of every seen stroke
 * and the mark, leaving out the through-lines and the clipped pieces (a
 * feed, a viewfinder's subject: they only ever show inside an outline the
 * box already holds). Null when it draws nothing.
 */
export function drawnBox(c: CompiledMorph, f: ResolvedFormation): [x0: number, y0: number, x1: number, y1: number] | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const take = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  };
  f.states.forEach((st, k) => {
    if (c.pool[k].clip || st.parked || !(st.look.o > 0)) return;
    const pts = outlineOf(st);
    if (pts.some(([x]) => x < -THROUGH || x > VIEW_W + THROUGH)) return;
    for (const [x, y] of pts) take(x, y);
  });
  if (f.mark.o > 0 && f.mark.size > 0) {
    const r = f.mark.size * MARK_REACH;
    take(f.mark.cx - r, f.mark.cy - r);
    take(f.mark.cx + r, f.mark.cy + r);
  }
  return Number.isFinite(x0) ? [x0, y0, x1, y1] : null;
}

/**
 * How a pocket's view is fitted. By default: the drawings the band forms
 * (every step after the one it opens on, which only reforms while the band
 * rises), padded by VIEW_PAD. `opening`: the drawing it opens on sizes it
 * too. `markEdge`: the view starts at the left edge of the mark its last
 * formation shows, so the mark stands on the text's left edge (the band
 * draws it xMinYMid, POCKET_ALIGN). `view`: a view set by hand.
 */
type ViewFit = { opening?: boolean; markEdge?: boolean; view?: Crop };
const VIEW_FIT: Readonly<Record<string, ViewFit>> = {
  // The pivot's band: framed on the orb and the mark (the viewfinder it opens on reaches a little past
  // them while it closes into the orb, and the band lets it: why.css), the mark on the line's left edge,
  // over "That’s why I built fathom.".
  climax: { markEdge: true },
};

/**
 * How a band places its view when the band's shape is not the view's
 * (preserveAspectRatio): centered, except the pivot's, whose mark keeps
 * the line's left edge on any screen.
 */
export const POCKET_ALIGN: Readonly<Record<string, string>> = { climax: "xMinYMid meet" };

/**
 * Each pocket's view, the part of the phone grid its band shows: the box
 * of the drawings it plays, so the drawing fills the band, the band takes
 * the text column's width at the view's shape (why.css --why-band-h, never
 * over its share of the screen), and a wide drawing makes a short band
 * rather than a tall one with empty ground above and below it. Every
 * pocket's svg draws on the same grid: only the viewBox differs.
 */
export function fitPocketView(c: CompiledMorph, plan: PocketPlan, fit: ViewFit = VIEW_FIT[plan.key] ?? {}): Crop {
  if (fit.view) return fit.view;
  const steps = fit.opening || plan.steps.length < 2 ? plan.steps : plan.steps.slice(1);
  let box: [number, number, number, number] | null = null;
  for (const i of steps) {
    const b = drawnBox(c, c.formations[i]);
    if (!b) continue;
    box = box ? [Math.min(box[0], b[0]), Math.min(box[1], b[1]), Math.max(box[2], b[2]), Math.max(box[3], b[3])] : b;
  }
  if (!box) return c.view;
  const r = (n: number) => Math.round(n);
  // Never wider than the grid: what reaches past it (the hero's skyline) runs out under the column's edges,
  // as it runs out of the stage's pane.
  let x0 = Math.max(0, box[0] - VIEW_PAD);
  const x1 = Math.min(VIEW_W, box[2] + VIEW_PAD);
  const mark = c.formations[plan.steps[plan.steps.length - 1]].mark;
  if (fit.markEdge && mark.o > 0 && mark.size > 0) x0 = mark.cx - mark.size * MARK_REACH;
  return [r(x0), r(box[1] - VIEW_PAD), r(x1 - x0), r(box[3] - box[1] + 2 * VIEW_PAD)];
}

/** Every pocket's view, by reel and placement. */
export const POCKET_VIEWS: Partial<Record<MorphReelId, Readonly<Record<string, Crop>>>> = Object.fromEntries(
  Object.entries(POCKETS).map(([reel, v]) => {
    const phone = MORPHS[reel as MorphReelId]?.phone;
    return [reel, Object.fromEntries((v?.plans ?? []).map((p) => [p.key, phone ? fitPocketView(phone, p) : PHONE_VIEW]))];
  }),
);

/**
 * A pocket that can stand upright: on a portrait screen tall enough to pin
 * its band and its text together at nearly the band's full height
 * (WhyDirector fitFrames), the hero's band draws the stage's own
 * formations, 1:1, in place of the phone's (which turn the phone on its
 * side to fit a short band): the phone in the drawing stands upright like
 * the one in the reader's hand, as tall as the band, the street and the
 * skyline running out under the column's edges. Its own view, fitted the
 * same way. Anywhere else the band keeps the phone's drawing.
 */
export const UPRIGHT: Partial<Record<MorphReelId, Readonly<Record<string, { c: CompiledMorph; view: Crop }>>>> = Object.fromEntries(
  Object.entries(MORPHS).map(([reel, c]) => {
    const plan = POCKETS[reel as MorphReelId]?.plans.find((p) => p.key === "hero");
    return [reel, plan && c ? { hero: { c, view: fitPocketView(c, plan) } } : {}];
  }),
);

/** The view a placement's band shows on a phone (the reel's own phone view for a placement with no pocket). */
export function pocketView(reel: MorphReelId, key: string): Crop {
  return POCKET_VIEWS[reel]?.[key] ?? MORPHS[reel]?.view ?? PHONE_VIEW;
}

/**
 * The formation that draws a still. undefined: the scene's reel has no
 * formations (it keeps its layered still). null: the reel has formations,
 * but none draws this still, so it shows none (never the old art beside
 * the new).
 */
export function morphStill(scene: string, pair?: number): { c: CompiledMorph; f: ResolvedFormation } | null | undefined {
  const reel = STILL_REEL[scene];
  const c = reel ? MORPHS[reel] : undefined;
  if (!c) return undefined;
  const key = stillKey(scene, pair);
  const f = c.formations.find((x) => x.still.includes(key)) ?? c.formations.find((x) => x.pocket.includes(key));
  return f ? { c, f } : null;
}
