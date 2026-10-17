/* ================================================================
   The /why formation engine: strings.

   Each piece is one <path>. Its d string has a constant command
   structure per kind, so a piece is the same path all its life and only
   its numbers change:
     rect  M L A L A L A L A Z   (four sides, four quarter corners; corners
                                  of radius 0 and sides of length 0 are
                                  allowed, so a rect can be a square, a
                                  circle, a pill or a point)
     line  M L
     arc   M A A                 (two halves, each at most half a turn, so a
                                  full ring is one path too)
   Numbers are printed at 1 decimal. The same functions draw the server's
   stills and the director's frames, so the two cannot drift.

   Style is written inline, on the path itself, so the copy of the pieces
   drawn on the pivot's navy (a <use> of their layer, which the page's
   stylesheet never reaches) draws the same way:
     stroke        a role alias (art.css, --why-c-*), or a color-mix of two
                   in oklab; the alias is the site role on the page's
                   ground and its on-accent counterpart on the navy
     fill          none, a fill role, or a mix (with transparent for none)
     stroke-width  a blend of --why-stroke and --fathom-border-emphasis,
                   plus the piece's band in stage units (times --why-u, the
                   px one stage unit takes where this svg is drawn: art.css
                   sets it on each svg from its container's size)
     opacity
   Caps, joins and the non-scaling stroke are presentation attributes on
   each path (MorphStage), for the same reason. Forced colors override the
   colors with !important (art.css).

   The brand mark layer (formation.ts `mark`) is a <g> around the exact
   brand path: its transform (translate, then one uniform scale) and its
   fill and opacity, the same way.
   ================================================================ */

import type { ArcGeom, Fill, LineGeom, LookMix, PieceKind, PieceNow, RectGeom, Role } from "./pieces";
import { MARK_UNITS } from "./brand";

/** Rounds to d decimals and prints the shortest form ("-0" prints as "0"). */
export function num(n: number, d = 1): string {
  const p = 10 ** d;
  const v = Math.round(n * p) / p;
  return String(Object.is(v, -0) ? 0 : v);
}

const DEG = Math.PI / 180;

export function rectPath(g: RectGeom): string {
  const w = Math.max(0, g.w);
  const h = Math.max(0, g.h);
  const r = Math.min(Math.max(0, g.r), w / 2, h / 2);
  const { x, y } = g;
  // Corners, clockwise from the top edge's start.
  const pts: [number, number][] = [
    [x + r, y],
    [x + w - r, y],
    [x + w, y + r],
    [x + w, y + h - r],
    [x + w - r, y + h],
    [x + r, y + h],
    [x, y + h - r],
    [x, y + r],
  ];
  const rot = g.rot ?? 0;
  if (rot) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const c = Math.cos(rot * DEG);
    const s = Math.sin(rot * DEG);
    for (const p of pts) {
      const dx = p[0] - cx;
      const dy = p[1] - cy;
      p[0] = cx + dx * c - dy * s;
      p[1] = cy + dx * s + dy * c;
    }
  }
  const P = pts.map(([px, py]) => `${num(px)} ${num(py)}`);
  const R = num(r);
  const A = (to: string) => `A${R} ${R} 0 0 1 ${to}`;
  return `M${P[0]} L${P[1]} ${A(P[2])} L${P[3]} ${A(P[4])} L${P[5]} ${A(P[6])} L${P[7]} ${A(P[0])} Z`;
}

export function linePath(g: LineGeom): string {
  return `M${num(g.x1)} ${num(g.y1)} L${num(g.x2)} ${num(g.y2)}`;
}

export function arcPath(g: ArcGeom): string {
  const r = Math.max(0, g.r);
  const span = Math.max(-360, Math.min(360, g.a1 - g.a0));
  const at = (a: number) => `${num(g.cx + r * Math.cos(a * DEG))} ${num(g.cy + r * Math.sin(a * DEG))}`;
  const sweep = span >= 0 ? 1 : 0;
  const R = num(r);
  return `M${at(g.a0)} A${R} ${R} 0 0 ${sweep} ${at(g.a0 + span / 2)} A${R} ${R} 0 0 ${sweep} ${at(g.a0 + span)}`;
}

export function pathOf(p: Pick<PieceNow, "kind" | "g">): string {
  if (p.kind === "rect") return rectPath(p.g as RectGeom);
  if (p.kind === "line") return linePath(p.g as LineGeom);
  return arcPath(p.g as ArcGeom);
}

/** The command letters of a path: one per kind, whatever the numbers. */
export function skeleton(d: string): string {
  return d.replace(/[-\d.]+/g, "").replace(/\s+/g, "");
}

/* ---------------------------------------------------------------- *
 * Style
 * ---------------------------------------------------------------- */

/**
 * Each role's color, through an alias art.css sets on the svg: the site
 * role on the page's ground, its on-accent counterpart where the pivot's
 * navy is behind the art (the same pieces, drawn again inside the navy's
 * clip), so a piece crossing the iris edge changes color with the edge.
 */
export const ROLE_VAR: Record<Role, string> = {
  ink: "var(--why-c-ink)",
  soft: "var(--why-c-soft)",
  accent: "var(--why-c-accent)",
  ghost: "var(--why-c-ghost)",
};

export const FILL_VAR: Record<Fill, string> = {
  none: "transparent",
  ink: "var(--why-c-ink)",
  accent: "var(--why-c-accent)",
  navy: "var(--why-c-navy)",
  glass: "var(--why-c-glass)",
};

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Two colors `t` of the way from a to b, as CSS: a plain var at either end. */
function mix(a: string, b: string, t: number): string {
  if (a === b || t <= 0) return a;
  if (t >= 1) return b;
  return `color-mix(in oklab, ${a}, ${b} ${num(clamp(t, 0, 1) * 100, 0)}%)`;
}

export function strokeCss([a, b, t]: LookMix["stroke"]): string {
  return mix(ROLE_VAR[a], ROLE_VAR[b], t);
}

export function fillCss([a, b, t]: LookMix["fill"]): string {
  const out = mix(FILL_VAR[a], FILL_VAR[b], t);
  return out === "transparent" ? "none" : out;
}

/**
 * Weight 0..2: 0 no stroke, 1 --why-stroke, 2 --fathom-border-emphasis,
 * blended between; plus band stage units, which scale with the art.
 */
export function widthCss(weight: number, band = 0): string {
  const w = clamp(weight, 0, 2);
  const b = Math.max(0, band);
  let token: string;
  if (w === 1) token = "var(--why-stroke)";
  else if (w === 2) token = "var(--fathom-border-emphasis)";
  else if (w <= 1) token = w === 0 ? "" : `var(--why-stroke) * ${num(w, 2)}`;
  else token = `var(--why-stroke) * ${num(2 - w, 2)} + var(--fathom-border-emphasis) * ${num(w - 1, 2)}`;
  const units = b > 0 ? `var(--why-u) * ${num(b, 2)}` : "";
  if (!units) return token === "" ? "0" : token.startsWith("var(") && !token.includes(" ") ? token : `calc(${token})`;
  return token === "" ? `calc(${units})` : `calc(${token} + ${units})`;
}

export type StyleVars = { stroke: string; fill: string; strokeWidth: string; opacity: string; strokeLinecap?: "butt" };

/**
 * The accent's stroke, heavier where the theme asks (art.css --why-accent-k:
 * 1.5 in the light theme, where the accent navy sits close to the ink, so
 * the orb still reads as the one accent by weight as well as hue). A piece
 * on its way to or from the accent role takes its share of that.
 */
export function accentWidth(width: string, [a, b, t]: LookMix["stroke"]): string {
  const share = (a === "accent" ? 1 - t : 0) + (b === "accent" ? t : 0);
  if (share <= 0 || width === "0") return width;
  const k = share >= 1 ? "var(--why-accent-k, 1)" : `(1 + (var(--why-accent-k, 1) - 1) * ${num(share, 2)})`;
  return `calc(${width} * ${k})`;
}

/** A piece's inline style, as React's style object (the server's first frame). */
export function styleVars(look: LookMix): StyleVars {
  return {
    stroke: strokeCss(look.stroke),
    fill: fillCss(look.fill),
    strokeWidth: accentWidth(widthCss(look.weight, look.band), look.stroke),
    opacity: num(clamp(look.o, 0, 1), 3),
    ...(look.cap ? { strokeLinecap: look.cap } : {}),
  };
}

/** The same inline style as the string the director writes, compared before every write. */
export function styleString(look: LookMix): string {
  const v = styleVars(look);
  const base = `stroke:${v.stroke};fill:${v.fill};stroke-width:${v.strokeWidth};opacity:${v.opacity}`;
  return v.strokeLinecap ? `${base};stroke-linecap:${v.strokeLinecap}` : base;
}

/** One piece at one scroll position, as the strings the DOM gets. */
export type PieceFrame = { d: string; style: string };

export function frameOf(p: PieceNow): PieceFrame {
  return { d: pathOf(p), style: styleString(p.look) };
}

/** The command skeleton every piece of a kind keeps for life. */
export const SKELETON: Record<PieceKind, string> = {
  rect: "MLALALALAZ",
  line: "ML",
  arc: "MAA",
};

/* ---------------------------------------------------------------- *
 * The brand mark layer
 * ---------------------------------------------------------------- */

export type MarkRole = "ink" | "onAccent";

/** The mark's own colors: bone/ink on the page, currentColor's on-accent on the navy. */
export const MARK_VAR: Record<MarkRole, string> = {
  ink: "var(--site-text-primary)",
  onAccent: "var(--site-text-on-accent)",
};

/** The mark layer at one scroll position: centered on (cx, cy), size stage units across. */
export type MarkNow = { cx: number; cy: number; size: number; o: number; role: [MarkRole, MarkRole, number] };

/** The mark layer's strings: its transform, its style in its own color, and its style on the navy. */
export type MarkFrame = { transform: string; style: string; on: string };

/** One uniform scale, never a distortion: the master's 120-unit box scaled to size, centered. */
export function markFrame(m: MarkNow): MarkFrame {
  const size = Math.max(0, m.size);
  const k = size / MARK_UNITS;
  const [a, b, t] = m.role;
  const o = num(clamp(m.o, 0, 1), 3);
  return {
    transform: `translate(${num(m.cx - size / 2, 2)} ${num(m.cy - size / 2, 2)}) scale(${num(k, 4)})`,
    style: `--m-f:${mix(MARK_VAR[a], MARK_VAR[b], t)};opacity:${o}`,
    on: `--m-f:${MARK_VAR.onAccent};opacity:${o}`,
  };
}

/* ---------------------------------------------------------------- *
 * A whole frame
 * ---------------------------------------------------------------- */

/** Everything the director writes for one reel's svg at one scroll position. */
export type MorphFrame = {
  pieces: PieceFrame[];
  mark: MarkFrame;
  /** The clip window's path (pieces the pool marks clip: true draw inside it). */
  window: string;
  /** Every piece as one layer: its opacity (the crossfade to and from the exact mark). */
  layer: string;
};

