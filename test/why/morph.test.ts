// The formation engine (components/why/morph/): path builders, moves,
// timing, pockets, the brand geometry, and every registered formation
// file checked as data. Pure: no layout.
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import WhyPage from "@/app/why/page";
import { defaultEasings } from "@/components/why/engine";
import {
  arc, asNow, circle, fadeAt, line, pieceAt, placeState, planMove, point, rect, resolveSpec, ring, travelAt, DEFAULT_LOOK, VIEW_H, VIEW_W,
  type PieceState,
} from "@/components/why/morph/pieces";
import { arcPath, frameOf, linePath, markFrame, pathOf, rectPath, skeleton, SKELETON, styleString, widthCss } from "@/components/why/morph/render";
import {
  bandTopAt, compileMorph, ENTRY_FROM, ENTRY_TO, FRAME_REFORM, lineOpener, localT, locate, moveAt, pocketAt, pocketEntry, pocketFrame, pocketFrameAt, pocketPlans,
  pocketProgress, pocketRange, POCKET_REFORM, POCKET_STEP_HOLD, resolveMorphTiming, sampleFrames, sampleMorph, staggerStarts, stepFrame, type CompiledMorph,
  type MorphSource,
} from "@/components/why/morph/formation";
import { MARK_BANDS, MARK_DISK, MARK_RADII, MARK_UNITS, markPieces, orbPieces, ORB_CORE } from "@/components/why/morph/brand";
import { MORPHS, PLACEMENTS, POCKETS, SOURCES } from "@/components/why/morph";

const easings = defaultEasings();
const nums = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
const state = (spec: Parameters<typeof resolveSpec>[0]) => resolveSpec(spec, DEFAULT_LOOK);

/* ---------------------------------------------------------------- *
 * Path builders
 * ---------------------------------------------------------------- */

describe("path builders", () => {
  it("keep one command skeleton per kind, whatever the numbers", () => {
    const rects = [rect(10, 20, 100, 60, 0), rect(10, 20, 100, 60, 12), rect(0, 0, 0, 0), circle(300, 400, 50), { ...rect(10, 20, 100, 60, 8), rot: 30 }];
    for (const r of rects) expect(skeleton(pathOf(state(r)))).toBe(SKELETON.rect);
    for (const l of [line(0, 0, 10, 10), line(5, 5, 5, 5)]) expect(skeleton(pathOf(state(l)))).toBe(SKELETON.line);
    for (const a of [arc(0, 0, 10, 0, 90), ring(300, 300, 40), arc(5, 5, 0, 30, 30), arc(0, 0, 10, 90, -200)]) {
      expect(skeleton(pathOf(state(a)))).toBe(SKELETON.arc);
    }
  });

  it("prints at most one decimal", () => {
    for (const d of [rectPath({ x: 1.234, y: 5.678, w: 33.33, h: 9.99, r: 3.333, rot: 0 }), arcPath({ cx: 1.11, cy: 2.22, r: 7.77, a0: 13, a1: 99 })]) {
      for (const n of d.match(/-?\d+(?:\.\d+)?/g)!) expect(n.split(".")[1]?.length ?? 0, n).toBeLessThanOrEqual(1);
    }
  });

  it("draws a circle as a rect whose corner is half its side: every vertex on the circle", () => {
    const d = rectPath(state(circle(300, 400, 50)).g as never);
    expect(d).toMatch(/A50 50 0 0 1/);
    const n = nums(d.replace(/A50 50 0 0 1 /g, ""));
    for (let i = 0; i < n.length; i += 2) expect(Math.hypot(n[i] - 300, n[i + 1] - 400)).toBeCloseTo(50, 0);
  });

  it("clamps a corner to half the short side", () => {
    expect(rectPath({ x: 0, y: 0, w: 40, h: 100, r: 80, rot: 0 })).toBe(rectPath({ x: 0, y: 0, w: 40, h: 100, r: 20, rot: 0 }));
  });

  it("is continuous: a small change in any parameter moves every number a little", () => {
    const pairs: [string, string][] = [
      [rectPath({ x: 10, y: 10, w: 100, h: 60, r: 29.9, rot: 0 }), rectPath({ x: 10, y: 10, w: 100, h: 60, r: 30, rot: 0 })],
      [rectPath({ x: 10, y: 10, w: 0.2, h: 0.2, r: 0, rot: 0 }), rectPath({ x: 10, y: 10, w: 0, h: 0, r: 0, rot: 0 })],
      [arcPath({ cx: 0, cy: 0, r: 50, a0: 0, a1: 359.8 }), arcPath({ cx: 0, cy: 0, r: 50, a0: 0, a1: 360 })],
      [arcPath({ cx: 0, cy: 0, r: 0.2, a0: 0, a1: 90 }), arcPath({ cx: 0, cy: 0, r: 0, a0: 0, a1: 90 })],
      [linePath({ x1: 0, y1: 0, x2: 0.2, y2: 0 }), linePath({ x1: 0, y1: 0, x2: 0, y2: 0 })],
    ];
    for (const [a, b] of pairs) {
      const na = nums(a);
      const nb = nums(b);
      expect(na.length).toBe(nb.length);
      na.forEach((v, i) => expect(Math.abs(v - nb[i]), `${a} / ${b}`).toBeLessThanOrEqual(0.3));
    }
  });

  it("closes a full ring on itself, in two halves", () => {
    const n = nums(arcPath({ cx: 100, cy: 100, r: 40, a0: -90, a1: 270 }));
    expect([n[0], n[1]]).toEqual([n[n.length - 2], n[n.length - 1]]);
    expect([n[0], n[1]]).toEqual([100, 60]);
  });

  it("writes widths from tokens, plus bands in grid units", () => {
    expect(widthCss(1)).toBe("var(--why-stroke)");
    expect(widthCss(2)).toBe("var(--fathom-border-emphasis)");
    expect(widthCss(0)).toBe("0");
    expect(widthCss(1.5)).toBe("calc(var(--why-stroke) * 0.5 + var(--fathom-border-emphasis) * 0.5)");
    expect(widthCss(0, 8)).toBe("calc(var(--why-u) * 8)");
    expect(widthCss(1, 4)).toBe("calc(var(--why-stroke) + var(--why-u) * 4)");
    // Colors are site roles only, mixed in oklab on the way.
    const mid = styleString({ stroke: ["ink", "accent", 0.5], fill: ["none", "navy", 0.25], weight: 1, band: 0, o: 0.5 });
    expect(mid).toBe(
      "stroke:color-mix(in oklab, var(--why-c-ink), var(--why-c-accent) 50%);" +
        "fill:color-mix(in oklab, transparent, var(--why-c-navy) 25%);stroke-width:calc(var(--why-stroke) * (1 + (var(--why-accent-k, 1) - 1) * 0.5));opacity:0.5",
    );
    // The accent's weight follows the theme (art.css --why-accent-k), on its share of the way.
    expect(styleString({ stroke: ["accent", "accent", 0], fill: ["none", "none", 0], weight: 1, band: 4, o: 1 })).toContain(
      "stroke-width:calc(calc(var(--why-stroke) + var(--why-u) * 4) * var(--why-accent-k, 1))",
    );
    expect(styleString({ stroke: ["soft", "soft", 0], fill: ["none", "none", 0], weight: 1, band: 0, o: 1 })).not.toMatch(/#|rgb|oklch\(/);
  });
});

/* ---------------------------------------------------------------- *
 * Moves
 * ---------------------------------------------------------------- */

describe("a piece's move", () => {
  const from = state(rect(100, 100, 100, 50, 10, { role: "ink" }));
  const to = state(rect(400, 500, 60, 60, 30, { role: "accent", weight: 2 }));
  const m = planMove(from, to, 0.2);

  it("is exactly its old state at t 0 and its new one at t 1", () => {
    expect(pieceAt(m, 0, 0)).toEqual(asNow(from));
    expect(pieceAt(m, 1, 1)).toEqual(asNow(to));
    expect(frameOf(pieceAt(m, 1, 1))).toEqual(frameOf(asNow(to)));
  });

  it("is halfway at t 0.5: size, corner, weight and color, its center bowed off the straight line by bend x distance / 2", () => {
    const now = pieceAt(m, 0.5, 0.5);
    if (now.kind !== "rect") throw new Error("kind changed");
    expect(now.g.w).toBeCloseTo(80);
    expect(now.g.h).toBeCloseTo(55);
    expect(now.g.r).toBeCloseTo(20);
    expect(now.look.weight).toBeCloseTo(1.5);
    expect(now.look.stroke).toEqual(["ink", "accent", 0.5]);
    const c = [now.g.x + now.g.w / 2, now.g.y + now.g.h / 2];
    const mid = [(m.c0[0] + m.c1[0]) / 2, (m.c0[1] + m.c1[1]) / 2];
    expect(Math.hypot(c[0] - mid[0], c[1] - mid[1])).toBeCloseTo((0.2 * m.dist) / 2, 5);
    // To the right of travel on screen (y down): travel is down-right, so the bow is down-left.
    expect(c[0]).toBeLessThan(mid[0]);
    expect(c[1]).toBeGreaterThan(mid[1]);
    expect(travelAt(m, 0.5)).toEqual(c.map((v) => expect.closeTo(v, 6)));
  });

  it("travels straight with bend 0", () => {
    const s = planMove(from, to, 0);
    const now = pieceAt(s, 0.5, 0.5);
    if (now.kind !== "rect") throw new Error("kind changed");
    expect(now.g.x + now.g.w / 2).toBeCloseTo((150 + 430) / 2);
  });

  it("turns a line the short way and keeps a point's heading", () => {
    const a = state(line(0, 0, 100, 0));
    const b = state(line(0, 0, 100 * Math.cos((-10 * Math.PI) / 180), 100 * Math.sin((-10 * Math.PI) / 180)));
    const mv = planMove(a, b, 0);
    expect(mv.polar!.ang1 - mv.polar!.ang0).toBeCloseTo(-10);
    const grow = planMove(state(point("line", 50, 50)), state(line(50, 0, 50, 100)), 0);
    expect(grow.polar!.ang0).toBe(grow.polar!.ang1);
    // A parked point the generator rounded to a tenth (a hair of a line, pointing anywhere) is still a
    // point: the stroke grows out of it level, and never sweeps across the drawing as it opens.
    const hair = planMove(state(line(322.9, 499.2, 323, 499.6)), state(line(91, 466, 537, 466)), 0);
    expect(hair.polar!.ang0).toBe(hair.polar!.ang1);
    const shrink = planMove(state(line(91, 466, 537, 466)), state(line(322.9, 499.2, 323, 499.6)), 0);
    expect(shrink.polar!.ang1).toBe(shrink.polar!.ang0);
  });

  it("opens an arc from a point already on its destination's angles", () => {
    const mv = planMove(state(point("arc", 300, 400)), state(arc(300, 400, 80, 180, 360)), 0);
    const half = pieceAt(mv, 0.5, 0.5);
    if (half.kind !== "arc") throw new Error("kind changed");
    expect([half.g.a0, half.g.a1]).toEqual([180, 360]);
    expect(half.g.r).toBeCloseTo(40);
  });

  it("fades in over the first half and out over the second, so a crossfade never dips", () => {
    expect(fadeAt(0, 1, 0.25)).toBeCloseTo(0.5);
    expect(fadeAt(0, 1, 0.5)).toBe(1);
    expect(fadeAt(1, 0, 0.5)).toBe(1);
    expect(fadeAt(1, 0, 0.75)).toBeCloseTo(0.5);
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const cover = 1 - (1 - fadeAt(0, 1, u)) * (1 - fadeAt(1, 0, u));
      expect(cover, `u ${u}`).toBeCloseTo(1, 6);
    }
  });

  it("places a whole formation for the phone with one scale, never a distortion", () => {
    const s = state({ ...rect(100, 100, 200, 100, 20), band: 10 });
    const p = placeState(s, 0.5, 10, -20, 300, 400);
    if (p.kind !== "rect") throw new Error("kind changed");
    expect(p.g).toEqual({ x: 210, y: 230, w: 100, h: 50, r: 10, rot: 0 });
    expect(p.look.band).toBe(5);
    expect(p.look.weight).toBe(s.look.weight);
    const a = placeState(state(arc(300, 400, 100, 10, 80)), 0.5, 0, 0, 300, 400);
    expect(a.g).toEqual({ cx: 300, cy: 400, r: 50, a0: 10, a1: 80 });
  });
});

describe("stagger", () => {
  const pieces = [0, 1, 2, 3, 4].map((i) => planMove(state(circle(100 + i * 50, 100, 10)), state(circle(100 + i * 50, 600, 10)), 0));
  pieces.push(planMove(state(circle(50, 50, 5)), state(circle(50, 50, 5)), 0));
  const ids = pieces.map((_, i) => `p${i}`);

  it("starts every mover within [0, stagger], first at 0 and last at stagger; still pieces at 0", () => {
    for (const st of [0, 0.35, 0.9]) {
      const starts = staggerStarts(pieces, ids, st, "travel");
      for (const s of starts) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(st + 1e-9);
      }
      expect(Math.min(...starts.slice(0, 5))).toBe(0);
      expect(Math.max(...starts)).toBeCloseTo(st);
      expect(starts[5]).toBe(0);
    }
  });

  it("lands every piece inside the window: its own progress is 0 at t 0 and 1 at t 1", () => {
    for (const st of [0, 0.35, 0.9]) {
      for (const s of staggerStarts(pieces, ids, st, "travel")) {
        expect(localT(s, st, 0)).toBe(0);
        expect(localT(s, st, 1)).toBe(1);
        expect(localT(s, st, s)).toBe(0);
        expect(localT(s, st, s + (1 - st))).toBeCloseTo(1);
      }
    }
  });

  it("orders by a declared list first, then by travel", () => {
    const starts = staggerStarts(pieces, ids, 0.4, ["p3", "p1"]);
    expect(starts[3]).toBe(0);
    expect(starts[1]).toBeCloseTo(0.1);
    expect(starts[0]).toBeGreaterThan(starts[1]);
  });
});

/* ---------------------------------------------------------------- *
 * Formations and timing
 * ---------------------------------------------------------------- */

/** A small source: three formations of three pieces, a mark and a clip window. */
const SRC: MorphSource = {
  reel: "r1",
  pool: [
    { id: "box", kind: "rect" },
    { id: "bar", kind: "line", clip: true },
    { id: "arc", kind: "arc", look: { role: "accent" } },
  ],
  formations: [
    { id: "a", still: "hero", window: { x: 0, y: 0, w: 600, h: 800 }, pieces: { box: rect(100, 100, 200, 300, 20), bar: line(120, 200, 280, 200), arc: arc(200, 150, 30, 180, 360) } },
    {
      id: "b",
      anchor: { at: "s2" },
      hold: { at: "s3" },
      still: "arrives",
      phone: { scale: 0.5, shift: [0, 10], run: "item" },
      pieces: { box: rect(300, 400, 100, 100, 50), arc: ring(350, 450, 70) },
    },
    {
      id: "c",
      anchor: { at: "s4" },
      still: "pace-0",
      mark: { cx: 350, cy: 450, size: 140 },
      window: { x: 300, y: 400, w: 100, h: 100, r: 50 },
      phone: { pieces: { arc: ring(300, 400, 60) }, run: "climax" },
      pieces: { box: point("rect", 350, 450, { o: 0 }), bar: point("line", 350, 450, { o: 0 }), arc: ring(350, 450, 70, { o: 0 }) },
    },
  ],
};
const C = compileMorph(SRC);
// Formation a from the top; b lands at 1000 and holds to 1500; c lands at 2000.
const TIMING = resolveMorphTiming(C, [NaN, 1000, 2000], [NaN, 1500, NaN], 9, 10_000);

describe("compiling formations", () => {
  it("compiles the sample with no problems, a phone variant, a clip window and a mark", () => {
    expect(C.problems).toEqual([]);
    expect([C.clipped, C.marked]).toEqual([true, true]);
    expect(C.phone!.formations).toHaveLength(3);
  });

  it("keeps a piece a formation leaves out exactly where the one before left it", () => {
    expect(C.formations[1].states[1]).toEqual(C.formations[0].states[1]);
  });

  it("refuses a kind change, an unknown piece, a missing first placement and a second formation without an anchor", () => {
    const bad = compileMorph({
      reel: "r2",
      pool: [
        { id: "x", kind: "rect" },
        { id: "y", kind: "line" },
      ],
      formations: [
        { id: "one", pieces: { x: rect(0, 0, 10, 10) } },
        { id: "two", pieces: { x: line(0, 0, 1, 1), z: rect(0, 0, 1, 1) } },
      ],
    });
    expect(bad.problems).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/one: the first formation must place every piece; "y"/),
        expect.stringMatching(/two: only the first formation may omit its anchor/),
        expect.stringMatching(/two: "x" is a rect for life but was given a line/),
        expect.stringMatching(/two: unknown piece "z"/),
      ]),
    );
  });

  it("places the phone variant: the whole drawing scaled about the view's center, overrides as given", () => {
    const [vx, vy, vw, vh] = C.view;
    const ox = vx + vw / 2;
    const oy = vy + vh / 2;
    const box = C.phone!.formations[1].states[0];
    if (box.kind !== "rect") throw new Error("kind changed");
    expect(box.g.x).toBeCloseTo(ox + (300 - ox) * 0.5);
    expect(box.g.y).toBeCloseTo(oy + (400 - oy) * 0.5 + 10);
    expect(box.g.w).toBe(50);
    // c has no scale: its pieces are the desktop's, its arc override as given.
    expect(C.phone!.formations[2].states[2].g).toEqual(state(ring(300, 400, 60)).g);
    expect(C.phone!.formations[2].states[0]).toEqual(C.formations[2].states[0]);
    // The mark is never stretched: one scale for both axes.
    expect(markFrame({ cx: 0, cy: 0, size: 240, o: 1, role: ["ink", "ink", 0] }).transform).toBe("translate(-120 -120) scale(2)");
  });

  it("times the moves into the gaps: nothing moves while a formation holds", () => {
    expect(TIMING.start.slice(1)).toEqual([0, 1500]);
    expect(TIMING.end.slice(1)).toEqual([1000, 2000]);
    expect(sampleFrames(C, TIMING, 1000, easings)).toBe(C.formations[1].frame);
    expect(sampleFrames(C, TIMING, 1250, easings)).toBe(C.formations[1].frame);
    expect(sampleFrames(C, TIMING, 1500, easings)).toBe(C.formations[1].frame);
    expect(sampleFrames(C, TIMING, 1501, easings)).not.toBe(C.formations[1].frame);
    expect(sampleFrames(C, TIMING, 2000, easings)).toBe(C.formations[2].frame);
    expect(sampleFrames(C, TIMING, 9000, easings)).toBe(C.formations[2].frame);
  });

  it("shortens a move to its lead, ending on its anchor, and never runs windows backwards", () => {
    const led = compileMorph({ ...SRC, formations: SRC.formations.map((f, i) => (i === 2 ? { ...f, lead: 10 } : f)) });
    const t = resolveMorphTiming(led, [NaN, 1000, 2000], [NaN, 1500, NaN], 9, 10_000);
    expect([t.start[2], t.end[2]]).toEqual([2000 - 90, 2000]);
    const back = resolveMorphTiming(C, [NaN, 1000, 800], [NaN, NaN, NaN], 9, 10_000);
    expect(back.start[2]).toBeGreaterThanOrEqual(back.end[1]);
    expect(back.end[2]).toBeGreaterThanOrEqual(back.start[2]);
  });

  it("is a pure function of the scroll position: the same strings whether reached scrolling down or up", () => {
    const ys = Array.from({ length: 61 }, (_, i) => i * 40);
    const down = ys.map((y) => sampleFrames(C, TIMING, y, easings));
    const up = [...ys].reverse().map((y) => sampleFrames(C, TIMING, y, easings)).reverse();
    expect(up).toEqual(down);
    // And it moves through the gaps.
    expect(new Set(down.map((f) => JSON.stringify(f))).size).toBeGreaterThan(10);
  });

  it("moves the mark and the window with the move, the mark whole by the move's middle", () => {
    const mid = locate(TIMING, 1750);
    expect(mid.next).toBe(2);
    const now = moveAt(C, 2, 0.5, easings);
    expect(now.mark.o).toBe(1);
    expect(now.mark.size).toBeGreaterThan(0);
    expect(now.window.w).toBeLessThan(600);
    const early = sampleMorph(C, TIMING, 1510, easings);
    expect(early.mark.o).toBeLessThan(0.2);
  });
});

/* ---------------------------------------------------------------- *
 * Pockets
 * ---------------------------------------------------------------- */

describe("pockets", () => {
  const plans = pocketPlans(C, ["hero", "arrives", "ceiling", "pace-0"]);

  it("play in page order: each the formations after the pocket before, the first from the opening formation", () => {
    expect(plans.map((p) => [p.key, p.steps, p.run])).toEqual([
      ["hero", [0], "section"],
      ["arrives", [0, 1], "item"],
      ["pace-0", [1, 2], "climax"],
    ]);
    const problems: string[] = [];
    pocketPlans(C, ["arrives", "hero"], problems);
    expect(problems).toHaveLength(1);
  });

  it("open every later pocket on the drawing the pocket before ended on, skipping what a phone never plays", () => {
    const src: MorphSource = {
      ...SRC,
      formations: [
        SRC.formations[0],
        { ...SRC.formations[1], gather: true, still: "arrives" },
        { ...SRC.formations[2], pocketSkip: true, still: undefined, anchor: { at: "s3" } },
        { id: "d", anchor: { at: "s4" }, still: "pace-0", pieces: { box: rect(10, 10, 20, 20) } },
        { id: "e", anchor: { at: "s5" }, still: "people", pieces: { box: rect(30, 10, 20, 20) } },
      ],
    };
    const c = compileMorph(src);
    expect(c.problems).toEqual([]);
    const got = pocketPlans(c, ["hero", "arrives", "pace-0", "people"]);
    // Each opens where the one before ended (a matched cut) and skips c.
    expect(got.map((p) => [p.key, p.steps])).toEqual([
      ["hero", [0]],
      ["arrives", [0, 1]],
      ["pace-0", [1, 3]],
      ["people", [3, 4]],
    ]);
  });

  it("rise as the through-line alone when they must: the line as the band before drew it, every other stroke growing out of it", () => {
    const src: MorphSource = {
      ...SRC,
      formations: [
        { id: "a", still: "hero", pieces: { hzL: line(0, 500, 300, 500), box: rect(100, 100, 200, 300, 20) } },
        { id: "b", anchor: { at: "s2" }, still: "arrives", pieces: { hzL: line(0, 300, 300, 300), box: rect(300, 400, 100, 100, 10) } },
      ],
      pool: [
        { id: "hzL", kind: "line" },
        { id: "box", kind: "rect" },
      ],
    };
    const c = compileMorph(src);
    expect(c.problems).toEqual([]);
    const { f } = lineOpener(c.phone!, 0, 1);
    expect(f.states[0]).toEqual(c.phone!.formations[0].states[0]);
    expect(f.states[1].look.o).toBe(0);
    const plan = { steps: [0, 1], open: "line" as const };
    const entry: [number, number] = [0, 100];
    expect(pocketFrameAt(c.phone!, plan, entry, [200, 300], 0, easings)).toBe(f.frame);
    expect(pocketFrameAt(c.phone!, plan, entry, [200, 300], 100, easings)).toBe(c.phone!.formations[1].frame);
    const mid = pocketFrameAt(c.phone!, plan, entry, [200, 300], 60, easings);
    expect(mid.pieces[1].d).not.toBe(f.frame.pieces[1].d);
  });

  it("play a band's opening move while it rises into view, and the rest once it is pinned, the same both ways", () => {
    // Its top 55% down the viewport (the block before it clear of the reading line) to 18% under the header:
    // before the pin, and never before the page's top.
    expect(pocketEntry(2000, 800, 80)).toEqual([2000 - ENTRY_FROM * 800, 2000 - 80 - ENTRY_TO * 800]);
    expect(pocketEntry(300, 800, 80)[0]).toBe(0);
    // A placement's own span (morph/index.ts ENTRY_FROM_AT, ENTRY_TO_AT): the people's, from 95% down to 55% under the header.
    expect(pocketEntry(2000, 800, 80, 0.95, 0.55)).toEqual([2000 - 0.95 * 800, 2000 - 80 - 0.55 * 800]);
    const [e0, e1] = pocketEntry(2000, 800, 80);
    expect(e1).toBeLessThan(2000 - 80);
    const plan = { steps: [0, 1, 2] };
    const range: [number, number] = [1920, 2320];
    const at = (y: number) => pocketFrameAt(C.phone!, plan, [e0, e1], range, y, easings);
    // Before it rises: the drawing the band before ended on. Risen: its own first formation, held until it pins.
    expect(at(0)).toBe(C.phone!.formations[0].frame);
    expect(at(e1)).toBe(C.phone!.formations[1].frame);
    expect(at(1919)).toBe(C.phone!.formations[1].frame);
    expect(at((e0 + e1) / 2)).toEqual(stepFrame(C.phone!, 0, 1, 0.5, easings));
    // Pinned: the rest of its steps, over its runway.
    expect(at(1920 + 400 * POCKET_REFORM)).toBe(C.phone!.formations[2].frame);
    const ys = Array.from({ length: 41 }, (_, i) => 1000 + i * 40);
    const down = ys.map(at);
    expect([...ys].reverse().map(at).reverse()).toEqual(down);
    // No entry (the first pocket): every step over the runway.
    expect(pocketFrameAt(C.phone!, plan, null, range, 1919, easings)).toBe(C.phone!.formations[0].frame);
  });

  it("know where a sticky band is on screen: riding with its box, held under the header for its runway, then leaving", () => {
    expect(bandTopAt(1000, 300, 80, 0)).toBe(1000);
    expect(bandTopAt(1000, 300, 80, 920)).toBe(80);
    expect(bandTopAt(1000, 300, 80, 1100)).toBe(80);
    expect(bandTopAt(1000, 300, 80, 1220)).toBe(80);
    expect(bandTopAt(1000, 300, 80, 1320)).toBe(-20);
  });

  it("move over the first share of the runway (each hold as long as a move) and hold the rest, exactly", () => {
    const plan = { steps: [0, 1, 2] };
    expect(POCKET_STEP_HOLD).toBe(0.4);
    expect(pocketAt(plan, 0)).toEqual({ a: 0, b: 1, t: 0 });
    expect(pocketAt(plan, POCKET_REFORM)).toEqual({ a: 2, b: 3, t: 0 });
    expect(pocketAt(plan, 0.95)).toEqual({ a: 2, b: 3, t: 0 });
    // Two moves (.6 of a slot each) and one hold (.4): the middle formation holds from 3/8 to 5/8 of the reform.
    expect(pocketAt(plan, POCKET_REFORM * 0.38)).toEqual({ a: 1, b: 2, t: 0 });
    expect(pocketAt(plan, POCKET_REFORM * 0.62)).toEqual({ a: 1, b: 2, t: 0 });
    expect(pocketAt(plan, POCKET_REFORM * 0.1875).t).toBeCloseTo(0.5);
    expect(pocketAt({ ...plan, hold: 0.5 }, POCKET_REFORM / 6).t).toBeCloseTo(0.5);
    // A lead holds the opening first; a frame's reform takes more of the runway.
    expect(pocketAt({ steps: [0, 1], lead: 0.5 }, 0.3).t).toBe(0);
    expect(pocketAt({ steps: [0, 1], lead: 0.5, reform: FRAME_REFORM }, 0.6).t).toBeGreaterThan(0);
    expect(pocketFrame(C.phone!, plan, 1, easings)).toBe(C.phone!.formations[2].frame);
    expect(pocketFrame(C.phone!, plan, 0, easings)).toBe(C.phone!.formations[0].frame);
    expect(pocketFrame(C.phone!, { steps: [1] }, 0.5, easings)).toBe(C.phone!.formations[1].frame);
  });

  it("plays a jump between two formations that are not neighbors, landing on each exactly", () => {
    const plan = { steps: [0, 2] };
    expect(pocketFrame(C.phone!, plan, 0, easings)).toBe(C.phone!.formations[0].frame);
    expect(pocketFrame(C.phone!, plan, 1, easings)).toBe(C.phone!.formations[2].frame);
    const mid = pocketFrame(C.phone!, plan, POCKET_REFORM / 2, easings);
    expect(mid).not.toEqual(C.phone!.formations[0].frame);
    expect(mid).not.toEqual(C.phone!.formations[2].frame);
  });

  it("is reversible: the same strings at the same progress, down or up", () => {
    const ps = Array.from({ length: 41 }, (_, i) => i / 40);
    const down = ps.map((p) => pocketFrame(C.phone!, { steps: [0, 1, 2] }, p, easings));
    const up = [...ps].reverse().map((p) => pocketFrame(C.phone!, { steps: [0, 1, 2] }, p, easings)).reverse();
    expect(up).toEqual(down);
  });

  it("pins from the pocket's top at the header to the end of its runway, inside the scroll range", () => {
    expect(pocketRange(1000, 600, 200, 80, 10_000)).toEqual([920, 1320]);
    expect(pocketProgress([920, 1320], 1120)).toBe(0.5);
    expect(pocketProgress([920, 1320], 0)).toBe(0);
    expect(pocketProgress([920, 1320], 5000)).toBe(1);
    const [a, b] = pocketRange(0, 0, 0, 80, 0);
    expect(b - a).toBeGreaterThanOrEqual(1);
    expect(pocketRange(9800, 600, 200, 80, 9900)).toEqual([9720, 9900]);
  });
});

describe("two-stroke moves (ViaSpec)", () => {
  it("retract a long trip into its own end, unseen between, and grow it out of its new place's end", () => {
    const src: MorphSource = {
      reel: "r1",
      pool: [
        { id: "l001", kind: "line" },
        { id: "named", kind: "line" },
      ],
      formations: [
        { id: "a", pieces: { l001: line(0, 100, 0, 300), named: line(0, 100, 0, 300) } },
        { id: "b", anchor: { at: "s1" }, via: { cap: 50, sink: { y: 400 }, out: 0.4, in: 0.6 }, stagger: 0, bend: 0, pieces: { l001: line(500, 600, 500, 700), named: line(500, 600, 500, 700) } },
      ],
    };
    const c = compileMorph(src);
    const m = c.moves[1]!;
    expect(m.via?.pieces[0]).toBeTruthy();
    // A named identity always travels.
    expect(m.via?.pieces[1]).toBeNull();
    const at = (t: number) => moveAt(c, 1, t, easings).pieces[0];
    // Out: the far end stays (its end nearest the sink, y 300) while it shortens, whole until the end.
    const out = at(0.12);
    expect(out.kind === "line" && Math.max(out.g.y1, out.g.y2)).toBeCloseTo(300, 0);
    expect(out.look.o).toBe(1);
    // Between the strokes it is unseen; growing again it starts from its new place's end nearest the sink (y 600).
    expect(at(0.5).look.o).toBe(0);
    const grow = at(0.8);
    expect(grow.kind === "line" && Math.min(grow.g.y1, grow.g.y2)).toBeCloseTo(600, 0);
    expect(grow.look.o).toBe(1);
  });

  it("fades a piece only as it lies down in its host, never in mid-air", () => {
    const from = resolveSpec(line(0, 0, 100, 0), DEFAULT_LOOK);
    const to = resolveSpec({ ...point("line", 300, 300, { o: 0 }), parked: true }, DEFAULT_LOOK);
    const m = planMove(from, to, 0);
    expect(m.fade).toBe("late");
    expect(pieceAt(m, 0.5, 0.5).look.o).toBe(1);
    expect(pieceAt(m, 0.8, 0.8).look.o).toBe(1);
    expect(pieceAt(m, 0.95, 0.95).look.o).toBeLessThan(1);
    const back = planMove(to, from, 0);
    expect(back.fade).toBe("early");
    expect(pieceAt(back, 0.2, 0.2).look.o).toBe(1);
  });
});

/* ---------------------------------------------------------------- *
 * The brand geometry
 * ---------------------------------------------------------------- */

describe("the mark and the orb as pieces", () => {
  it("reads the mark from the generated brand path: a disk and three rings", () => {
    expect(MARK_UNITS).toBe(120);
    expect(MARK_RADII).toEqual([10, 19, 27, 36, 42, 51, 55]);
    expect(MARK_DISK).toBe(10);
    expect(MARK_BANDS).toEqual([
      [19, 27],
      [36, 42],
      [51, 55],
    ]);
  });

  it("lays the pieces exactly on the mark: rings on the centerlines, as wide as the bands", () => {
    const { disk, rings } = markPieces(60, 60, 120);
    expect(state(disk).g).toEqual({ x: 50, y: 50, w: 20, h: 20, r: 10, rot: 0 });
    expect(rings.map((r) => [r.r, r.band, r.a1 - r.a0, r.weight])).toEqual([
      [23, 8, 360, 0],
      [39, 6, 360, 0],
      [53, 4, 360, 0],
    ]);
    const big = markPieces(300, 400, 240);
    expect(big.rings.map((r) => r.band)).toEqual([16, 12, 8]);
  });

  it("draws the orb with the app's rings at 100, 84 and 68% and its core", () => {
    const { core, rings } = orbPieces(0, 0, 100);
    expect(rings.map((r) => r.r)).toEqual([100, 84, 68]);
    expect(core.w).toBeCloseTo(2 * 100 * ORB_CORE);
    expect(rings.every((r) => r.role === "accent")).toBe(true);
  });
});

/* ---------------------------------------------------------------- *
 * The registered formation files, as data
 * ---------------------------------------------------------------- */

describe("registered formations", () => {
  const compiled = Object.values(MORPHS) as CompiledMorph[];

  it("compile with no problems, and their pockets chain in page order", () => {
    expect(SOURCES.length).toBeGreaterThan(0);
    for (const c of compiled) expect(c.problems, c.reel).toEqual([]);
    for (const p of Object.values(POCKETS)) expect(p!.problems).toEqual([]);
  });

  it("draw every still for a placement the page has, in page order", () => {
    const { container } = render(createElement(WhyPage));
    const inPage = Array.from(container.querySelectorAll<HTMLElement>("[data-why-pocket], [data-why-still]")).map(
      (el) => el.dataset.whyPocket ?? el.dataset.whyStill!,
    );
    expect(inPage).toEqual(PLACEMENTS.filter((k) => inPage.includes(k)));
    for (const c of compiled) for (const f of c.formations) for (const k of f.still) expect(PLACEMENTS, `${f.id} ${k}`).toContain(k);
  });

  it("key every formation to a sentence that exists once, in essay order", () => {
    const { container } = render(createElement(WhyPage));
    const order = Array.from(container.querySelectorAll<HTMLElement>("[data-why-at]")).map((e) => e.dataset.whyAt!);
    for (const c of compiled) {
      let last = -1;
      c.formations.forEach((f, i) => {
        if (i > 0) expect(f.anchor, f.id).toBeDefined();
        for (const a of [f.anchor, f.hold]) {
          if (!a) continue;
          expect(container.querySelectorAll(`[data-why-at="${a.at}"]`), `${f.id} ${a.at}`).toHaveLength(1);
        }
        if (f.anchor) {
          const at = order.indexOf(f.anchor.at);
          expect(at, `${f.id} comes after the formation before`).toBeGreaterThanOrEqual(last);
          last = at;
        }
      });
    }
  });

  it("keep every visible piece in sight: on the grid, and on a phone in its view (a drawing may run out past the edges, where the column and the band crop it)", () => {
    const bounds = (s: PieceState): [number, number, number, number] => {
      if (s.kind === "rect") return [s.g.x, s.g.y, s.g.x + s.g.w, s.g.y + s.g.h];
      if (s.kind === "line") return [Math.min(s.g.x1, s.g.x2), Math.min(s.g.y1, s.g.y2), Math.max(s.g.x1, s.g.x2), Math.max(s.g.y1, s.g.y2)];
      // An arc's own extent: sampled along its span, not its whole circle.
      const { cx, cy, r, a0, a1 } = s.g;
      const xs: number[] = [];
      const ys: number[] = [];
      for (let k = 0; k <= 64; k++) {
        const a = ((a0 + ((a1 - a0) * k) / 64) * Math.PI) / 180;
        xs.push(cx + r * Math.cos(a));
        ys.push(cy + r * Math.sin(a));
      }
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    };
    // The column is wider than the grid on a wide window: a piece just past the side may still show there.
    const SLACK = 24;
    for (const c of compiled) {
      const [vx, vy, vw, vh] = c.view;
      for (const [grid, box] of [
        [c.formations, [0, 0, VIEW_W, VIEW_H]],
        [c.phone!.formations, [vx, vy, vx + vw, vy + vh]],
      ] as const) {
        for (const f of grid) {
          f.states.forEach((s, i) => {
            // Parked pieces lie in a stroke of their own color (the horizon runs off the grid): hidden there.
            if (s.look.o <= 0 || s.parked) return;
            const [x0, y0, x1, y1] = bounds(s);
            const where = `${c.reel} ${f.id} ${c.pool[i].id}`;
            // A clipped piece wholly outside its window is not drawn (a card scrolled off the feed).
            const w = f.window;
            if (c.pool[i].clip && (x0 > w.x + w.w || x1 < w.x || y0 > w.y + w.h || y1 < w.y)) return;
            // Never wholly out of sight while it is meant to be seen.
            expect(x1, where).toBeGreaterThanOrEqual(box[0] - SLACK);
            expect(x0, where).toBeLessThanOrEqual(box[2] + SLACK);
            expect(y1, where).toBeGreaterThanOrEqual(box[1] - SLACK);
            expect(y0, where).toBeLessThanOrEqual(box[3] + SLACK);
          });
        }
      }
    }
  });

  it("never rest on an approximation of the mark: a formation that shows the mark shows no piece under it", () => {
    for (const c of compiled) {
      for (const f of c.formations) {
        if (f.mark.o <= 0) continue;
        const r = f.mark.size / 2;
        f.states.forEach((s, i) => {
          const g = s.kind === "rect" ? [s.g.x + s.g.w / 2, s.g.y + s.g.h / 2] : s.kind === "line" ? [(s.g.x1 + s.g.x2) / 2, (s.g.y1 + s.g.y2) / 2] : [s.g.cx, s.g.cy];
          // The pieces fade as one layer under the mark (f.layer), never piece by piece.
          if (Math.hypot(g[0] - f.mark.cx, g[1] - f.mark.cy) <= r) expect(s.look.o * f.layer, `${f.id} ${c.pool[i].id}`).toBe(0);
        });
      }
    }
  });
});

describe("the brand mark layer", () => {
  it("fades in and out whole, where it stands: an unseen end never grows it or moves it", () => {
    const placed = C.formations[2].mark;
    for (const u of [0.1, 0.3, 0.6, 0.9]) {
      const now = moveAt(C, 2, u, easings).mark;
      expect([now.cx, now.cy, now.size]).toEqual([placed.cx, placed.cy, placed.size]);
    }
    expect(moveAt(C, 2, 0.1, easings).mark.o).toBeGreaterThan(0);
  });
});
