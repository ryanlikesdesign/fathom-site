"use client";

/* ================================================================
   The /why director: the page's only script. Renders nothing.

   - Runs the motion gate (gate.ts) before paint and keeps html[data-why]
     in step with it: OS reduced motion, more contrast, forced colors,
     the header's Pause motion control, window size and text zoom.
   - One passive scroll listener sets a flag; one rAF per frame reads
     scrollY and, before it writes anything, where the reader is (the
     first essay block under the header: one or two box reads, a short
     search after a jump), then writes only the strings that changed.
   - Stage mode (big windows): one sticky pane beside the text carries the
     whole essay's art, one pool of pieces (morph/). The frame samples the
     formations and writes each piece's d and style, the pieces' layer, the
     brand mark and the clip window. The hero's text and the four pairs
     pin while the art plays against them (the five machines never pin:
     each lands as its era comes up the screen), and the
     reading tie (Leader) joins each to its words by position alone: the
     horizon's near stub runs from the art column's inner edge on the
     first baseline of the line the art is showing (a sentence, an era, a
     job) until it meets the drawing, and a machine whose era's line is at
     its floor stands on it. A piece of the art, in the art's column, never
     beside the words; nothing in the text moves or dims.
   - Pocket mode (phones and other smaller windows at default text size):
     each placement is a pocket (why.css), a band that pins under the
     header between two blocks of text. Every band after the hero's enters
     as the drawing the band before it ended on (pocketPlans) and reforms
     it into its own while it rises into view (pocketEntry), so a phone
     sees the same matched cuts as the stage; then, pinned, the reader's
     scroll plays the rest of its formations (pocketFrameAt), and it holds
     and lets go. If the band before is still on screen as a band comes
     into view, or stood upright (so its drawing is not the phone's), it
     rises as its own first drawing, whole and still, instead, so one
     drawing never forms twice and no band rises as a bare line over empty
     ground (the summit's band is the exception: it rises as the hands'
     glasses, whole, and lifts the ridge through them). The hero's sentences pin with their band as one frame when
     they fit on a portrait screen (the band shortened if it must be), and
     each beat plays beside its words; the five machines, the four pairs
     and the hands never pin: their band sits in flow above their text and
     steps as each item comes up the screen (keyed pockets). The pivot's
     band holds the mark through the pivot.
     While the page is pinch-zoomed the art (pane, pockets, pivot) freezes
     on what it shows.
   - The pivot (pivot.ts), in both: the navy iris opens out of the mark's
     on-screen center and the words build once it covers them. The mark
     is drawn twice, in ink on the ground and on-accent on the navy, and
     the director writes both clips from the same circle.
   - Layout is read only in remeasure(): on start, when fonts load, when
     the article resizes and when the mode changes. It reads every pinned
     block where the flow put it (data-why-measuring releases the pins for
     the few synchronous reads), whatever the scroll.
   - When the mode changes mid-scroll (the header's Pause motion control,
     an OS setting, a resize), the block the reader was looking at stays
     where it was on screen. It is the one the last frame saw under the
     header, live, so a pinned block (whose place in the flow says nothing
     about where it is on screen) keeps its place too; restored with an
     instant scroll once the new layout is in. Resuming motion without a
     scroll since the pause goes back to the exact scroll the pause left.
   ================================================================ */

import { useLayoutEffect, useSyncExternalStore } from "react";
import { applyMode, computeMode, GATE_QUERIES, MODE_ATTR, readEnv, WHY_GATE_SCRIPT, type WhyMode } from "./gate";
import { beatY, docBox, edgeAt, measure, outlineOf, pickRestoreAnchor, removeProbe, restoreTarget, type Geometry, type RestoreAnchor } from "./anchors";
import { LINE, readEasings, type Easings } from "./engine";
import { ENTRY_FROM_AT, ENTRY_TO_AT, FRAMES, KEYED, MORPHS, OPEN_WHOLE, pocketPlan, UPRIGHT } from "./morph";
import {
  bandTopAt, crossingAt, foldFrame, KEYED_HOLD, KEYED_MIN, KEYED_SQUEEZE, keyedFrameAt, keyedRanges, locate, pocketEntry, pocketFrameAt, pocketRange, resolveMorphTiming, runSvh, sampleFrames, sampleMorph, type CompiledMorph,
  type Crop, type MorphReelId, type MorphTiming, type PocketPlan,
} from "./morph/formation";
import { FRAME_TOP, PIVOT_IRIS } from "./morph/formations/essay";
import type { PieceState } from "./morph/pieces";
import { linePath, type MorphFrame } from "./morph/render";
import { GROUND_ALL } from "./morph/MorphStage";
import { MARK_BANDS, MARK_DISK, MARK_UNITS } from "./morph/brand";
import { irisClip, navyPath, wordAt, wordStyle, WORD_COUNT, WORD_REST, type PivotGeom } from "./pivot";

const noSubscribe = () => () => {};

/**
 * The pre-paint gate, as the article's first child. It is in the server
 * HTML, so it runs during parse, before first paint. React never runs an
 * inline script it creates itself (and warns in development when asked
 * to), so on a client-side navigation this renders nothing and the
 * director's layout effect applies the same gate before paint instead.
 */
export function WhyGateScript() {
  const fromServer = useSyncExternalStore(
    noSubscribe,
    () => false,
    () => true,
  );
  return fromServer ? <script dangerouslySetInnerHTML={{ __html: WHY_GATE_SCRIPT }} /> : null;
}

/** Attributes of one element: the strings last written, and the server's, put back on the way out. */
type AttrRef = { el: Element; a: string; b: string; a0: string | null; b0: string | null };
/**
 * A formation svg: one path per piece of its pool (d, style), the pieces'
 * layer, the brand mark twice (on the ground, on the navy), the clip
 * window, the navy and ground clips, and the viewBox the server drew it with.
 */
type MorphSvg = {
  svg: SVGSVGElement;
  paths: AttrRef[];
  layer: AttrRef | null;
  mark: AttrRef | null;
  markOn: AttrRef | null;
  win: AttrRef | null;
  navy: AttrRef | null;
  ground: AttrRef | null;
  /** The pieces' copy on the navy: only linked while there is navy to draw it in, so it costs nothing otherwise. */
  use: { el: Element; href: string | null; on: boolean | null } | null;
  view0: string | null;
};
/** The pane: the whole essay's art beside the text, on the stage. */
type LivePane = { pane: HTMLElement; c: CompiledMorph; svg: MorphSvg; timing: MorphTiming | null; live: boolean; ready: boolean; shown: boolean | null };
/**
 * A phone's pocket: one placement's band, playing its plan from the reel's
 * phone formations. `steps` is the plan it plays (open: "line" when the
 * band before is still on screen as it comes into view: it rises as the
 * through-line alone); `entry` the scroll range its opening move plays over
 * as it rises, `range` the one it is pinned for; `stick` where its band
 * rides (its box's document top, the box's runway, the band's height), so
 * the band after it can tell whether it is still on screen.
 */
type LivePocket = {
  el: HTMLElement;
  band: HTMLElement;
  /** The formations the band plays: the phone's, or the stage's own where it stands upright (`upright`). */
  phone: CompiledMorph;
  /** The phone's drawing and its view; the upright one where the pocket has it (morph/index.ts UPRIGHT). */
  base: { c: CompiledMorph; view: Crop };
  upright: { c: CompiledMorph; view: Crop } | null;
  /** The view variables the server drew the pocket with, put back on leaving motion. */
  vars0: [string, string];
  plan: PocketPlan;
  steps: Pick<PocketPlan, "steps" | "lead" | "reform" | "hold"> & { open?: "line"; regrow?: boolean; fold?: boolean };
  svg: MorphSvg;
  entry: [number, number] | null;
  range: [number, number] | null;
  stick: { T: number; R: number; bandH: number } | null;
  /** A keyed pocket's moves (morph/index.ts KEYED): each one's scroll range, ending as its list item reaches the reading line. */
  keys: [number, number][] | null;
  /**
   * A band that rises as the drawing the band before folds away (OPEN_WHOLE after a KEYED fold: the summit's,
   * under the hands'): the scroll range over which it grows that drawing back out of its line, the same
   * range the band before folds it over, so the drawing passes from one band to the next and is never whole
   * in both. Before it, the band holds the line.
   */
  handoff: [number, number] | null;
  live: boolean;
  ready: boolean;
};
/** Where the mark sits in an svg while the pivot runs: its center (svg units) and px per unit. */
type MarkSpot = { svg: MorphSvg; k: number; mx: number; my: number };
type LivePivot = {
  stage: HTMLElement;
  section: HTMLElement;
  iris: HTMLElement | null;
  words: HTMLElement[];
  geom: PivotGeom | null;
  spot: MarkSpot | null;
  irisLast: string;
  wordLast: string[];
};
/** A phone's frame: a band and its text, pinned as one block while the band steps through them. */
type Frame = { key: string; pin: HTMLElement; frame: HTMLElement; run: HTMLElement; pocket: LivePocket };
/**
 * The stage's reading tie: a level line of the art at the first baseline
 * of the sentence the art is showing, run from the art column's inner edge
 * until it meets the drawing, so a reader (or a magnifier panning along
 * the line) goes from the words straight into the picture of them. It is
 * the horizon's near stub (hzL), a piece of the art, in the art's column,
 * never beside the words. Per formation that has a line (the hero's five
 * beats, the five machines' eras, the four pairs' jobs):
 *   open    the opening formation: the lede already sits on the horizon
 *           (why.css), so the horizon keeps its height and both halves
 *           only reach the phone's outline;
 *   lead    the near stub steps to the sentence's line and ends on the
 *           drawing's outline there; the far half of the horizon, if
 *           drawn, folds into the outline at its own height, so the
 *           horizon never shows at two heights;
 *   ground  a machine on its floor: the floor's far half takes the whole
 *           floor and the near half lifts off it as the leader. Where the
 *           era's line is at or near the floor (the smartphone, the list's
 *           last line), the drawing settles onto it instead: the machine
 *           stands on the line of its era, and the leader is the floor.
 * `docY` is the sentence's first baseline (document px, measured with the
 * pins released), `pin` the scroll range its block pins for, so the line
 * rides with the words exactly; `shift` the layer's settle (grid units)
 * while the block is pinned. The pane's grid on screen: px per unit (k)
 * and the grid's top (y0).
 */
type LeadKind = "open" | "lead" | "ground";
type Lead = {
  kind: LeadKind;
  docY: number;
  pinStart: number;
  pinLen: number;
  shift: number;
  /** Where a level line at a height meets the drawing, from the left (cached by half unit). */
  edge: Map<number, number | null>;
};
type Leader = {
  iL: number;
  iR: number;
  skip: ReadonlySet<number>;
  layer: AttrRef | null;
  leads: (Lead | null)[];
  y0: number;
  k: number;
};
/** The most scroll steps a mode change takes to put a pinned block back where the reader saw it. */
const SETTLE_STEPS = 24;
/** A keyed pocket's lines (morph/index.ts KEYED): where item j of m lands its step, as a share of the viewport. */
export function keyedLines(lines: readonly [number, number], m: number): number[] {
  return Array.from({ length: m }, (_, j) => lines[0] + (m > 1 ? ((lines[1] - lines[0]) * j) / (m - 1) : 0));
}
/** A keyed band shows at least this share of itself under the header as each of its moves lands. */
export const KEYED_SEEN = 0.6;
/**
 * A keyed band's opening move: from its top at 58% down the screen (past the reading line, engine.ts LINE,
 * so the text above it has risen clear of where it is read: the band holds the drawing it rose in as until
 * then) to 32%, done before its first item comes up to its line.
 */
export const KEYED_ENTRY = [0.58, 0.32] as const;
/**
 * A keyed band that rises as its through-line alone (lineOpener) grows its drawing out of the line from
 * the moment it comes into view, so it never sits on screen as a bare line over empty ground.
 */
export const KEYED_ENTRY_LINE = [1, 0.32] as const;
/** The pool pieces that lead on the stage: the horizon's (and every floor's) near and far halves. */
const LEADER_PIECE = "hzL";
const LEADER_FAR = "hzR";
/**
 * The lines the pinned lists tie to, by the formation that draws each (the
 * hero's sentences are the hero formations' own cues): each machine's era,
 * and each pair's job, the line the viewfinder re-targets level with.
 */
export const LIST_CUES: Readonly<Record<string, string>> = {
  "F06-cctv": '[data-why-at="era-1"]',
  "F07-portable": '[data-why-at="era-2"]',
  "F08-dos": '[data-why-at="era-3"]',
  "F09-windows": '[data-why-at="era-4"]',
  "F10-smartphone": '[data-why-at="era-5"]',
  "F12a-menu": '[data-why-at="pair-1"] .why-pointed',
  "F12b-curb": '[data-why-at="pair-2"] .why-pointed',
  "F12c-hall": '[data-why-at="pair-3"] .why-pointed',
  "F12d-street": '[data-why-at="pair-4"] .why-pointed',
  // Once the pairs let go: the statement that closes them, the viewfinder level with its first line.
  "F12e-statement": '[data-why-at="pace-p2"]',
};
/**
 * A machine settles onto its era's line (instead of a leader lifting off
 * its floor) where the line is below the floor, or above it by less than
 * this (grid units): a leader that close to the floor would read as a
 * doubled floor. It never settles further than its floor can go and stay
 * on the grid.
 */
const SETTLE_UP = 28;
const GRID_FLOOR = 792;

const attrRef = (el: Element, a: string, b: string): AttrRef => ({ el, a: "", b: "", a0: el.getAttribute(a), b0: el.getAttribute(b) });

/** The svg's pieces, layer, marks and clips; null if the page and the pool are out of step (no formation art at all, never half of it). */
function collectSvg(c: CompiledMorph | undefined, svg: SVGSVGElement | null | undefined): MorphSvg | null {
  if (!c || !svg) return null;
  const paths: AttrRef[] = [];
  for (const p of c.pool) {
    const el = svg.querySelector(`path[data-piece="${p.id}"]`);
    if (!el) return null;
    paths.push(attrRef(el, "d", "style"));
  }
  const q = (sel: string) => svg.querySelector(sel);
  const mark = q("[data-why-mark]");
  const markOn = q("[data-why-mark-on]");
  const win = q("[data-why-window]");
  const layer = q("[data-why-layer]");
  const navy = q("[data-why-navy]");
  const ground = q("[data-why-ground]");
  const use = q("[data-why-use]");
  if (c.marked !== !!mark || c.clipped !== !!win) return null;
  const href = use?.getAttribute("href") ?? null;
  // Unlinked until the pivot's navy is behind this svg (writeNavy), so it costs nothing elsewhere.
  use?.removeAttribute("href");
  return {
    svg,
    paths,
    layer: layer ? attrRef(layer, "style", "data-x") : null,
    mark: mark ? attrRef(mark, "transform", "style") : null,
    markOn: markOn ? attrRef(markOn, "transform", "style") : null,
    win: win ? attrRef(win, "d", "style") : null,
    navy: navy ? attrRef(navy, "d", "data-x") : null,
    ground: ground ? attrRef(ground, "d", "data-x") : null,
    use: use ? { el: use, href, on: false } : null,
    view0: svg.getAttribute("viewBox"),
  };
}

function put(r: AttrRef, which: "a" | "b", name: string, v: string) {
  if (r[which] !== v) r.el.setAttribute(name, (r[which] = v));
}

/** Writes only the strings that changed since the last write. */
function writeSvg(m: MorphSvg, f: MorphFrame) {
  for (let i = 0; i < m.paths.length; i++) {
    put(m.paths[i], "a", "d", f.pieces[i].d);
    put(m.paths[i], "b", "style", f.pieces[i].style);
  }
  if (m.layer) put(m.layer, "a", "style", `opacity:${f.layer}`);
  if (m.mark) {
    put(m.mark, "a", "transform", f.mark.transform);
    put(m.mark, "b", "style", f.mark.style);
  }
  if (m.markOn) {
    put(m.markOn, "a", "transform", f.mark.transform);
    put(m.markOn, "b", "style", f.mark.on);
  }
  if (m.win) put(m.win, "a", "d", f.window);
}

/** The pivot's navy behind the mark: the on-accent copy shows inside it, the ink copy outside. */
function writeNavy(m: MorphSvg, navy: string) {
  if (m.navy) put(m.navy, "a", "d", navy);
  if (m.ground) put(m.ground, "a", "d", navy ? `${GROUND_ALL}${navy}` : GROUND_ALL);
  const u = m.use;
  if (u && u.href && u.on !== !!navy) {
    u.on = !!navy;
    if (u.on) u.el.setAttribute("href", u.href);
    else u.el.removeAttribute("href");
  }
}

/** Puts back every string the server drew, and its viewBox. */
function restoreSvg(m: MorphSvg) {
  const back = (r: AttrRef | null, a: string, b: string) => {
    if (!r) return;
    for (const [name, v] of [
      [a, r.a0],
      [b, r.b0],
    ] as const) {
      if (v === null) r.el.removeAttribute(name);
      else r.el.setAttribute(name, v);
    }
    r.a = r.b = "";
  };
  for (const p of m.paths) back(p, "d", "style");
  back(m.layer, "style", "data-x");
  back(m.mark, "transform", "style");
  back(m.markOn, "transform", "style");
  back(m.win, "d", "style");
  back(m.navy, "d", "data-x");
  back(m.ground, "d", "data-x");
  if (m.use) {
    if (m.use.href === null) m.use.el.removeAttribute("href");
    else m.use.el.setAttribute("href", m.use.href);
    m.use.on = null;
  }
  if (m.view0 === null) m.svg.removeAttribute("viewBox");
  else m.svg.setAttribute("viewBox", m.view0);
}

/** Pinch zoom past this freezes the pockets. */
const PINCHED = 1.01;
/**
 * A phone's frame pins its band and its text as one block only if the
 * frame fits the small viewport under the header with this much to spare;
 * the band may shorten to fit, never below FRAME_BAND_MIN of its own height.
 */
const FRAME_SPARE = 16;
/** How far a frame's band may shorten to fit, as a share of its own height. */
const FRAME_BAND_MIN: Readonly<Record<string, number>> = { hero: 0.7 };
/** An upright band (morph/index.ts UPRIGHT) pins with its text only at this share of its own height or more. */
const UPRIGHT_MIN = 0.9;
/** The pocket the pivot's band holds the mark in. */
const CLIMAX = "climax";
/**
 * The mark's solid parts as radii in px from its center, for a mark `px` across: its disk and its bands,
 * each a pixel wider on either side (the antialiased edge), for the iris to cross quickly (pivot.ts).
 */
function markBands(px: number): [number, number][] {
  const u = px / MARK_UNITS;
  return [[0, MARK_DISK * u + 1], ...MARK_BANDS.map(([a, b]) => [a * u - 1, b * u + 1] as [number, number])];
}
/** On a phone the pivot's words build as soon as the navy covers the line (this much past its far corner), a word this many svh apart. */
const PIVOT_COVER_PAD = 12;
const PHONE_WORD_STEP = 6;
/** A band counts as on screen when this many px of it show under the header or above the bottom edge. */
const COVISIBLE = 8;
/** Atkinson Hyperlegible Next's first baseline under the middle of its line, in em (why.css --why-baseline). */
const BASELINE_EM = 0.31;

/**
 * Where an svg drawn with preserveAspectRatio meet puts a point of its
 * viewBox on screen: px per unit, and the viewBox's origin in px. `align`
 * is the svg's own preserveAspectRatio alignment (xMidYMid by default;
 * the pivot's band sets its mark at the line's left edge, xMinYMid).
 */
function meet(box: { left: number; top: number; width: number; height: number }, view: readonly [number, number, number, number], align = "xMidYMid") {
  const [vx, vy, vw, vh] = view;
  const k = Math.min(box.width / vw, box.height / vh);
  const share = (a: string) => (a === "Min" ? 0 : a === "Max" ? 1 : 0.5);
  const m = /^x(Min|Mid|Max)Y(Min|Mid|Max)/.exec(align);
  const ax = m ? share(m[1]) : 0.5;
  const ay = m ? share(m[2]) : 0.5;
  return { k, x0: box.left + (box.width - vw * k) * ax - vx * k, y0: box.top + (box.height - vh * k) * ay - vy * k };
}

/** An svg's viewBox as numbers (its data-view on a phone: the pocket's own view). */
function viewOf(svg: SVGSVGElement): [number, number, number, number] | null {
  const n = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  return n.length === 4 && n.every(Number.isFinite) && n[2] > 0 && n[3] > 0 ? (n as [number, number, number, number]) : null;
}

/** A line piece that is drawn: seen, not parked. */
function seenLine(st: PieceState): st is Extract<PieceState, { kind: "line" }> {
  return st.kind === "line" && st.look.o > 0 && !st.parked;
}

/** Where a stub that was a point at the outline starts when it leads: off the art column's inner edge (the column clips it). */
const LEAD_FROM = -700;
/** The share of a move over which the reading tie hands over from one formation's sentence to the next's. */
const LEAD_HANDOFF = 0.35;

const spans = new WeakMap<readonly PieceState[], [number, number]>();
/** The drawing's top and bottom (grid units), leaving out `skip`: where a level line can meet it. */
function spanOf(states: readonly PieceState[], skip: ReadonlySet<number>): [number, number] {
  let v = spans.get(states);
  if (!v) {
    let top = Infinity;
    let bottom = -Infinity;
    states.forEach((st, i) => {
      if (skip.has(i) || st.parked || !(st.look.o > 0)) return;
      for (const [, py] of outlineOf(st)) {
        top = Math.min(top, py);
        bottom = Math.max(bottom, py);
      }
    });
    spans.set(states, (v = Number.isFinite(top) ? [top, bottom] : [0, 800]));
  }
  return v;
}

/** A line piece's numbers from its d ("M x1 y1 L x2 y2"). */
function lineNums(d: string): number[] | null {
  const m = /^M(-?[\d.e+-]+) (-?[\d.e+-]+) L(-?[\d.e+-]+) (-?[\d.e+-]+)$/.exec(d);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])] : null;
}

export function startDirector(article: HTMLElement, win: Window & typeof globalThis = window): () => void {
  const doc = article.ownerDocument;
  const html = doc.documentElement;
  let mode: WhyMode = "static";
  let geom: Geometry | null = null;
  let lastY = win.scrollY;
  let pending = false;
  let rafId = 0;
  let forceAll = false;
  let disposed = false;
  let pinched = false;
  let easings: Easings = readEasings(() => "");
  let pane: LivePane | null = null;
  let pockets: LivePocket[] = [];
  let pivot: LivePivot | null = null;
  let frames: Frame[] = [];
  /** Where the motion layout had the reader when motion was paused (the block, its offset, the scroll). */
  let resumeAt: { el: Element; offset: number; y: number } | null = null;
  /** Where the pause left the static page: resuming from exactly there goes back to resumeAt.y, untouched. */
  let pausedLandY: number | null = null;
  /** The block the reader is at: the first essay block under the header, live, as the last frame saw it. */
  let reader: { el: Element; offset: number } | null = null;
  let readerIdx = 0;
  let leader: Leader | null = null;
  let io: IntersectionObserver | null = null;

  /* ---------------- collect ---------------- */

  function collectPane(): LivePane | null {
    const root = article.querySelector<HTMLElement>('[data-why-reel="r1"]');
    const el = root?.querySelector<HTMLElement>(":scope > .why-pane");
    const c = MORPHS.r1;
    const svg = collectSvg(c, el?.querySelector<SVGSVGElement>("svg.why-morph"));
    return el && c && svg ? { pane: el, c, svg, timing: null, live: true, ready: false, shown: null } : null;
  }

  function collectPockets(): LivePocket[] {
    const out: LivePocket[] = [];
    article.querySelectorAll<HTMLElement>(".why-pocket[data-why-pocket]").forEach((el) => {
      const reel = el.dataset.reel as MorphReelId;
      const c = MORPHS[reel];
      const plan = c ? pocketPlan(reel, el.dataset.whyPocket ?? "") : undefined;
      const band = el.querySelector<HTMLElement>(":scope > .why-pocket-band");
      const svg = collectSvg(c, band?.querySelector<SVGSVGElement>(":scope > svg.why-morph"));
      if (!c?.phone || !plan || !band || !svg) return;
      // The pocket's view of the grid, in place of the still's crop.
      const view = (svg.svg.getAttribute("data-view") ?? "").split(" ").map(Number);
      const base = { c: c.phone, view: (view.length === 4 && view.every(Number.isFinite) ? view : c.view) as unknown as Crop };
      svg.svg.setAttribute("viewBox", base.view.join(" "));
      const up = UPRIGHT[reel]?.[plan.key] ?? null;
      const vars0: [string, string] = [el.style.getPropertyValue("--vw"), el.style.getPropertyValue("--vh")];
      out.push({ el, band, phone: c.phone, base, upright: up, vars0, plan, steps: plan, svg, entry: null, range: null, stick: null, keys: null, handoff: null, live: true, ready: false });
    });
    return out;
  }

  function collectPivot(): LivePivot | null {
    const stage = article.querySelector<HTMLElement>(".why-pivot-stage");
    const section = stage?.querySelector<HTMLElement>(".why-pivot");
    if (!stage || !section) return null;
    const words: HTMLElement[] = [];
    for (let i = 0; i < WORD_COUNT; i++) {
      const w = section.querySelector<HTMLElement>(`[data-why-word="${i}"]`);
      if (w) words.push(w);
    }
    return {
      stage,
      section,
      iris: section.querySelector<HTMLElement>(".why-iris"),
      words,
      geom: null,
      spot: null,
      irisLast: "",
      wordLast: words.map(() => ""),
    };
  }

  /** The stage's reading tie: the horizon's two halves, if the pane draws them. */
  function collectLeader(): Leader | null {
    if (!pane) return null;
    const ids = pane.c.pool.map((p) => p.id);
    const iL = ids.indexOf(LEADER_PIECE);
    const iR = ids.indexOf(LEADER_FAR);
    if (iL < 0 || iR < 0 || pane.c.pool[iL].kind !== "line" || pane.c.pool[iR].kind !== "line") return null;
    const layer = pane.svg.layer ? attrRef(pane.svg.layer.el, "transform", "data-y") : null;
    // The clipped pieces (a feed, a viewfinder's subject) are seen only inside their window: never an outline the stub stops at.
    const clipped = pane.c.pool.flatMap((p, k) => (p.clip ? [k] : []));
    return { iL, iR, skip: new Set([iL, iR, ...clipped]), layer, leads: [], y0: 0, k: 1 };
  }

  /* ---------------- measure ---------------- */

  /**
   * Phones: pin the hero's band and its sentences as one block when they
   * fit on one portrait screen together (the band shortened if it must be,
   * never below FRAME_BAND_MIN of its height), so each beat plays beside
   * the words it shows. Otherwise, and always on a window wider than it is
   * tall (a zoomed desktop, where a pinned block of text would take most
   * of a short screen), the band is a plain pocket before the text. Only
   * the frames a phone pins (morph/index.ts FRAMES: the hero's).
   * A layout write, at measure time only.
   */
  function fitFrames(headerH: number, svh: number) {
    frames = [];
    article.querySelectorAll<HTMLElement>(".why-frame-pin[data-why-frame]").forEach((pin) => {
      const frame = pin.querySelector<HTMLElement>(":scope > .why-frame");
      const run = pin.querySelector<HTMLElement>(":scope > .why-frame-run");
      const pocket = pockets.find((p) => frame?.contains(p.el));
      pin.removeAttribute("data-pin");
      frame?.style.removeProperty("--why-frame-band");
      if (pocket) drawAs(pocket, false);
      const key = pin.dataset.whyFrame ?? "";
      if (mode !== "pocket" || !frame || !run || !pocket || !(svh > 0) || !(FRAMES as readonly string[]).includes(key)) return;
      if (win.innerWidth > win.innerHeight) return;
      // Upright first, where the pocket has it (morph/index.ts UPRIGHT): only where the band and its text
      // fit on the screen with the band at nearly its own height, so the upright phone fills the screen
      // above the words; a shorter screen keeps the phone's own drawing, on its side.
      if (pocket.upright) {
        drawAs(pocket, true);
        pin.setAttribute("data-pin", "");
        const tall = pocket.band.getBoundingClientRect().height;
        const short = headerH + frame.getBoundingClientRect().height + FRAME_SPARE - 100 * svh;
        if (short <= 0 || tall - short >= UPRIGHT_MIN * tall) {
          if (short > 0) frame.style.setProperty("--why-frame-band", `${Math.floor(tall - short)}px`);
          frames.push({ key, pin, frame, run, pocket });
          return;
        }
        pin.removeAttribute("data-pin");
        drawAs(pocket, false);
      }
      const band = pocket.band.getBoundingClientRect().height;
      pin.setAttribute("data-pin", "");
      const over = headerH + frame.getBoundingClientRect().height + FRAME_SPARE - 100 * svh;
      if (over > 0) {
        if (band - over < (FRAME_BAND_MIN[key] ?? 0.7) * band) {
          pin.removeAttribute("data-pin");
          return;
        }
        frame.style.setProperty("--why-frame-band", `${Math.floor(band - over)}px`);
      }
      frames.push({ key, pin, frame, run, pocket });
    });
  }

  /** Draws a pocket upright (morph/index.ts UPRIGHT) or as the phone draws it: its formations, its view and its band's shape. */
  function drawAs(p: LivePocket, upright: boolean) {
    const v = upright && p.upright ? p.upright : p.base;
    p.phone = v.c;
    p.svg.svg.setAttribute("viewBox", v.view.join(" "));
    p.el.style.setProperty("--vw", String(v.view[2]));
    p.el.style.setProperty("--vh", String(v.view[3]));
  }

  /**
   * A keyed pocket's ranges (morph/index.ts KEYED): one per move after the band's opening one, each ending
   * as its item's top reaches its line (a list's later items lower down the screen, so the band above them
   * is still on screen as they land): the band sits in flow right above its text (why.css data-run
   * "keyed"), so the drawing changes where the words do, by their position, and nothing pins. A pocket
   * whose frame pins (it fits on one screen with its text) steps over the frame's runway instead. With
   * `fold`, one range more: the last drawing folds into its through-line as the next band rises, done
   * the moment that band is whole on screen, over KEYED_MIN px of scroll before it, never before the
   * last move has landed and held, and never over less than KEYED_SQUEEZE. A measure-time read.
   */
  function keyedFor(p: LivePocket, vh: number, headerH: number, next: LivePocket | undefined): [number, number][] | null {
    const spec = KEYED[p.plan.key];
    if (mode !== "pocket" || !spec || !p.range || frames.some((f) => f.pocket === p)) return null;
    const frame = p.el.closest(".why-copy") ?? p.el.parentElement;
    const items = frame ? Array.from(frame.querySelectorAll<HTMLElement>(spec.items)) : [];
    const moves = p.steps.steps.length - 2;
    if (moves < 1 || items.length < moves) return null;
    const y = win.scrollY;
    const tops = items.slice(items.length - moves).map((el) => docBox(el, y).top);
    // Every move lands while the band is still mostly on screen (KEYED_SEEN of it under the header, or the
    // placement's own share: the hands', all of it).
    const latest = p.stick ? p.stick.T - headerH + (1 - (spec.seen ?? KEYED_SEEN)) * p.stick.bandH : Infinity;
    const after = p.entry ? p.entry[1] : p.range[0];
    const ranges = keyedRanges(
      tops,
      keyedLines(spec.lines, moves).map((l) => l * vh),
      after,
      latest,
    );
    if (spec.fold && next) {
      const nb = docBox(next.band, y);
      const whole = nb.top + nb.height - vh;
      const s0 = Math.max(whole - KEYED_MIN, (ranges.at(-1)?.[1] ?? after) + KEYED_HOLD);
      ranges.push([s0, Math.max(whole, s0 + KEYED_SQUEEZE)]);
      p.steps = { ...p.steps, fold: true };
    }
    return ranges;
  }

  function markOf(c: CompiledMorph) {
    const i = c.formations.findIndex((f) => f.pocket.includes(CLIMAX));
    return i >= 0 ? c.formations[i].mark : null;
  }

  function measurePivot(g: Geometry, y: number) {
    if (!pivot) return;
    const p = pivot;
    p.geom = null;
    p.spot = null;
    const sBox = docBox(p.stage, y);
    const secH = p.section.getBoundingClientRect().height;
    const vw = html.clientWidth || win.innerWidth;
    const vh = win.innerHeight;
    const base = { stageTop: sBox.top, stageH: sBox.height, secH, secOffset: 0, vw, vh, svh: g.svh };
    if (mode === "stage" && pane) {
      const m = markOf(pane.c);
      const r = pane.svg.svg.getBoundingClientRect();
      if (!m || !(r.width > 0)) return;
      // The pane is pinned under the header for the whole essay.
      const at = meet({ left: r.left, top: g.headerH, width: r.width, height: r.height }, [0, 0, 600, 800]);
      const ox = at.x0 + m.cx * at.k;
      const oy = at.y0 + m.cy * at.k;
      // The iris opens once the section has risen past the mark's center, and not before the exact
      // mark has held still for a while (PIVOT_IRIS svh after the stage's top reached the viewport's bottom).
      p.geom = { ...base, ox, oy, start: Math.max(sBox.top - oy, sBox.top - 100 * g.svh + PIVOT_IRIS * g.svh), bands: markBands(m.size * at.k) };
      p.spot = { svg: pane.svg, k: at.k, mx: m.cx, my: m.cy };
    } else if (mode === "pocket") {
      const pk = pockets.find((x) => x.plan.key === CLIMAX);
      if (!pk || !pk.range) return;
      const m = markOf(pk.phone);
      const view = viewOf(pk.svg.svg);
      // The band pins under the header; the svg (the mark's box) sits in it below the band's own air
      // (why.css: the scene is centered in the screen under the header).
      const b = pk.band.getBoundingClientRect();
      const r = pk.svg.svg.getBoundingClientRect();
      if (!m || !view || !(r.width > 0)) return;
      const align = pk.svg.svg.getAttribute("preserveAspectRatio") ?? undefined;
      const at = meet({ left: r.left, top: g.headerH + (r.top - b.top), width: r.width, height: r.height }, view, align);
      const ox = at.x0 + m.cx * at.k;
      const oy = at.y0 + m.cy * at.k;
      // The line's box where the pinned section holds it (its offset in the section: the section pins at the
      // viewport's top): the words build as soon as the navy covers it, a word a PHONE_WORD_STEP apart.
      const line = p.section.querySelector<HTMLElement>(".why-pivot-line");
      let cover: number | undefined;
      if (line) {
        const lr = line.getBoundingClientRect();
        const sr = p.section.getBoundingClientRect();
        const top = lr.top - sr.top;
        cover = Math.max(...[lr.left, lr.right].flatMap((x) => [top, top + lr.height].map((yy) => Math.hypot(x - ox, yy - oy)))) + PIVOT_COVER_PAD;
      }
      // The iris opens as soon as the exact mark is whole (the end of the band's reform), not after its hold.
      const start = pk.range[0] + (pk.range[1] - pk.range[0]) * pk.plan.reform;
      p.geom = { ...base, ox, oy, start, cover, step: PHONE_WORD_STEP, bands: markBands(m.size * at.k) };
      p.spot = { svg: pk.svg, k: at.k, mx: m.cx, my: m.cy };
    }
  }

  /**
   * A sentence's first baseline, in viewport px (measure time): half its
   * line under its top plus the face's baseline below the line's middle
   * (Atkinson Hyperlegible Next: .31em; why.css sets the lede on the
   * horizon with the same figure).
   */
  function firstLine(s: HTMLElement | null): number | null {
    if (!s) return null;
    const r = s.getBoundingClientRect();
    const cs = win.getComputedStyle(s);
    const line = parseFloat(cs.lineHeight) || r.height;
    return r.top + Math.min(line, r.height) / 2 + BASELINE_EM * (parseFloat(cs.fontSize) || 0);
  }

  /**
   * The stage's reading tie (Leader): for each formation with a sentence,
   * where that sentence's first line is and how its block pins, and the
   * grid the pane draws on. A machine whose era's line, pinned, is below its
   * floor or just above it settles onto it (shift).
   */
  function measureLeader(g: Geometry, y: number) {
    if (!leader || !pane) return;
    const L = leader;
    const r = pane.svg.svg.getBoundingClientRect();
    const at = meet({ left: r.left, top: g.headerH, width: r.width, height: r.height }, [0, 0, 600, 800]);
    L.k = at.k || 1;
    L.y0 = at.y0;
    const heroRun = article.querySelector<HTMLElement>(".why-hero-run");
    L.leads = pane.c.formations.map((f, i) => {
      const cue = LIST_CUES[f.id] ?? (f.cue ? `[data-why-at="${f.cue}"]` : null);
      const sentence = cue ? article.querySelector<HTMLElement>(cue) : null;
      const base = firstLine(sentence);
      const nl = f.states[L.iL];
      const nr = f.states[L.iR];
      if (!sentence || base === null || nl.kind !== "line" || nr.kind !== "line") return null;
      // How the sentence's block pins on the stage: the hero's text under the header for its runway and the
      // pairs' at FRAME_TOP for theirs; anything else (the machines' eras among them) is plain flow.
      let pinStart = 0;
      let pinLen = 0;
      const heroPin = sentence.closest<HTMLElement>(".why-hero-pin");
      const framePin = sentence.closest<HTMLElement>(".why-frame-pin[data-why-frame='pace']");
      const frameBox = framePin?.querySelector<HTMLElement>(":scope > .why-frame");
      const frameRun = framePin?.querySelector<HTMLElement>(":scope > .why-frame-run");
      if (heroPin && heroRun) {
        pinStart = docBox(heroPin, y).top - g.headerH;
        pinLen = docBox(heroRun, y).height;
      } else if (frameBox && frameRun) {
        pinStart = docBox(frameBox, y).top - FRAME_TOP * 100 * g.svh;
        pinLen = docBox(frameRun, y).height;
      }
      const docY = base + y;
      const ground = !!LIST_CUES[f.id] && seenLine(nl) && seenLine(nr) && Math.abs(nl.g.y1 - nr.g.y1) < 1 && Math.abs(nl.g.x2 - nr.g.x1) < 1;
      let shift = 0;
      if (ground) {
        // Where the era's line sits on the grid as its machine lands (pinned: where the block holds it); the
        // floor settles onto it if it is near.
        const landed = pane?.timing?.end[i];
        const u = (docY - (pinLen > 0 ? pinStart : Number.isFinite(landed) ? landed! : y) - L.y0) / L.k;
        const d = u - nl.g.y1;
        if (d > -SETTLE_UP) shift = Math.min(d, GRID_FLOOR - nl.g.y1);
      }
      const kind: LeadKind = ground ? "ground" : i === 0 ? "open" : "lead";
      return { kind, docY, pinStart, pinLen, shift, edge: new Map() };
    });
  }

  function remeasure() {
    // Every pinned block where the flow put it, for these reads only.
    article.setAttribute("data-why-measuring", "");
    try {
      measureAll();
    } finally {
      article.removeAttribute("data-why-measuring");
    }
  }

  function measureAll() {
    if (mode === "pocket") {
      const probe = measure(article, win);
      fitFrames(probe.headerH, probe.svh);
    }
    const g = measure(article, win);
    geom = g;
    readerIdx = Math.min(readerIdx, Math.max(0, g.blocks.length - 1));
    const y = win.scrollY;
    if (pane) {
      const f = pane.c.formations;
      const r = pane.svg.svg.getBoundingClientRect();
      const unit = Math.min(r.width / 600, r.height / 800) || 1;
      pane.timing = resolveMorphTiming(
        pane.c,
        f.map((x) => beatY(x.anchor, g)),
        f.map((x) => beatY(x.hold, g)),
        g.svh,
        g.maxScroll,
        unit,
      );
      measureLeader(g, y);
    }
    const last = Math.max(1, g.maxScroll);
    const vh = 100 * g.svh;
    let prev: LivePocket | null = null;
    for (const p of pockets) {
      const box = docBox(p.el, y);
      const bandH = p.band.getBoundingClientRect().height;
      const framed = frames.find((f) => f.pocket === p);
      let T = box.top;
      let R = box.height - bandH;
      if (framed) {
        // The frame pins from its natural top under the header for the run's height.
        T = docBox(framed.frame, y).top;
        R = docBox(framed.run, y).height;
        const y0 = Math.max(0, T - g.headerH);
        p.range = [Math.min(y0, last - 1), Math.min(Math.max(y0 + 1, y0 + R), last)];
      } else if (p.plan.key === CLIMAX) {
        // The pivot's band holds through the whole stage; it reforms over its own runway first.
        const y0 = Math.max(0, box.top - g.headerH);
        p.range = [y0, Math.min(Math.max(y0 + 1, y0 + runSvh(p.plan.run) * g.svh), last)];
      } else p.range = pocketRange(box.top, box.height, bandH, g.headerH, g.maxScroll);
      p.stick = { T, R, bandH };
      // Every band after the first opens on the drawing the band before ended on and reforms it as it
      // rises. If the band before is still on screen when this one comes into view, or stood upright
      // (UPRIGHT: its drawing is the stage's, and the phone's own lies on its side), it rises as its own
      // first drawing instead, whole and still (the CCTV, the ceiling, the hallway, the cane and the dog),
      // so one drawing never forms twice and the band never rises as a bare line over empty ground. Only
      // were that drawing the one the band before ended on would it rise as the through-line alone and
      // grow it out of that. The summit's is excepted: it rises as the glasses whole, the hands' band
      // leaving with the same glasses above it (OPEN_WHOLE).
      p.entry = null;
      p.steps = p.plan;
      if (prev?.stick && p.plan.steps.length > 1) {
        p.entry = pocketEntry(T, vh, g.headerH, ENTRY_FROM_AT[p.plan.key], ENTRY_TO_AT[p.plan.key]);
        const ps = prev.stick;
        const top = bandTopAt(ps.T, ps.R, g.headerH, T - vh + COVISIBLE);
        const covisible = top + ps.bandH > g.headerH + COVISIBLE && top < vh - COVISIBLE;
        const turned = prev.phone !== p.phone;
        if (!p.plan.own && !OPEN_WHOLE.includes(p.plan.key) && (turned || covisible)) {
          const own = [p.plan.steps[1], ...p.plan.steps.slice(1)];
          const ended = prev.phone.formations[prev.steps.steps[prev.steps.steps.length - 1]]?.id;
          if (p.phone.formations[own[0]]?.id !== ended) p.steps = { ...p.plan, steps: own };
          else p.steps = turned ? { ...p.plan, steps: own, open: "line" } : { ...p.plan, open: "line" };
        }
      }
      // A band that rises and never pins (formation.ts "rise": the ceiling's, the summit's) is done before the
      // text after it reaches the reading line, so that text is never read beside a drawing still changing.
      if (p.entry && p.plan.run === "rise") {
        const next = p.el.nextElementSibling;
        if (next) p.entry = [p.entry[0], Math.max(p.entry[0] + 1, Math.min(p.entry[1], docBox(next, y).top - LINE * vh))];
      }
      // A keyed band never pins under the header: it rises straight into its list, so its opening move plays
      // while it comes up from the bottom of the screen to its middle, done before its first item is read
      // (from the bottom edge itself when it rises as the through-line alone).
      // A placement's own span (morph/index.ts ENTRY_FROM_AT, ENTRY_TO_AT: the hands') is kept.
      const ownSpan = p.plan.key in ENTRY_FROM_AT || p.plan.key in ENTRY_TO_AT;
      if (p.entry && KEYED[p.plan.key] && !framed && !ownSpan) {
        const [a, b] = p.steps.open === "line" ? KEYED_ENTRY_LINE : KEYED_ENTRY;
        p.entry = [Math.max(0, T - a * vh), Math.max(1, T - b * vh)];
      }
      p.keys = keyedFor(p, vh, g.headerH, pockets[pockets.indexOf(p) + 1]);
      // Rising as the drawing the band before folds away: it grows it over the same range (the summit's).
      p.handoff = OPEN_WHOLE.includes(p.plan.key) && prev?.steps.fold && prev.keys?.length ? prev.keys[prev.keys.length - 1] : null;
      prev = p;
    }
    measurePivot(g, y);
  }

  function clearStyles() {
    if (pane) {
      restoreSvg(pane.svg);
      pane.pane.removeAttribute("data-ready");
      pane.pane.classList.remove("is-live");
    }
    for (const p of pockets) {
      restoreSvg(p.svg);
      p.el.removeAttribute("data-ready");
      p.el.style.setProperty("--vw", p.vars0[0]);
      p.el.style.setProperty("--vh", p.vars0[1]);
    }
    if (pivot) {
      pivot.iris?.style.removeProperty("clip-path");
      for (const w of pivot.words) {
        w.style.removeProperty("transform");
        w.style.removeProperty("opacity");
      }
    }
    if (leader?.layer) {
      leader.layer.el.removeAttribute("transform");
      leader.layer.a = "";
    }
    article.querySelectorAll<HTMLElement>(".why-frame-pin[data-pin]").forEach((pin) => pin.removeAttribute("data-pin"));
    article.querySelectorAll<HTMLElement>(".why-frame").forEach((f) => f.style.removeProperty("--why-frame-band"));
  }

  /* ---------------- the frame ---------------- */

  function writePivot(y: number) {
    const p = pivot;
    if (!p) return;
    const g = p.geom;
    if (!g) return;
    const clip = irisClip(g, y);
    if (p.iris && clip !== p.irisLast) p.iris.style.clipPath = p.irisLast = clip;
    for (let i = 0; i < p.words.length; i++) {
      const s = wordStyle(wordAt(g, i, y, easings.settle));
      const key = s.transform + s.opacity;
      if (key === p.wordLast[i]) continue;
      p.wordLast[i] = key;
      p.words[i].style.transform = s.transform;
      p.words[i].style.opacity = s.opacity;
    }
    if (p.spot) writeNavy(p.spot.svg, navyPath(g, y, p.spot.k, p.spot.mx, p.spot.my));
  }

  /** Where a level line at height uy (grid units) meets formation i's drawing from one side, cached. */
  function edgeOf(lead: Lead, i: number, uy: number, side: "left" | "right"): number | null {
    const L = leader!;
    const key = (side === "left" ? 1 : -1) * (Math.round(uy * 2) + 100000);
    if (lead.edge.has(key)) return lead.edge.get(key)!;
    const v = edgeAt(pane!.c.formations[i].states, Math.round(uy * 2) / 2, side, L.skip);
    lead.edge.set(key, v);
    return v;
  }

  /**
   * Formation i's reading tie at scroll y: how far the horizon's two halves
   * move from where the formation draws them ([x1, y1, x2, y2] each, grid
   * units) and the layer's settle. Null: the formation has no sentence.
   */
  function leadAt(i: number, y: number): { dL: number[]; dR: number[]; shift: number } | null {
    const L = leader;
    const lead = L?.leads[i];
    if (!L || !lead || !pane) return null;
    const f = pane.c.formations[i];
    const nl = f.states[L.iL];
    const nr = f.states[L.iR];
    if (nl.kind !== "line" || nr.kind !== "line") return null;
    const a = [nl.g.x1, nl.g.y1, nl.g.x2, nl.g.y2];
    const b = [nr.g.x1, nr.g.y1, nr.g.x2, nr.g.y2];
    const tL = a.slice();
    const tR = b.slice();
    // The sentence's line on the grid, riding with its block (pinned or not), in the layer's own units.
    const sy = lead.docY - y + Math.min(Math.max(y - lead.pinStart, 0), lead.pinLen);
    const uy = (sy - L.y0) / L.k - lead.shift;
    const farSeen = seenLine(nr) && Math.abs(b[2] - b[0]) > 1;
    if (lead.kind === "open") {
      // The lede sits on the horizon: both halves keep its height and reach the outline.
      tL[2] = edgeOf(lead, i, a[1], "left") ?? a[2];
      if (farSeen) tR[0] = edgeOf(lead, i, b[1], "right") ?? b[0];
    } else if (lead.kind === "lead") {
      const [top, bottom] = spanOf(f.states, L.skip);
      const v = Math.min(Math.max(uy, top + 2), bottom - 2);
      const e = edgeOf(lead, i, v, "left");
      if (e !== null) {
        tL[0] = Math.abs(a[2] - a[0]) > 1 ? a[0] : LEAD_FROM;
        tL[1] = tL[3] = v;
        tL[2] = e;
      }
      // The far half folds into the outline where it is, so the horizon is only ever at one height.
      if (farSeen && Math.abs(b[1] - a[1]) < 1) {
        const x = edgeOf(lead, i, b[1], "right") ?? b[0];
        tR[0] = tR[2] = x;
      }
    } else {
      // A machine's floor: its far half takes the whole floor; the near half lifts off it as the era's line rises past.
      const gy = a[1];
      tR[0] = Math.min(a[0], b[0]);
      tR[2] = Math.max(a[2], b[2]);
      const [top] = spanOf(f.states, L.skip);
      const v = Math.max(uy, top + 2);
      if (v < gy - 0.5) {
        const e = edgeOf(lead, i, v, "left");
        if (e !== null) {
          tL[1] = tL[3] = v;
          tL[2] = e;
        }
      }
    }
    return { dL: tL.map((v, j) => v - a[j]), dR: tR.map((v, j) => v - b[j]), shift: lead.shift };
  }

  /**
   * The pane's frame with its reading tie: the horizon's halves moved by the
   * formation's tie (between two formations, eased from one to the next, on
   * top of the move's own path) and the layer's settle. A copy: the
   * formations' own frames are shared.
   */
  function withLeader(fr: MorphFrame, where: { k: number; next: number; t: number }, y: number): MorphFrame {
    const L = leader;
    if (!L) return fr;
    const A = leadAt(where.k, y);
    const B = where.t > 0 ? leadAt(where.next, y) : null;
    // The tie hands over early in the move (its first LEAD_HANDOFF): the stub is at the next sentence's
    // line, or folded away, before the drawing under it has changed much.
    const e = where.t > 0 ? easings.standard(Math.min(1, where.t / LEAD_HANDOFF)) : 0;
    const mix = (p: number[] | undefined, q: number[] | undefined, j: number) => (p?.[j] ?? 0) * (1 - e) + (q?.[j] ?? 0) * e;
    const shift = (A?.shift ?? 0) * (1 - e) + (B?.shift ?? 0) * e;
    if (L.layer) {
      const v = Math.abs(shift) < 0.05 ? "" : `translate(0 ${Math.round(shift * 10) / 10})`;
      if (v !== L.layer.a) {
        L.layer.a = v;
        if (v) L.layer.el.setAttribute("transform", v);
        else L.layer.el.removeAttribute("transform");
      }
    }
    if (!A && !B) return fr;
    const pieces = fr.pieces.slice();
    // Mid-move, the live drawing: the stub ends where it meets it, never across an outline.
    const live = where.t > 0 && where.t < 1 && pane ? sampleMorph(pane.c, pane.timing!, y, easings).pieces : null;
    for (const [i, which] of [
      [L.iL, "dL"],
      [L.iR, "dR"],
    ] as const) {
      const n = lineNums(pieces[i].d);
      if (!n) continue;
      const d = [0, 1, 2, 3].map((j) => n[j] + mix(A?.[which], B?.[which], j));
      if (live && Math.abs(d[1] - d[3]) < 0.5 && d[2] > d[0]) {
        const edge = crossingAt(live, d[1], i === L.iL ? "left" : "right", L.skip);
        if (edge !== null && edge > d[0] && edge < d[2]) {
          if (i === L.iL) d[2] = edge;
          else d[0] = edge;
        }
      }
      pieces[i] = { ...pieces[i], d: linePath({ x1: d[0], y1: d[1], x2: d[2], y2: d[3] }) };
    }
    return { ...fr, pieces };
  }

  /**
   * Where the reader is: the essay block at the reading line (engine.ts
   * LINE of the viewport down), live: the innermost block whose box holds
   * the line, else the one whose top is nearest it. Blocks keep document
   * order on screen (a pinned block holds while the blocks after it wait
   * under its runway), so it is a short search from the last frame's block
   * (a few box reads), or a binary search after a jump. Its offset from the
   * viewport's top is what a mode change keeps.
   */
  function trackReader() {
    const g = geom;
    if (!g || !g.blocks.length) return;
    const bs = g.blocks;
    const pivotLine = bs.findIndex((el) => el.matches(".why-pivot-line"));
    const line = LINE * win.innerHeight;
    const rects = new Map<number, DOMRect>();
    const rect = (i: number) => {
      let v = rects.get(i);
      if (!v) rects.set(i, (v = bs[i].getBoundingClientRect()));
      return v;
    };
    // The last block whose top is at or above the line (or -1).
    const above = (i: number) => rect(i).top <= line;
    let i = Math.min(Math.max(readerIdx, 0), bs.length - 1);
    const settled = (k: number) => (k < 0 || above(k)) && (k + 1 >= bs.length || !above(k + 1));
    if (!settled(i)) {
      if (settled(i + 1 < bs.length ? i + 1 : i)) i = Math.min(i + 1, bs.length - 1);
      else if (i > 0 && settled(i - 1)) i -= 1;
      else {
        let lo = 0;
        let hi = bs.length - 1;
        i = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (above(mid)) {
            i = mid;
            lo = mid + 1;
          } else hi = mid - 1;
        }
      }
    }
    // The innermost block holding the line is the last at or above it, if its box reaches the line; nested
    // blocks (a pair's terms in its item) come after their container, so walk back to one that holds it.
    let pick = -1;
    for (let k = i; k >= 0 && k >= i - 3; k--) {
      const r = rect(k);
      if (r.top <= line && r.bottom > line) {
        pick = k;
        break;
      }
    }
    if (pick < 0) {
      const a = i >= 0 ? i : 0;
      const b = Math.min(a + 1, bs.length - 1);
      pick = i < 0 || Math.abs(rect(b).top - line) < Math.abs(rect(a).top - line) ? b : a;
      // Nothing holds the line while the pivot pins (its navy is all there is around the line): the
      // pivot's line is what the reader is on whenever it is whole on screen.
      const pv = pivotLine >= 0 ? pivotLine : -1;
      if (pv >= 0 && pv !== pick) {
        const r = bs[pv].getBoundingClientRect();
        if (r.height > 0 && r.top >= g.headerH && r.bottom <= win.innerHeight) pick = pv;
      }
    }
    readerIdx = Math.max(0, i);
    reader = { el: bs[pick], offset: rect(pick).top };
  }

  function frame() {
    rafId = 0;
    pending = false;
    const y = win.scrollY;
    lastY = y;
    if (mode === "static" || !geom) return;
    // The frame's reads: scrollY, and where the reader is, before anything is written (the layout is the last paint's).
    trackReader();
    // Writes only from here on.
    if (pane && !(pinched && pane.ready)) {
      if (pane.ready && pane.shown !== pane.live) {
        pane.pane.classList.toggle("is-live", pane.live);
        pane.shown = pane.live;
      }
      if (pane.timing && (pane.live || forceAll)) {
        writeSvg(pane.svg, withLeader(sampleFrames(pane.c, pane.timing, y, easings), locate(pane.timing, y), y));
        if (!pane.ready) {
          pane.ready = true;
          pane.pane.setAttribute("data-ready", "");
          pane.pane.classList.toggle("is-live", pane.live);
          pane.shown = pane.live;
        }
      }
    }
    for (const p of pockets) {
      if (!p.range || (!p.live && !forceAll)) continue;
      // Pinch-zoomed: hold whatever the pocket shows (once it has shown something).
      if (pinched && p.ready) continue;
      writeSvg(
        p.svg,
        p.handoff && y < p.handoff[1]
          ? foldFrame(p.phone, p.steps.steps[0], 1 - (y - p.handoff[0]) / (p.handoff[1] - p.handoff[0]), easings)
          : p.keys
            ? keyedFrameAt(p.phone, p.steps, p.entry, p.keys, y, easings)
            : pocketFrameAt(p.phone, p.steps, p.entry, p.range, y, easings),
      );
      if (!p.ready) {
        p.ready = true;
        p.el.setAttribute("data-ready", "");
      }
    }
    if (!pinched) writePivot(y);
    forceAll = false;
  }

  function schedule() {
    if (pending || disposed) return;
    pending = true;
    rafId = win.requestAnimationFrame(frame);
  }

  function onScroll() {
    if (mode !== "static") schedule();
  }

  /* ---------------- modes ---------------- */

  function observe(targets: { root: Element; set: (live: boolean) => void }[]) {
    if (!("IntersectionObserver" in win)) return;
    const byEl = new Map(targets.map((t) => [t.root, t.set]));
    io = new win.IntersectionObserver(
      (entries) => {
        for (const e of entries) byEl.get(e.target)?.(e.isIntersecting);
        schedule();
      },
      { rootMargin: "50% 0px" },
    );
    for (const t of targets) io.observe(t.root);
  }

  /** Measure, then write everything once, now, before paint, whatever the observer reports later. */
  function firstFrame() {
    remeasure();
    forceAll = true;
    frame();
  }

  function enterMotion(next: "stage" | "pocket") {
    easings = readEasings((token) => win.getComputedStyle(html).getPropertyValue(token));
    pivot = collectPivot();
    if (next === "stage") {
      pane = collectPane();
      leader = collectLeader();
      // The pane is sticky for the whole essay: the observer only tells when the reel leaves.
      const reel = pane?.pane.parentElement;
      if (pane && reel) observe([{ root: reel, set: (live) => void (pane!.live = live) }]);
    } else {
      pockets = collectPockets();
      observe(pockets.map((p) => ({ root: p.el, set: (live: boolean) => void (p.live = live) })));
    }
    firstFrame();
  }

  function leaveMotion() {
    io?.disconnect();
    io = null;
    if (rafId) win.cancelAnimationFrame(rafId);
    rafId = 0;
    pending = false;
    clearStyles();
    pane = null;
    pockets = [];
    pivot = null;
    leader = null;
    frames = [];
    reader = null;
  }

  function setMode(next: WhyMode, restore: boolean) {
    if (next === mode || disposed) return;
    // Out of stage or pocket the CSS may already have released the layout
    // (and its pins) before this runs, so the reader's place is the one the
    // last frame saw, live: inside a pinned block, the block on screen, not
    // whatever its runway put under scrollY. Without one, the cached
    // geometry. Out of static the layout cannot have changed yet (it waits
    // for the attribute), so measure it as it is.
    let anchor: RestoreAnchor | null = null;
    if (restore) {
      if (mode !== "static" && reader && geom) {
        const index = geom.blocks.indexOf(reader.el);
        if (index >= 0) anchor = { index, offset: reader.offset };
      }
      if (!anchor) {
        const g = geom ?? measure(article, win);
        const y = geom ? lastY : win.scrollY;
        anchor = pickRestoreAnchor(g.blockTops, y, g.headerH, y + LINE * win.innerHeight, g.blockHeights);
      }
    }
    // Pausing: remember where the motion layout had the reader, so resuming without having scrolled puts the
    // page back exactly there (a pinned block holds still over a whole runway: the scroll, not the block's
    // place, says how far its art had played).
    if (mode !== "static" && next === "static" && anchor && geom) {
      const el = geom.blocks[anchor.index];
      resumeAt = el ? { el, offset: anchor.offset, y: lastY } : null;
    }
    if (mode !== "static") leaveMotion();
    mode = next;
    applyMode(html, next);
    if (next === "stage" || next === "pocket") enterMotion(next);
    else geom = null;
    // Resuming where the pause left the page, without a scroll in between: the motion layout had the reader
    // exactly at resumeAt.y, so go straight back there (a pinned block's place in the flow says nothing about
    // where it was on screen, so nothing is re-derived from the static layout).
    const back0 = resumeAt;
    if (next !== "static" && back0 && pausedLandY !== null && Math.abs(win.scrollY - pausedLandY) < 2) {
      const g2 = geom ?? measure(article, win);
      try {
        win.scrollTo({ top: Math.min(g2.maxScroll, back0.y), behavior: "instant" as ScrollBehavior });
      } catch {
        /* tests */
      }
      resumeAt = null;
      pausedLandY = null;
      anchor = null;
      lastY = win.scrollY;
      forceAll = true;
      frame();
    }
    pausedLandY = null;
    if (anchor) {
      const g2 = geom ?? measure(article, win);
      const top = restoreTarget(anchor, g2);
      if (top !== null && Math.abs(top - win.scrollY) >= 1) {
        try {
          // "instant": html has scroll-behavior: smooth.
          win.scrollTo({ top, behavior: "instant" as ScrollBehavior });
        } catch {
          /* no scrolling here (tests); the layout is still right */
        }
      }
      // A block that pins in the new layout (the hero's sentences, the pairs, the pivot's line) is not where
      // the flow put it: read it live and step the scroll until it is back at its offset (a pinned block
      // holds still under the scroll, so the steps carry it out past its runway's end, where it moves again).
      const el = g2.blocks[anchor.index];
      if (el && next !== "static") {
        const back = resumeAt;
        if (back && back.el === el && Math.abs(back.offset - anchor.offset) <= 2) {
          try {
            win.scrollTo({ top: Math.min(g2.maxScroll, back.y), behavior: "instant" as ScrollBehavior });
          } catch {
            /* tests */
          }
        }
        settleOn(el, anchor.offset, g2.maxScroll);
        resumeAt = null;
      }
      lastY = win.scrollY;
      if (mode !== "static") {
        forceAll = true;
        frame();
      } else if (resumeAt) pausedLandY = win.scrollY;
    }
  }

  /** Scrolls until `el`'s live top is at `offset` (px from the viewport's top), a few layout reads at most. */
  function settleOn(el: Element, offset: number, maxScroll: number) {
    for (let i = 0; i < SETTLE_STEPS; i++) {
      const d = el.getBoundingClientRect().top - offset;
      if (Math.abs(d) < 1) return;
      const to = Math.min(maxScroll, Math.max(0, win.scrollY + d));
      if (Math.abs(to - win.scrollY) < 0.5) return;
      try {
        win.scrollTo({ top: to, behavior: "instant" as ScrollBehavior });
      } catch {
        return;
      }
    }
  }

  const sync = () => setMode(computeMode(readEnv(win)), true);

  function onResize() {
    if (disposed) return;
    const next = computeMode(readEnv(win));
    if (next !== mode) return setMode(next, true);
    if (mode !== "static") {
      remeasure();
      forceAll = true;
      schedule();
    }
  }

  /** Pinch zoom: freeze the art (the pane, the pockets, the pivot) while magnified; pick up where the scroll is once it ends. */
  const vv = win.visualViewport ?? null;
  function onViewport() {
    const now = (vv?.scale ?? 1) > PINCHED;
    if (now === pinched) return;
    pinched = now;
    if (!now && mode !== "static") {
      forceAll = true;
      schedule();
    }
  }

  /* ---------------- start ---------------- */

  const initial = computeMode(readEnv(win));
  if (initial === "static") applyMode(html, "static");
  else setMode(initial, false);

  win.addEventListener("scroll", onScroll, { passive: true });
  vv?.addEventListener("resize", onViewport, { passive: true });
  const mqls = Object.values(GATE_QUERIES).flatMap((q) => {
    try {
      const m = win.matchMedia(q);
      m.addEventListener?.("change", sync);
      return [m];
    } catch {
      return [];
    }
  });
  const mo = "MutationObserver" in win ? new win.MutationObserver(sync) : null;
  mo?.observe(html, { attributes: true, attributeFilter: ["data-motion"] });
  // Text zoom changes the article's size without a window resize. The
  // article's size, not the window's: iOS's toolbar changing the window's
  // height moves nothing on a page laid out in svh, so it never re-measures.
  const ro = "ResizeObserver" in win ? new win.ResizeObserver(onResize) : null;
  if (ro) ro.observe(article);
  else win.addEventListener("resize", onResize);
  doc.fonts?.ready.then(() => {
    if (!disposed && mode !== "static") onResize();
  });

  return () => {
    disposed = true;
    leaveMotion();
    html.removeAttribute(MODE_ATTR);
    win.removeEventListener("scroll", onScroll);
    win.removeEventListener("resize", onResize);
    vv?.removeEventListener("resize", onViewport);
    for (const m of mqls) m.removeEventListener?.("change", sync);
    mo?.disconnect();
    ro?.disconnect();
    removeProbe(doc);
  };
}

export function WhyDirector() {
  useLayoutEffect(() => {
    const article = document.querySelector<HTMLElement>("article.why");
    if (!article) return;
    return startDirector(article);
  }, []);
  return null;
}

/** The words' resting state on the stage before the director's first write (tests). */
export const PIVOT_WORD_REST = WORD_REST;
