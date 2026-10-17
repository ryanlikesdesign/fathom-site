/* ================================================================
   The formation engine's brand geometry: the fathom mark and the
   assistant orb, as pieces.

   The mark is never approximated at rest. Pieces may BECOME the mark (a
   disk and three rings on the mark's own centerlines, each ring a stroke
   as wide as its band), and then the exact brand path takes over: a
   formation's `mark` (formation.ts) draws MARK's 120 master itself,
   uniformly scaled, in the mark's own colors, and crossfades in over the
   pieces. markPieces() gives the pieces that sit exactly under it.

   The geometry is read from the generated brand paths (design-system/
   generated/logo-paths.ts), never retyped, so it cannot drift from the
   design system: test/why/morph.test.ts checks what it parses.

   The orb is the app's AssistantOrbIndicator (components/phone/Orb.tsx):
   rings at 100%, 84% and 68% of its radius and a core of 8.46 / 50 of it.
   Pure: no window, no document.
   ================================================================ */

import { MARK } from "@/design-system/generated/logo-paths";
import { circle, ring, type ArcSpec, type Fill, type RectSpec, type Role } from "./pieces";

/** The master the mark layer draws: the 120-unit one (the ladder's 40px and up). */
export const MARK_PATH = MARK[120];
export const MARK_UNITS = MARK_PATH.width;
const CENTER = MARK_UNITS / 2;

/** Every circle radius in the master's path, smallest first: the disk, then each ring's inner and outer edge. */
export const MARK_RADII: readonly number[] = [
  ...new Set(Array.from(MARK_PATH.d.matchAll(/A([\d.]+),[\d.]+/g), (m) => Number(m[1]))),
].sort((a, b) => a - b);

/** The center disk's radius, in master units. */
export const MARK_DISK = MARK_RADII[0];

/** Each ring as [inner, outer] radius, in master units, innermost first. */
export const MARK_BANDS: readonly (readonly [number, number])[] = (() => {
  const edges = MARK_RADII.slice(1);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < edges.length; i += 2) out.push([edges[i], edges[i + 1]]);
  return out;
})();

export type MarkPieceLook = { role?: Role; fill?: Fill; o?: number };

/**
 * The mark as pieces, centered on (cx, cy), `size` stage units across
 * (its master's 120-unit box): the disk as a filled circle with no stroke,
 * and each ring as a full-turn arc on the band's centerline with weight 0
 * and a band (stage units) as wide as the mark's. Exactly under the brand
 * path, so the crossfade to it shows nothing moving.
 */
export function markPieces(cx: number, cy: number, size: number, look: MarkPieceLook = {}): { disk: RectSpec; rings: ArcSpec[] } {
  const k = size / MARK_UNITS;
  const o = look.o ?? 1;
  return {
    disk: circle(cx, cy, MARK_DISK * k, { fill: look.fill ?? "ink", weight: 0, band: 0, o }),
    rings: MARK_BANDS.map(([a, b]) => ring(cx, cy, ((a + b) / 2) * k, { role: look.role ?? "ink", fill: "none", weight: 0, band: (b - a) * k, o })),
  };
}

/** The orb's rings as shares of its radius, outermost first, and its core. */
export const ORB_RINGS = [1, 0.84, 0.68] as const;
export const ORB_CORE = 8.46 / 50;

/**
 * The assistant orb as pieces, radius r around (cx, cy): three rings in
 * the accent and a filled core. Strokes keep the site's line weight (the
 * app's ring opacities are left out: art holds 3:1 at full strength).
 */
export function orbPieces(cx: number, cy: number, r: number, look: { o?: number } = {}): { core: RectSpec; rings: ArcSpec[] } {
  const o = look.o ?? 1;
  return {
    core: circle(cx, cy, r * ORB_CORE, { fill: "accent", weight: 0, o }),
    rings: ORB_RINGS.map((f) => ring(cx, cy, r * f, { role: "accent", fill: "none", weight: 1, band: 0, o })),
  };
}

/** The mark's center in its own master, for the layer's transform. */
export const MARK_CENTER = CENTER;
