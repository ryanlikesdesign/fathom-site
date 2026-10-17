/* ================================================================
   The /why formation engine: pieces.

   Every illustration on a reel is drawn by one pool of pieces. A piece is
   one stroke, a parametric primitive, and it lives for the whole reel:
   between sections it travels, turns, resizes and bends into its place
   in the next drawing, and scrolling back reforms the one before.

   Kinds (fixed for life; see formation.ts):
     rect  {x, y, w, h, r, rot}  a rounded rect, r clamped to half the short
                                 side. r = w/2 = h/2 is a circle. rot turns it
                                 about its center, in degrees.
     line  {x1, y1, x2, y2}      a straight stroke.
     arc   {cx, cy, r, a0, a1}   part of a circle, from angle a0 to a1 in
                                 degrees: 0 is 3 o'clock, angles grow
                                 clockwise on screen. a1 - a0 = 360 is a full
                                 ring; the span is clamped to +/-360.
   A piece of any kind can shrink to a point (w = h = 0, a zero-length
   line, r = 0): that is how the reel's pieces converge into the pupil
   before the pivot and stream back out of the orb after it.

   Look (per piece, per formation):
     role    ink | soft | accent | ghost: the stroke's color role
     fill    none | ink | accent | navy | glass
     weight  0..2: 1 is --why-stroke, 2 is --fathom-border-emphasis, 0 draws
             no stroke (a fill on its own). Fractions blend the two.
     band    an extra stroke width in stage units (default 0). Unlike weight
             it scales with the art: a ring with weight 0 and band 8 is an
             8-unit band at any size (the mark's rings, drawn as pieces).
     o       opacity, 0..1

   Coordinates are stage units on the 600 x 800 grid every reel shares.
   Pure: no window, no document, so the server draws stills with exactly
   the strings the director writes.
   ================================================================ */

export const VIEW_W = 600;
export const VIEW_H = 800;

export type PieceKind = "rect" | "line" | "arc";

export type RectGeom = { x: number; y: number; w: number; h: number; r: number; rot: number };
export type LineGeom = { x1: number; y1: number; x2: number; y2: number };
export type ArcGeom = { cx: number; cy: number; r: number; a0: number; a1: number };
export type GeomOf<K extends PieceKind> = K extends "rect" ? RectGeom : K extends "line" ? LineGeom : ArcGeom;

export type Role = "ink" | "soft" | "accent" | "ghost";
export type Fill = "none" | "ink" | "accent" | "navy" | "glass";
export type Look = { role: Role; fill: Fill; weight: number; band: number; o: number };

/**
 * A piece as one formation draws it: its kind, its geometry, its look.
 * parked: the drawing does not use it; it lies inside a stroke of its own
 * color at least as wide (or under the orb's filled core), hidden at rest,
 * and travels visibly into it and out of it.
 */
export type PieceState =
  | { kind: "rect"; g: RectGeom; look: Look; parked?: boolean }
  | { kind: "line"; g: LineGeom; look: Look; parked?: boolean }
  | { kind: "arc"; g: ArcGeom; look: Look; parked?: boolean };

/**
 * A look on its way between two formations: each color is a mix of the
 * two ends ([from, to, share of `to`]); weight and opacity are numbers.
 */
export type LookMix = {
  stroke: [Role, Role, number];
  fill: [Fill, Fill, number];
  weight: number;
  band: number;
  o: number;
  /** Set while a stroke is shorter than about two of its own widths on its way to or from nothing: drawn with butt caps, so it thins away instead of leaving a round-cap dot. */
  cap?: "butt";
};

/** A piece at one scroll position: a formation's state, or one between two. */
export type PieceNow =
  | { kind: "rect"; g: RectGeom; look: LookMix }
  | { kind: "line"; g: LineGeom; look: LookMix }
  | { kind: "arc"; g: ArcGeom; look: LookMix };

export const DEFAULT_LOOK: Look = { role: "ink", fill: "none", weight: 1, band: 0, o: 1 };

/* ---------------------------------------------------------------- *
 * Authoring: what a formation file writes for each piece
 * ---------------------------------------------------------------- */

type LookIn = Partial<Look> & { parked?: boolean };
export type RectSpec = { kind: "rect"; x: number; y: number; w: number; h: number; r?: number; rot?: number } & LookIn;
export type LineSpec = { kind: "line"; x1: number; y1: number; x2: number; y2: number } & LookIn;
export type ArcSpec = { kind: "arc"; cx: number; cy: number; r: number; a0: number; a1: number } & LookIn;
export type PieceSpec = RectSpec | LineSpec | ArcSpec;

/** A rounded rect. */
export const rect = (x: number, y: number, w: number, h: number, r = 0, look: LookIn = {}): RectSpec => ({ kind: "rect", x, y, w, h, r, ...look });
/** A circle: a rect whose corner radius is half its side. */
export const circle = (cx: number, cy: number, radius: number, look: LookIn = {}): RectSpec =>
  ({ kind: "rect", x: cx - radius, y: cy - radius, w: 2 * radius, h: 2 * radius, r: radius, ...look });
export const line = (x1: number, y1: number, x2: number, y2: number, look: LookIn = {}): LineSpec => ({ kind: "line", x1, y1, x2, y2, ...look });
export const arc = (cx: number, cy: number, r: number, a0: number, a1: number, look: LookIn = {}): ArcSpec =>
  ({ kind: "arc", cx, cy, r, a0, a1, ...look });
/** A ring: a full-turn arc starting at `from` degrees. */
export const ring = (cx: number, cy: number, r: number, look: LookIn = {}, from = -90): ArcSpec => arc(cx, cy, r, from, from + 360, look);

/**
 * A piece of the given kind shrunk to the point (x, y): where pieces
 * gather to converge (the pupil) and where they emerge from (the orb).
 * `angle` sets a line's or an arc's heading at the point, so it leaves
 * already pointing the way it will grow.
 */
export function point(kind: PieceKind, x: number, y: number, look: LookIn = {}, angle = 0): PieceSpec {
  if (kind === "rect") return { kind, x, y, w: 0, h: 0, r: 0, ...look };
  if (kind === "line") return { kind, x1: x, y1: y, x2: x, y2: y, ...look };
  return { kind, cx: x, cy: y, r: 0, a0: angle, a1: angle, ...look };
}

/** A spec's geometry, normalized (rect r and rot defaulted). */
export function geomOf(spec: PieceSpec): PieceState["g"] {
  if (spec.kind === "rect") return { x: spec.x, y: spec.y, w: spec.w, h: spec.h, r: spec.r ?? 0, rot: spec.rot ?? 0 };
  if (spec.kind === "line") return { x1: spec.x1, y1: spec.y1, x2: spec.x2, y2: spec.y2 };
  return { cx: spec.cx, cy: spec.cy, r: spec.r, a0: spec.a0, a1: spec.a1 };
}

/**
 * A piece scaled by k about (ox, oy), then moved by (dx, dy): how a
 * formation's phone variant fits the whole drawing into the phone's view
 * (formation.ts). Sizes, corners, radii and bands scale with it; angles,
 * headings and weights (screen widths) do not. Never distorts: one k for
 * both axes.
 */
export function placeState(s: PieceState, k: number, dx: number, dy: number, ox: number, oy: number): PieceState {
  const X = (x: number) => ox + (x - ox) * k + dx;
  const Y = (y: number) => oy + (y - oy) * k + dy;
  const look = { ...s.look, band: s.look.band * k };
  const parked = s.parked ? { parked: true } : {};
  if (s.kind === "rect") {
    const g = s.g;
    return { kind: "rect", look, ...parked, g: { x: X(g.x), y: Y(g.y), w: g.w * k, h: g.h * k, r: g.r * k, rot: g.rot } };
  }
  if (s.kind === "line") {
    const g = s.g;
    return { kind: "line", look, ...parked, g: { x1: X(g.x1), y1: Y(g.y1), x2: X(g.x2), y2: Y(g.y2) } };
  }
  const g = s.g;
  return { kind: "arc", look, ...parked, g: { cx: X(g.cx), cy: Y(g.cy), r: g.r * k, a0: g.a0, a1: g.a1 } };
}

export function resolveSpec(spec: PieceSpec, base: Look): PieceState {
  const look: Look = {
    role: spec.role ?? base.role,
    fill: spec.fill ?? base.fill,
    weight: spec.weight ?? base.weight,
    band: spec.band ?? base.band,
    o: spec.o ?? base.o,
  };
  return (spec.parked ? { kind: spec.kind, g: geomOf(spec), look, parked: true } : { kind: spec.kind, g: geomOf(spec), look }) as PieceState;
}

export const fixedMix = (look: Look): LookMix => ({
  stroke: [look.role, look.role, 0],
  fill: [look.fill, look.fill, 0],
  weight: look.weight,
  band: look.band,
  o: look.o,
});
export const asNow = (s: PieceState): PieceNow => ({ kind: s.kind, g: s.g, look: fixedMix(s.look) }) as PieceNow;

/* ---------------------------------------------------------------- *
 * Geometry helpers
 * ---------------------------------------------------------------- */

export type Pt = readonly [number, number];

/** The point a piece travels by: a rect's center, a line's midpoint, an arc's circle center. */
export function centerOf(s: { kind: PieceKind; g: PieceState["g"] }): Pt {
  if (s.kind === "rect") {
    const g = s.g as RectGeom;
    return [g.x + g.w / 2, g.y + g.h / 2];
  }
  if (s.kind === "line") {
    const g = s.g as LineGeom;
    return [(g.x1 + g.x2) / 2, (g.y1 + g.y2) / 2];
  }
  const g = s.g as ArcGeom;
  return [g.cx, g.cy];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const DEG = Math.PI / 180;

/** b shifted by whole turns to sit within half a turn of a: the short way round. */
export function nearestTurn(a: number, b: number): number {
  return b - 360 * Math.round((b - a) / 360);
}

/**
 * Everything one piece needs to move from one formation to the next,
 * worked out once at compile time so a frame is only arithmetic.
 *
 * Travel: the piece's center rides a quadratic bezier from its old
 * center to its new one. The control point sits off the straight line
 * by `bend` times the distance, to the right of the direction of travel
 * (positive bend: every piece swings the same way, a clockwise swirl;
 * negative: counterclockwise). Its shape (size, corner, length, heading,
 * radius, angles) changes about that center.
 *
 * A line turns the short way, keeping its length as it does (polar). An
 * arc's angles turn the short way too. A piece shrunk to a point takes
 * the heading of the other end, so it grows out already pointing the
 * right way and never spins.
 */
export type PieceMove = {
  kind: PieceKind;
  from: PieceState;
  to: PieceState;
  /** True when the two ends are identical: the piece holds through the move. */
  still: boolean;
  c0: Pt;
  c1: Pt;
  ctrl: Pt;
  /** Travel distance between centers, in stage units. */
  dist: number;
  /** line: [length, heading] at each end, the heading unwrapped the short way. */
  polar?: { len0: number; len1: number; ang0: number; ang1: number };
  /** arc: the destination's angles, unwrapped the short way. */
  arcTo?: { a0: number; a1: number };
  /**
   * How its opacity changes: "half" (fadeAt), or, for a piece lying down in
   * a stroke of its own color (parked), "late": whole until the last
   * PARK_FADE of its trip, so it travels into the stroke and only then is
   * gone; "early": the other way, seen from the first PARK_FADE; "unseen":
   * parked at both ends, it travels unseen (a parked piece is only ever
   * hidden by its host at rest, so it is never shown while its host moves).
   */
  fade: "half" | "late" | "early" | "unseen";
  /**
   * The extent (stage units) below which the piece fades with its own size: three stroke widths, or its
   * seen end's own extent when that is smaller (a dot of an eye stays whole while it travels). A piece
   * shrinking into its host or a point thins away as it goes, never a round-cap dot (extentFade).
   */
  ref: number;
};

/**
 * A stroke's width in stage units: --why-stroke is 2px, about 3 units on the stage's pane and a phone's
 * band alike (600 units across 360 to 620px); the emphasis weight adds a px; a band (stage units) adds itself.
 */
export function strokeUnits(weight: number, band = 0): number {
  const w = Math.max(0, weight);
  return (w <= 1 ? 3 * w : 3 + 1.5 * (w - 1)) + Math.max(0, band);
}

/** A piece's visible extent in stage units: a line's length, an arc's length (a full turn at most), a rect's longer side. */
export function extentOf(kind: PieceKind, g: PieceState["g"]): number {
  if (kind === "line") {
    const l = g as LineGeom;
    return Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
  }
  if (kind === "arc") {
    const a = g as ArcGeom;
    return (Math.max(0, a.r) * Math.min(360, Math.abs(a.a1 - a.a0)) * Math.PI) / 180;
  }
  const r = g as RectGeom;
  return Math.max(0, r.w, r.h);
}

const smooth = (x: number) => {
  const t = x <= 0 ? 0 : x >= 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};

/**
 * The share of a moving piece's opacity its size allows: 1 at its reference extent (PieceMove.ref) and
 * over, easing to 0 at a third of it. So a stroke on its way into a point or its host thins out as it
 * shrinks (and grows in the same way), never a round-cap dot at full ink.
 */
export function extentFade(len: number, ref: number): number {
  if (!(ref > 0)) return 1;
  return smooth((len - ref / 3) / ((2 * ref) / 3));
}

/** The share of a trip over which a piece lying down in its host (or leaving it) fades. */
export const PARK_FADE = 0.15;

const sameLook = (a: Look, b: Look) => a.role === b.role && a.fill === b.fill && a.weight === b.weight && a.band === b.band && a.o === b.o;
function sameGeom(a: PieceState["g"], b: PieceState["g"]): boolean {
  const ka = Object.keys(a) as (keyof typeof a)[];
  return ka.every((k) => a[k] === (b as typeof a)[k]);
}
export const sameState = (a: PieceState, b: PieceState) => a.kind === b.kind && sameLook(a.look, b.look) && sameGeom(a.g, b.g);

/** A line this short (grid units) is a point: the generator rounds parked points to a tenth. */
const POINT_LEN = 1.5;

export function planMove(from: PieceState, to: PieceState, bend: number): PieceMove {
  const c0 = centerOf(from);
  const c1 = centerOf(to);
  const dx = c1[0] - c0[0];
  const dy = c1[1] - c0[1];
  const dist = Math.hypot(dx, dy);
  // Right of travel on screen (y grows down): (-dy, dx), unit length, times bend * dist.
  const ctrl: Pt = [(c0[0] + c1[0]) / 2 - dy * bend, (c0[1] + c1[1]) / 2 + dx * bend];
  const fade = from.parked && to.parked ? "unseen" : to.parked ? "late" : from.parked ? "early" : "half";
  // The seen ends' extent, capped at three stroke widths: the size under which the piece fades with its size.
  const seen = (s: PieceState) => s.look.o > 0 && !s.parked;
  const ends = [from, to].filter(seen);
  const ref = ends.length ? Math.max(...ends.map((s) => Math.min(3 * strokeUnits(s.look.weight, s.look.band), extentOf(s.kind, s.g)))) : 0;
  const move: PieceMove = { kind: from.kind, from, to, still: sameState(from, to), c0, c1, ctrl, dist, fade, ref };
  if (from.kind === "line" && to.kind === "line") {
    const a = from.g;
    const b = to.g;
    const len0 = Math.hypot(a.x2 - a.x1, a.y2 - a.y1);
    const len1 = Math.hypot(b.x2 - b.x1, b.y2 - b.y1);
    let ang0 = Math.atan2(a.y2 - a.y1, a.x2 - a.x1) / DEG;
    let ang1 = Math.atan2(b.y2 - b.y1, b.x2 - b.x1) / DEG;
    // A point (a parked line, within rounding of zero length) has no heading of its own: a stroke
    // growing out of one, or shrinking into one, keeps the other end's heading and never spins.
    if (len0 < POINT_LEN) ang0 = ang1;
    if (len1 < POINT_LEN) ang1 = ang0;
    move.polar = { len0, len1, ang0, ang1: nearestTurn(ang0, ang1) };
  } else if (from.kind === "arc" && to.kind === "arc") {
    const a = from.g;
    const b = to.g;
    if (b.r === 0) {
      // Closing to a point: the arc keeps its angles and shrinks into its center.
      move.arcTo = { a0: a.a0, a1: a.a1 };
    } else {
      // Opening from a point, the arc starts on the destination's angles
      // (pieceAt); otherwise it turns the short way to them.
      const midA = a.r === 0 ? (b.a0 + b.a1) / 2 : (a.a0 + a.a1) / 2;
      const midB = (b.a0 + b.a1) / 2;
      const shift = nearestTurn(midA, midB) - midB;
      move.arcTo = { a0: b.a0 + shift, a1: b.a1 + shift };
    }
  }
  return move;
}

/**
 * Opacity on the way from a to b: rising over the first half of the move,
 * falling over the second. Whatever fades in is whole before whatever it
 * replaces starts to go, so a crossfade between two pieces in the same
 * place (or a piece and the brand mark) never dips through the ground.
 */
export function fadeAt(a: number, b: number, u: number): number {
  const e = u <= 0 ? 0 : u >= 1 ? 1 : u;
  return b >= a ? lerp(a, b, Math.min(1, 2 * e)) : lerp(a, b, Math.max(0, 2 * e - 1));
}

/** A piece's opacity u of the way through its move (PieceMove.fade). */
export function opacityAt(m: Pick<PieceMove, "from" | "to" | "fade">, u: number): number {
  const a = m.from.look.o;
  const b = m.to.look.o;
  if (m.fade === "unseen") return 0;
  if (m.fade === "late") return u <= 1 - PARK_FADE ? a : lerp(a, 0, Math.min(1, (u - (1 - PARK_FADE)) / PARK_FADE));
  if (m.fade === "early") return u >= PARK_FADE ? b : lerp(0, b, Math.max(0, u / PARK_FADE));
  return fadeAt(a, b, u);
}

/** A point on the move's travel curve at u (0..1, or a little past 1 on the settle spring). */
export function travelAt(m: Pick<PieceMove, "c0" | "c1" | "ctrl">, u: number): Pt {
  const v = 1 - u;
  return [v * v * m.c0[0] + 2 * u * v * m.ctrl[0] + u * u * m.c1[0], v * v * m.c0[1] + 2 * u * v * m.ctrl[1] + u * u * m.c1[1]];
}

/**
 * The piece `u` of the way through its move. `local` is its un-eased
 * progress: at or below 0 the piece is exactly its old state, at or above
 * 1 exactly its new one, so holds are exact to the string. `u` is the
 * eased value (it may pass 1 a little on the settle spring).
 */
export function pieceAt(m: PieceMove, local: number, u: number): PieceNow {
  if (local <= 0 || m.still) return asNow(m.from);
  if (local >= 1) return asNow(m.to);
  const look: LookMix = {
    stroke: [m.from.look.role, m.to.look.role, u],
    fill: [m.from.look.fill, m.to.look.fill, u],
    weight: lerp(m.from.look.weight, m.to.look.weight, u),
    band: lerp(m.from.look.band, m.to.look.band, u),
    o: opacityAt(m, u),
  };
  const [cx, cy] = travelAt(m, u);
  let out: PieceNow | null = null;
  if (m.from.kind === "rect" && m.to.kind === "rect") {
    const a = m.from.g;
    const b = m.to.g;
    const w = Math.max(0, lerp(a.w, b.w, u));
    const h = Math.max(0, lerp(a.h, b.h, u));
    out = { kind: "rect", look, g: { x: cx - w / 2, y: cy - h / 2, w, h, r: Math.max(0, lerp(a.r, b.r, u)), rot: lerp(a.rot, b.rot, u) } };
  } else if (m.from.kind === "line" && m.polar) {
    const p = m.polar;
    const half = Math.max(0, lerp(p.len0, p.len1, u)) / 2;
    const ang = lerp(p.ang0, p.ang1, u) * DEG;
    const hx = Math.cos(ang) * half;
    const hy = Math.sin(ang) * half;
    out = { kind: "line", look, g: { x1: cx - hx, y1: cy - hy, x2: cx + hx, y2: cy + hy } };
  } else if (m.from.kind === "arc" && m.to.kind === "arc" && m.arcTo) {
    const a = m.from.g;
    const a0From = a.r === 0 ? m.arcTo.a0 : a.a0;
    const a1From = a.r === 0 ? m.arcTo.a1 : a.a1;
    out = {
      kind: "arc",
      look,
      g: { cx, cy, r: Math.max(0, lerp(a.r, m.to.g.r, u)), a0: lerp(a0From, m.arcTo.a0, u), a1: lerp(a1From, m.arcTo.a1, u) },
    };
  }
  if (out) {
    // Thinning with its size: a stroke shrinking toward nothing fades as it goes, its caps cut square.
    const len = extentOf(out.kind, out.g);
    const f = extentFade(len, m.ref);
    if (f < 1) {
      look.o *= f;
      if (len < (2 * m.ref) / 3 + 1e-9) look.cap = "butt";
    }
    return out;
  }
  // Kinds never change (compileMorph refuses it); hold the old state to be safe.
  return asNow(m.from);
}
