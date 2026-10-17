// How the art and the words are tied, and how the words rest: the stage's
// reading tie (WhyDirector Leader: a level line of the art on the first
// baseline of the line the art shows, run until it meets the drawing), the
// pivot's words (never at part opacity), and the statement's phrases.
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import WhyPage from "@/app/why/page";
import { LIST_CUES } from "@/components/why/WhyDirector";
import { edgeAt, outlineOf } from "@/components/why/anchors";
import { MORPHS } from "@/components/why/morph";
import type { CompiledMorph } from "@/components/why/morph/formation";
import type { PieceState } from "@/components/why/morph/pieces";
import { defaultEasings } from "@/components/why/engine";
import { irisDoneY, lineDoneY, wordAt, WORD_COUNT, type PivotGeom } from "@/components/why/pivot";

const C = MORPHS.r1 as CompiledMorph;
const ids = C.pool.map((p) => p.id);
const LOOK = { role: "ink", fill: "none", weight: 1, band: 0, o: 1 } as const;

describe("edgeAt: where a level line meets the drawing", () => {
  const rect: PieceState = { kind: "rect", g: { x: 100, y: 100, w: 200, h: 400, r: 40, rot: 0 }, look: { ...LOOK } };
  const ring: PieceState = { kind: "arc", g: { cx: 300, cy: 400, r: 150, a0: -90, a1: 270 }, look: { ...LOOK } };

  it("meets a rounded rect on its side, and inside its corners on the curve", () => {
    expect(edgeAt([rect], 300, "left")).toBeCloseTo(100, 5);
    expect(edgeAt([rect], 300, "right")).toBeCloseTo(300, 5);
    const corner = edgeAt([rect], 105, "left")!;
    expect(corner).toBeGreaterThan(100);
    expect(corner).toBeLessThan(140);
  });

  it("meets a ring where the circle is at that height", () => {
    const x = edgeAt([ring], 510, "left")!;
    expect(x).toBeCloseTo(300 - Math.sqrt(150 ** 2 - 110 ** 2), 0);
  });

  it("finds nothing above or below the drawing, and leaves out what it is told to (the line itself) and what is unseen", () => {
    expect(edgeAt([rect], 50, "left")).toBeNull();
    expect(edgeAt([rect], 300, "left", new Set([0]))).toBeNull();
    expect(edgeAt([{ ...rect, look: { ...LOOK, o: 0 } }], 300, "left")).toBeNull();
    expect(edgeAt([{ ...rect, parked: true }], 300, "left")).toBeNull();
  });

  it("draws a rect's outline closed", () => {
    const pts = outlineOf(rect);
    expect(pts[0]).toEqual(pts[pts.length - 1]);
  });
});

describe("the reading tie", () => {
  const iL = ids.indexOf("hzL");
  const iR = ids.indexOf("hzR");
  const skip = new Set([iL, iR]);
  const tied = C.formations.filter((f) => LIST_CUES[f.id] || f.cue);

  it("names formations that exist, and lines that are on the page", () => {
    const { container } = render(<WhyPage />);
    for (const [id, sel] of Object.entries(LIST_CUES)) {
      expect(C.formations.some((f) => f.id === id), id).toBe(true);
      expect(container.querySelector(sel), sel).not.toBeNull();
    }
    for (const f of C.formations) if (f.cue) expect(container.querySelector(`[data-why-at="${f.cue}"]`), f.cue).not.toBeNull();
  });

  it("ties the hero's beats, every machine and every pair", () => {
    expect(tied.map((f) => f.id)).toEqual(
      expect.arrayContaining(["F01-dark", "F02-sign", "F03-room", "F04-orb", "F05-feed", "F06-cctv", "F10-smartphone", "F12a-menu", "F12d-street", "F12e-statement"]),
    );
  });

  it("draws it with the horizon's two halves, lines for life; each machine on a floor the two halves make between them", () => {
    expect(C.pool[iL].kind).toBe("line");
    expect(C.pool[iR].kind).toBe("line");
    for (const id of ["F06-cctv", "F07-portable", "F08-dos", "F09-windows", "F10-smartphone"]) {
      const f = C.formations.find((x) => x.id === id)!;
      const [l, r] = [f.states[iL], f.states[iR]];
      if (l.kind !== "line" || r.kind !== "line") throw new Error(id);
      expect(l.g.y1, id).toBe(r.g.y1);
      expect(l.g.x2, id).toBeCloseTo(r.g.x1, 0);
    }
  });

  it("always has a drawing to meet across the middle of each tied formation", () => {
    for (const f of tied) {
      const ys = f.states.flatMap((s, i) => (skip.has(i) || s.parked || !(s.look.o > 0) ? [] : outlineOf(s).map((p) => p[1])));
      const mid = (Math.min(...ys) + Math.max(...ys)) / 2;
      expect(edgeAt(f.states, mid, "left", skip), f.id).not.toBeNull();
    }
  });
});

describe("the pivot's words never rest part-way", () => {
  const g: PivotGeom = { stageTop: 5000, stageH: 1980, secH: 900, secOffset: 0, vw: 1440, vh: 900, svh: 9, ox: 900, oy: 490, start: 4510 };
  const e = defaultEasings().settle;

  it("are unseen or whole at every scroll position, while they still rise and grow into place", () => {
    let moving = 0;
    for (let y = irisDoneY(g) - 20; y <= lineDoneY(g) + 20; y += 0.5) {
      for (let i = 0; i < WORD_COUNT; i++) {
        const w = wordAt(g, i, y, e);
        expect([0, 1], `word ${i} at ${y}`).toContain(w.o);
        if (w.o === 1 && (w.y > 0 || w.s < 1)) moving++;
      }
    }
    expect(moving).toBeGreaterThan(0);
  });
});

describe("the statement breaks where it is said", () => {
  it("is its two phrases, read as one sentence", () => {
    const { container } = render(<WhyPage />);
    const p = container.querySelector('[data-why-at="pace-p2"]')!;
    const phrases = Array.from(p.querySelectorAll(".why-phrase")).map((s) => s.textContent);
    expect(phrases).toEqual(["Point that tech at the right problems", "and accessibility catches up fast."]);
    expect(p.textContent?.replace(/\s+/g, " ").trim()).toBe("Point that tech at the right problems and accessibility catches up fast.");
  });

  it("sets each phrase on a line where the column holds it whole, else stacks both over two lines each", () => {
    const css = readFileSync(path.resolve(__dirname, "../../components/why/why.css"), "utf8");
    expect(css).toMatch(/\.why \.why-statement \{[^}]*container-type: inline-size/);
    expect(css).toMatch(/\.why-statement \.why-phrase \{[^}]*display: block;[^}]*text-wrap: balance/);
    expect(css).toMatch(/@container \(width < [\d.]+em\) \{\s*\.why-statement \.why-phrase \{ max-inline-size: [\d.]+em; \}/);
  });
});
