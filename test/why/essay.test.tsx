// The essay's art as a story (components/why/morph/formations/essay.ts and
// components/why/pivot.ts), checked as data: what each formation must show,
// the one accent, the bookend between the hero's orb and the pivot's mark,
// the stills the static page draws, the motion limits, and the pivot's
// iris opening out of the mark. Pure: no layout.
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "../helpers/axe";
import WhyPage from "@/app/why/page";
import { drawnBox, KEYED, MORPHS, PLACEMENTS, POCKET_ALIGN, POCKET_VIEWS, POCKETS, UPRIGHT, VIEW_PAD } from "@/components/why/morph";
import { MARK_BANDS, MARK_UNITS } from "@/components/why/morph/brand";
import { centerOf, type PieceState } from "@/components/why/morph/pieces";
import { lineOpener, LINE_PIECES, RUN_SVH, type CompiledMorph, type Crop, type ResolvedFormation } from "@/components/why/morph/formation";
import { ESSAY_ORDER } from "@/components/why/morph/formations/essay";
import { IRIS_CROSS, irisClip, irisCoverY, irisDoneY, irisFull, irisRadius, navyPath, pinY, stepRadius, wordAt, wordWindow, WORD_COUNT, type PivotGeom } from "@/components/why/pivot";
import { defaultEasings } from "@/components/why/engine";

const C = MORPHS.r1 as CompiledMorph;
const P = C.phone as CompiledMorph;
const byId = (c: CompiledMorph, id: string) => c.formations.find((f) => f.id === id) as ResolvedFormation;
const piece = (f: ResolvedFormation, id: string) => f.states[C.pool.findIndex((p) => p.id === id)];
/** What a formation shows: every piece it draws (parked pieces lie unseen in a stroke of their own color). */
const seen = (f: ResolvedFormation) => f.states.filter((s) => s.look.o > 0 && f.layer > 0 && !s.parked);
const isAccent = (s: PieceState) => s.look.role === "accent" || s.look.fill === "accent";
const radiusOf = (s: PieceState) => (s.kind === "rect" ? s.g.w / 2 : s.kind === "arc" ? s.g.r : NaN);

describe("the story", () => {
  it("runs hero, machines, ceiling, pace, the mark, people and hands, in essay order", () => {
    expect(C.formations.map((f) => f.id)).toEqual(ESSAY_ORDER);
    expect(ESSAY_ORDER).toEqual([
      "F01-dark", "F02-sign", "F03-room", "F04-orb", "F05-feed", "F05s-scroll",
      "F06-cctv", "F07-portable", "F08-dos", "F09-windows", "F10-smartphone",
      "F11-ceiling", "F12-hallway", "F12a-menu", "F12b-curb", "F12c-hall", "F12d-street", "F12e-statement",
      "V13-orb-returns", "F13-mark", "F13x-exact", "R2-pieces", "R2o-orb",
      "F14-people", "F14b-listening", "F15-hands", "F16-wearable", "F17-summit",
    ]);
    expect(C.problems).toEqual([]);
  });

  it("opens complete: the first viewport already sees in the dark, with nothing drawing on", () => {
    const f = C.formations[0];
    expect(f.anchor).toBeUndefined();
    expect(seen(f).length).toBeGreaterThanOrEqual(30);
    expect(piece(f, "core").look.o).toBe(1);
    expect(piece(f, "core").look.fill).toBe("accent");
    // The phone that sees: its outline is ink, whole, at the stage's center line.
    const body = piece(f, "body");
    expect(body.kind).toBe("rect");
    expect(body.look.role).toBe("ink");
    expect(centerOf(body)[0]).toBeCloseTo(300, 0);
  });

  it.each([
    ["desktop", C],
    ["phone", P],
  ] as const)("keeps the orb the one accent, wherever it stands in (%s)", (_v, c) => {
    const core = c.pool.findIndex((p) => p.id === "core");
    for (const f of c.formations) {
      const at = centerOf(f.states[core]);
      for (const [i, s] of f.states.entries()) {
        if (!(s.look.o > 0 && f.layer > 0 && !s.parked && isAccent(s))) continue;
        const [x, y] = centerOf(s);
        expect(Math.hypot(x - at[0], y - at[1]), `${f.id} ${c.pool[i].id}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("draws no ghost lines (no role that depends on the 3.52:1 control border)", () => {
    for (const c of [C, P]) for (const f of c.formations) for (const s of seen(f)) expect(s.look.role, f.id).not.toBe("ghost");
  });
});

describe("the bookend: the hero's orb comes back as the mark", () => {
  const OUTER = MARK_BANDS[MARK_BANDS.length - 1][1];

  it.each([
    ["desktop", C],
    ["phone", P],
  ] as const)("gathers every piece into the orb at one place and size, in the hero and before the pivot (%s)", (_v, c) => {
    const f04 = byId(c, "F04-orb");
    const v13 = byId(c, "V13-orb-returns");
    for (const f of [f04, v13]) {
      const ring = piece(f, "body");
      expect(centerOf(ring)).toEqual(centerOf(piece(f04, "body")));
      expect(radiusOf(ring)).toBeCloseTo(radiusOf(piece(f04, "body")), 1);
      // Nothing else shows outside the orb, but the horizon, stopping short of it ("with no internet connection").
      const [cx, cy] = centerOf(ring);
      const hz = c.pool.findIndex((p) => p.id === "hzL");
      f.states.forEach((s, i) => {
        if (!seen(f).includes(s)) return;
        if (i === hz && s.kind === "line") {
          expect(Math.max(s.g.x1, s.g.x2), "the horizon stops short of the orb").toBeLessThan(cx - radiusOf(ring) - 20);
          return;
        }
        const [x, y] = centerOf(s);
        expect(Math.hypot(x - cx, y - cy), `${f.id} ${c.pool[i].id}`).toBeLessThanOrEqual(radiusOf(ring) + 2);
      });
    }
  });

  it.each([
    ["desktop", C],
    ["phone", P],
  ] as const)("lands the exact mark where the orb was, the same size, and opens it whole (%s)", (_v, c) => {
    const orb = piece(byId(c, "F04-orb"), "body");
    const exact = byId(c, "F13x-exact");
    expect([exact.mark.cx, exact.mark.cy]).toEqual(centerOf(orb));
    expect((exact.mark.size / MARK_UNITS) * OUTER).toBeCloseTo(radiusOf(orb), 0);
    expect(exact.mark.o).toBe(1);
    expect(exact.mark.role).toBe("ink");
    // The pieces under it fade as one layer, never piece by piece.
    expect(exact.layer).toBe(0);
    expect(exact.pocket).toContain("climax");
  });

  it("comes back out of the mark with nothing moving: the pieces return under it, then relax into the listening orb", () => {
    const exact = byId(C, "F13x-exact");
    const back = byId(C, "R2-pieces");
    expect(back.layer).toBe(1);
    expect(back.mark.o).toBe(0);
    expect([back.mark.cx, back.mark.cy, back.mark.size]).toEqual([exact.mark.cx, exact.mark.cy, exact.mark.size]);
    back.states.forEach((s, i) => {
      if (s.look.o > 0) expect(back.frame.pieces[i].d, C.pool[i].id).toBe(exact.frame.pieces[i].d);
    });
    const people = byId(C, "F14-people");
    expect(isAccent(piece(people, "core"))).toBe(true);
    expect(people.mark.o).toBe(0);
  });

  it("re-spaces the orb's rings onto the mark's bands exactly, in its ink", () => {
    const f = byId(C, "F13-mark");
    const exact = byId(C, "F13x-exact");
    const k = exact.mark.size / MARK_UNITS;
    const radii = ["body", "screen", "wall"].map((id) => radiusOf(piece(f, id))).sort((a, b) => a - b);
    const want = MARK_BANDS.map(([a, b]) => ((a + b) / 2) * k);
    radii.forEach((r, i) => expect(r).toBeCloseTo(want[i], 0));
    for (const s of seen(f)) expect(s.look.role === "accent" || s.look.fill === "accent", "the mark is ink, not accent").toBe(false);
  });
});

describe("stills and pockets", () => {
  it("draws the finished frame each fallback needs, the pivot's mark never as pieces", () => {
    const still = (key: string) => C.formations.find((f) => f.still.includes(key))?.id;
    expect(still("hero")).toBe("F01-dark");
    expect(still("arrives")).toBe("F06-cctv");
    expect(still("ceiling")).toBe("F11-ceiling");
    expect(still("pace")).toBe("F12-hallway");
    expect(still("people")).toBe("F14-people");
    expect(still("hands")).toBe("F15-hands");
    expect(still("summit")).toBe("F17-summit");
    // The pivot's static block is its own navy scene: no still draws the pieces' mark.
    expect(still("climax")).toBeUndefined();
  });

  it("gives every placement a pocket in page order, each a real reform: the hands' band carries the hands into the glasses, the summit's lifts the ridge before its beat", () => {
    const plans = POCKETS.r1!.plans;
    expect(plans.map((p) => p.key)).toEqual([...PLACEMENTS]);
    expect(POCKETS.r1!.problems).toEqual([]);
    for (const p of plans) expect(p.steps.length, p.key).toBeGreaterThan(1);
    const hands = plans.find((p) => p.key === "hands")!;
    expect(hands.steps.slice(1).map((i) => C.formations[i].id)).toEqual(["F15-hands", "F16-wearable"]);
    // The hands' band steps by its text: the glasses form as the wearable's paragraph comes up to the reading line.
    expect(KEYED.hands.items).toBe('[data-why-at="hands-p2"]');
    const summit = plans.find((p) => p.key === "summit")!;
    expect(summit.steps.map((i) => C.formations[i].id)).toEqual(["F16-wearable", "F17-summit"]);
  });

  it("opens every band after the hero's on the drawing the band before it ended on (a matched cut)", () => {
    const plans = POCKETS.r1!.plans;
    plans.slice(1).forEach((p, i) => {
      const before = plans[i].steps[plans[i].steps.length - 1];
      // A band may open on its own formation (opens): the people's rises as the listening orb.
      if (p.own) expect(C.formations[p.steps[0]].opens, `${p.key} opens on its own formation`).toBe(true);
      else expect(C.formations[p.steps[0]].id, `${p.key} opens on what ${plans[i].key} ended on`).toBe(C.formations[before].id);
      // The through-line it rises as instead, when the band before is still on screen, shows no drawing of it.
      const { f } = lineOpener(P, p.steps[0], p.steps[1]);
      const lines = new Set<string>(LINE_PIECES);
      f.states.forEach((s, k) => {
        if (!lines.has(P.pool[k].id)) expect(s.look.o, `${p.key} ${P.pool[k].id}`).toBe(0);
      });
    });
    // The orb is a gather formation, every other piece hidden in it; the climax rises as the street reforming into it.
    for (const id of ["F04-orb", "V13-orb-returns"]) expect(byId(P, id).gather).toBe(true);
    const climax = plans.find((p) => p.key === "climax")!;
    expect(climax.steps.slice(0, 2).map((i) => C.formations[i].id)).toEqual(["F12d-street", "V13-orb-returns"]);
    // A phone never plays the stage's crossfade back out of the mark: the people's band rises as the orb the
    // mark relaxes into, then the people stream out of it.
    const r2 = C.formations.findIndex((f) => f.id === "R2-pieces");
    expect(plans.some((p) => p.steps.includes(r2))).toBe(false);
    const people = plans.find((p) => p.key === "people")!;
    expect(people.own).toBe(true);
    expect(people.steps.slice(0, 2).map((i) => C.formations[i].id)).toEqual(["R2o-orb", "F14-people"]);
  });

  it("relaxes the mark into the hero's orb after the pivot, where the mark was, and a phone's people band rises as it", () => {
    for (const c of [C, P]) {
      const mark = byId(c, "F13x-exact").mark;
      const orb = byId(c, "R2o-orb");
      const hero = byId(c, "F04-orb");
      for (const id of ["body", "screen", "wall"]) {
        const s = orb.states[c.pool.findIndex((p) => p.id === id)];
        expect(s.look.role).toBe("accent");
        expect(centerOf(s)[0]).toBeCloseTo(mark.cx, 0);
        expect(centerOf(s)[1]).toBeCloseTo(mark.cy, 0);
      }
      // The same rings, radii and place as the hero's orb at "no connection at all", within 2 units.
      const radii = (f: ResolvedFormation) => ["body", "screen", "wall"].map((id) => radiusOf(f.states[c.pool.findIndex((p) => p.id === id)]));
      radii(orb).forEach((r, i) => expect(Math.abs(r - radii(hero)[i])).toBeLessThanOrEqual(2));
      // and the mark's outer band within 6: the relax only re-spaces the rings
      expect(Math.abs(radii(orb)[0] - (mark.size * MARK_BANDS[MARK_BANDS.length - 1][1]) / MARK_UNITS)).toBeLessThanOrEqual(6);
    }
  });

  it("renders every placement aria-hidden and axe clean on the static page", async () => {
    const { container } = render(<WhyPage />);
    const placed = Array.from(container.querySelectorAll<HTMLElement>(".why-pocket")).map((el) => el.dataset.whyPocket);
    expect(placed).toEqual([...PLACEMENTS]);
    for (const el of container.querySelectorAll(".why-pocket")) expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("motion limits", () => {
  /** A piece's drawn extent: an arc's along its own span, not its whole circle. */
  const box = (s: PieceState) => {
    if (s.kind === "rect") return [s.g.w, s.g.h];
    if (s.kind === "line") return [Math.abs(s.g.x2 - s.g.x1), Math.abs(s.g.y2 - s.g.y1)];
    const { cx, cy, r, a0, a1 } = s.g;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let k = 0; k <= 48; k++) {
      const t = ((a0 + ((a1 - a0) * k) / 48) * Math.PI) / 180;
      xs.push(cx + r * Math.cos(t));
      ys.push(cy + r * Math.sin(t));
    }
    return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  };

  it.each([
    ["desktop", C, 600 * 800],
    ["phone", P, 600 * 450],
  ] as const)("never looms: nothing over a quarter of the view grows in both directions by more than 1.5x in one move (%s)", (_v, c, area) => {
    for (let i = 1; i < c.formations.length; i++) {
      const a = c.formations[i - 1];
      const b = c.formations[i];
      b.states.forEach((s, k) => {
        const p = a.states[k];
        if (!(s.look.o > 0 && p.look.o > 0) || s.kind === "line") return;
        const [w0, h0] = box(p);
        const [w1, h1] = box(s);
        if (w1 * h1 <= area / 4) return;
        const grow = Math.min(w1 / Math.max(w0, 1e-6), h1 / Math.max(h0, 1e-6));
        expect(grow, `${b.id} ${c.pool[k].id}`).toBeLessThanOrEqual(1.5);
      });
    }
  });

  it("moves the feed exactly with the reader's scroll: linear, no stagger, no curve", () => {
    const i = C.formations.findIndex((f) => f.id === "F05s-scroll");
    const m = C.moves[i]!;
    expect([m.ease, m.stagger, m.bend]).toEqual(["linear", 0, 0]);
    expect(m.leadUnits).toBeGreaterThan(0);
  });
});

describe("the pivot opens out of the mark", () => {
  // A 900px viewport: the mark held at (900, 490), the stage 240svh from 5000, its section 100svh.
  const g: PivotGeom = { stageTop: 5000, stageH: 2160, secH: 900, secOffset: 0, vw: 1440, vh: 900, svh: 9, ox: 900, oy: 490, start: 5000 - 490 };

  it("starts from nothing at the mark's center and only ever opens while scrolling down", () => {
    expect(irisRadius(g, g.start)).toBe(0);
    // In the section's own box, which is still rising: its top is stageTop - y below the viewport's.
    expect(irisClip(g, g.start - 10)).toBe(`circle(0px at 900px ${490 - (g.stageTop - (g.start - 10))}px)`);
    let last = -1;
    for (let y = g.start; y < irisDoneY(g) + 200; y += 25) {
      const r = irisRadius(g, y);
      expect(r).toBeGreaterThanOrEqual(last);
      last = r;
    }
    expect(irisRadius(g, irisDoneY(g))).toBeCloseTo(irisFull(g), 0);
  });

  it("keeps the circle inside the rising section, so no navy shows above its top edge", () => {
    for (let y = g.start; y <= pinY(g); y += 20) {
      const top = Math.max(0, g.stageTop - y);
      expect(g.oy - irisRadius(g, y), `at ${y}`).toBeGreaterThanOrEqual(top - 1);
    }
  });

  it("builds the words only once the navy covers the viewport, one after another", () => {
    const e = defaultEasings().settle;
    expect(wordWindow(g, 0)[0]).toBeGreaterThanOrEqual(irisDoneY(g));
    for (let i = 1; i < WORD_COUNT; i++) expect(wordWindow(g, i)[0]).toBeGreaterThan(wordWindow(g, i - 1)[0]);
    expect(wordAt(g, 0, irisDoneY(g) - 1, e).o).toBe(0);
    expect(wordAt(g, WORD_COUNT - 1, wordWindow(g, WORD_COUNT - 1)[1], e)).toEqual({ o: 1, y: 0, s: 1 });
  });

  it("crosses each of the mark's bands within a couple of px of growth, resting only in the dark gaps", () => {
    // A mark 336px across: its disk and bands in px from its center.
    const u = 336 / MARK_UNITS;
    const bands: [number, number][] = [[0, 10 * u], ...MARK_BANDS.map(([a, b]) => [a * u, b * u] as [number, number])];
    const outer = bands[bands.length - 1][1];
    let inBand = 0;
    let last = -1;
    for (let r = 0; r <= outer + 40; r += 0.25) {
      const v = stepRadius(r, bands);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
      if (bands.some(([a, b]) => v > a + 0.5 && v < b - 0.5)) inBand += 0.25;
    }
    // Over the whole growth across the mark, the edge sits on a band for at most IRIS_CROSS px per band.
    expect(inBand).toBeLessThanOrEqual(bands.length * IRIS_CROSS + 1);
    // Past the mark the radius is the growth itself.
    expect(stepRadius(outer + 30, bands)).toBe(outer + 30);
    const gb = { ...g, bands };
    expect(irisRadius(gb, irisDoneY(gb))).toBeCloseTo(irisFull(gb), 0);
  });

  it("on a phone, builds the words as soon as the navy covers the line, never before", () => {
    const cover = 420;
    const gp = { ...g, cover, step: 6 };
    expect(irisCoverY(gp)).toBeLessThan(irisDoneY(gp));
    expect(irisRadius(gp, irisCoverY(gp))).toBeGreaterThanOrEqual(cover - 0.5);
    expect(wordWindow(gp, 0)[0]).toBe(irisCoverY(gp));
    expect(wordWindow(gp, 1)[0] - wordWindow(gp, 0)[0]).toBeCloseTo(6 * g.svh, 5);
  });

  it("draws the navy behind the mark in the mark's own svg: none before, a circle while opening, the section after", () => {
    expect(navyPath(g, g.start - 5, 1.025, 300, 400)).toBe("");
    expect(navyPath(g, g.start + 50, 1.025, 300, 400)).toMatch(/^M[\d.]+ 400A/);
    expect(navyPath(g, irisDoneY(g) + 10, 1.025, 300, 400)).toMatch(/^M-9999 /);
  });
});

describe("a phone's bands: each drawing fills its band", () => {
  const plans = POCKETS.r1!.plans;
  const views = POCKET_VIEWS.r1!;
  /** The drawings a band forms (everything after the drawing it opens on), as boxes on the phone grid. */
  const formed = (c: CompiledMorph, steps: readonly number[]) => steps.slice(1).map((i) => drawnBox(c, c.formations[i])!);
  const inside = (b: readonly number[], v: Crop) => b[0] >= v[0] - 1 && b[1] >= v[1] - 1 && b[2] <= v[0] + v[2] + 1 && b[3] <= v[1] + v[3] + 1;

  it("frames every band on the drawings it forms, never wider than the grid, with only a stroke's air around them", () => {
    for (const p of plans) {
      const v = views[p.key];
      expect(v, p.key).toBeDefined();
      expect(v[0], p.key).toBeGreaterThanOrEqual(0);
      expect(v[0] + v[2], p.key).toBeLessThanOrEqual(600);
      const boxes = formed(P, p.steps);
      // Every drawing it forms is whole inside it (what runs past the grid, the hero's skyline, under the column's edge).
      for (const b of boxes) expect(inside([Math.max(0, b[0]), b[1], Math.min(600, b[2]), b[3]], v), `${p.key}: ${b.map(Math.round)}`).toBe(true);
      // No empty ground: top and bottom sit a pad from the tallest drawing; one side at least a pad from the widest.
      const top = Math.min(...boxes.map((b) => b[1]));
      const bottom = Math.max(...boxes.map((b) => b[3]));
      expect(top - v[1], p.key).toBeLessThanOrEqual(VIEW_PAD + 1);
      expect(v[1] + v[3] - bottom, p.key).toBeLessThanOrEqual(VIEW_PAD + 1);
      const left = Math.max(0, Math.min(...boxes.map((b) => b[0])));
      const right = Math.min(600, Math.max(...boxes.map((b) => b[2])));
      expect(Math.min(left - v[0], v[0] + v[2] - right), p.key).toBeLessThanOrEqual(VIEW_PAD + 1);
    }
  });

  it("sets the pivot's mark on the line's left edge, across its band", () => {
    const climax = plans.find((p) => p.key === "climax")!;
    const mark = P.formations[climax.steps.at(-1)!].mark;
    const r = (mark.size * MARK_BANDS[MARK_BANDS.length - 1][1]) / MARK_UNITS;
    const v = views.climax;
    // The view starts at the mark's outer edge, and the band draws it from its start (the line's left edge).
    expect(Math.abs(v[0] - (mark.cx - r))).toBeLessThanOrEqual(1);
    expect(POCKET_ALIGN.climax).toMatch(/^xMin/);
    // The mark spans the view but for a pad on its far side: as wide as the column the line is set in.
    expect(v[0] + v[2] - (mark.cx + r)).toBeLessThanOrEqual(VIEW_PAD + 1);
  });

  it("stands the hero's phone upright on the stage's own formations, framed the same way", () => {
    const up = UPRIGHT.r1!.hero;
    const hero = plans.find((p) => p.key === "hero")!;
    // The stage's compiled formations: the same pool, the same order, the phone 1:1.
    expect(up.c).toBe(C);
    expect(up.c.formations.map((f) => f.id)).toEqual(P.formations.map((f) => f.id));
    for (const b of formed(C, hero.steps)) expect(inside([Math.max(0, b[0]), b[1], Math.min(600, b[2]), b[3]], up.view)).toBe(true);
    // Upright, the band is taller than it is wide only where the phone is; on its side, wide and short.
    expect(up.view[3] / up.view[2]).toBeGreaterThan(1);
    expect(views.hero[3] / views.hero[2]).toBeLessThan(1);
  });

  it("draws the hands as wide as the glasses they become, the forearms running out of the band's left edge", () => {
    const hands = byId(P, "F15-hands");
    const glasses = byId(P, "F16-wearable");
    const h = drawnBox(P, hands)!;
    const g = drawnBox(P, glasses)!;
    const v = views.hands;
    expect(h[0]).toBeLessThanOrEqual(v[0]);
    // The hands take most of the band's width and all of its height.
    expect((h[2] - Math.max(h[0], v[0])) / v[2]).toBeGreaterThan(0.8);
    expect(h[3] - h[1]).toBeGreaterThanOrEqual(v[3] - 2 * VIEW_PAD - 1);
    expect(g[2] - g[0]).toBeGreaterThan(0.9 * v[2]);
  });

  it("lets a band with one move play it as it rises, with no runway under it to pin over", () => {
    expect(RUN_SVH.rise).toBe(0);
    for (const key of ["ceiling", "summit"]) {
      const p = plans.find((x) => x.key === key)!;
      expect(p.run, key).toBe("rise");
      expect(p.steps.length, key).toBe(2);
    }
  });
});
