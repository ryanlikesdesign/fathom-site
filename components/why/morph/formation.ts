/* ================================================================
   The /why formation engine: formations, moves and timing.

   A reel's art is one pool of pieces (pieces.ts) and a list of
   formations: where every piece is, and how it looks, while one stretch
   of the essay is read. Between two formations the pieces move from one
   to the next, scrubbed by scroll in the gap between sections. Everything
   here is a pure function of the scroll position, so scrolling back
   plays a move backwards and lands on the earlier formation exactly.

   Data (a formation file registers one MorphSource per reel):

     pool        every piece, in drawing order (later pieces draw on top).
                 A piece's kind is fixed for life: a rect stays a rect, a
                 line a line, an arc an arc. Design within that: a rect can
                 be a square, a pill, a circle or a point; a line can be any
                 length, heading or a point; an arc any radius, span (to a
                 full ring) or a point. look sets the piece's default look.
                 clip: true draws the piece inside the reel's clip window
                 (below), for life: a feed inside a screen, subjects inside
                 a viewfinder. Clipped pieces draw together, in pool order,
                 where the first of them sits in the pool.
     formations  in essay order. The first is the reel's opening frame and
                 must place every piece. A later one may leave a piece out:
                 it stays exactly where the formation before left it. The
                 same goes for mark and window.
     phoneView   the part of the 600 x 800 grid the phone variant is placed
                 for (default [0, 175, 600, 450], a 4:3 window): a phone
                 variant's shift and scale are about its center. Each
                 pocket then shows its own view of the placed drawings,
                 fitted to the ones it plays (morph/index.ts POCKET_VIEWS).

   Per formation, besides its pieces:

     mark     the exact fathom mark (brand.ts), never approximated:
              { cx, cy, size, o, role: "ink" | "onAccent" }, size stage
              units across. Drawn on top of every piece, one uniform scale.
              In a move its center and size follow the move's ease (an
              unseen end takes the seen end's place: it fades where it
              stands, whole). Its
              opacity, like every piece's (pieces.ts fadeAt), rises over the
              move's first half and falls over its second, so the brand path
              is whole before the pieces under it start to go, either way.
              Default: unseen.
     window   { x, y, w, h, r }: the clip window for clip pieces, moving
              like a rect between formations (no curve, no stagger).
              Default: the whole grid.
     phone    the formation on a phone (the pockets, below):
                shift [dx, dy] and scale: the whole drawing, scaled about
                  the phone view's center, then moved. One scale: never a
                  distortion. Pieces, mark and window alike.
                pieces / mark / window: overrides in phone-view
                  coordinates, taken as they are (not shifted or scaled):
                  for a tall drawing recomposed for the landscape view.
                  Kinds are the pool's, as everywhere.
                run: the pocket's runway when this formation ends one:
                  "item" (24svh, between list items), "section" (12svh,
                  between sections, the default), "climax" (40svh),
                  "rise" (none: a band whose one move plays while it
                  rises into view, so it never pins over empty ground),
                  or a number of svh (a pocket that plays several).
              It never swaps in other pieces: the phone draws the same
              pool, placed for its view.

   Timing, per formation (anchors are engine.ts Anchors: a [data-why-at]
   element's edge reaching a line of the viewport, plus offset svh):

     anchor   the formation is complete when this lands. The move into it
              ends here. (Optional on the first formation, which is there
              from the top of the page.)
     hold     the formation holds perfectly still at least until this lands;
              the move to the next one starts here. Default: when it landed
              (the first formation: its anchor, else the top of the page),
              so without a hold the next move starts as soon as it arrives.
              Set hold to the section's last sentence and the next anchor to
              the next section's first, and the move runs in the gap between.
     lead     optional: the move into this formation takes at most this many
              svh, ending at its anchor. Default: the whole gap.

   How the move into a formation runs:

     ease     standard (default) | settle | linear | crossfade: the site's
              motion tokens, read from :root (engine.ts readEasings).
     stagger  0..0.9 (default 0.35): the share of the move over which the
              pieces' start times spread. Each piece moves for (1 - stagger)
              of the window, so every piece starts at or after the window's
              start and lands at or before its end.
     order    "travel" (default): the pieces at the front of the flock's
              travel go first; with no shared direction (pieces converging
              or scattering), the longest trips go first. "pool": pool order.
              Or a list of piece ids: those first, in that order, then the
              rest by travel.
     bend     curved travel (default 0.18): each piece's center rides a
              quadratic bezier whose control point sits bend x distance to
              the right of its line of travel. One sign for every piece, so
              the flock swirls one way. 0 travels straight. (ease linear,
              stagger 0, bend 0: the pieces move exactly with the reader's
              scroll, the feed's joke.)
     slot     a travelling piece's own [start, end] share of the move, in
              place of its stagger slot (the ground that rises only once
              the drawing above it has gone).
     via      the move in two strokes (ViaSpec): pieces retract into a sink
              and grow out of it instead of flying across the frame. Its
              zones hand parts of the drawing over their own way (hatching
              folding into its ceiling line, brackets into their corners);
              follow + whip make it one zoom through a travelling lens: the
              drawing is drawn whole into the orb while the orb moves, and
              the next opens whole out of it.

   Stills (the static page) and pockets (phones):

     still    the placement key(s) this formation draws for on the static
              page: "hero", "arrives", "ceiling", "pace", "people", "hands",
              "summit" (morph/index.ts PLACEMENTS, in page order).
     crop     [x, y, w, h] in stage units: the static still's frame
              (default the whole 600 x 800).

   On a phone the same placement is a pocket (MorphStage.tsx): a band that
   opens on the drawing the band before it ended on and reforms it while it
   rises into view, then pins under the header while the reader's scroll
   plays the rest of the formations after the pocket before it, up to this
   one, holds it and scrolls away with the page. See pocketPlans(),
   pocketEntry() and pocketAt().

   Hidden pieces. A piece a drawing does not need is parked: it lies in a
   stroke of its own color, unseen, and travels unseen between parkings. A
   piece on its way into its host stays whole until the last of its trip
   (pieces.ts PieceMove.fade), so nothing fades out in mid-air. A move with
   `via` hands over in two strokes (retract, then grow) instead of flying
   pieces across the frame.

   The pivot. The pieces gather into the orb, re-space onto the mark's
   bands, and fade as one layer (layer) under the exact brand mark (mark);
   the pivot's navy iris opens out of the mark's center (../pivot.ts), and
   after it the pieces come back under the mark and stream back out.
   ================================================================ */

import type { Anchor, Easings } from "../engine";
import {
  asNow, centerOf, DEFAULT_LOOK, fadeAt, pieceAt, placeState, planMove, resolveSpec, sameState, VIEW_H, VIEW_W, type Look, type PieceKind, type PieceMove,
  type PieceNow, type PieceSpec, type PieceState, type RectGeom,
} from "./pieces";
import { frameOf, markFrame, num, rectPath, type MarkNow, type MarkRole, type MorphFrame } from "./render";

export type MorphReelId = "r1" | "r2";
export type MoveEase = "standard" | "settle" | "linear" | "crossfade";
export type Crop = readonly [x: number, y: number, w: number, h: number];
/** A pocket's runway: a named one, or a number of svh (a pocket that plays several formations). */
export type PocketRun = "item" | "section" | "climax" | "rise" | number;

export type PoolPiece = { id: string; kind: PieceKind; look?: Partial<Look>; clip?: boolean };

/** The exact brand mark: centered on (cx, cy), size stage units across (its 120-unit master's box). */
export type MarkSpec = { cx: number; cy: number; size: number; o?: number; role?: MarkRole };
/** The clip window: a rounded rect in stage units. */
export type WindowSpec = { x: number; y: number; w: number; h: number; r?: number };

export type PhoneVariant = {
  shift?: readonly [dx: number, dy: number];
  scale?: number;
  pieces?: Readonly<Record<string, PieceSpec>>;
  mark?: MarkSpec;
  window?: WindowSpec;
  run?: PocketRun;
};

export type Formation = {
  id: string;
  anchor?: Anchor;
  hold?: Anchor;
  lead?: number;
  /** The move takes exactly this many stage units of scroll on the pane (a 1:1 scroll), ending at its anchor. */
  leadUnits?: number;
  /** The sentence (data-why-at) this formation shows, for the stage's leader (the horizon's near stub). */
  cue?: string;
  /** Every piece as one layer: its opacity, 0..1 (default: the formation before's, at first 1). Crossfades to the mark. */
  layer?: number;
  ease?: MoveEase;
  stagger?: number;
  order?: "travel" | "pool" | readonly string[];
  bend?: number;
  still?: string | readonly string[];
  /** The placement(s) whose phone pocket ends on this formation (default: its stills no other formation ends). */
  pocket?: string | readonly string[];
  /**
   * Every piece gathered into the orb (the hero's F04, its return before the
   * pivot). A phone's band never opens on one (it opens on the drawing the band before ended on),
   * so a band never enters showing what the band before it still shows.
   */
  gather?: boolean;
  /** Not played in a phone's pocket (a crossfade only the desktop's pane needs). */
  pocketSkip?: boolean;
  /**
   * A phone's band rises as this formation: the pocket it falls in opens here (its steps start here),
   * whatever the band before ended on, and never as the through-line alone. The people's band rises as
   * the listening orb the mark has relaxed into, while the pivot's band, the mark in it, leaves above.
   */
  opens?: boolean;
  /**
   * The move into this formation in two strokes: every piece that would
   * travel further than `cap` grid units, or that comes out of hiding or
   * goes into it (named identities seen at both ends excepted: they carry
   * the story and always travel), retracts along its own length to
   * its end nearest `sink` over the move's first `out` share, and grows out
   * of its new place's end nearest `sink` from `in` on. Nothing crosses
   * the frame; the drawings hand over where they touch.
   */
  via?: ViaSpec;
  /**
   * A travelling piece's own share of the move, [start, end], in place of its
   * stagger slot: the ground that rises only once the drawing above it has
   * gone, the orb that travels while one drawing is drawn into it.
   */
  slot?: Readonly<Record<string, readonly [number, number]>>;
  /**
   * The share of the move [start, end] the travelling pieces take (their stagger runs inside it), when it
   * is not the whole move: a drawing whose small parts fold away first (via zones with their own windows)
   * and whose outline then travels into the next.
   */
  travel?: readonly [number, number];
  /**
   * A level line split by the drawing while it moves (the floor rising past the phone into the ceiling):
   * while the line `left` (running in from the left) and the line `right` (running off to the right) are
   * level and the drawing crosses their height, the left one ends where it first meets the drawing and
   * the right one starts where it last leaves it, so the line passes on either side of the outline and
   * joins again where nothing is in its way. Pool ids.
   */
  part?: { left: string; right: string };
  /**
   * Traced contours (a figure drawn as one pen line): per piece, its share
   * of its contour, [start, length, end] (fractions of the contour's length;
   * end: the piece's end the pen starts at, 0 its first point, 1 its last).
   * `in` for a contour this formation draws, `out` for one the formation
   * before drew that leaves. A two-stroke piece (via) with a share grows
   * out of its pen end over its share of the move's second stroke, and
   * retracts back into it over its share of the first, in reverse: each
   * outline draws as one continuous line from its first point, never in
   * dashes. Contours run side by side.
   */
  trace?: Readonly<Record<string, TraceSpec>>;
  crop?: Crop;
  mark?: MarkSpec;
  window?: WindowSpec;
  phone?: PhoneVariant;
  pieces: Readonly<Record<string, PieceSpec>>;
};

/**
 * cap: travel (grid units) above which a piece hands over in two strokes; sink: where they gather;
 * phoneSink: the same for a phone's own recomposed drawing (phone-view units), which has no single
 * placement of the desktop's; out / in: the shares of the move the retract ends and the grow starts
 * (in may come before out: the two strokes overlap, so the frame never empties); keep: the pieces
 * that travel whatever their trip, the identities that carry one drawing into the next; all: every
 * other moving piece hands over in two strokes, however short its trip or whatever its name; focus:
 * each of those strokes is drawn into the sink's one point, and the next grows out of it (a rack
 * focus: with no stagger the whole drawing shrinks into the point and the next grows out whole).
 */
export type ViaSpec = {
  cap?: number;
  sink?: Sink;
  phoneSink?: Sink;
  /**
   * Where the second stroke grows out of, when it is not where the first went (sinkIn; phoneSinkIn for a
   * recomposed phone end): the drawing drawn into the orb where it stands, the next grown out of the orb
   * where it has travelled to.
   */
  sinkIn?: Sink;
  phoneSinkIn?: Sink;
  out?: number;
  in?: number;
  keep?: readonly string[];
  /** The identities that travel on a recomposed phone end, in place of keep (a phone turned to landscape keeps its body, not its buttons). */
  phoneKeep?: readonly string[];
  all?: boolean;
  /** The cap holds for named pieces too: only the ones the move keeps travel further than it. */
  capAll?: boolean;
  focus?: boolean;
  /**
   * A focus stroke longer than this (grid units) is not drawn into the point: it retracts along its own
   * length toward it instead (and grows the same way), so no long stroke slides across the frame.
   */
  focusMax?: number;
  /**
   * A kept piece the strokes are drawn into and grow out of wherever it is as it travels (the orb): its
   * center at the move's start is the first stroke's sink, at its end the second's, and each stroke
   * follows it between, so a drawing gathers into the lens while the lens moves and the next opens out of it.
   */
  follow?: string;
  /**
   * One continuous zoom through the sink: the first stroke eases in (it gathers speed into the point)
   * and the second eases out of it, so the hand-over never stops dead in the middle.
   */
  whip?: boolean;
  /** Parts of the move that hand over their own way (ViaZone); zones for a recomposed phone end: phoneZones, in its units. */
  zones?: readonly ViaZone[];
  phoneZones?: readonly ViaZone[];
  /**
   * A focus stroke is drawn toward its sink only down to this share of its own size (a uniform scale of
   * its drawing about the sink, never to a point), and the next grows out of the same share: the drawing
   * contracts toward the place its counterpart opens from, and the two overlap there (out after in).
   */
  floor?: number;
  /** Every piece that comes out of hiding grows, even where it stays in place (a band rising as the line). */
  grow?: boolean;
  /**
   * The viewfinder re-targets as a pan: every clipped stroke the move leaves slides out of the window's
   * left edge and every clipped stroke it brings slides in from its right edge, all of them riding with
   * the window as it moves, over the whole move at once, so the frame is always full: half of one subject
   * and half of the next at the midpoint, never a collapse to a point. Nothing scales. Needs the two
   * subjects drawn by different pieces (r1.mjs retargetScene: alternating sets).
   */
  pan?: boolean;
};
export type Sink = { x?: number; y: number };
/**
 * A part of a move's two strokes that hands over its own way: the hatching that folds down into its
 * ceiling line before the line drops, the brackets that draw themselves in at the viewfinder's corners.
 * It takes the strokes it names (ids), or those whose own place has its center in `box` ([x, y, w, h]:
 * a stroke leaving, where it was; one arriving, where it lands); `phase` limits it to the strokes leaving
 * ("out") or arriving ("in"). Its strokes retract into (or grow out of) `sink`, drawn into its one point
 * with `focus`, over `window` ([start, end], shares of the move) when it has one, else over the move's own
 * stroke. The first zone that takes a stroke wins.
 */
export type ViaZone = {
  ids?: readonly string[];
  box?: readonly [x: number, y: number, w: number, h: number];
  phase?: "out" | "in";
  sink: Sink;
  focus?: boolean;
  /** As ViaSpec.floor, for this zone's strokes. */
  floor?: number;
  window?: readonly [number, number];
};
/** [start, length, end]: a piece's share of its contour, and the end its pen starts at (0 its first point, 1 its last). */
export type TraceSeg = readonly [start: number, len: number, end: 0 | 1];
export type TraceSpec = { in?: TraceSeg; out?: TraceSeg };

export type MorphSource = { reel: MorphReelId; pool: readonly PoolPiece[]; formations: readonly Formation[]; phoneView?: Crop };

export const DEFAULT_STAGGER = 0.35;
export const MAX_STAGGER = 0.9;
export const DEFAULT_BEND = 0.18;
export const FULL_CROP: Crop = [0, 0, VIEW_W, VIEW_H];
/** The window of the grid a phone variant is placed for (its center is what shift and scale move about), unless the source says otherwise. */
export const PHONE_VIEW: Crop = [0, 175, 600, 450];
const FULL_WINDOW: RectGeom = { x: 0, y: 0, w: VIEW_W, h: VIEW_H, r: 0, rot: 0 };

export type MarkState = { cx: number; cy: number; size: number; o: number; role: MarkRole };
const NO_MARK: MarkState = { cx: VIEW_W / 2, cy: VIEW_H / 2, size: 0, o: 0, role: "ink" };

export type ResolvedFormation = {
  id: string;
  gather: boolean;
  pocketSkip: boolean;
  opens: boolean;
  anchor?: Anchor;
  hold?: Anchor;
  cue?: string;
  still: string[];
  pocket: string[];
  crop: Crop;
  run: PocketRun;
  /** Every piece, in pool order. */
  states: PieceState[];
  mark: MarkState;
  window: RectGeom;
  /** The pieces' layer opacity. */
  layer: number;
  /** With no window of its own: the box its seen clipped pieces are drawn in (null: it shows none). */
  reach: RectGeom | null;
  /** Those states as the DOM's strings: what a hold writes, and what a still draws. */
  frame: MorphFrame;
};

export type Move = {
  /** The formation this move lands on. */
  to: number;
  lead?: number;
  leadUnits?: number;
  ease: MoveEase;
  stagger: number;
  bend: number;
  /** One per pool piece. */
  pieces: PieceMove[];
  /** Each piece's start, as a share of the window (0 .. stagger). */
  starts: number[];
  order?: Formation["order"];
  /**
   * The two-stroke pieces (ViaSpec): out (retract) then in (grow), or null for a piece that travels;
   * follow: the pool index of the piece they follow, and its centers at the move's two ends.
   */
  via?: { out: number; in: number; pieces: (ViaPiece | null)[]; follow?: { k: number; c0: readonly [number, number]; c1: readonly [number, number] }; whip?: boolean };
  /** A travelling piece's own window in the move (Formation.slot), or null for its stagger slot. */
  slots?: (readonly [number, number] | null)[];
  /** The share of the move the travelling pieces take (Formation.travel); the whole move by default. */
  travel?: readonly [number, number];
  /** Formation.part, as pool indices; `skip`: the clipped pieces (seen only inside their window, never an outline to stop at). */
  part?: { left: number; right: number; skip: number[] };
};

/**
 * A piece that retracts into its own end and grows out of its next place's
 * end, unseen between. w0 / w1: its own window inside the first / second
 * stroke ([start, span], shares of that stroke) when it traces a contour;
 * otherwise its stagger slot. at: when its second stroke starts, as a share
 * of the move: the move's `in`, or, for a piece seen at both ends, not
 * before its own first stroke has ended (the strokes of the move overlap,
 * a piece's own never do).
 */
export type ViaPiece = {
  out: PieceMove;
  in: PieceMove;
  w0?: readonly [number, number];
  w1?: readonly [number, number];
  at?: number;
  /** Its zone's windows (ViaZone.window), as shares of the move: its first stroke's, its second's. */
  ow?: readonly [number, number];
  iw?: readonly [number, number];
  /** Its first stroke, its second, follows the move's followed piece (ViaSpec.follow). */
  fo?: boolean;
  fi?: boolean;
};

export type CompiledMorph = {
  reel: MorphReelId;
  pool: PoolPiece[];
  formations: ResolvedFormation[];
  /** moves[i] lands on formations[i]; moves[0] is null (the opening frame). */
  moves: (Move | null)[];
  /** Some piece draws inside the clip window. */
  clipped: boolean;
  /** Some formation shows the brand mark. */
  marked: boolean;
  /** The same formations placed for a phone's pocket view (no phone of its own). */
  phone: CompiledMorph | null;
  /** The grid window the phone variant is placed for. */
  view: Crop;
  /** Authoring mistakes. test/why/morph.test.ts requires none in the registered data. */
  problems: string[];
};

/* ---------------------------------------------------------------- *
 * Compile
 * ---------------------------------------------------------------- */

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Start offsets for a move's pieces: the k-th mover (by `order`) starts at
 * stagger * k / (movers - 1). Pieces that do not move start at 0 (they
 * hold either way).
 */
export function staggerStarts(pieces: readonly PieceMove[], ids: readonly string[], stagger: number, order: Formation["order"]): number[] {
  const movers = pieces.map((p, i) => i).filter((i) => !pieces[i].still);
  const byTravel = (list: number[]) => {
    let vx = 0;
    let vy = 0;
    let total = 0;
    for (const i of list) {
      const p = pieces[i];
      vx += p.c1[0] - p.c0[0];
      vy += p.c1[1] - p.c0[1];
      total += p.dist;
    }
    const n = Math.max(1, list.length);
    const mean = Math.hypot(vx, vy) / n;
    const avg = total / n;
    // A shared direction (the mean travel at least a quarter of the average
    // trip): the front of the flock, furthest along that direction, leaves first.
    if (avg > 0 && mean >= avg / 4) {
      const ux = vx / (mean * n);
      const uy = vy / (mean * n);
      const key = (i: number) => pieces[i].c0[0] * ux + pieces[i].c0[1] * uy;
      return [...list].sort((a, b) => key(b) - key(a) || a - b);
    }
    return [...list].sort((a, b) => pieces[b].dist - pieces[a].dist || a - b);
  };
  let ranked: number[];
  if (order === "pool") ranked = movers;
  else if (Array.isArray(order)) {
    const index = new Map(ids.map((id, i) => [id, i]));
    const first = (order as readonly string[]).map((id) => index.get(id)).filter((i): i is number => i !== undefined && movers.includes(i));
    const firstSet = new Set(first);
    ranked = [...first, ...byTravel(movers.filter((i) => !firstSet.has(i)))];
  } else ranked = byTravel(movers);
  const starts = new Array<number>(pieces.length).fill(0);
  const n = ranked.length;
  ranked.forEach((i, k) => {
    starts[i] = n > 1 ? (stagger * k) / (n - 1) : 0;
  });
  // A piece hidden in its host at rest leaves at once (unseen while the host still covers it) and
  // arrives last (seen only once its new host is in place): never exposed by its host moving. A piece
  // the order names travels in its named slot (the small orb condensing into the core, with the core).
  const named = new Set(Array.isArray(order) ? (order as readonly string[]) : []);
  pieces.forEach((p, i) => {
    if (p.still || named.has(ids[i])) return;
    if (p.from.parked && p.from.look.o > 0) starts[i] = 0;
    else if (p.to.parked && p.to.look.o > 0) starts[i] = stagger;
  });
  return starts;
}

function pointSpecFor(kind: PieceKind): PieceSpec {
  if (kind === "rect") return { kind, x: VIEW_W / 2, y: VIEW_H / 2, w: 0, h: 0 };
  if (kind === "line") return { kind, x1: VIEW_W / 2, y1: VIEW_H / 2, x2: VIEW_W / 2, y2: VIEW_H / 2 };
  return { kind, cx: VIEW_W / 2, cy: VIEW_H / 2, r: 0, a0: 0, a1: 0 };
}

const markOf = (m: MarkSpec): MarkState => ({ cx: m.cx, cy: m.cy, size: m.size, o: m.o ?? 1, role: m.role ?? "ink" });
const windowOf = (w: WindowSpec): RectGeom => ({ x: w.x, y: w.y, w: w.w, h: w.h, r: w.r ?? 0, rot: 0 });

/** A placement: scale k about (ox, oy), then move by (dx, dy). */
type Place = { k: number; dx: number; dy: number; ox: number; oy: number };
const placeMark = (m: MarkState, p: Place): MarkState => ({
  ...m,
  cx: p.ox + (m.cx - p.ox) * p.k + p.dx,
  cy: p.oy + (m.cy - p.oy) * p.k + p.dy,
  size: m.size * p.k,
});
const placeWindow = (w: RectGeom, p: Place): RectGeom => ({
  x: p.ox + (w.x - p.ox) * p.k + p.dx,
  y: p.oy + (w.y - p.oy) * p.k + p.dy,
  w: w.w * p.k,
  h: w.h * p.k,
  r: w.r * p.k,
  rot: 0,
});

export function frameOfState(states: readonly PieceState[], mark: MarkState, window: RectGeom, layer = 1): MorphFrame {
  return {
    pieces: states.map((s) => frameOf(asNow(s))),
    mark: markFrame({ ...mark, role: [mark.role, mark.role, 0] }),
    window: rectPath(window),
    layer: layerString(layer),
  };
}

/**
 * Every formation's states, for the desktop grid or for the phone view.
 * Problems with the data itself are reported once, by the desktop pass;
 * the phone pass reports only its own overrides.
 */
function resolveAll(src: MorphSource, variant: "desktop" | "phone", problems: string[]): ResolvedFormation[] {
  const pool = src.pool;
  const index = new Map(pool.map((p, i) => [p.id, i]));
  const bases: Look[] = pool.map((p) => ({ ...DEFAULT_LOOK, ...p.look }));
  const view = src.phoneView ?? PHONE_VIEW;
  const desktop = variant === "desktop";
  const report = (msg: string, phoneOwn = false) => {
    if (desktop !== phoneOwn) problems.push(msg);
  };

  const out: ResolvedFormation[] = [];
  const stillKeys = new Set<string>();
  const pocketKeys = new Set<string>();
  const claimed = new Set(src.formations.flatMap((f) => (f.pocket === undefined ? [] : typeof f.pocket === "string" ? [f.pocket] : [...f.pocket])));
  const formationIds = new Set<string>();
  let prev: ResolvedFormation | null = null;
  src.formations.forEach((f, fi) => {
    if (formationIds.has(f.id)) report(`${f.id}: formation id used twice`);
    formationIds.add(f.id);
    if (fi > 0 && !f.anchor) report(`${f.id}: only the first formation may omit its anchor`);
    if (f.stagger !== undefined && !(f.stagger >= 0 && f.stagger <= MAX_STAGGER)) report(`${f.id}: stagger must be 0..${MAX_STAGGER}`);
    if (f.lead !== undefined && !(f.lead > 0)) report(`${f.id}: lead must be a positive number of svh`);
    if (Array.isArray(f.order)) for (const id of f.order as readonly string[]) if (!index.has(id)) report(`${f.id}: order names unknown piece "${id}"`);
    for (const id of Object.keys(f.pieces)) if (!index.has(id)) report(`${f.id}: unknown piece "${id}"`);
    const share = (w: readonly [number, number]) => w[0] >= 0 && w[1] <= 1 && w[1] > w[0];
    for (const [id, w] of Object.entries(f.slot ?? {})) {
      if (!index.has(id)) report(`${f.id}: slot names unknown piece "${id}"`);
      if (!share(w)) report(`${f.id}: slot "${id}" must be a [start, end] share of the move`);
    }
    for (const z of [...(f.via?.zones ?? []), ...(f.via?.phoneZones ?? [])]) {
      for (const id of z.ids ?? []) if (!index.has(id)) report(`${f.id}: a via zone names unknown piece "${id}"`);
      if (z.window && !share(z.window)) report(`${f.id}: a via zone's window must be a [start, end] share of the move`);
      if (!z.ids && !z.box) report(`${f.id}: a via zone takes the strokes it names or those in its box`);
    }
    if (f.mark && !(f.mark.size >= 0)) report(`${f.id}: mark size must be 0 or more`);

    const ph = f.phone;
    const k = ph?.scale ?? 1;
    if (!(k > 0)) report(`${f.id}: phone scale must be positive`, true);
    const place: Place = {
      k: k > 0 ? k : 1,
      dx: ph?.shift?.[0] ?? 0,
      dy: ph?.shift?.[1] ?? 0,
      ox: view[0] + view[2] / 2,
      oy: view[1] + view[3] / 2,
    };
    const moved = !desktop && (place.k !== 1 || place.dx !== 0 || place.dy !== 0);
    if (!desktop) for (const id of Object.keys(ph?.pieces ?? {})) if (!index.has(id)) report(`${f.id}: phone names unknown piece "${id}"`, true);

    const states: PieceState[] = pool.map((p, i) => {
      const own = !desktop ? ph?.pieces?.[p.id] : undefined;
      const spec = own ?? f.pieces[p.id];
      const held = prev?.states[i] ?? resolveSpec(pointSpecFor(p.kind), { ...bases[i], o: 0 });
      if (!spec) {
        if (!prev) report(`${f.id}: the first formation must place every piece; "${p.id}" is missing`);
        return held;
      }
      if (spec.kind !== p.kind) {
        report(`${f.id}: "${p.id}" is a ${p.kind} for life but was given a ${spec.kind}${own ? " on the phone" : ""}`, !!own);
        return held;
      }
      const st = resolveSpec(spec, bases[i]);
      return moved && !own ? placeState(st, place.k, place.dx, place.dy, place.ox, place.oy) : st;
    });

    const ownMark = !desktop ? ph?.mark : undefined;
    let mark = prev?.mark ?? NO_MARK;
    if (ownMark) mark = markOf(ownMark);
    else if (f.mark) mark = moved ? placeMark(markOf(f.mark), place) : markOf(f.mark);

    const ownWindow = !desktop ? ph?.window : undefined;
    let window = prev?.window ?? FULL_WINDOW;
    if (ownWindow) window = windowOf(ownWindow);
    else if (f.window) window = moved ? placeWindow(windowOf(f.window), place) : windowOf(f.window);

    const keys = (v: string | readonly string[] | undefined) => (v === undefined ? [] : typeof v === "string" ? [v] : [...v]);
    const still = keys(f.still);
    for (const key of still) {
      if (stillKeys.has(key)) report(`${f.id}: still "${key}" is drawn by two formations`);
      stillKeys.add(key);
    }
    // A still is its formation's pocket too, unless another formation ends that pocket.
    const pocket = f.pocket === undefined ? still.filter((k) => !claimed.has(k)) : keys(f.pocket);
    for (const key of pocket) {
      if (pocketKeys.has(key)) report(`${f.id}: pocket "${key}" is ended by two formations`);
      pocketKeys.add(key);
    }
    const layer = f.layer ?? prev?.layer ?? 1;
    if (!(layer >= 0 && layer <= 1)) report(`${f.id}: layer must be 0..1`);
    const crop = f.crop ?? FULL_CROP;
    if (!(crop[2] > 0 && crop[3] > 0)) report(`${f.id}: crop needs a positive size`);
    const run = ph?.run ?? "section";
    if (typeof run === "number" && !(run > 0)) report(`${f.id}: a phone runway must be a positive number of svh`, true);
    if (f.leadUnits !== undefined && !(f.leadUnits > 0)) report(`${f.id}: leadUnits must be positive`);

    // The box the formation's seen clipped pieces are drawn in, a little wide (a stroke's width).
    let reach: RectGeom | null = null;
    if (isFull(window)) {
      states.forEach((st, i) => {
        if (!pool[i].clip || st.look.o <= 0 || st.parked) return;
        const b = boxOfState(st);
        reach = reach ? union(reach, b) : b;
      });
      if (reach) {
        const r = reach as RectGeom;
        reach = { x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12, r: 0, rot: 0 };
      }
    }

    const resolved: ResolvedFormation = {
      id: f.id,
      gather: !!f.gather,
      pocketSkip: !!f.pocketSkip,
      opens: !!f.opens,
      anchor: f.anchor,
      hold: f.hold,
      cue: f.cue,
      still,
      pocket,
      crop,
      run,
      states,
      mark,
      window,
      layer,
      reach,
      frame: frameOfState(states, mark, window, layer),
    };
    out.push(resolved);
    prev = resolved;
  });
  return out;
}

/** A piece's box at rest: a rect's own (unturned), a line's, an arc's whole circle. */
function boxOfState(st: PieceState): RectGeom {
  if (st.kind === "rect") return { x: st.g.x, y: st.g.y, w: st.g.w, h: st.g.h, r: 0, rot: 0 };
  if (st.kind === "line") {
    const g = st.g;
    return { x: Math.min(g.x1, g.x2), y: Math.min(g.y1, g.y2), w: Math.abs(g.x2 - g.x1), h: Math.abs(g.y2 - g.y1), r: 0, rot: 0 };
  }
  const g = st.g;
  return { x: g.cx - g.r, y: g.cy - g.r, w: 2 * g.r, h: 2 * g.r, r: 0, rot: 0 };
}

/** Generated pool ids carry no identity; every other id is a named part of the story (the phone, the orb, the horizon). */
export const isNamedPiece = (id: string) => !/^(?:[rla]\d{3}|f[rla]\d{2})$/.test(id);

/**
 * A piece shrunk, unseen, into its own end nearest the sink (a line's end, an arc's end angle, a rect's
 * nearest edge point). A line or arc whose two ends lie as near the sink as each other (a level stroke
 * and a level sink) shrinks into its own middle instead, never sliding toward one end.
 */
export function endNear(s: PieceState, sink: { x?: number; y: number }): PieceState {
  const d = (x: number, y: number) => (sink.x === undefined ? Math.abs(y - sink.y) : Math.hypot(x - sink.x, y - sink.y));
  // Shrunk into its own stroke: parked, so it fades only as the last of it goes (pieces.ts PieceMove.fade).
  const look = { ...s.look, o: 0 };
  const tie = (d0: number, d1: number, len: number) => Math.abs(d0 - d1) <= 0.08 * len;
  if (s.kind === "line") {
    const g = s.g;
    const d0 = d(g.x1, g.y1);
    const d1 = d(g.x2, g.y2);
    const [x, y] = tie(d0, d1, Math.hypot(g.x2 - g.x1, g.y2 - g.y1)) ? [(g.x1 + g.x2) / 2, (g.y1 + g.y2) / 2] : d0 <= d1 ? [g.x1, g.y1] : [g.x2, g.y2];
    return { kind: "line", g: { x1: x, y1: y, x2: x, y2: y }, look, parked: true };
  }
  if (s.kind === "arc") {
    const g = s.g;
    const at = (a: number) => [g.cx + g.r * Math.cos((a * Math.PI) / 180), g.cy + g.r * Math.sin((a * Math.PI) / 180)] as const;
    const d0 = d(...at(g.a0));
    const d1 = d(...at(g.a1));
    const full = Math.abs(g.a1 - g.a0) >= 359.9;
    const e = !full && tie(d0, d1, (g.r * Math.abs(g.a1 - g.a0) * Math.PI) / 180) ? (g.a0 + g.a1) / 2 : d0 <= d1 ? g.a0 : g.a1;
    return { kind: "arc", g: { ...g, a0: e, a1: e }, look, parked: true };
  }
  const g = s.g;
  // Toward a line (no sink x): flat on its edge nearest the line, so it rises out of it as one edge, never a dot.
  if (sink.x === undefined) return { kind: "rect", g: { x: g.x, y: clamp(sink.y, g.y, g.y + g.h), w: g.w, h: 0, r: 0, rot: g.rot }, look, parked: true };
  return { kind: "rect", g: { x: clamp(sink.x, g.x, g.x + g.w), y: clamp(sink.y, g.y, g.y + g.h), w: 0, h: 0, r: 0, rot: g.rot }, look, parked: true };
}

const travelOf = (m: PieceMove) => m.dist;

/** A piece drawn into one point, unseen (a rack focus: every stroke of the subject gathers into the focus). */
function atPoint(s: PieceState, x: number, y: number): PieceState {
  const look = { ...s.look, o: 0 };
  if (s.kind === "line") return { kind: "line", g: { x1: x, y1: y, x2: x, y2: y }, look, parked: true };
  if (s.kind === "arc") return { kind: "arc", g: { cx: x, cy: y, r: 0, a0: s.g.a0, a1: s.g.a1 }, look, parked: true };
  return { kind: "rect", g: { x, y, w: 0, h: 0, r: 0, rot: s.g.rot }, look, parked: true };
}

/** A piece scaled by k about (x, y), unseen (a focus stroke with a floor: the drawing contracts toward the sink, never to a point). */
function scaledAbout(s: PieceState, x: number, y: number, k: number): PieceState {
  const st = placeState(s, k, 0, 0, x, y);
  return { ...st, look: { ...st.look, o: 0 }, parked: true } as PieceState;
}

/** A piece moved by (dx, dy), unseen: where a panned stroke leaves to or comes in from. */
function movedBy(s: PieceState, dx: number, dy: number): PieceState {
  const st = placeState(s, 1, dx, dy, 0, 0);
  return { ...st, look: { ...st.look, o: 0 }, parked: true } as PieceState;
}

/** A piece shrunk, unseen, into one of its own ends (0: its first point, 1: its last): where a traced line's pen starts. */
export function penEnd(s: PieceState, end: 0 | 1): PieceState {
  const look = { ...s.look, o: 0 };
  if (s.kind === "line") {
    const g = s.g;
    const [x, y] = end === 0 ? [g.x1, g.y1] : [g.x2, g.y2];
    return { kind: "line", g: { x1: x, y1: y, x2: x, y2: y }, look, parked: true };
  }
  if (s.kind === "arc") {
    const e = end === 0 ? s.g.a0 : s.g.a1;
    return { kind: "arc", g: { ...s.g, a0: e, a1: e }, look, parked: true };
  }
  const g = s.g;
  return { kind: "rect", g: { x: g.x + g.w / 2, y: g.y + g.h / 2, w: 0, h: 0, r: 0, rot: g.rot }, look, parked: true };
}

/**
 * The two-stroke pieces of a move (ViaSpec), or undefined when the move has
 * none. `starts` and `stagger` are the move's own stagger slots: a piece
 * seen at both ends starts its second stroke only once its first is done.
 */
/** A stroke's size for ViaSpec.focusMax: a line's length, an arc's, a rect's longer side. */
function sizeOf(s: PieceState): number {
  if (s.kind === "line") return Math.hypot(s.g.x2 - s.g.x1, s.g.y2 - s.g.y1);
  if (s.kind === "arc") return (s.g.r * Math.min(360, Math.abs(s.g.a1 - s.g.a0)) * Math.PI) / 180;
  return Math.max(s.g.w, s.g.h);
}

const inBox = (p: readonly [number, number], b: readonly [number, number, number, number]) => p[0] >= b[0] && p[0] <= b[0] + b[2] && p[1] >= b[1] && p[1] <= b[1] + b[3];

/** What planVia needs besides the spec: where the second stroke grows out of, and the zones, in the variant's units. */
type ViaPlace = { sinkIn?: Sink; zonesOut?: readonly ViaZone[]; zonesIn?: readonly ViaZone[]; keep?: readonly string[]; clip?: readonly boolean[] };

function planVia(
  ids: readonly string[],
  from: ResolvedFormation,
  to: ResolvedFormation,
  pieces: PieceMove[],
  via: ViaSpec | undefined,
  sink: Sink | undefined,
  trace?: Readonly<Record<string, TraceSpec>>,
  starts?: readonly number[],
  stagger = 0,
  place: ViaPlace = {},
) {
  if (!via || !sink) return undefined;
  // Following a piece: its two ends' centers are the two strokes' sinks.
  const fk = via.follow ? ids.indexOf(via.follow) : -1;
  const follow = fk >= 0 ? { k: fk, c0: centerOf(from.states[fk]), c1: centerOf(to.states[fk]) } : undefined;
  if (follow) {
    sink = { x: follow.c0[0], y: follow.c0[1] };
    place = { ...place, sinkIn: { x: follow.c1[0], y: follow.c1[1] } };
  }
  // A pan: how far the window moves, and how far a stroke slides past its edge (a window's width and a little).
  const pan = via.pan
    ? { dx: to.window.x - from.window.x, dy: to.window.y - from.window.y, d: Math.max(from.window.w, to.window.w) + 8 }
    : null;
  const cap = via.cap ?? 120;
  const out = clamp(via.out ?? 0.4, 0.05, 0.95);
  const inn = clamp(via.in ?? 0.55, 0.05, 0.95);
  const focusMax = via.focusMax ?? Infinity;
  const span = (start: number, len: number): [number, number] => [clamp(start, 0, 1), clamp(len, 1e-3, 1)];
  const win = (w: readonly [number, number]): [number, number] => {
    const a = clamp(w[0], 0, 1);
    return [a, clamp(Math.max(w[1], a + 1e-3), 0, 1)];
  };
  const zoneOf = (zones: readonly ViaZone[] | undefined, k: number, s: PieceState) =>
    zones?.find((z) => !!z.ids?.includes(ids[k]) || (!!z.box && inBox(centerOf(s), z.box)));
  const list = pieces.map((m, k): ViaPiece | null => {
    if (m.still) return null;
    const a = from.states[k];
    const b = to.states[k];
    if (a.look.o <= 0 && b.look.o <= 0) return null;
    // A piece that stays where it is (only its opacity changes: one piece of the pool handing a stroke
    // to another in place) crossfades there; it never retracts and grows back.
    if (!via.grow && a.kind === b.kind && (Object.keys(a.g) as (keyof typeof a.g)[]).every((key) => Math.abs((a.g[key] as number) - (b.g[key] as number)) < 0.05)) return null;
    const seenA = a.look.o > 0 && !a.parked;
    const seenB = b.look.o > 0 && !b.parked;
    const both = seenA && seenB;
    const tr = trace?.[ids[k]];
    // The identities the move names (keep) carry the story across and travel, always: the cane into the
    // temple, the ground into the horizon. Otherwise a stroke of a traced contour hands over in two
    // strokes (whatever pool piece carries it); a named piece seen at both ends travels, as does a short trip.
    const traced = !!(tr?.in || tr?.out);
    // A zone that names a piece hands it over its own way; otherwise an identity the move keeps travels,
    // seen at both ends or lying down in its host at one (the small orb's rings riding up into the core).
    const named = (z: readonly ViaZone[] | undefined) => !!z?.some((x) => x.ids?.includes(ids[k]));
    if (!named(place.zonesOut) && !named(place.zonesIn) && (place.keep ?? via.keep)?.includes(ids[k])) return null;
    if (both && !via.all && !traced && isNamedPiece(ids[k]) && !(via.capAll && travelOf(m) > cap)) return null;
    if (both && !via.all && !traced && travelOf(m) <= cap) return null;
    const zOut = a.look.o > 0 ? zoneOf(place.zonesOut, k, a) : undefined;
    const zIn = b.look.o > 0 ? zoneOf(place.zonesIn, k, b) : undefined;
    // A zone hands its strokes over its own way, traced or not.
    const tOut = seenA && !zOut ? tr?.out : undefined;
    const tIn = seenB && !zIn ? tr?.in : undefined;
    const toSink = (s: PieceState, at: Sink, focus: boolean, floor: number) =>
      focus && at.x !== undefined && sizeOf(s) <= focusMax ? (floor > 0 ? scaledAbout(s, at.x, at.y, floor) : atPoint(s, at.x, at.y)) : endNear(s, at);
    // A pan: a clipped stroke rides with the window, out through its left edge or in through its right.
    if (pan && place.clip?.[k] && !zOut && !zIn && !tr?.in && !tr?.out) {
      const A = seenA ? movedBy(a, pan.dx - pan.d, pan.dy) : a;
      const B = seenB ? movedBy(b, pan.d - pan.dx, -pan.dy) : b;
      const v: ViaPiece = { out: planMove(a, A, 0), in: planMove(B, b, 0) };
      if (seenA && seenB) {
        v.ow = [0, 0.5];
        v.iw = [0.5, 1];
      } else if (seenA) {
        v.ow = [0, 1];
        v.at = 1;
      } else v.iw = [0, 1];
      return v;
    }
    const fOut = zOut?.floor ?? (zOut ? 0 : (via.floor ?? 0));
    const fIn = zIn?.floor ?? (zIn ? 0 : (via.floor ?? 0));
    const A = a.look.o > 0 ? (tOut ? penEnd(a, tOut[2]) : toSink(a, zOut?.sink ?? sink, zOut ? !!zOut.focus : !!via.focus, fOut)) : a;
    const B = b.look.o > 0 ? (tIn ? penEnd(b, tIn[2]) : toSink(b, zIn?.sink ?? place.sinkIn ?? sink, zIn ? !!zIn.focus : !!via.focus, fIn)) : b;
    const v: ViaPiece = { out: planMove(a, A, 0), in: planMove(B, b, 0) };
    if (follow && k !== follow.k) {
      if (a.look.o > 0 && !tOut && !zOut) v.fo = true;
      if (b.look.o > 0 && !tIn && !zIn) v.fi = true;
    }
    // Back along its contour, the last of it first; then out along the new one, from its first point.
    if (tOut) v.w0 = span(1 - tOut[0] - tOut[1], tOut[1]);
    if (tIn) v.w1 = span(tIn[0], tIn[1]);
    if (zOut?.window) v.ow = win(zOut.window);
    if (zIn?.window) v.iw = win(zIn.window);
    if (b.look.o <= 0) {
      // Only leaving: it has no second stroke, so its first runs to its end, whatever the move's `in`.
      v.at = 1;
      return v;
    }
    // A piece seen at both ends: its own second stroke waits for its first (an upper bound: the eased
    // stroke is ahead of its linear share).
    if (both) {
      const done = v.ow ? v.ow[1] : v.w0 ? out * (v.w0[0] + v.w0[1]) : out * clamp((starts?.[k] ?? 0) + 1 - stagger, 0, 1);
      if (v.iw) {
        if (done > v.iw[0]) v.iw = win([done, v.iw[1] + done - v.iw[0]]);
      } else if (done > inn) v.at = Math.min(0.98, done);
    }
    return v;
  });
  return list.some(Boolean) ? { out, in: inn, pieces: list, ...(follow ? { follow } : {}), ...(via.whip ? { whip: true } : {}) } : undefined;
}

function planMoves(src: MorphSource, formations: ResolvedFormation[], variant: "desktop" | "phone" = "desktop"): (Move | null)[] {
  const ids = src.pool.map((p) => p.id);
  const view = src.phoneView ?? PHONE_VIEW;
  return formations.map((to, i) => {
    if (i === 0) return null;
    const f = src.formations[i];
    const from = formations[i - 1];
    const bend = f.bend ?? DEFAULT_BEND;
    const stagger = clamp(f.stagger ?? DEFAULT_STAGGER, 0, MAX_STAGGER);
    const pieces = to.states.map((s, k) => planMove(from.states[k], s, bend));
    // A recomposed phone end has its own contours: it hands over without tracing, into its own sink
    // (phoneSink, phoneSinkIn, phoneZones, in the phone view's units), or, with none, travels.
    const recomposed = variant === "phone" && !!(f.phone?.pieces || src.formations[i - 1].phone?.pieces);
    const via = f.via;
    let sink: Sink | undefined;
    let place: ViaPlace = {};
    if (via) {
      const zones = (z: readonly ViaZone[] | undefined, at: (z: ViaZone) => ViaZone) => ({
        zonesOut: z?.filter((x) => x.phase !== "in").map(at),
        zonesIn: z?.filter((x) => x.phase !== "out").map(at),
      });
      if (variant === "desktop") {
        sink = via.sink ?? { y: VIEW_H / 2 };
        place = { sinkIn: via.sinkIn, ...zones(via.zones, (z) => z) };
      } else if (recomposed) {
        sink = via.phoneSink;
        const z = zones(via.phoneZones, (x) => x);
        place = { sinkIn: via.phoneSinkIn, ...z, keep: via.phoneKeep ?? via.keep };
      } else {
        // On a phone the sinks and zones are placed with the drawing: a stroke leaving with the drawing it
        // leaves, one arriving with the drawing it arrives in.
        const a = placeOn(src.formations[i - 1].phone, view);
        const b = placeOn(f.phone, view);
        sink = placeSink(via.sink ?? { y: VIEW_H / 2 }, a);
        const zOut = zones(via.zones, (x) => placeZone(x, a)).zonesOut;
        const zIn = zones(via.zones, (x) => placeZone(x, b)).zonesIn;
        place = { sinkIn: placeSink(via.sinkIn ?? via.sink ?? { y: VIEW_H / 2 }, b), zonesOut: zOut, zonesIn: zIn };
      }
    }
    place = { ...place, clip: src.pool.map((p) => !!p.clip) };
    const starts = staggerStarts(pieces, ids, stagger, f.order);
    const slots = f.slot ? ids.map((id) => f.slot![id] ?? null) : undefined;
    return {
      to: i,
      lead: f.lead,
      leadUnits: f.leadUnits,
      ease: f.ease ?? "standard",
      stagger,
      bend,
      pieces,
      order: f.order,
      starts,
      via: planVia(ids, from, to, pieces, via, sink, recomposed ? undefined : f.trace, starts, stagger, place),
      ...(slots ? { slots } : {}),
      ...(f.travel ? { travel: f.travel } : {}),
      ...(f.part && ids.includes(f.part.left) && ids.includes(f.part.right)
        ? { part: { left: ids.indexOf(f.part.left), right: ids.indexOf(f.part.right), skip: src.pool.flatMap((p, k) => (p.clip ? [k] : [])) } }
        : {}),
    };
  });
}

/** A phone variant's placement of the desktop grid (scale about the view's center, then shift). */
function placeOn(ph: PhoneVariant | undefined, view: Crop): Place {
  return { k: ph?.scale ?? 1, dx: ph?.shift?.[0] ?? 0, dy: ph?.shift?.[1] ?? 0, ox: view[0] + view[2] / 2, oy: view[1] + view[3] / 2 };
}
const placeSink = (s: Sink, p: Place): Sink => ({ x: s.x === undefined ? undefined : p.ox + (s.x - p.ox) * p.k + p.dx, y: p.oy + (s.y - p.oy) * p.k + p.dy });
function placeZone(z: ViaZone, p: Place): ViaZone {
  const box = z.box;
  return {
    ...z,
    sink: placeSink(z.sink, p),
    ...(box ? { box: [p.ox + (box[0] - p.ox) * p.k + p.dx, p.oy + (box[1] - p.oy) * p.k + p.dy, box[2] * p.k, box[3] * p.k] as const } : {}),
  };
}

export function compileMorph(src: MorphSource): CompiledMorph {
  const problems: string[] = [];
  const pool = [...src.pool];
  const seen = new Set<string>();
  for (const p of pool) {
    if (seen.has(p.id)) problems.push(`pool: "${p.id}" is declared twice`);
    seen.add(p.id);
  }
  const view = src.phoneView ?? PHONE_VIEW;
  if (!(view[2] > 0 && view[3] > 0)) problems.push("phoneView needs a positive size");
  const clipped = pool.some((p) => p.clip);
  const marked = src.formations.some((f) => f.mark !== undefined || f.phone?.mark !== undefined);

  const formations = resolveAll(src, "desktop", problems);
  const phoneFormations = resolveAll(src, "phone", problems);
  const base = { reel: src.reel, pool, clipped, marked, view, problems };
  const phone: CompiledMorph = { ...base, formations: phoneFormations, moves: planMoves(src, phoneFormations, "phone"), phone: null };
  return { ...base, formations, moves: planMoves(src, formations), phone };
}

/* ---------------------------------------------------------------- *
 * Moves
 * ---------------------------------------------------------------- */

/** A piece's own progress through a move, 0..1, from the move's t: its stagger slot. */
export function localT(start: number, stagger: number, t: number): number {
  const span = 1 - stagger;
  if (span <= 0) return t >= start ? 1 : 0;
  return clamp((t - start) / span, 0, 1);
}

export type MorphNow = { pieces: PieceNow[]; mark: MarkNow; window: RectGeom; layer: number };

/** The pieces' layer opacity as the DOM's string. */
export function layerString(o: number): string {
  return num(clamp(o, 0, 1), 3);
}

const markNow = (m: MarkState): MarkNow => ({ ...m, role: [m.role, m.role, 0] });

/**
 * The mark `u` of the way through a move: center and size on the move's
 * ease; opacity rising over the first half, or falling over the second.
 * An unseen end has no place of its own: it takes the other end's, so the
 * mark fades in or out where it stands, whole, never growing out of
 * nothing or travelling while unseen.
 */
export function markAt(from: MarkState, to: MarkState, u: number): MarkNow {
  const a = from.o <= 0 ? { ...to, o: from.o } : from;
  const b = to.o <= 0 ? { ...a, o: to.o } : to;
  const e = clamp(u, 0, 1);
  return { cx: lerp(a.cx, b.cx, e), cy: lerp(a.cy, b.cy, e), size: lerp(a.size, b.size, e), o: fadeAt(a.o, b.o, e), role: [a.role, b.role, e] };
}

/** A window as large as (or larger than) the whole grid: no window of its own. */
const isFull = (w: RectGeom) => w === FULL_WINDOW || (w.x <= 0 && w.y <= 0 && w.x + w.w >= VIEW_W && w.y + w.h >= VIEW_H);
const union = (a: RectGeom, b: RectGeom): RectGeom => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y, r: 0, rot: 0 };
};

/**
 * The clip window `u` of the way through a move. An end with no window of
 * its own (the whole grid) never lends its size to the move: it stands in
 * as the box its clipped pieces are drawn in (reach), joined with the other
 * end's window, or as the other end's window when it shows none. So a
 * window that closes onto the feed never draws a card past it, and one that
 * opens out of the feed shows every card on its way, and nothing pops at
 * either end.
 */
export function moveWindow(from: Pick<ResolvedFormation, "window" | "reach">, end: Pick<ResolvedFormation, "window" | "reach">, u: number): RectGeom {
  if (from.window === end.window) return end.window;
  const fa = isFull(from.window);
  const fb = isFull(end.window);
  if (fa && fb) return end.window;
  const a = fa ? (from.reach ? union(from.reach, end.window) : end.window) : from.window;
  const b = fb ? (end.reach ? union(end.reach, from.window) : from.window) : end.window;
  return windowAt(a, b, u);
}

export function windowAt(a: RectGeom, b: RectGeom, u: number): RectGeom {
  const e = clamp(u, 0, 1);
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e), r: lerp(a.r, b.r, e), rot: 0 };
}

/** Everything `t` (0..1) of the way through the move into formation `to`. */
export function moveAt(c: CompiledMorph, to: number, t: number, easings: Easings): MorphNow {
  const move = c.moves[to];
  const end = c.formations[to];
  if (!move) return { pieces: end.states.map(asNow), mark: markNow(end.mark), window: end.window, layer: end.layer };
  return movingAt(move, c.formations[to - 1], end, t, easings);
}

/** A piece moved by (dx, dy). */
function shifted(p: PieceNow, dx: number, dy: number): PieceNow {
  if (!dx && !dy) return p;
  if (p.kind === "rect") return { ...p, g: { ...p.g, x: p.g.x + dx, y: p.g.y + dy } };
  if (p.kind === "line") return { ...p, g: { x1: p.g.x1 + dx, y1: p.g.y1 + dy, x2: p.g.x2 + dx, y2: p.g.y2 + dy } };
  return { ...p, g: { ...p.g, cx: p.g.cx + dx, cy: p.g.cy + dy } };
}

/**
 * One piece `t` of the way through a move: straight through, or out, unseen, then in (ViaSpec). A
 * stroke that follows a travelling piece (ViaSpec.follow) is carried with it: by the share of its own
 * stroke it has done going in (so it ends on the piece wherever it is), by the share it has left coming out.
 */
function pieceOfMove(move: Move, k: number, t: number, ease: (x: number) => number): PieceNow {
  const v = move.via?.pieces[k];
  const f = move.via?.follow;
  if (v && f && (v.fo || v.fi) && t > 0 && t < 1) {
    const p = viaPieceAt(move, v, k, t, ease);
    const inSecond = t >= (v.iw ? v.iw[0] : (v.at ?? move.via!.in));
    if (inSecond ? !v.fi : !v.fo) return p;
    const c = centerOf(pieceOfMove(move, f.k, t, ease));
    const ref = inSecond ? f.c1 : f.c0;
    const m = inSecond ? v.in : v.out;
    // How far the stroke is toward the followed piece: all the way at its sink, none at its own place.
    const [mx, my] = centerOf(p);
    const span = Math.hypot(m.c1[0] - m.c0[0], m.c1[1] - m.c0[1]);
    const near = inSecond ? m.c0 : m.c1;
    const w = span > 1e-6 ? clamp(1 - Math.hypot(mx - near[0], my - near[1]) / span, 0, 1) : 1;
    return shifted(p, (c[0] - ref[0]) * w, (c[1] - ref[1]) * w);
  }
  if (v) return viaPieceAt(move, v, k, t, ease);
  return travellerAt(move, k, t, ease);
}

function viaPieceAt(move: Move, v: ViaPiece, k: number, t: number, easeOut: (x: number) => number): PieceNow {
  const { out } = move.via!;
  // A whip: the first stroke on the ease turned round (in), the second on the ease itself.
  const easeIn = move.via!.whip ? (x: number) => 1 - easeOut(1 - x) : easeOut;
  {
    let ease = easeIn;
    if (t >= 1) return asNow(v.in.to);
    const inn = v.iw ? v.iw[0] : (v.at ?? move.via!.in);
    // A traced piece runs over its own share of the stroke, at the pen's even pace (linear within it).
    const within = (w: readonly [number, number], x: number) => clamp((x - w[0]) / w[1], 0, 1);
    // A zone's stroke runs over its own window of the move.
    const inWindow = (w: readonly [number, number]) => clamp((t - w[0]) / Math.max(1e-6, w[1] - w[0]), 0, 1);
    // The move's two strokes may overlap (in before out): a piece is in its first until its second starts.
    if (t < inn) {
      if (v.ow) {
        const x = inWindow(v.ow);
        return x >= 1 ? asNow(v.out.to) : pieceAt(v.out, x, ease(x));
      }
      if (t >= out) return asNow(v.out.to);
      const x = t / out;
      if (v.w0) {
        const l = within(v.w0, ease(x));
        return pieceAt(v.out, l, l);
      }
      const l = localT(move.starts[k], move.stagger, x);
      return pieceAt(v.out, l, ease(l));
    }
    ease = easeOut;
    if (v.iw) {
      const x = inWindow(v.iw);
      return pieceAt(v.in, x, ease(x));
    }
    const x = (t - inn) / (1 - inn);
    if (v.w1) {
      const l = within(v.w1, ease(x));
      return pieceAt(v.in, l, l);
    }
    const l = localT(move.starts[k], move.stagger, x);
    return pieceAt(v.in, l, ease(l));
  }
}

function travellerAt(move: Move, k: number, t: number, ease: (x: number) => number): PieceNow {
  const slot = move.slots?.[k];
  if (slot) {
    const x = clamp((t - slot[0]) / Math.max(1e-6, slot[1] - slot[0]), 0, 1);
    return pieceAt(move.pieces[k], x, ease(x));
  }
  const x = move.travel ? clamp((t - move.travel[0]) / Math.max(1e-6, move.travel[1] - move.travel[0]), 0, 1) : t;
  const local = localT(move.starts[k], move.stagger, x);
  return pieceAt(move.pieces[k], local, ease(local));
}

/** Everything `t` of the way through a move from one formation to another (consecutive or not). */
/** A piece's stroke as a polyline (rects with their corners and turn, arcs in short chords): where a level line meets it. */
function strokeOf(p: Pick<PieceNow, "kind" | "g">): [number, number][] {
  if (p.kind === "line") {
    const g = p.g as LineGeomT;
    return [
      [g.x1, g.y1],
      [g.x2, g.y2],
    ];
  }
  if (p.kind === "arc") {
    const g = p.g as ArcGeomT;
    const n = Math.max(2, Math.ceil(Math.abs(g.a1 - g.a0) / 6));
    return Array.from({ length: n + 1 }, (_, i) => {
      const a = ((g.a0 + ((g.a1 - g.a0) * i) / n) * Math.PI) / 180;
      return [g.cx + g.r * Math.cos(a), g.cy + g.r * Math.sin(a)] as [number, number];
    });
  }
  const g = p.g as RectGeom;
  const r = Math.min(Math.max(0, g.r), g.w / 2, g.h / 2);
  const out: [number, number][] = [];
  const corner = (cx: number, cy: number, from: number) => {
    for (let i = 0; i <= 3; i++) {
      const a = ((from + i * 30) * Math.PI) / 180;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  corner(g.x + g.w - r, g.y + r, -90);
  corner(g.x + g.w - r, g.y + g.h - r, 0);
  corner(g.x + r, g.y + g.h - r, 90);
  corner(g.x + r, g.y + r, 180);
  out.push(out[0]);
  if (!g.rot) return out;
  const mx = g.x + g.w / 2;
  const my = g.y + g.h / 2;
  const c = Math.cos((g.rot * Math.PI) / 180);
  const sn = Math.sin((g.rot * Math.PI) / 180);
  return out.map(([x, y]) => [mx + (x - mx) * c - (y - my) * sn, my + (x - mx) * sn + (y - my) * c] as [number, number]);
}
type LineGeomT = { x1: number; y1: number; x2: number; y2: number };
type ArcGeomT = { cx: number; cy: number; r: number; a0: number; a1: number };

/**
 * Where a level line at height y meets the seen pieces (opacity half or more), coming in from one side:
 * the smallest (left) or largest (right) x a stroke crosses y at, leaving out `skip`. Null: nothing crosses.
 */
export function crossingAt(pieces: readonly Pick<PieceNow, "kind" | "g" | "look">[], y: number, side: "left" | "right", skip: ReadonlySet<number>): number | null {
  let best: number | null = null;
  const take = (x: number) => {
    if (best === null || (side === "left" ? x < best : x > best)) best = x;
  };
  pieces.forEach((p, i) => {
    if (skip.has(i) || !(p.look.o >= 0.5)) return;
    const pts = strokeOf(p);
    for (let j = 1; j < pts.length; j++) {
      const [ax, ay] = pts[j - 1];
      const [bx, by] = pts[j];
      if ((ay < y && by < y) || (ay > y && by > y)) continue;
      if (ay === by) {
        take(ax);
        take(bx);
      } else take(ax + ((y - ay) * (bx - ax)) / (by - ay));
    }
  });
  return best;
}

/**
 * A level line pair split by the drawing at its height (Formation.part): the left line ends where it
 * first meets the drawing, the right one starts where it last leaves it. Never lengthens either.
 */
export function partLines(pieces: PieceNow[], left: number, right: number, also: readonly number[] = []): PieceNow[] {
  const skip = new Set([left, right, ...also]);
  const out = pieces.slice();
  const L = pieces[left];
  const R = pieces[right];
  if (L?.kind === "line") {
    const g = L.g as LineGeomT;
    if (Math.abs(g.y1 - g.y2) < 0.5 && g.x2 > g.x1) {
      const e = crossingAt(pieces, g.y1, "left", skip);
      if (e !== null && e > g.x1 && e < g.x2) out[left] = { ...L, g: { ...g, x2: e } } as PieceNow;
    }
  }
  if (R?.kind === "line") {
    const g = R.g as LineGeomT;
    if (Math.abs(g.y1 - g.y2) < 0.5 && g.x2 > g.x1) {
      const e = crossingAt(pieces, g.y1, "right", skip);
      if (e !== null && e > g.x1 && e < g.x2) out[right] = { ...R, g: { ...g, x1: e } } as PieceNow;
    }
  }
  return out;
}

export function movingAt(move: Move, from: ResolvedFormation, end: ResolvedFormation, t: number, easings: Easings): MorphNow {
  const ease = easings[move.ease];
  let pieces = move.pieces.map((_, k) => pieceOfMove(move, k, t, ease));
  if (move.part && t > 0 && t < 1) pieces = partLines(pieces, move.part.left, move.part.right, move.part.skip);
  const u = ease(clamp(t, 0, 1));
  return {
    pieces,
    mark: markAt(from.mark, end.mark, u),
    window: moveWindow(from, end, u),
    layer: from.layer === end.layer ? end.layer : fadeAt(from.layer, end.layer, u),
  };
}

export function frameOfNow(now: MorphNow): MorphFrame {
  return { pieces: now.pieces.map(frameOf), mark: markFrame(now.mark), window: rectPath(now.window), layer: layerString(now.layer) };
}

/** The strings `t` of the way into formation `to`. At either end: the formations' own frames, exactly. */
export function moveFrame(c: CompiledMorph, to: number, t: number, easings: Easings): MorphFrame {
  if (t <= 0) return c.formations[to - 1]?.frame ?? c.formations[to].frame;
  if (t >= 1) return c.formations[to].frame;
  return frameOfNow(moveAt(c, to, t, easings));
}

/* ---------------------------------------------------------------- *
 * Timing: the stage
 * ---------------------------------------------------------------- */

/** start[i], end[i]: the scroll window (px) of the move into formation i. Index 0 is unused. */
export type MorphTiming = { start: number[]; end: number[] };

/**
 * Windows from measured anchor positions (scrollY at which each lands,
 * engine/anchors beatY; NaN for a missing one). The move into formation
 * i runs from the moment the formation before may leave (its hold, or its
 * arrival) to formation i's anchor, shortened to `lead` svh if set. The
 * windows never overlap and never run backwards: each starts at or after
 * the previous one's end. Ends are kept inside the page's scroll range
 * (maxScroll - 1), so the last formation can always land.
 */
export function resolveMorphTiming(
  c: CompiledMorph,
  arrive: readonly number[],
  hold: readonly number[],
  svhPx: number,
  maxScroll: number,
  unitPx = 1,
): MorphTiming {
  const n = c.formations.length;
  const start = new Array<number>(n).fill(-Infinity);
  const end = new Array<number>(n).fill(-Infinity);
  const ceiling = Math.max(0, maxScroll - 1);
  const fin = Number.isFinite;
  let cursor = -Infinity;
  for (let i = 1; i < n; i++) {
    // When the formation before may leave: its hold; else when it landed
    // (the first formation: its anchor, else the top of the page).
    const j = i - 1;
    let s = fin(hold[j]) ? hold[j] : j === 0 ? (fin(arrive[0]) ? arrive[0] : 0) : cursor;
    if (fin(cursor)) s = Math.max(s, cursor);
    let e = fin(arrive[i]) ? arrive[i] : s;
    e = Math.max(e, s);
    const lead = c.moves[i]?.lead;
    if (lead !== undefined) s = Math.max(s, e - lead * svhPx);
    const units = c.moves[i]?.leadUnits;
    if (units !== undefined) s = Math.max(s, e - units * unitPx);
    e = Math.min(e, ceiling);
    s = Math.min(s, e);
    if (fin(cursor)) {
      s = Math.max(s, cursor);
      e = Math.max(e, s);
    }
    start[i] = s;
    end[i] = e;
    cursor = e;
  }
  return { start, end };
}

/** Which move is running at scroll y, and how far: k is the last formation landed. */
export function locate(timing: MorphTiming, y: number): { k: number; next: number; t: number } {
  const n = timing.end.length;
  let k = 0;
  for (let i = 1; i < n; i++) {
    if (timing.end[i] <= y) k = i;
    else break;
  }
  const next = k + 1;
  if (next >= n || y <= timing.start[next]) return { k, next, t: 0 };
  const span = timing.end[next] - timing.start[next];
  return { k, next, t: span > 0 ? (y - timing.start[next]) / span : 1 };
}

/**
 * Every string at scroll y. While a formation holds this is its
 * precomputed frame, the same object every time, so nothing is written.
 */
export function sampleFrames(c: CompiledMorph, timing: MorphTiming, y: number, easings: Easings): MorphFrame {
  const { k, next, t } = locate(timing, y);
  if (t <= 0 || next >= c.formations.length) return c.formations[k].frame;
  return moveFrame(c, next, t, easings);
}

/** Everything at scroll y, as numbers (for tests and tools). */
export function sampleMorph(c: CompiledMorph, timing: MorphTiming, y: number, easings: Easings): MorphNow {
  const { k, next, t } = locate(timing, y);
  if (t <= 0 || next >= c.formations.length) {
    const f = c.formations[k];
    return { pieces: f.states.map(asNow), mark: markNow(f.mark), window: f.window, layer: f.layer };
  }
  return moveAt(c, next, Math.min(1, t), easings);
}

/* ---------------------------------------------------------------- *
 * Timing: a phone's pockets
 * ---------------------------------------------------------------- */

/**
 * A pocket: the placement `key`, which plays the formations `steps` (indices,
 * in order) over a runway of `run`. steps[0] is where it opens: the reel's
 * opening formation for the first pocket; for every later one, the
 * formation the band before it ended on, so a band enters as the matched
 * cut of the drawing the reader just saw (the feed scrolls away, the next
 * band arrives as the feed and reforms it into the CCTV) and reforms it
 * while it rises into view (pocketEntry). When the band before is still on
 * screen as this one rises, the director opens it on the through-line
 * instead (open: "line", lineOpener), so one drawing never shows in two
 * bands at once. `lead` is the share of a slot the first pinned formation holds before the
 * next move; `reform` the share of the runway the steps take (the rest holds
 * the last one); `hold` the share of a slot each formation between two
 * moves holds.
 */
export type PocketPlan = {
  key: string;
  steps: number[];
  run: PocketRun;
  lead: number;
  reform: number;
  hold: number;
  own?: boolean;
  /** The formations (indices) whose move into them is a crossfade, nothing moving: it takes CROSSFADE_SLOT of a slot. */
  short?: number[];
};

/** A crossfade in a pocket (pieces to the exact mark: nothing moves) takes this share of a move's slot. */
export const CROSSFADE_SLOT = 0.35;

/** A runway in svh: the named ones match why.css (--why-run-item, -section, -climax; "rise" has none). */
export const RUN_SVH: Record<Exclude<PocketRun, number>, number> = { item: 24, section: 12, climax: 40, rise: 0 };
export const runSvh = (run: PocketRun) => (typeof run === "number" ? run : RUN_SVH[run]);

/** The runway's share that reforms; the rest holds the new formation before the band lets go. */
export const POCKET_REFORM = 0.8;
/**
 * A frame (the band pinned with its text) steps through more of its runway,
 * and its holds are a little shorter than its moves: its text is on screen
 * whole the whole time, so the runway it pins for stays short (why.css
 * --why-hero-frame-run, --why-list-frame-run) and every move still runs over
 * 100px or more of scroll on a phone (test/why/morph-continuity.test.ts).
 */
export const FRAME_REFORM = 0.95;
/**
 * In a pocket that plays several formations, each one between two moves
 * holds this share of its slot (a frame's too): two thirds as long as its
 * move, so each move runs over 100px or more of scroll on a phone.
 */
export const POCKET_STEP_HOLD = 0.4;
export const FRAME_STEP_HOLD = POCKET_STEP_HOLD;
/**
 * A band's opening move plays while the band rises into view: from when its
 * top is ENTRY_FROM of the way down the viewport to when it is ENTRY_TO of
 * the viewport under the header. It starts only once the block before the
 * band has risen clear of the reading line (engine.ts LINE, 60%: with the
 * band's top at 55%, the block's last line, at least 24px above the band,
 * sits 66px or more above the line on a 390 x 844 phone), so nothing moves
 * under a sentence still being read; and the drawing is whole before its
 * band pins and before the text after it reaches the reading line.
 */
export const ENTRY_FROM = 0.55;
export const ENTRY_TO = 0.18;

export type PocketOptions = {
  lead?: Readonly<Record<string, number>>;
  hold?: Readonly<Record<string, number>>;
  /** A placement's own share of its runway that steps (the rest holds the last formation); a frame's default is FRAME_REFORM. */
  reform?: Readonly<Record<string, number>>;
  frames?: readonly string[];
};

/**
 * The pockets of one reel, in page order. Each plays the formations after
 * the one the pocket before it ended on, up to the one that ends it,
 * opening on that one (the first pocket: the reel's opening formation, at
 * rest), and skipping what a phone never plays (pocketSkip: a crossfade
 * only the stage needs). Placements no formation ends have no pocket. A
 * placement whose formation comes before the previous pocket's is a
 * problem, and plays nothing.
 */
export function pocketPlans(c: CompiledMorph, placements: readonly string[], problems: string[] = [], opts: PocketOptions = {}): PocketPlan[] {
  const out: PocketPlan[] = [];
  let last = 0;
  let first = true;
  for (const key of placements) {
    const to = c.formations.findIndex((f) => f.pocket.includes(key));
    if (to < 0) continue;
    const framed = !!opts.frames?.includes(key);
    const reform = opts.reform?.[key] ?? (framed ? FRAME_REFORM : POCKET_REFORM);
    const hold = opts.hold?.[key] ?? (framed ? FRAME_STEP_HOLD : POCKET_STEP_HOLD);
    const lead = opts.lead?.[key] ?? 0;
    const run = c.formations[to].run;
    if (to < last || (to === last && !first)) {
      problems.push(`${key}: its formation (${c.formations[to].id}) comes before the previous pocket's (${c.formations[last].id})`);
      out.push({ key, steps: [to], run, lead, reform, hold });
      continue;
    }
    const played: number[] = [];
    let open = last;
    for (let i = last + 1; i <= to; i++) {
      if (c.formations[i].opens && i < to) {
        open = i;
        played.length = 0;
      } else if (!c.formations[i].pocketSkip) played.push(i);
    }
    const short = played.filter((i) => c.moves[i]?.ease === "crossfade");
    out.push({ key, steps: [open, ...played], run, lead, reform, hold, ...(open !== last ? { own: true } : {}), ...(short.length ? { short } : {}) });
    last = to;
    first = false;
  }
  return out;
}

/** Where a pocket is at progress p: steps[a], moving to steps[b] by t (t 0: holding steps[a]). */
export type PocketAt = { a: number; b: number; t: number };

/**
 * open "line": the band rises as the through-line alone (the band before is still on screen). regrow: the
 * band opens on steps[0] itself, not on the move out of it: it rises holding steps[0] (or, opening on the
 * line, growing steps[0] back out of it), and its pinned range plays every move from steps[0] on.
 */
type StepPlan = Pick<PocketPlan, "steps"> & Partial<Pick<PocketPlan, "lead" | "reform" | "hold" | "short">> & { open?: "line"; regrow?: boolean; fold?: boolean };

/**
 * Where a pocket is at progress p (0: the band pins; 1: it lets go). The
 * first `reform` of the runway is the opening's hold (`lead` of a slot),
 * then each move and, between two moves, a hold (`hold` of a slot,
 * POCKET_STEP_HOLD by default); the rest of the runway
 * holds the last one.
 */
export function pocketAt(plan: StepPlan, p: number): PocketAt {
  const n = plan.steps.length - 1;
  const q = clamp(p / (plan.reform ?? POCKET_REFORM), 0, 1);
  if (n <= 0 || q <= 0) return { a: 0, b: 1, t: 0 };
  if (q >= 1) return { a: n, b: n + 1, t: 0 };
  const H = clamp(plan.hold ?? POCKET_STEP_HOLD, 0, 0.9);
  const M = 1 - H;
  const L = Math.max(0, plan.lead ?? 0);
  // A crossfade (nothing moving) takes a short slot.
  const w = (j: number) => (plan.short?.includes(plan.steps[j + 1]) ? CROSSFADE_SLOT : 1) * M;
  let total = L + (n - 1) * H;
  for (let j = 0; j < n; j++) total += w(j);
  let x = q * total - L;
  if (x <= 0) return { a: 0, b: 1, t: 0 };
  for (let j = 0; j < n; j++) {
    const Mj = w(j);
    if (x < Mj) return { a: j, b: j + 1, t: x / Mj };
    x -= Mj;
    if (j < n - 1) {
      if (x < H) return { a: j + 1, b: j + 2, t: 0 };
      x -= H;
    }
  }
  return { a: n, b: n + 1, t: 0 };
}

const jumps = new WeakMap<CompiledMorph, Map<string, Move>>();

/**
 * The move from formation `from` to formation `to` (any two): the
 * compiled move when they are consecutive, else one planned once from the
 * two formations, in the destination's ease, stagger and order, straight
 * (a pocket opening out of the orb: every piece streams out of it).
 */
export function moveBetween(c: CompiledMorph, from: number, to: number): Move | null {
  if (to === from + 1) return c.moves[to];
  if (to === from) return null;
  // Past formations that draw exactly what `from` draws (a pocketSkip a phone shows the same), the move
  // into `to` is its own compiled one.
  if (to > from + 1 && c.formations.slice(from + 1, to).every((f) => f.states.every((s, k) => sameState(s, c.formations[from].states[k])))) {
    return c.moves[to];
  }
  let cache = jumps.get(c);
  if (!cache) jumps.set(c, (cache = new Map()));
  const key = `${from}>${to}`;
  let m = cache.get(key);
  if (!m) {
    const own = c.moves[to];
    const ids = c.pool.map((p) => p.id);
    const stagger = own?.stagger ?? DEFAULT_STAGGER;
    const a = c.formations[from];
    const b = c.formations[to];
    const pieces = b.states.map((s, k) => planMove(a.states[k], s, 0));
    // Out of the orb: its rings travel into the drawing's named parts; every stroke that was hidden in it
    // draws itself from its own end nearest the orb's center, so nothing flies across the band.
    const center = centerOf(a.states[ids.indexOf("core")] ?? a.states[0]);
    const starts = staggerStarts(pieces, ids, stagger, own?.order);
    const via = planVia(ids, a, b, pieces, { cap: 0, out: 0.3, in: 0.35 }, { x: center[0], y: center[1] }, undefined, starts, stagger);
    m = { to, ease: own?.ease ?? "standard", stagger, bend: 0, pieces, order: own?.order, starts, via };
    cache.set(key, m);
  }
  return m;
}

/** The strings `t` of the way from formation `from` to formation `to` (any two): either end's own frame, exactly. */
export function stepFrame(phone: CompiledMorph, from: number, to: number, t: number, easings: Easings): MorphFrame {
  if (t <= 0) return phone.formations[from].frame;
  if (t >= 1) return phone.formations[to].frame;
  const move = moveBetween(phone, from, to);
  if (!move) return phone.formations[to].frame;
  return frameOfNow(movingAt(move, phone.formations[from], phone.formations[to], t, easings));
}

/** A pocket's strings at progress p, from the phone formations. Holds are the formations' own frames. */
export function pocketFrame(phone: CompiledMorph, plan: StepPlan, p: number, easings: Easings): MorphFrame {
  const { a, b, t } = pocketAt(plan, p);
  const steps = plan.steps;
  if (t <= 0 || b >= steps.length) return phone.formations[steps[Math.min(a, steps.length - 1)]].frame;
  return stepFrame(phone, steps[a], steps[b], t, easings);
}

/**
 * The scroll range [e0, e1] over which a band's opening move plays as it
 * rises into view (`from`, ENTRY_FROM by default, to `to`, ENTRY_TO by default): it ends before the band
 * pins (top - headerH), and starts no earlier than the top of the page.
 */
export function pocketEntry(top: number, vh: number, headerH: number, from = ENTRY_FROM, to = ENTRY_TO): [number, number] {
  const e1 = Math.max(1, top - headerH - to * vh);
  const e0 = Math.min(Math.max(0, top - from * vh), e1 - 1);
  return [e0, e1];
}

/** The pieces that draw the line running under the whole story: the horizon, every machine's floor, the ceiling, the people's base line, the ground. */
export const LINE_PIECES = ["hzL", "hzR"] as const;

const openers = new WeakMap<CompiledMorph, Map<string, { f: ResolvedFormation; move: Move }>>();

/**
 * The through-line's two halves (LINE_PIECES) met in the middle of the gap a drawing leaves between them
 * (the glasses stand on the line between its halves): one unbroken line, never two stubs with a hole
 * where the drawing was. Halves at different heights, or either unseen, are left as they are.
 */
function closeLine(ids: readonly string[], states: PieceState[]): PieceState[] {
  const [l, r] = LINE_PIECES.map((id) => ids.indexOf(id));
  const L = states[l];
  const R = states[r];
  if (!L || !R || L.kind !== "line" || R.kind !== "line" || L.parked || R.parked || !(L.look.o > 0) || !(R.look.o > 0)) return states;
  if (Math.abs(L.g.y1 - L.g.y2) > 0.5 || Math.abs(R.g.y1 - R.g.y2) > 0.5 || Math.abs(L.g.y2 - R.g.y1) > 0.5) return states;
  const lx = Math.max(L.g.x1, L.g.x2);
  const rx = Math.min(R.g.x1, R.g.x2);
  if (!(rx > lx)) return states;
  const mid = (lx + rx) / 2;
  const out = states.slice();
  out[l] = { ...L, g: L.g.x2 >= L.g.x1 ? { ...L.g, x2: mid } : { ...L.g, x1: mid } };
  out[r] = { ...R, g: R.g.x1 <= R.g.x2 ? { ...R.g, x1: mid } : { ...R.g, x2: mid } };
  return out;
}

/**
 * What a band rises as when the band before it is still on screen (so the
 * drawing it would open on is still in view): only the through-line as the
 * band before drew it (LINE_PIECES), every other piece unseen, waiting to
 * grow out of it. The move into `to` draws each stroke out of its end
 * nearest the line while the line itself travels to its new place.
 * `close`: the line runs unbroken under where the drawing was (closeLine),
 * the halves drawing back to their own ends as the drawing grows.
 */
export function lineOpener(phone: CompiledMorph, from: number, to: number, close = false): { f: ResolvedFormation; move: Move } {
  let cache = openers.get(phone);
  if (!cache) openers.set(phone, (cache = new Map()));
  const key = `${from}>${to}${close ? " closed" : ""}`;
  let got = cache.get(key);
  if (!got) {
    const ids = phone.pool.map((p) => p.id);
    const a = phone.formations[from];
    const b = phone.formations[to];
    const isLine = (k: number) => (LINE_PIECES as readonly string[]).includes(ids[k]);
    const open = b.states.map((s, k): PieceState => (isLine(k) ? a.states[k] : ({ ...s, look: { ...s.look, o: 0 }, parked: true } as PieceState)));
    const states = close ? closeLine(ids, open) : open;
    const lineYs = ids.flatMap((id, k) => {
      const st = a.states[k];
      return isLine(k) && st.kind === "line" && st.look.o > 0 && !st.parked ? [(st.g.y1 + st.g.y2) / 2] : [];
    });
    const sinkY = lineYs.length ? lineYs.reduce((x, y) => x + y, 0) / lineYs.length : VIEW_H / 2;
    const mark = { ...b.mark, o: 0 };
    const f: ResolvedFormation = { ...b, id: `${a.id} line`, states, mark, frame: frameOfState(states, mark, b.window, b.layer) };
    const pieces = b.states.map((s, k) => planMove(states[k], s, 0));
    const own = phone.moves[to];
    const stagger = own?.stagger ?? DEFAULT_STAGGER;
    const starts = staggerStarts(pieces, ids, stagger, own?.order);
    const via = planVia(ids, f, b, pieces, { cap: 0, out: 0.05, in: 0.1, grow: true }, { y: sinkY }, undefined, starts, stagger);
    // A traced contour of the drawing still grows the way its own move draws it: from its first point, at the pen's pace.
    own?.via?.pieces.forEach((v, k) => {
      if (v?.w1 && via?.pieces[k]) via.pieces[k] = { out: planMove(states[k], states[k], 0), in: v.in, w1: v.w1 };
    });
    const move: Move = { to, ease: own?.ease ?? "standard", stagger, bend: 0, pieces, order: own?.order, starts, via };
    cache.set(key, (got = { f, move }));
  }
  return got;
}

/**
 * A pocket's strings at scroll y. With an entry, its opening move (steps[0]
 * to steps[1], or the through-line to steps[1] when the plan opens on the
 * line) plays over the entry as the band rises, and its pinned range plays
 * the rest (steps from 1 on); without one, the pinned range plays every
 * step. A pure function of y: scrolling back plays it backwards.
 */
export function pocketFrameAt(
  phone: CompiledMorph,
  plan: StepPlan,
  entry: readonly [number, number] | null,
  range: readonly [number, number],
  y: number,
  easings: Easings,
): MorphFrame {
  const steps = plan.steps;
  if (entry && plan.regrow) {
    if (y < entry[1]) {
      if (plan.open !== "line") return phone.formations[steps[0]].frame;
      const t = clamp((y - entry[0]) / (entry[1] - entry[0]), 0, 1);
      const { f, move } = lineOpener(phone, steps[0], steps[0]);
      if (t <= 0) return f.frame;
      if (t >= 1) return phone.formations[steps[0]].frame;
      return frameOfNow(movingAt(move, f, phone.formations[steps[0]], t, easings));
    }
    return pocketFrame(phone, plan, pocketProgress(range, y), easings);
  }
  if (entry && steps.length > 1) {
    if (y < entry[1]) {
      const t = clamp((y - entry[0]) / (entry[1] - entry[0]), 0, 1);
      if (plan.open !== "line") return stepFrame(phone, steps[0], steps[1], t, easings);
      const { f, move } = lineOpener(phone, steps[0], steps[1]);
      if (t <= 0) return f.frame;
      if (t >= 1) return phone.formations[steps[1]].frame;
      return frameOfNow(movingAt(move, f, phone.formations[steps[1]], t, easings));
    }
    return pocketFrame(phone, { ...plan, steps: steps.slice(1) }, pocketProgress(range, y), easings);
  }
  return pocketFrame(phone, plan, pocketProgress(range, y), easings);
}

/**
 * A keyed pocket (a phone's band in flow over the text it steps through:
 * the five machines and the four pairs where their frame does not fit on
 * one screen, the hands' paragraphs): the band never pins, the text is
 * plain flow after it, and each step plays as its item comes up the
 * screen, so the drawing changes where the words do and nothing pins the
 * text. `tops`: the document tops of the items the moves key to, in order
 * (one per move after the band's opening one); `line`: where each item's
 * top lands its move, px from the viewport's top (one line for all, or
 * one per item: a list's later items land lower on the screen, so the
 * band above them is still on screen when they do). Each move ends as its
 * item's top reaches its line and runs over KEYED_MOVE px of scroll
 * before it (0.8 of the step from the item before, at least KEYED_MIN),
 * never before the move before it has ended and held; the first starts no
 * earlier than `after` (the band's opening move).
 */
export const KEYED_MIN = 100;
export const KEYED_MAX = 160;
export const KEYED_FIRST = 120;
export const KEYED_HOLD = 8;
/**
 * `latest`: the last scroll at which a move may still end (the band still mostly on screen). Where the
 * items crowd too close for every move to land on its own line before then (a small phone, where a
 * list's frame cannot pin), the later moves land earlier instead, each over KEYED_SQUEEZE px or more, so
 * every machine still forms in the band and none plays off screen.
 */
export const KEYED_SQUEEZE = 64;
export function keyedRanges(tops: readonly number[], line: number | readonly number[], after: number, latest = Infinity): [number, number][] {
  const out: [number, number][] = [];
  const m = tops.length;
  let prevEnd = after;
  tops.forEach((top, j) => {
    let e = top - (typeof line === "number" ? line : line[Math.min(j, line.length - 1)]);
    // Room for the moves still to come before `latest`, each squeezed to its least.
    const cap = latest - (m - 1 - j) * (KEYED_SQUEEZE + KEYED_HOLD);
    const squeezed = e > cap;
    if (squeezed) e = cap;
    const span = j === 0 ? KEYED_FIRST : clamp(0.8 * (top - tops[j - 1]), KEYED_MIN, KEYED_MAX);
    const s0 = Math.max(e - span, prevEnd + KEYED_HOLD);
    const least = squeezed || e - s0 < KEYED_MIN ? Math.min(KEYED_MIN, Math.max(KEYED_SQUEEZE, cap - s0)) : KEYED_MIN;
    if (e < s0 + least) e = s0 + least;
    out.push([s0, e]);
    prevEnd = e;
  });
  return out;
}

/**
 * A drawing folding down into the through-line it stands on, `t` of the way (0: the drawing, 1: the line
 * alone, unbroken under where the drawing was): the line opener's grow played backwards, each stroke
 * drawing back into its end nearest the line. 1 - t is the same drawing growing back out of the line.
 */
export function foldFrame(phone: CompiledMorph, i: number, t: number, easings: Easings): MorphFrame {
  if (t <= 0) return phone.formations[i].frame;
  const { f, move } = lineOpener(phone, i, i, true);
  if (t >= 1) return f.frame;
  return frameOfNow(movingAt(move, f, phone.formations[i], 1 - t, easings));
}

/**
 * A keyed pocket's strings at scroll y: its opening move over the entry, then each move over its own range.
 * With `fold`, one range more than its moves: the last drawing folds into its through-line over it.
 */
export function keyedFrameAt(
  phone: CompiledMorph,
  plan: StepPlan,
  entry: readonly [number, number] | null,
  ranges: readonly (readonly [number, number])[],
  y: number,
  easings: Easings,
): MorphFrame {
  const steps = plan.steps;
  if (entry && steps.length > 1 && y < entry[1]) return pocketFrameAt(phone, plan, entry, [entry[1], entry[1] + 1], y, easings);
  // steps[1] holds from the end of the band's opening move; each range moves steps[j + 1] into steps[j + 2].
  for (let j = 0; j < ranges.length && j + 2 < steps.length; j++) {
    const [s0, s1] = ranges[j];
    if (y < s0) return phone.formations[steps[j + 1]].frame;
    if (y < s1) return stepFrame(phone, steps[j + 1], steps[j + 2], (y - s0) / (s1 - s0), easings);
  }
  const last = steps[Math.min(steps.length - 1, ranges.length + 1)];
  const fold = plan.fold && steps.length > 1 ? ranges[steps.length - 2] : undefined;
  if (fold) return foldFrame(phone, last, (y - fold[0]) / (fold[1] - fold[0]), easings);
  return phone.formations[last].frame;
}

/**
 * The scroll range [y0, y1] of a pocket: its band pins when the pocket's
 * top reaches the header (y0) and lets go when the pocket's runway (its
 * height less the band's) has scrolled by (y1). Kept inside the page's
 * scroll range and at least 1px long.
 */
export function pocketRange(top: number, height: number, bandH: number, headerH: number, maxScroll: number): [number, number] {
  const last = Math.max(1, maxScroll);
  let y0 = top - headerH;
  let y1 = y0 + Math.max(0, height - bandH);
  y1 = Math.min(Math.max(y1, 1), last);
  y0 = Math.min(Math.max(y0, 0), y1 - 1);
  return [y0, y1];
}

/** Progress through a pocket's range, 0..1. */
export function pocketProgress(range: readonly [number, number], y: number): number {
  const [y0, y1] = range;
  return clamp((y - y0) / (y1 - y0), 0, 1);
}

/**
 * A sticky band's top in the viewport at scroll y: it rides with its box
 * (document top T) until the box's top reaches the header, holds there for
 * the box's runway R (its height less the band's), then leaves with it.
 */
export function bandTopAt(T: number, R: number, headerH: number, y: number): number {
  return T - y + clamp(y - (T - headerH), 0, Math.max(0, R));
}
