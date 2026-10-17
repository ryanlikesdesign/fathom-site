/* ================================================================
   Where the beats land, and where the reader is.

   measure() is the only place the director reads layout: document-space
   boxes of every [data-why-at] element and every essay block, 1svh in px
   (from a 100svh probe, so iOS toolbar changes don't move beats), the
   header height and the scroll range. It runs on init, when fonts load,
   when the article resizes and when the mode changes; never per frame.

   beatY() and pickRestoreAnchor() are pure, so they are unit tested
   without a browser, as is edgeAt(): where a level line at a sentence's
   baseline meets a formation's drawing (the director's reading tie).
   ================================================================ */

import { LINE, type Anchor } from "./engine";
import type { PieceState } from "./morph/pieces";

/** The blocks a reader reads; one of them is kept in place when the layout changes. */
export const BLOCK_SELECTOR = "h1, h2, p, li, dt, dd";

/**
 * Blocks that never anchor a restore: anything aria-hidden. The pivot's line
 * is one (its sr-only sentence and drawn words are one paragraph): pinned,
 * the director reads it live on screen like any pinned block, so a reader
 * who pauses at the climax keeps it where it was.
 */
const NOT_A_BLOCK = '[aria-hidden="true"]';

export type Box = { top: number; height: number };

export type Geometry = {
  /** Document-space box of each [data-why-at] element, by name. */
  at: Map<string, Box>;
  /** Essay blocks in document order, and their document-space tops and heights. */
  blocks: Element[];
  blockTops: number[];
  blockHeights?: number[];
  /** 1svh in px. */
  svh: number;
  maxScroll: number;
  /** Bottom of the fixed header, in viewport px. */
  headerH: number;
};

export type RestoreAnchor = { index: number; offset: number };

const PROBE_ATTR = "data-why-probe";

/** A fixed, invisible 100svh box: its height is the small viewport height. */
export function ensureProbe(doc: Document): HTMLElement {
  let probe = doc.querySelector<HTMLElement>(`[${PROBE_ATTR}]`);
  if (!probe) {
    probe = doc.createElement("div");
    probe.setAttribute(PROBE_ATTR, "");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;inset-block-start:0;inset-inline-start:0;inline-size:0;block-size:100svh;visibility:hidden;pointer-events:none";
    doc.body.appendChild(probe);
  }
  return probe;
}

export function removeProbe(doc: Document) {
  doc.querySelector(`[${PROBE_ATTR}]`)?.remove();
}

export function measure(root: Element, win: Window): Geometry {
  const doc = root.ownerDocument;
  const y = win.scrollY;
  const at = new Map<string, Box>();
  root.querySelectorAll<HTMLElement>("[data-why-at]").forEach((el) => {
    const name = el.dataset.whyAt;
    if (!name || at.has(name)) return;
    const r = el.getBoundingClientRect();
    at.set(name, { top: r.top + y, height: r.height });
  });
  const blocks = Array.from(root.querySelectorAll(BLOCK_SELECTOR)).filter((el) => !el.closest(NOT_A_BLOCK));
  const rects = blocks.map((el) => el.getBoundingClientRect());
  const blockTops = rects.map((r) => r.top + y);
  const blockHeights = rects.map((r) => r.height);
  const probeH = ensureProbe(doc).getBoundingClientRect().height;
  const svh = (probeH > 0 ? probeH : win.innerHeight) / 100;
  const html = doc.documentElement;
  const maxScroll = Math.max(0, html.scrollHeight - win.innerHeight);
  const headerH = parseFloat(win.getComputedStyle(html).getPropertyValue("--site-header-h")) || 0;
  return { at, blocks, blockTops, blockHeights, svh, maxScroll, headerH };
}

/**
 * The scroll position at which a beat lands: the anchor element's edge
 * (default center) reaches `line` of the viewport (default 0.6), plus
 * `offset` svh. NaN when the anchor is missing; resolveTiming() then
 * lands the beat with the one before it.
 */
export function beatY(anchor: Anchor | undefined, g: Pick<Geometry, "at" | "svh">): number {
  if (!anchor) return NaN;
  const box = g.at.get(anchor.at);
  if (!box) return NaN;
  const edge = anchor.edge ?? "center";
  const ey = edge === "top" ? box.top : edge === "bottom" ? box.top + box.height : box.top + box.height / 2;
  return ey - (anchor.line ?? LINE) * 100 * g.svh + (anchor.offset ?? 0) * g.svh;
}

/**
 * The block to hold still across a layout change: the one at the reading
 * line (`readingY`, document px: the line a reader reads at, engine.ts
 * LINE of the viewport down), with its offset from the top of the
 * viewport, so a reader who pauses the motion keeps the line they were
 * on where it was, even when a still is inserted above it. The innermost
 * block whose box contains the line, else the block whose top is nearest
 * it. Without a reading line (or heights): the topmost block whose top is
 * at or below the header's bottom edge (past the last block, the last).
 * Read from geometry cached before the change (the CSS can release the
 * stage before any script runs).
 */
export function pickRestoreAnchor(
  blockTops: readonly number[],
  scrollY: number,
  headerH: number,
  readingY?: number,
  blockHeights?: readonly number[],
): RestoreAnchor | null {
  if (!blockTops.length) return null;
  let best = -1;
  if (readingY !== undefined && blockHeights && blockHeights.length === blockTops.length) {
    for (let i = 0; i < blockTops.length; i++) {
      const top = blockTops[i];
      if (top <= readingY && top + blockHeights[i] > readingY && (best < 0 || top >= blockTops[best])) best = i;
    }
    if (best < 0) {
      for (let i = 0; i < blockTops.length; i++) {
        if (best < 0 || Math.abs(blockTops[i] - readingY) < Math.abs(blockTops[best] - readingY)) best = i;
      }
    }
    return { index: best, offset: blockTops[best] - scrollY };
  }
  for (let i = 0; i < blockTops.length; i++) {
    const offset = blockTops[i] - scrollY;
    if (offset >= headerH && (best < 0 || blockTops[i] < blockTops[best])) best = i;
  }
  if (best < 0) best = blockTops.length - 1;
  return { index: best, offset: blockTops[best] - scrollY };
}

/** The scrollY that puts the anchored block back at its old offset. */
export function restoreTarget(anchor: RestoreAnchor, g: Pick<Geometry, "blockTops" | "maxScroll">): number | null {
  const top = g.blockTops[anchor.index];
  if (!Number.isFinite(top)) return null;
  return Math.min(g.maxScroll, Math.max(0, top - anchor.offset));
}

/** An element's document-space box. A layout read: measure time only, never per frame. */
export function docBox(el: Element, scrollY: number): Box {
  const r = el.getBoundingClientRect();
  return { top: r.top + scrollY, height: r.height };
}

/* ---------------------------------------------------------------- *
 * Where a level line meets the drawing
 * ---------------------------------------------------------------- */

const RAD = Math.PI / 180;

/** A piece's stroke as a polyline in grid units (rects with their rounded corners and rotation, arcs in short chords). */
export function outlineOf(s: PieceState): [number, number][] {
  if (s.kind === "line") return [
    [s.g.x1, s.g.y1],
    [s.g.x2, s.g.y2],
  ];
  if (s.kind === "arc") {
    const { cx, cy, r, a0, a1 } = s.g;
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 6));
    const out: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const a = (a0 + ((a1 - a0) * i) / n) * RAD;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return out;
  }
  const { x, y, w, h } = s.g;
  const r = Math.min(Math.max(0, s.g.r), w / 2, h / 2);
  const corner = (ccx: number, ccy: number, from: number): [number, number][] =>
    [0, 1, 2, 3, 4].map((i) => {
      const a = (from + i * 22.5) * RAD;
      return [ccx + r * Math.cos(a), ccy + r * Math.sin(a)];
    });
  const pts = [...corner(x + w - r, y + r, -90), ...corner(x + w - r, y + h - r, 0), ...corner(x + r, y + h - r, 90), ...corner(x + r, y + r, 180)];
  pts.push(pts[0]);
  const rot = (s.g.rot ?? 0) * RAD;
  if (!rot) return pts;
  const mx = x + w / 2;
  const my = y + h / 2;
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  return pts.map(([px, py]) => [mx + (px - mx) * c - (py - my) * sn, my + (px - mx) * sn + (py - my) * c]);
}

/**
 * Where a level line at height y first meets the drawing, coming in from
 * one side: the smallest (left) or largest (right) x at which a seen
 * stroke crosses y, leaving out the pieces in `skip`. Null where nothing
 * crosses. Pure, so it is tested without a browser.
 */
export function edgeAt(states: readonly PieceState[], y: number, side: "left" | "right", skip: ReadonlySet<number> = new Set()): number | null {
  let best: number | null = null;
  const take = (x: number) => {
    if (best === null || (side === "left" ? x < best : x > best)) best = x;
  };
  states.forEach((s, i) => {
    if (skip.has(i) || s.parked || !(s.look.o > 0)) return;
    const pts = outlineOf(s);
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
