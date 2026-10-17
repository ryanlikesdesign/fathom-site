/* ================================================================
   /why: the scroll vocabulary the formation engine (morph/) and the
   director share. Pure: no window, no document.

   - Anchor: a sentence ([data-why-at]) whose edge reaches a line of the
     viewport, plus an offset in svh. anchors.ts turns one into the
     scroll position at which it lands.
   - Easings: the site's motion tokens, read once from :root and parsed
     here (cubic-bezier, the keywords, and the settle spring's linear()
     stop list), so a move eases exactly as the site's CSS would.
   ================================================================ */

/** Default viewport line an anchor must reach (fraction from the top). */
export const LINE = 0.6;

export type Ease = "linear" | "standard" | "settle" | "crossfade";
export type EaseFn = (t: number) => number;
export type Easings = Record<Ease, EaseFn>;

/** The anchor lands when the element's edge reaches `line` of the viewport, plus offset svh. */
export type Anchor = { at: string; edge?: "top" | "center" | "bottom"; line?: number; offset?: number };

/* ---------------------------------------------------------------- *
 * Easing
 * ---------------------------------------------------------------- */

const linearFn: EaseFn = (t) => t;

export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EaseFn {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      const d = dsx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x)));
}

const KEYWORDS: Record<string, [number, number, number, number]> = {
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

export const EASE_OUT: EaseFn = cubicBezier(...KEYWORDS["ease-out"]);

/** CSS linear(): stops with optional input percentages, missing inputs spread evenly. */
function linearStops(body: string): EaseFn | null {
  const pts: { out: number; at?: number }[] = [];
  for (const raw of body.split(",")) {
    const parts = raw.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return null;
    const out = Number(parts[0]);
    if (!Number.isFinite(out)) return null;
    const ats = parts.slice(1).map((p) => (p.endsWith("%") ? Number(p.slice(0, -1)) / 100 : NaN));
    if (ats.some((a) => !Number.isFinite(a)) || ats.length > 2) return null;
    if (!ats.length) pts.push({ out });
    else for (const at of ats) pts.push({ out, at });
  }
  if (pts.length < 2) return null;
  if (pts[0].at === undefined) pts[0].at = 0;
  if (pts[pts.length - 1].at === undefined) pts[pts.length - 1].at = 1;
  let max = -Infinity;
  for (const p of pts) {
    if (p.at === undefined) continue;
    if (p.at < max) p.at = max;
    max = p.at;
  }
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].at !== undefined) continue;
    let j = i;
    while (pts[j].at === undefined) j++;
    const a = pts[i - 1].at!;
    const b = pts[j].at!;
    const gaps = j - i + 1;
    for (let k = i; k < j; k++) pts[k].at = a + ((b - a) * (k - i + 1)) / gaps;
  }
  const xs = pts.map((p) => p.at!);
  const ys = pts.map((p) => p.out);
  return (t) => {
    if (t <= xs[0]) return ys[0];
    if (t >= xs[xs.length - 1]) return ys[ys.length - 1];
    // First stop past t; at a repeated input the later stop wins, as in CSS.
    let i = 1;
    while (i < xs.length && xs[i] <= t) i++;
    const x0 = xs[i - 1];
    const x1 = xs[i];
    return ys[i - 1] + ((ys[i] - ys[i - 1]) * (t - x0)) / (x1 - x0);
  };
}

/**
 * Parses a CSS easing token value: linear, the four keywords,
 * cubic-bezier(), or a linear() stop list (the settle spring, with its
 * small overshoot). Anything else returns the fallback.
 */
export function parseEasing(value: string | null | undefined, fallback: EaseFn = EASE_OUT): EaseFn {
  const s = (value ?? "").trim().toLowerCase();
  if (s === "linear") return linearFn;
  if (s in KEYWORDS) return cubicBezier(...KEYWORDS[s]);
  const bez = /^cubic-bezier\(([^)]*)\)$/.exec(s);
  if (bez) {
    const n = bez[1].split(",").map((v) => Number(v.trim()));
    if (n.length === 4 && n.every(Number.isFinite) && n[0] >= 0 && n[0] <= 1 && n[2] >= 0 && n[2] <= 1) {
      return cubicBezier(n[0], n[1], n[2], n[3]);
    }
    return fallback;
  }
  const lin = /^linear\((.*)\)$/.exec(s);
  if (lin) return linearStops(lin[1]) ?? fallback;
  return fallback;
}

/** The legacy --ease-standard value (globals.css), for the server and for a missing token. */
export const STANDARD_FALLBACK = "cubic-bezier(0.33, 1, 0.68, 1)";

/** Easings with no DOM: what the server uses, and what tokens fall back to. */
export function defaultEasings(): Easings {
  return { linear: linearFn, standard: parseEasing(STANDARD_FALLBACK), settle: EASE_OUT, crossfade: EASE_OUT };
}

/** The token each easing reads (on :root), parsed by parseEasing. */
export const EASING_TOKENS = {
  standard: "--ease-standard",
  settle: "--fathom-motion-settle-easing",
  crossfade: "--fathom-motion-crossfade-easing",
} as const;

export function readEasings(read: (token: string) => string): Easings {
  const d = defaultEasings();
  return {
    linear: linearFn,
    standard: parseEasing(read(EASING_TOKENS.standard), d.standard),
    settle: parseEasing(read(EASING_TOKENS.settle), EASE_OUT),
    crossfade: parseEasing(read(EASING_TOKENS.crossfade), EASE_OUT),
  };
}



/** Rounds to d decimals and prints the shortest form ("-0" prints as "0"). */
export function fmt(n: number, d: number): string {
  const p = 10 ** d;
  const v = Math.round(n * p) / p;
  return String(Object.is(v, -0) ? 0 : v);
}
