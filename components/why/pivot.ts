/* ================================================================
   The pivot: "That’s why I built fathom."

   Ryan's favorite scene, now the payoff of the hero's promise. Just
   before it, the pieces have become the fathom mark, the exact brand path,
   at the hero orb's place and size. The navy iris opens out of the mark's
   own center, under and through its rings, and the words build once the
   navy covers them (text on the accent fill is AAA only on the navy).

   Everything here is a pure function of the scroll position and of
   geometry the director measured once (WhyDirector), so it costs no
   layout reads per frame and plays backwards exactly.

   The iris is a circle in viewport px around the mark's center. It starts
   once the pivot's section has risen past the mark (stage) or once the
   phone's band has finished the mark (pocket). While the section rises it
   grows slower than the section moves, so the circle never meets the
   section's top edge; once the section pins it opens faster, until it
   covers the viewport. The words then build one after another: they rise
   .25em and grow from .96 on the settle spring. Their opacity is a step,
   never a ramp: a word is unseen until its build starts and whole from its
   first pixel of scroll, so wherever the reader stops, every word on the
   navy is either absent or at full contrast (AAA), never part-way. Only
   position and scale are scrubbed. They are never out of focus.
   ================================================================ */

export type PivotGeom = {
  /** The stage's document top and height (px). */
  stageTop: number;
  stageH: number;
  /** The pinned section's height, and its natural top inside the stage (px). */
  secH: number;
  secOffset: number;
  /** The viewport (px) and 1svh (px). */
  vw: number;
  vh: number;
  svh: number;
  /** The iris's center: the mark's center, in viewport px while the mark is held. */
  ox: number;
  oy: number;
  /** The scroll position at which the iris starts to open from nothing. */
  start: number;
  /**
   * The radius at which the iris covers the line (its box's farthest corner from the iris's center, and a
   * little). The words build from then, so a phone's line (just under the mark) starts as soon as the navy
   * is behind it, not once it covers the whole screen. Default: the whole viewport.
   */
  cover?: number;
  /** svh between one word's build and the next (default WORD_STEP). */
  step?: number;
  /**
   * The mark's solid parts as radii from its center, in px, innermost first ([0, disk], then each band's
   * [inner, outer]). The iris's edge crosses each of them within IRIS_CROSS px of its own growth and
   * spends the rest in the dark gaps between them, so the two colors of the mark (ink outside the navy,
   * bone inside it) never sit side by side on one band.
   */
  bands?: readonly (readonly [number, number])[];
};

/** The iris's growth (px of radius) over which its edge crosses one solid part of the mark. */
export const IRIS_CROSS = 2;

/**
 * A radius stepped across the mark's solid parts (PivotGeom.bands): over a band, the edge moves the band's
 * whole width in IRIS_CROSS px of growth; the time the bands give up is spent in the gaps, each in
 * proportion to its width; past the mark's outer edge the radius is the growth itself.
 */
export function stepRadius(r: number, bands?: readonly (readonly [number, number])[]): number {
  if (!bands?.length || r <= 0) return r;
  const outer = bands[bands.length - 1][1];
  if (r >= outer) return r;
  // The parts in order: solid, gap, solid, gap, ..., solid; each with its width on screen and its share of growth.
  const parts: { from: number; to: number; solid: boolean }[] = [];
  let at = 0;
  for (const [a, b] of bands) {
    if (a > at) parts.push({ from: at, to: a, solid: false });
    parts.push({ from: Math.max(a, at), to: b, solid: true });
    at = b;
  }
  const solids = parts.filter((p) => p.solid);
  const gaps = parts.filter((p) => !p.solid);
  const saved = solids.reduce((t, p) => t + Math.max(0, p.to - p.from - IRIS_CROSS), 0);
  const gapW = gaps.reduce((t, p) => t + (p.to - p.from), 0) || 1;
  let grown = 0;
  for (const p of parts) {
    const w = p.to - p.from;
    const span = p.solid ? Math.min(w, IRIS_CROSS) : w + (saved * w) / gapW;
    if (r <= grown + span) return p.from + (span > 0 ? (w * (r - grown)) / span : w);
    grown += span;
  }
  return r;
}

/** Radius per px of scroll while the section still rises (under 1, so the circle stays inside it). */
export const IRIS_RISE = 0.92;
/** Radius per px of scroll once the section is pinned. */
export const IRIS_OPEN = 2.4;
/** Word i builds over WORD_DUR svh, starting WORD_STEP svh after word i - 1. */
export const WORD_STEP = 8;
export const WORD_DUR = 8;
export const WORD_COUNT = 5;
/** A word before it builds: unseen, .25em low, at .96. */
export const WORD_REST = { o: 0, y: 0.25, s: 0.96 } as const;

/** The section's top in the viewport at scroll y: rising, pinned at 0, then leaving. */
export function sectionTop(g: PivotGeom, y: number): number {
  const natural = g.stageTop + g.secOffset - y;
  const leaving = g.stageTop + g.stageH - g.secH - y;
  return Math.min(Math.max(0, natural), leaving);
}

/** The scroll position at which the section pins at the top of the viewport. */
export const pinY = (g: PivotGeom) => g.stageTop + g.secOffset;

/** The iris's radius in px at scroll y. */
export function irisRadius(g: PivotGeom, y: number): number {
  if (y <= g.start) return 0;
  const p = pinY(g);
  const rise = Math.max(0, Math.min(y, p) - g.start);
  const open = Math.max(0, y - Math.max(g.start, p));
  return stepRadius(IRIS_RISE * rise + IRIS_OPEN * open, g.bands);
}

/** The radius that covers the whole viewport from the iris's center. */
export function irisFull(g: PivotGeom): number {
  const dx = Math.max(g.ox, g.vw - g.ox);
  const dy = Math.max(g.oy, g.vh - g.oy);
  return Math.hypot(dx, dy) + 2;
}

/** The scroll position at which the iris covers the viewport. */
export function irisDoneY(g: PivotGeom): number {
  const full = irisFull(g);
  const p = pinY(g);
  const riseSpan = Math.max(0, p - g.start);
  const atPin = IRIS_RISE * riseSpan;
  if (atPin >= full) return g.start + full / IRIS_RISE;
  return Math.max(g.start, p) + (full - atPin) / IRIS_OPEN;
}

/** The iris clip at scroll y, in px of the section's own box. */
export function irisClip(g: PivotGeom, y: number): string {
  const r = irisRadius(g, y);
  const top = sectionTop(g, y);
  return `circle(${fmt(r)}px at ${fmt(g.ox)}px ${fmt(g.oy - top)}px)`;
}

/** The scroll position at which the iris covers the line (PivotGeom.cover), or the viewport. */
export function irisCoverY(g: PivotGeom): number {
  const done = irisDoneY(g);
  if (g.cover === undefined || g.cover >= irisFull(g)) return done;
  const p = pinY(g);
  const atPin = IRIS_RISE * Math.max(0, p - g.start);
  const y = atPin >= g.cover ? g.start + g.cover / IRIS_RISE : Math.max(g.start, p) + (g.cover - atPin) / IRIS_OPEN;
  return Math.min(done, y);
}

/** Word i's window, in scroll px: once the iris covers the line. */
export function wordWindow(g: PivotGeom, i: number): [number, number] {
  const from = irisCoverY(g) + i * (g.step ?? WORD_STEP) * g.svh;
  return [from, from + WORD_DUR * g.svh];
}

/** When the whole line is built. */
export const lineDoneY = (g: PivotGeom) => wordWindow(g, WORD_COUNT - 1)[1];

export type WordState = { o: number; y: number; s: number };

/** Word i at scroll y, through `ease` (the settle spring). Rest before, whole after. */
export function wordAt(g: PivotGeom, i: number, y: number, ease: (t: number) => number): WordState {
  const [a, b] = wordWindow(g, i);
  const t = y <= a ? 0 : y >= b ? 1 : (y - a) / (b - a);
  if (t <= 0) return { ...WORD_REST };
  if (t >= 1) return { o: 1, y: 0, s: 1 };
  const e = ease(t);
  // Whole as soon as it starts to build: a reader who stops mid-build never leaves a word part-way.
  return {
    o: 1,
    y: WORD_REST.y * (1 - e),
    s: WORD_REST.s + (1 - WORD_REST.s) * e,
  };
}

export function wordStyle(w: WordState): { transform: string; opacity: string } {
  return { transform: `translate(0, ${fmt(w.y, 3)}em) scale(${fmt(w.s, 4)})`, opacity: fmt(Math.min(1, Math.max(0, w.o)), 3) };
}

/**
 * The navy behind the mark, in the coordinates of the svg the mark is
 * drawn in: the iris circle while it opens, then the section's own box
 * once the circle covers the viewport (so it leaves with the section).
 * `k` is px per svg unit, (mx, my) the mark's center in svg units, which
 * sits at the iris's center (ox, oy) on screen. Empty: no navy.
 */
export function navyPath(g: PivotGeom, y: number, k: number, mx: number, my: number): string {
  const r = irisRadius(g, y);
  if (r <= 0 || !(k > 0)) return "";
  const top = sectionTop(g, y);
  const bottom = top + g.secH;
  if (bottom <= 0) return "";
  const toSvg = (vy: number) => my + (vy - g.oy) / k;
  if (r < irisFull(g)) {
    const R = r / k;
    return `M${fmt(mx - R)} ${fmt(my)}A${fmt(R)} ${fmt(R)} 0 1 0 ${fmt(mx + R)} ${fmt(my)}A${fmt(R)} ${fmt(R)} 0 1 0 ${fmt(mx - R)} ${fmt(my)}Z`;
  }
  return `M-9999 ${fmt(toSvg(top))}H9999V${fmt(toSvg(bottom))}H-9999Z`;
}

function fmt(n: number, d = 1): string {
  const p = 10 ** d;
  const v = Math.round(n * p) / p;
  return String(Object.is(v, -0) ? 0 : v);
}
