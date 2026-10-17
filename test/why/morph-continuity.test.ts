// The one pool's continuity, checked on the registered data: nothing pops in
// or out in the middle of the story. A piece may only go unseen by lying
// down in a stroke of its own color (parked: the engine fades it only as it
// arrives there, pieces.ts PieceMove.fade), never in mid-air. The only
// exceptions are the pivot (the pieces under the exact mark, as one layer)
// and a clipped card scrolled off its window.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import geometry from "../fixtures/why-geometry-1440.json";
import { ENTRY_FROM_AT, ENTRY_TO_AT, FRAMES, KEYED, MORPHS, OPEN_WHOLE, POCKETS } from "@/components/why/morph";
import { beatY } from "@/components/why/anchors";
import { asNow as asNowState, extentFade, extentOf, PARK_FADE, planMove, pieceAt, strokeUnits } from "@/components/why/morph/pieces";
import { CROSSFADE_SLOT, KEYED_MIN, KEYED_SQUEEZE, keyedRanges, moveAt, pocketEntry, resolveMorphTiming, runSvh, sampleMorph, type CompiledMorph, type MorphNow } from "@/components/why/morph/formation";
import { PIVOT_STAGE } from "@/components/why/morph/formations/essay";
import { readEasings } from "@/components/why/engine";
import type { PieceNow } from "@/components/why/morph/pieces";

const C = MORPHS.r1 as CompiledMorph;
const ids = C.formations.map((f) => f.id);
const PIVOT = [ids.indexOf("V13-orb-returns"), ids.indexOf("F14-people")];
const inPivot = (i: number) => i > PIVOT[0] && i <= PIVOT[1];

describe("the pool's continuity", () => {
  it.each([
    ["desktop", C],
    ["phone", C.phone as CompiledMorph],
  ] as const)("only ever hides a piece by laying it in a stroke of its own color (%s)", (_v, c) => {
    const bad: string[] = [];
    for (let i = 1; i < c.formations.length; i++) {
      if (inPivot(i)) continue;
      const a = c.formations[i - 1];
      const b = c.formations[i];
      b.states.forEach((s, k) => {
        if (c.pool[k].clip) return;
        const p = a.states[k];
        if (p.look.o > 0 && s.look.o <= 0 && !s.parked) bad.push(`${b.id} ${c.pool[k].id}: fades out in mid-air`);
        if (p.look.o <= 0 && s.look.o > 0 && !p.parked) bad.push(`${b.id} ${c.pool[k].id}: fades in from nowhere`);
      });
    }
    expect(bad).toEqual([]);
  });

  it("keeps a piece whole until the last of its trip into its host", () => {
    for (let i = 1; i < C.formations.length; i++) {
      if (inPivot(i)) continue;
      C.formations[i].states.forEach((s, k) => {
        const p = C.formations[i - 1].states[k];
        if (!(p.look.o > 0 && !p.parked && s.look.o <= 0 && s.parked)) return;
        const m = planMove(p, s, 0);
        const now = pieceAt(m, 1 - PARK_FADE - 0.01, 1 - PARK_FADE - 0.01);
        // Whole, but for what its own size takes away as it shrinks into the host (never a dot at full ink).
        expect(now.look.o, `${C.formations[i].id} ${C.pool[k].id}`).toBeCloseTo(p.look.o * extentFade(extentOf(now.kind, now.g), m.ref), 6);
      });
    }
  });
});

/* ---------------------------------------------------------------- *
 * Every move runs over enough scroll to read as one: never a burst a
 * flick plays in a few milliseconds.
 * ---------------------------------------------------------------- */

describe("a phone's band never rises over empty ground", () => {
  it("opens every band on a drawing with 40% or more of the stroke it lands on at full ink (the summit's on the glasses)", () => {
    const P = C.phone as CompiledMorph;
    const bad: string[] = [];
    // (A band that opens on its own formation is a drawing of its own: the people's rises as the listening orb.)
    for (const p of POCKETS.r1!.plans.slice(1)) {
      if (p.steps.length < 2 || p.own) continue;
      const full = (i: number) => {
        let len = 0;
        P.formations[i].states.forEach((st, k) => {
          if (st.parked || st.look.o < 0.999 || P.pool[k].clip) return;
          len += extentOf(st.kind, st.g);
        });
        return len;
      };
      const open = full(p.steps[0]);
      const land = full(p.steps[1]);
      if (open < 0.4 * land) bad.push(`${p.key}: ${Math.round((100 * open) / land)}%`);
    }
    expect(bad).toEqual([]);
    // The summit's band opens on the glasses the hands' band ended on, whole (never grown again out of the
    // horizon), never on the hands; its only move lifts the ridge.
    expect(OPEN_WHOLE).toContain("summit");
    const summit = POCKETS.r1!.plans.find((p) => p.key === "summit")!;
    expect(summit.steps.map((i) => C.formations[i].id)).toEqual(["F16-wearable", "F17-summit"]);
    expect(C.formations[POCKETS.r1!.plans.find((p) => p.key === "hands")!.steps.at(-1)!].id).toBe("F16-wearable");
  });
});

describe("a phone's list steps item by item", () => {
  it("ends each move as its item reaches the reading line, over 100px or more, never before the move before has ended", () => {
    // 390 x 844 as measured: the four pairs' tops 97px apart, the eras' 86 to 113 apart, the line 62% down.
    for (const tops of [[5786, 5883, 5981, 6078], [2925, 3011, 3124, 3237], [1000, 1010, 1020, 1030]]) {
      const line = 523;
      const after = tops[0] - line - 300;
      const r = keyedRanges(tops, line, after);
      r.forEach(([a, b], j) => {
        expect(b - a, `move ${j}`).toBeGreaterThanOrEqual(KEYED_MIN);
        expect(a, `move ${j}`).toBeGreaterThan(j ? r[j - 1][1] : after);
        // It lands as its item reaches the line, or just after where the items crowd.
        expect(b).toBeGreaterThanOrEqual(tops[j] - line);
      });
      expect(r[0][1]).toBe(tops[0] - line);
    }
  });
});

describe("a small phone's list, too long to pin with its band, still forms every machine in view", () => {
  it("lands every era's machine with 60% or more of the band on screen (375 x 667 as measured)", () => {
    // The machines' band 2106px down, 200px tall (30svh), the eras right under it; a 73px header.
    const vh = 667;
    const header = 73;
    const band = { top: 2106, h: 200 };
    const eras = [2338, 2451, 2537, 2650, 2763];
    const lines = [0.66, 0.72, 0.78, 0.84].map((l) => l * vh);
    const after = band.top - 0.5 * vh;
    const r = keyedRanges(eras.slice(1), lines, after, band.top - header + 0.4 * band.h);
    r.forEach(([a, b], j) => {
      const top = band.top - b;
      const seen = (Math.min(top + band.h, vh) - Math.max(top, header)) / band.h;
      expect(seen, `era ${j + 2}`).toBeGreaterThanOrEqual(0.6 - 1e-9);
      expect(b - a, `era ${j + 2}`).toBeGreaterThanOrEqual(KEYED_SQUEEZE);
      expect(a).toBeGreaterThan(j ? r[j - 1][1] : after);
    });
  });
});

describe("a shrinking stroke thins away, never a dot", () => {
  const easings = readEasings(() => "");
  it.each([
    ["desktop", C],
    ["phone", C.phone as CompiledMorph],
  ] as const)("draws no stroke shorter than its own width at more than a fifth of its ink, at any twentieth of any move (%s)", (_v, c) => {
    const bad: string[] = [];
    for (let i = 1; i < c.formations.length; i++) {
      for (let t = 0.05; t < 0.999; t += 0.05) {
        moveAt(c, i, t, easings).pieces.forEach((p, k) => {
          if (p.look.o <= 0.2) return;
          // At rest at either end (a point folded into a stroke of its own color, hidden by it): not in flight.
          const ends = [c.formations[i - 1].states[k], c.formations[i].states[k]];
          const g = p.g as Record<string, number>;
          if (ends.some((e) => Object.entries(e.g).every(([key, v]) => Math.abs((v as number) - g[key]) < 1e-6))) return;
          const sw = strokeUnits(p.look.weight, p.look.band);
          const len = extentOf(p.kind, p.g);
          // On its way to or from nothing: under half the size it has where it is seen (a short run of a chain stays).
          const whole = Math.max(...ends.filter((e) => e.look.o > 0 && !e.parked).map((e) => extentOf(e.kind, e.g)), 0);
          if (len < sw && len < 0.5 * whole && p.look.fill[0] === "none") bad.push(`${c.formations[i].id} ${c.pool[k].id} at ${t.toFixed(2)}: ${len.toFixed(1)} long at o ${p.look.o.toFixed(2)}`);
        });
      }
    }
    expect(bad.slice(0, 20)).toEqual([]);
  });
});

describe("the brand mark is the climax, never approximated at rest", () => {
  it("holds the exact mark at full strength, no pieces under it, for as long as the pivot's line is pinned, and hands it straight to the orb", () => {
    const g = { at: new Map(Object.entries(geometry.at)), svh: geometry.svh };
    const t = resolveMorphTiming(C, C.formations.map((f) => beatY(f.anchor, g)), C.formations.map((f) => beatY(f.hold, g)), geometry.svh, geometry.maxScroll, geometry.unit);
    const easings = readEasings(() => "");
    const vh = 100 * geometry.svh;
    const stage = geometry.at["pivot-stage"];
    const line = geometry.at["pivot"];
    // The section pins (sticky, 100svh) from the stage's top at the viewport's top until PIVOT_STAGE svh after
    // the stage's top reached the viewport's bottom (why.css --why-pivot-stage); the line rides in it.
    const pinFrom = stage.top;
    const pinTo = stage.top - vh + PIVOT_STAGE * geometry.svh;
    const exact = t.end[ids.indexOf("F13x-exact")];
    expect(exact).toBeLessThan(pinFrom);
    const bad: string[] = [];
    for (let y = exact; y <= pinTo; y += 4) {
      const top = line.top - stage.top + Math.max(0, stage.top - y);
      if (top < geometry.headerH || top + line.height > vh) continue;
      const now = sampleMorph(C, t, y, easings);
      if (now.mark.o < 0.999 || now.layer > 0.001) bad.push(`${Math.round(y)}: mark ${now.mark.o.toFixed(2)}, pieces ${now.layer.toFixed(2)}`);
    }
    expect(bad.slice(0, 10)).toEqual([]);
    // The pieces come back under the mark only as the section starts to leave, and the mark relaxes into the
    // orb the moment they are back: no stretch where a copy of the mark in pieces holds still.
    const back = ids.indexOf("R2-pieces");
    expect(t.start[back]).toBeGreaterThanOrEqual(pinTo - 1);
    expect(t.start[back + 1]).toBeCloseTo(t.end[back], 0);
  });
});

describe("every move runs over enough scroll", () => {
  it("desktop: each move takes 120px or more at 1440 x 900 (the machines, stepping with their unpinned list, 80px; a crossfade, where nothing moves, excepted)", () => {
    // test/fixtures/why-geometry-1440.json: the page's measured anchors (node scripts/why/geometry.mjs 1440x900).
    const g = { at: new Map(Object.entries(geometry.at)), svh: geometry.svh };
    const t = resolveMorphTiming(C, C.formations.map((f) => beatY(f.anchor, g)), C.formations.map((f) => beatY(f.hold, g)), geometry.svh, geometry.maxScroll, geometry.unit);
    const short: string[] = [];
    for (let i = 1; i < C.formations.length; i++) {
      if (C.moves[i]!.ease === "crossfade") continue;
      const len = t.end[i] - t.start[i];
      // The machines step with an unpinned list, its eras 106px apart: ERA_MOVE (80px or more) each.
      const least = /^F(0[7-9]|10)-/.test(C.formations[i].id) ? 80 : 120;
      if (!(len >= least)) short.push(`${C.formations[i].id}: ${Math.round(len)}px`);
    }
    expect(short).toEqual([]);
  });

  it("phone: each band's opening move and each pinned step takes 100px or more at 390 x 844", () => {
    const vh = 844;
    const svh = vh / 100;
    const header = 80; // app/site-tokens.css --site-header-h
    const css = readFileSync("components/why/why.css", "utf8");
    const svhOf = (name: string) => Number(new RegExp(`${name}:\\s*([\\d.]+)svh`).exec(css)![1]);
    const FRAME_RUN: Record<string, string> = { hero: "--why-hero-frame-run" };
    expect(Object.keys(FRAME_RUN)).toEqual([...FRAMES]);
    const plans = POCKETS.r1!.plans;
    const short: string[] = [];
    plans.forEach((p, k) => {
      let steps = p.steps;
      if (k > 0) {
        const [e0, e1] = pocketEntry(10_000, vh, header, ENTRY_FROM_AT[p.key], ENTRY_TO_AT[p.key]);
        if (e1 - e0 < 100) short.push(`${p.key} entry: ${Math.round(e1 - e0)}px`);
        steps = steps.slice(1);
      }
      // A keyed pocket's moves run over their own ranges (keyedRanges: 100px or more each, tested below); a
      // list that pins with its band (a frame) steps over the frame's runway.
      if (KEYED[p.key] && !FRAME_RUN[p.key]) return;
      const n = steps.length - 1;
      if (n < 1) return;
      const run = (FRAME_RUN[p.key] ? svhOf(FRAME_RUN[p.key]) : runSvh(p.run)) * svh;
      const M = 1 - p.hold;
      // A crossfade (nothing moving) takes a short slot (formation.ts CROSSFADE_SLOT).
      const weight = (s: number) => (p.short?.includes(s) ? CROSSFADE_SLOT : 1);
      const slot = (run * p.reform) / (p.lead + steps.slice(1).reduce((t, s) => t + weight(s) * M, 0) + (n - 1) * p.hold);
      steps.slice(1).forEach((s) => {
        if (C.phone!.moves[s]?.ease === "crossfade") return;
        if (slot * M < 100) short.push(`${p.key} ${C.formations[s].id}: ${Math.round(slot * M)}px`);
      });
    });
    expect(short).toEqual([]);
  });
});

/* ---------------------------------------------------------------- *
 * A move reforms the drawing; it never erases it and draws the next.
 * Measured as the stroke a reader sees: every piece's visible length
 * inside the frame (the stage's grid, a phone's view; a clipped piece
 * inside its window too), times its opacity and the pieces' layer.
 * ---------------------------------------------------------------- */

const DEG = Math.PI / 180;
function strokePoints(p: PieceNow): [number, number][] {
  const g = p.g as Record<string, number>;
  if (p.kind === "line") return [[g.x1, g.y1], [g.x2, g.y2]];
  if (p.kind === "arc") {
    const span = Math.max(-360, Math.min(360, g.a1 - g.a0));
    const n = Math.max(2, Math.ceil(Math.abs(span) / 6));
    return Array.from({ length: n + 1 }, (_, i) => {
      const a = (g.a0 + (span * i) / n) * DEG;
      return [g.cx + g.r * Math.cos(a), g.cy + g.r * Math.sin(a)] as [number, number];
    });
  }
  const w = Math.max(0, g.w);
  const h = Math.max(0, g.h);
  return [[g.x, g.y], [g.x + w, g.y], [g.x + w, g.y + h], [g.x, g.y + h], [g.x, g.y]];
}
/** The length of a polyline inside a box (Liang-Barsky per segment). */
function lengthIn(pts: [number, number][], box: readonly [number, number, number, number]): number {
  const [x0, y0, bw, bh] = box;
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const dx = pts[i][0] - ax;
    const dy = pts[i][1] - ay;
    let t0 = 0;
    let t1 = 1;
    let ok = true;
    const P = [-dx, dx, -dy, dy];
    const Q = [ax - x0, x0 + bw - ax, ay - y0, y0 + bh - ay];
    for (let k = 0; k < 4 && ok; k++) {
      if (P[k] === 0) {
        if (Q[k] < 0) ok = false;
        continue;
      }
      const r = Q[k] / P[k];
      if (P[k] < 0) {
        if (r > t1) ok = false;
        else if (r > t0) t0 = r;
      } else if (r < t0) ok = false;
      else if (r < t1) t1 = r;
    }
    if (ok && t1 > t0) total += Math.hypot(dx, dy) * (t1 - t0);
  }
  return total;
}
function seen(c: CompiledMorph, now: MorphNow, view: readonly [number, number, number, number]): number {
  let total = 0;
  now.pieces.forEach((p, k) => {
    const o = Math.max(0, Math.min(1, p.look.o)) * now.layer;
    if (o <= 0.02) return;
    let box = view;
    if (c.pool[k].clip) {
      const w = now.window;
      const x = Math.max(view[0], w.x);
      const y = Math.max(view[1], w.y);
      box = [x, y, Math.min(view[0] + view[2], w.x + w.w) - x, Math.min(view[1] + view[3], w.y + w.h) - y];
      if (box[2] <= 0 || box[3] <= 0) return;
    }
    total += lengthIn(strokePoints(p), box) * o;
  });
  return total;
}

describe("every move reforms the drawing, never empties the frame", () => {
  const easings = readEasings(() => "");
  it.each([
    ["desktop", C, [0, 0, 600, 800] as const],
    ["phone", C.phone as CompiledMorph, (C.phone as CompiledMorph).view],
  ] as const)("keeps 40%% or more of the smaller drawing's stroke in view at every twentieth of every move (%s)", (_v, c, view) => {
    const low: string[] = [];
    for (let i = 1; i < c.formations.length; i++) {
      // The pivot's crossfades hand the pieces to the exact brand mark and back: nothing moves.
      if (c.moves[i]!.ease === "crossfade") continue;
      const a = seen(c, moveAt(c, i, 0, easings), view);
      const b = seen(c, moveAt(c, i, 1, easings), view);
      const floor = 0.4 * Math.min(a, b);
      for (let t = 0.05; t < 0.999; t += 0.05) {
        const v = seen(c, moveAt(c, i, t, easings), view);
        if (v < floor) low.push(`${c.formations[i].id} at ${t.toFixed(2)}: ${Math.round(v)} of ${Math.round(Math.min(a, b))}`);
      }
    }
    expect(low).toEqual([]);
  });

  it("never draws a clipped piece past the window it is moving into or out of", () => {
    const easings2 = readEasings(() => "");
    const bad: string[] = [];
    for (const c of [C, C.phone as CompiledMorph]) {
      for (let i = 1; i < c.formations.length; i++) {
        const a = c.formations[i - 1].window;
        const b = c.formations[i].window;
        if (a === b) continue;
        for (const t of [0.25, 0.5, 0.75]) {
          const w = moveAt(c, i, t, easings2).window;
          // A window an end has of its own bounds the move's: never larger than both ends' together.
          const own = [a, b].filter((x) => !(x.x <= 0 && x.y <= 0 && x.x + x.w >= 600 && x.y + x.h >= 800));
          if (own.length !== 1) continue;
          const o = own[0];
          const reach = c.formations[a === o ? i : i - 1].reach;
          const ux = reach ? Math.min(o.x, reach.x) : o.x;
          const uy = reach ? Math.min(o.y, reach.y) : o.y;
          const ux1 = reach ? Math.max(o.x + o.w, reach.x + reach.w) : o.x + o.w;
          const uy1 = reach ? Math.max(o.y + o.h, reach.y + reach.h) : o.y + o.h;
          if (w.x < ux - 0.5 || w.y < uy - 0.5 || w.x + w.w > ux1 + 0.5 || w.y + w.h > uy1 + 0.5) bad.push(`${c.formations[i].id} at ${t}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

/* ---------------------------------------------------------------- *
 * The hands hand over figure by figure (people to hands, hands to
 * glasses): each figure contracts toward the place its counterpart opens
 * from, never below three fifths of its size, while the counterpart opens
 * out of three fifths of its own: never a zoom through one point, never a
 * thumbnail of the old drawing.
 * ---------------------------------------------------------------- */

function sizeOf(p: { kind: string; g: unknown }): number {
  const g = p.g as Record<string, number>;
  if (p.kind === "line") return Math.hypot(g.x2 - g.x1, g.y2 - g.y1);
  if (p.kind === "arc") return g.r;
  return Math.max(g.w, g.h);
}

describe("a move's loose strokes stay with the drawing", () => {
  // Mid-move, every stroke on screen is near some other stroke on screen: the ceiling's halves fold into the
  // phone's shoulders, the phone shrinks onto the orb as one nested shape, the summit rises out of the
  // glasses. Never a dash alone in empty ground.
  const easings = readEasings(() => "");
  const dense = (p: PieceNow): [number, number][] => {
    const pts = strokePoints(p);
    const out: [number, number][] = [];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 6));
      for (let k = 0; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
    }
    return out.length ? out : pts;
  };
  it.each([
    ["desktop", C],
    ["phone", C.phone as CompiledMorph],
  ] as const)("keeps every stroke within 40 grid units of another at the middle of the ceiling-to-hallway, viewfinder-to-orb and glasses-to-summit moves (%s)", (_v, c) => {
    const bad: string[] = [];
    for (const id of ["F12-hallway", "V13-orb-returns", "F17-summit"]) {
      const i = c.formations.findIndex((f) => f.id === id);
      for (const tt of [0.35, 0.5, 0.65]) {
        const now = moveAt(c, i, tt, easings);
        const shown = now.pieces
          .map((p, k) => ({ p, k }))
          .filter(({ p, k }) => p.look.o * now.layer > 0.3 && !c.pool[k].clip && extentOf(p.kind, p.g as never) > 4);
        const pts = shown.map(({ p }) => dense(p));
        // A closed shape (a ring, a rounded rect) holds what lies inside it: the orb's core in its rings.
        const closed = shown.map(({ p }) => (p.kind === "rect" || (p.kind === "arc" && Math.abs((p.g as Record<string, number>).a1 - (p.g as Record<string, number>).a0) >= 359) ? boxOfNow(p) : null));
        shown.forEach(({ k, p }, a) => {
          const [x0, y0, x1, y1] = boxOfNow(p);
          const cx = (x0 + x1) / 2;
          const cy = (y0 + y1) / 2;
          if (closed.some((b, j) => j !== a && b && cx > b[0] && cx < b[2] && cy > b[1] && cy < b[3])) return;
          let best = Infinity;
          pts.forEach((q, b) => {
            if (b === a) return;
            for (const [x, y] of pts[a]) for (const [u, v] of q) best = Math.min(best, Math.hypot(x - u, y - v));
          });
          if (best > 40) bad.push(`${id} at ${tt}: ${c.pool[k].id} ${Math.round(best)} units from the rest`);
        });
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("the hands reform part by part", () => {
  const easings = readEasings(() => "");
  const IDS = ["dBack", "dBelly", "dChest", "dRump", "armF1", "armF2", "armN1", "armN2", "fist", "handleA", "cane"];
  it.each([
    ["desktop", C],
    ["phone", C.phone as CompiledMorph],
  ] as const)("carries the dog, the arms, the fist, the handle and the cane into the frame whole (%s)", (_v, c) => {
    const i = c.formations.findIndex((f) => f.id === "F16-wearable");
    const bad: string[] = [];
    for (const id of IDS) {
      const k = c.pool.findIndex((p) => p.id === id);
      expect(k, id).toBeGreaterThanOrEqual(0);
      const a = c.formations[i - 1].states[k];
      const b = c.formations[i].states[k];
      if (!(a.look.o > 0 && !a.parked && b.look.o > 0 && !b.parked)) bad.push(`${id}: not seen in both drawings`);
      if (c.moves[i]!.via?.pieces[k]) bad.push(`${id}: retracts instead of travelling`);
    }
    expect(bad).toEqual([]);
  });

  it.each([
    ["desktop", C],
    ["phone", C.phone as CompiledMorph],
  ] as const)("draws 70%% or more of its stroke at full ink halfway through each hands move (%s)", (_v, c) => {
    const bad: string[] = [];
    for (const id of ["F15-hands", "F16-wearable"]) {
      const i = c.formations.findIndex((f) => f.id === id);
      let all = 0;
      let full = 0;
      moveAt(c, i, 0.5, easings).pieces.forEach((p) => {
        if (p.look.o <= 0.02) return;
        const len = extentOf(p.kind, p.g);
        all += len;
        if (p.look.o >= 0.999) full += len;
      });
      if (full < 0.7 * all) bad.push(`${id}: ${Math.round((100 * full) / all)}%`);
    }
    expect(bad).toEqual([]);
  });
});

/* ---------------------------------------------------------------- *
 * The viewfinder re-targets pair to pair as a pan: the subject it leaves
 * slides out of the reticle as the next slides in, nothing scales, the
 * two never share a stroke, and the reticle is always full.
 * ---------------------------------------------------------------- */

describe("the viewfinder pans pair to pair", () => {
  const easings = readEasings(() => "");
  it.each([
    ["desktop", C],
    ["phone", C.phone as CompiledMorph],
  ] as const)("slides each subject whole, never shares a stroke between two, and keeps 60%% of a subject in the reticle (%s)", (_v, c) => {
    const bad: string[] = [];
    for (const id of ["F12b-curb", "F12c-hall", "F12d-street"]) {
      const i = c.formations.findIndex((f) => f.id === id);
      const a = c.formations[i - 1];
      const b = c.formations[i];
      const via = c.moves[i]!.via!;
      c.pool.forEach((p, k) => {
        if (!p.clip) return;
        const sa = a.states[k].look.o > 0 && !a.states[k].parked;
        const sb = b.states[k].look.o > 0 && !b.states[k].parked;
        if (sa && sb) bad.push(`${id} ${p.id}: drawn in both subjects`);
        const v = via.pieces[k];
        if ((sa || sb) && !v) bad.push(`${id} ${p.id}: does not pan`);
        // Slid, never scaled: its size the same at both ends of its stroke.
        if (v && sa && Math.abs(sizeOf(v.out.to) - sizeOf(v.out.from)) > 0.5) bad.push(`${id} ${p.id}: scales`);
        if (v && sb && Math.abs(sizeOf(v.in.to) - sizeOf(v.in.from)) > 0.5) bad.push(`${id} ${p.id}: scales`);
      });
      const inWin = (now: MorphNow) => seen(c, { ...now, pieces: now.pieces.map((q, k) => (c.pool[k].clip ? q : { ...q, look: { ...q.look, o: 0 } })) }, [0, 0, 600, 800]);
      const ends = [inWin(moveAt(c, i, 0, easings)), inWin(moveAt(c, i, 1, easings))];
      for (let t = 0.05; t < 0.999; t += 0.05) {
        const v = inWin(moveAt(c, i, t, easings));
        if (v < 0.6 * Math.min(...ends)) bad.push(`${id} at ${t.toFixed(2)}: ${Math.round(v)} of ${Math.round(Math.min(...ends))}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it.each([
    ["desktop", C],
    ["phone", C.phone as CompiledMorph],
  ] as const)("holds each pair's subject inside the viewfinder: nothing seen lies outside its window at a hold (%s)", (_v, c) => {
    const bad: string[] = [];
    for (const id of ["F12a-menu", "F12b-curb", "F12c-hall", "F12d-street"]) {
      const f = c.formations.find((x) => x.id === id)!;
      const w = f.window;
      f.states.forEach((st, k) => {
        if (!c.pool[k].clip || st.parked || st.look.o <= 0.5) return;
        const [x0, y0, x1, y1] = boxOfNow(asNowState(st));
        if (x1 < w.x - 0.5 || x0 > w.x + w.w + 0.5 || y1 < w.y - 0.5 || y0 > w.y + w.h + 0.5) bad.push(`${id} ${c.pool[k].id}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it("opens the menu out of half its size as the hallway draws in to half of its own: never a point", () => {
    for (const c of [C, C.phone as CompiledMorph]) {
      const i = c.formations.findIndex((f) => f.id === "F12a-menu");
      c.moves[i]!.via!.pieces.forEach((v, k) => {
        if (!v) return;
        if (v.out.from.look.o > 0 && sizeOf(v.out.from) > 6) expect(sizeOf(v.out.to) / sizeOf(v.out.from), c.pool[k].id).toBeGreaterThanOrEqual(0.49);
        if (v.in.to.look.o > 0 && sizeOf(v.in.to) > 6) expect(sizeOf(v.in.from) / sizeOf(v.in.to), c.pool[k].id).toBeGreaterThanOrEqual(0.49);
      });
    }
  });
});

/* ---------------------------------------------------------------- *
 * The orb is set into the drawing, never stuck on top of it: no stroke of
 * the hero's or the pace's drawings comes within its outer ring.
 * ---------------------------------------------------------------- */

describe("the orb sits in the drawing", () => {
  it.each([
    ["desktop", C],
    ["phone", C.phone as CompiledMorph],
  ] as const)("leaves the orb's rings clear in every hero and pace formation (%s)", (_v, c) => {
    const bad: string[] = [];
    const orbIds = new Set(["ring1", "ring2", "ring3", "core"]);
    for (const f of c.formations) {
      if (!/^F0[1-3]|^F12/.test(f.id)) continue;
      const ring = f.states[c.pool.findIndex((p) => p.id === "ring1")];
      const core = f.states[c.pool.findIndex((p) => p.id === "core")];
      if (ring.kind !== "arc" || !(ring.g.r > 0)) continue;
      const [cx, cy] = [core.g as Record<string, number>].map((g) => [g.x + g.w / 2, g.y + g.h / 2])[0];
      const r = ring.g.r + 4;
      f.states.forEach((s, k) => {
        // (a point under the core waits there, unseen: the loupe in the lens)
        if (orbIds.has(c.pool[k].id) || s.parked || !(s.look.o > 0) || sizeOf(s) < 0.5) return;
        if (c.pool[k].clip) return; // clipped to a window the orb is outside of
        const pts = strokePoints(asNowState(s));
        for (let j = 0; j < pts.length; j++) {
          const p0 = pts[Math.max(0, j - 1)];
          const p1 = pts[j];
          for (let u = 0; u <= 1; u += 0.1) {
            const x = p0[0] + (p1[0] - p0[0]) * u;
            const y = p0[1] + (p1[1] - p0[1]) * u;
            if (Math.hypot(x - cx, y - cy) < r) {
              bad.push(`${f.id} ${c.pool[k].id}`);
              return;
            }
          }
        }
      });
    }
    expect(bad).toEqual([]);
  });
});

/* ---------------------------------------------------------------- *
 * The handoffs QA saw scatter: every stroke stays with the object it
 * belongs to while it moves, never a slash across the frame.
 * ---------------------------------------------------------------- */

type Box4 = [number, number, number, number];
function boxOfNow(p: PieceNow): Box4 {
  const pts = strokePoints(p);
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const headingOf = (g: Record<string, number>) => (Math.atan2(g.y2 - g.y1, g.x2 - g.x1) * 180) / Math.PI;
const turn = (a: number, b: number) => {
  const d = Math.abs(a - b) % 180;
  return Math.min(d, 180 - d);
};

describe("the handoffs stay inside their objects", () => {
  const easings = readEasings(() => "");
  const T = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9];
  const variants = [
    ["desktop", C],
    ["phone", C.phone as CompiledMorph],
  ] as const;

  it.each(variants)("ceiling to hallway: the hatching folds into the ceiling, the ceiling parts, and nothing leaves the phone or turns (%s)", (_v, c) => {
    const i = c.formations.findIndex((f) => f.id === "F12-hallway");
    const k = (id: string) => c.pool.findIndex((p) => p.id === id);
    const ceilY = (c.formations[i - 1].states[k("hzL")].g as Record<string, number>).y1;
    const body = [c.formations[i - 1], c.formations[i]].map((f) => f.states[k("body")].g as Record<string, number>);
    const phone: Box4 = [Math.min(body[0].x, body[1].x) - 8, Math.min(body[0].y, body[1].y) - 8, Math.max(body[0].x + body[0].w, body[1].x + body[1].w) + 8, Math.max(body[0].y + body[0].h, body[1].y + body[1].h) + 8];
    const bad: string[] = [];
    for (const t of T) {
      moveAt(c, i, t, easings).pieces.forEach((p, j) => {
        if (p.look.o <= 0.02) return;
        const [x0, y0, x1, y1] = boxOfNow(p);
        const onCeiling = y0 >= ceilY - 32 && y1 <= ceilY + 2;
        if (!onCeiling && (x0 < phone[0] || y0 < phone[1] || x1 > phone[2] || y1 > phone[3])) bad.push(`${c.pool[j].id} at ${t}: outside the phone`);
        if (p.kind !== "line") return;
        const g = p.g as Record<string, number>;
        if (Math.hypot(g.x2 - g.x1, g.y2 - g.y1) < 2) return;
        const ends = [c.formations[i - 1].states[j], c.formations[i].states[j]].map((s) => s.g as Record<string, number>);
        if (Math.min(...ends.map((e) => turn(headingOf(e), headingOf(g)))) > 5) bad.push(`${c.pool[j].id} at ${t}: turns`);
      });
    }
    expect(bad).toEqual([]);
  });

  it.each(variants)("smartphone to ceiling: the rising line parts at the phone and its hatching stays folded until it is above it (%s)", (_v, c) => {
    const i = c.formations.findIndex((f) => f.id === "F11-ceiling");
    const k = (id: string) => c.pool.findIndex((p) => p.id === id);
    const body = c.formations[i].states[k("body")].g as Record<string, number>;
    const hatch = c.formations[i].states.flatMap((st, j) => (c.pool[j].clip || st.kind !== "line" || st.look.o <= 0 || st.parked ? [] : [j])).filter((j) => {
      const g = c.formations[i].states[j].g as Record<string, number>;
      return Math.abs(g.y1 - g.y2) > 5 && Math.max(g.y1, g.y2) < body.y;
    });
    expect(hatch.length).toBeGreaterThan(5);
    const bad: string[] = [];
    for (let t = 0.02; t < 1; t += 0.02) {
      const now = moveAt(c, i, t, easings);
      const L = now.pieces[k("hzL")].g as Record<string, number>;
      const R = now.pieces[k("hzR")].g as Record<string, number>;
      const y = L.y1;
      // Along the phone's straight sides (its rounded corners curve in), each half ends on the side.
      if (y > body.y + body.r && y < body.y + body.h - body.r) {
        if (L.x2 > body.x + 1) bad.push(`left half crosses the phone at ${t.toFixed(2)}`);
        if (R.x1 < body.x + body.w - 1) bad.push(`right half crosses the phone at ${t.toFixed(2)}`);
      }
      // Every hatch tick is unseen while the line is still level with the phone (or just above it).
      if (y > body.y - 8) for (const j of hatch) if (now.pieces[j].look.o > 0.02) bad.push(`${c.pool[j].id} shows at ${t.toFixed(2)}`);
    }
    expect(bad.join("; ")).toBe("");
  });

  it.each(variants)("street to orb: the street and the reticle stay inside the phone's outline while it rounds into the orb (%s)", (_v, c) => {
    const i = c.formations.findIndex((f) => f.id === "V13-orb-returns");
    const kb = c.pool.findIndex((p) => p.id === "body");
    const kept = new Set(["body", "screen", "island", "btnA", "btnU", "btnD", "btnP", "core", "ring1", "ring2", "ring3", "wall"]);
    const bad: string[] = [];
    for (const t of T) {
      const now = moveAt(c, i, t, easings);
      const o = now.pieces[kb].g as Record<string, number>;
      now.pieces.forEach((p, j) => {
        if (p.look.o <= 0.02 || kept.has(c.pool[j].id)) return;
        const [x0, y0, x1, y1] = boxOfNow(p);
        if (x0 < o.x - 4 || y0 < o.y - 4 || x1 > o.x + o.w + 4 || y1 > o.y + o.h + 4) bad.push(`${c.pool[j].id} at ${t}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it("feed to CCTV, as a phone's band rises: the feed is gone before the ground moves, and nothing lies under the ground once it does", () => {
    const c = C.phone as CompiledMorph;
    const i = c.formations.findIndex((f) => f.id === "F06-cctv");
    const kh = c.pool.findIndex((p) => p.id === "hzL");
    const start = (c.formations[i - 1].states[kh].g as Record<string, number>).y1;
    const bad: string[] = [];
    for (const t of T) {
      const now = moveAt(c, i, t, easings);
      const ground = (now.pieces[kh].g as Record<string, number>).y1;
      if (Math.abs(ground - start) < 0.5) continue;
      now.pieces.forEach((p, j) => {
        if (p.look.o <= 0.02) return;
        if (boxOfNow(p)[3] > ground + 2) bad.push(`${c.pool[j].id} at ${t}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
