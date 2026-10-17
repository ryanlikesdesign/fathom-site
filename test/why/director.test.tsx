// The /why director: the gate on <html>, the first write, releasing on
// Pause motion, keeping the reader's place, and cleaning up. The stage
// (big windows) and the pockets (phones): the formation engine's svgs,
// written from the same strings the server draws, played by scroll, and
// handed back untouched.
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "../helpers/axe";
import WhyPage from "@/app/why/page";
import { KEYED_ENTRY, KEYED_SEEN, keyedLines } from "@/components/why/WhyDirector";
import { GATE_QUERIES, MODE_ATTR } from "@/components/why/gate";
import { beatY, BLOCK_SELECTOR, pickRestoreAnchor, restoreTarget } from "@/components/why/anchors";
import { defaultEasings } from "@/components/why/engine";
import { ENTRY_FROM_AT, ENTRY_TO_AT, KEYED, MORPHS, OPEN_WHOLE, PLACEMENTS, pocketPlan, pocketView, UPRIGHT } from "@/components/why/morph";
import { KEYED_SQUEEZE, keyedFrameAt, keyedRanges, lineOpener, pocketEntry, pocketFrameAt, type CompiledMorph } from "@/components/why/morph/formation";

const html = document.documentElement;
const paneNodes = (root: ParentNode) => Array.from(root.querySelectorAll<SVGPathElement>(".why-pane path[data-piece]"));
const flush = () => new Promise((r) => setTimeout(r, 0));
const R1 = MORPHS.r1 as CompiledMorph;
/** A formation svg's piece paths in pool order (clipped pieces draw together in the DOM, inside the clip window). */
const paths = (svg: Element) => R1.pool.map((p) => svg.querySelector<SVGPathElement>(`path[data-piece="${p.id}"]`)!);
const pocketsOf = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>(".why-pocket[data-why-pocket]"));

/** Every string a formation svg carries, to compare a page with itself later. */
function svgStrings(svg: Element) {
  const mark = svg.querySelector("[data-why-mark]");
  return {
    viewBox: svg.getAttribute("viewBox"),
    pieces: paths(svg).map((p) => [p.getAttribute("d"), p.getAttribute("style")]),
    mark: mark && [mark.getAttribute("transform"), mark.getAttribute("style")],
    window: svg.querySelector("[data-why-window]")?.getAttribute("d") ?? null,
  };
}

describe("without IntersectionObserver (jsdom as it is)", () => {
  it("leaves the finished static page: no mode, no inline styles", () => {
    const { container } = render(<WhyPage />);
    expect(html.hasAttribute(MODE_ATTR)).toBe(false);
    const nodes = paneNodes(container);
    expect(nodes.length).toBe(R1.pool.length);
    // The server's opening frame, untouched.
    expect(paths(container.querySelector(".why-pane svg.why-morph")!).map((p) => p.getAttribute("d"))).toEqual(
      R1.formations[0].frame.pieces.map((p) => p.d),
    );
    for (const n of nodes) expect(n.style.transform).toBe("");
    expect(container.querySelector(".why-pane[data-ready]")).toBeNull();
  });

  it("places every still where the essay needs it (each renders once its scene has one)", () => {
    const { container } = render(<WhyPage />);
    for (const still of container.querySelectorAll(".why-still")) expect(still.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws each formation still finished, from the formation's own strings, cropped, never as a pocket", () => {
    const { container } = render(<WhyPage />);
    const pockets = pocketsOf(container);
    expect(pockets.length).toBeGreaterThan(0);
    for (const el of pockets) {
      const f = R1.formations.find((x) => x.id === el.dataset.formation)!;
      // A placement draws the formation whose still it is (the pivot's band: the one its pocket ends on).
      expect([...f.still, ...f.pocket]).toContain(el.dataset.whyPocket);
      const svg = el.querySelector("svg.why-morph")!;
      expect(svg.getAttribute("viewBox")).toBe(f.crop.join(" "));
      expect(paths(svg).map((p) => p.getAttribute("d"))).toEqual(f.frame.pieces.map((p) => p.d));
      expect(el.hasAttribute("data-ready")).toBe(false);
    }
  });
});

describe("the gate script", () => {
  it("is the article's first child in the server HTML, and is not created on the client", () => {
    const markup = renderToString(<WhyPage />);
    expect(markup).toMatch(/<article[^>]*><script>\(function\(w\)\{/);
    const { container } = render(<WhyPage />);
    expect(container.querySelector("article.why > script")).toBeNull();
  });
});

describe("with motion allowed", () => {
  type Listener = () => void;
  let rafs: FrameRequestCallback[] = [];
  let mqListeners: Map<string, Set<Listener>>;
  let answers: Record<string, boolean>;
  const saved: Record<string, unknown> = {};

  const flushFrames = () => {
    const q = rafs;
    rafs = [];
    q.forEach((cb) => cb(0));
  };
  const fire = (q: string) => mqListeners.get(q)!.forEach((fn) => fn());

  beforeEach(() => {
    for (const k of ["IntersectionObserver", "ResizeObserver", "requestAnimationFrame", "cancelAnimationFrame", "matchMedia", "scrollTo", "visualViewport"]) {
      saved[k] = (window as unknown as Record<string, unknown>)[k];
    }
    rafs = [];
    mqListeners = new Map();
    answers = {
      [GATE_QUERIES.motion]: true,
      [GATE_QUERIES.contrast]: true,
      [GATE_QUERIES.forced]: true,
      [GATE_QUERIES.big]: true,
      [GATE_QUERIES.fit]: true,
    };
    Object.assign(window, {
      IntersectionObserver: class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
      ResizeObserver: class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
      requestAnimationFrame: (cb: FrameRequestCallback) => rafs.push(cb),
      cancelAnimationFrame: () => {},
      matchMedia: (q: string) => ({
        matches: answers[q] ?? false,
        media: q,
        addEventListener: (_: string, fn: Listener) => {
          if (!mqListeners.has(q)) mqListeners.set(q, new Set());
          mqListeners.get(q)!.add(fn);
        },
        removeEventListener: (_: string, fn: Listener) => mqListeners.get(q)?.delete(fn),
      }),
      scrollTo: vi.fn(),
    });
    html.style.fontSize = "16px";
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete (window as unknown as Record<string, unknown>)[k];
      else (window as unknown as Record<string, unknown>)[k] = v;
    }
    html.style.fontSize = "";
    html.removeAttribute("data-motion");
  });

  it("stages the page and writes the first frame before paint", () => {
    const { container } = render(<WhyPage />);
    expect(html.getAttribute(MODE_ATTR)).toBe("stage");
    const pane = container.querySelector('[data-why-reel="r1"] > .why-pane')!;
    expect(pane.hasAttribute("data-ready")).toBe(true);
    // jsdom has no layout, so every formation lands at scroll 0 and the
    // first frame is reel 1's last formation: its own strings, in full.
    const svg = pane.querySelector("svg.why-morph")!;
    const last = R1.formations[R1.formations.length - 1].frame;
    expect(paths(svg).map((p) => [p.getAttribute("d"), p.getAttribute("style")])).toEqual(last.pieces.map((p) => [p.d, p.style]));
    const mark = svg.querySelector("[data-why-mark]")!;
    expect([mark.getAttribute("transform"), mark.getAttribute("style")]).toEqual([last.mark.transform, last.mark.style]);
    // One pane, one reel: the pivot and the people are on it too.
    expect(container.querySelectorAll(".why-pane")).toHaveLength(1);
  });

  it("samples again on scroll, one frame per batch of scroll events", () => {
    const { container } = render(<WhyPage />);
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    expect(rafs).toHaveLength(1);
    flushFrames();
    expect(rafs).toHaveLength(0);
    const svg = container.querySelector(".why-pane svg.why-morph")!;
    const last = R1.formations[R1.formations.length - 1].frame;
    expect(paths(svg).map((p) => p.getAttribute("d"))).toEqual(last.pieces.map((p) => p.d));
  });

  it("releases to the static page when Pause motion is pressed, and stages again when it is released", async () => {
    const { container } = render(<WhyPage />);
    html.setAttribute("data-motion", "reduce");
    await flush();
    expect(html.hasAttribute(MODE_ATTR)).toBe(false);
    // The formation svg is back to the server's opening frame, string for string.
    const svg = container.querySelector(".why-pane svg.why-morph")!;
    const first = R1.formations[0].frame;
    expect(paths(svg).map((p) => p.getAttribute("d"))).toEqual(first.pieces.map((p) => p.d));
    for (const n of paneNodes(container)) expect(n.style.transform).toBe("");
    expect(container.querySelector(".why-pane[data-ready]")).toBeNull();
    html.removeAttribute("data-motion");
    await flush();
    expect(html.getAttribute(MODE_ATTR)).toBe("stage");
    expect(container.querySelector('[data-why-reel="r1"] > .why-pane[data-ready]')).not.toBeNull();
  });

  it("follows the OS settings and the window size", () => {
    render(<WhyPage />);
    answers[GATE_QUERIES.big] = false;
    fire(GATE_QUERIES.big);
    expect(html.getAttribute(MODE_ATTR)).toBe("pocket");
    answers[GATE_QUERIES.fit] = false;
    fire(GATE_QUERIES.fit);
    expect(html.hasAttribute(MODE_ATTR)).toBe(false);
    answers[GATE_QUERIES.fit] = true;
    answers[GATE_QUERIES.big] = true;
    answers[GATE_QUERIES.motion] = false;
    fire(GATE_QUERIES.motion);
    expect(html.hasAttribute(MODE_ATTR)).toBe(false);
    answers[GATE_QUERIES.motion] = true;
    fire(GATE_QUERIES.motion);
    expect(html.getAttribute(MODE_ATTR)).toBe("stage");
  });

  it("leaves the finished page at large text sizes", () => {
    html.style.fontSize = "24px";
    render(<WhyPage />);
    expect(html.hasAttribute(MODE_ATTR)).toBe(false);
  });

  it("cleans up on unmount", () => {
    const { container, unmount } = render(<WhyPage />);
    const nodes = paneNodes(container);
    expect(document.querySelector("[data-why-probe]")).not.toBeNull();
    unmount();
    expect(html.hasAttribute(MODE_ATTR)).toBe(false);
    for (const n of nodes) {
      expect(n.style.transform).toBe("");
      expect(n.style.getPropertyValue("--why-s")).toBe("");
    }
    expect(document.querySelector("[data-why-probe]")).toBeNull();
    // Nothing is listening any more.
    for (const set of mqListeners.values()) expect(set.size).toBe(0);
    window.dispatchEvent(new Event("scroll"));
    expect(rafs).toHaveLength(0);
  });

  /* ---------------- pockets ---------------- */

  describe("in pocket mode (a phone, or another smaller window at default text size)", () => {
    beforeEach(() => {
      answers[GATE_QUERIES.big] = false;
    });

    it("marks pocket, leaves the panes alone, and opens every pocket on its first formation in its own view", () => {
      const { container } = render(<WhyPage />);
      expect(html.getAttribute(MODE_ATTR)).toBe("pocket");
      expect(container.querySelector(".why-pane[data-ready]")).toBeNull();
      expect(paths(container.querySelector(".why-pane svg.why-morph")!).map((p) => p.getAttribute("d"))).toEqual(
        R1.formations[0].frame.pieces.map((p) => p.d),
      );
      const pockets = pocketsOf(container);
      expect(pockets.map((p) => p.dataset.whyPocket)).toEqual([...PLACEMENTS]);
      for (const el of pockets) {
        const key = el.dataset.whyPocket!;
        const plan = pocketPlan("r1", key);
        // A placement no pocket plays (the summit: the hands' frame plays it) is the static page's only.
        if (!plan) {
          expect(el.hasAttribute("data-why-static"), key).toBe(true);
          expect(el.hasAttribute("data-ready"), key).toBe(false);
          continue;
        }
        expect(el.hasAttribute("data-ready"), key).toBe(true);
        const svg = el.querySelector("svg.why-morph")!;
        // Each band shows its own view of the phone grid (the box of the drawings it plays), its shape the band's.
        expect(svg.getAttribute("viewBox"), key).toBe(pocketView("r1", key).join(" "));
        expect([el.style.getPropertyValue("--vw"), el.style.getPropertyValue("--vh")], key).toEqual(pocketView("r1", key).slice(2).map(String));
        // jsdom has no layout: every pocket is at progress 0, where its plan opens. The summit's band, before
        // the hands' fold their glasses into the line, holds that line, to grow the glasses back out of it.
        const want = key === "summit" ? lineOpener(R1.phone!, plan.steps[0], plan.steps[0], true).f.frame : R1.phone!.formations[plan.steps[0]].frame;
        expect(paths(svg).map((p) => p.getAttribute("d")), key).toEqual(want.pieces.map((p) => p.d));
      }
      // jsdom has no layout, so the pivot has nothing to open its iris from: it stays the finished navy block.
      expect(container.querySelector<HTMLElement>(".why-iris")!.style.clipPath).toBe("");
      expect(container.querySelector<HTMLElement>('[data-why-word="4"]')!.style.opacity).toBe("");
    });

    it("gives a pocket with nothing to play no runway, a keyed one none either (it steps with its list), and the rest the runway their formation asks for", () => {
      const { container } = render(<WhyPage />);
      for (const el of pocketsOf(container)) {
        const plan = pocketPlan("r1", el.dataset.whyPocket!);
        const keyed = el.dataset.whyPocket! in KEYED;
        expect(el.dataset.run).toBe(plan && plan.steps.length > 1 ? (keyed ? "keyed" : typeof plan.run === "number" ? "steps" : plan.run) : "none");
        if (plan && typeof plan.run === "number") expect(el.style.getPropertyValue("--why-run")).toBe(`${plan.run}svh`);
      }
    });

    it("hands back the server's still frames, crop and all, when motion is paused", async () => {
      // The frames as the server drew them: render once without motion.
      html.setAttribute("data-motion", "reduce");
      const server = render(<WhyPage />, { container: document.createElement("div") });
      expect(html.hasAttribute(MODE_ATTR)).toBe(false);
      const drawn = pocketsOf(server.container).map((el) => svgStrings(el.querySelector("svg")!));
      server.unmount();
      html.removeAttribute("data-motion");

      const { container } = render(<WhyPage />);
      expect(html.getAttribute(MODE_ATTR)).toBe("pocket");
      html.setAttribute("data-motion", "reduce");
      await flush();
      expect(html.hasAttribute(MODE_ATTR)).toBe(false);
      expect(container.querySelector(".why-pocket[data-ready]")).toBeNull();
      expect(pocketsOf(container).map((el) => svgStrings(el.querySelector("svg")!))).toEqual(drawn);
    });

    it("stays axe clean once the director has taken the pockets over", async () => {
      const { container } = render(<WhyPage />);
      expect(container.querySelector(".why-pocket[data-ready]")).not.toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    });

    describe("with a layout", () => {
      // A fake layout: the machines' pocket 1000px down, 600px tall with a 200px band; the ceiling's (when
      // asked) 1700px down, 300px tall; under a 0px header in a 768px window (jsdom's); everything else at the top.
      // The machines' frame is too tall to pin with its list here, so its band sits in flow and steps as each era
      // comes up (a keyed pocket); its eras right under it, 100px apart.
      const ERA_TOPS = [1240, 1340, 1440, 1540, 1640];
      let scrollY = 0;
      let scale = 1;
      let ceilingTop = 0;
      let handsTop = 0;
      let summitTop = 0;
      const realRect = Element.prototype.getBoundingClientRect;
      const vvTarget = new EventTarget();
      beforeEach(() => {
        Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
        Object.defineProperty(html, "scrollHeight", { configurable: true, value: 100_000 });
        Object.defineProperty(vvTarget, "scale", { configurable: true, get: () => scale });
        Object.defineProperty(window, "visualViewport", { configurable: true, value: vvTarget });
        Element.prototype.getBoundingClientRect = function (this: Element) {
          if (this.classList.contains("why-frame") && this.closest('[data-why-frame="arrives"]')) {
            return { top: 0, bottom: 5000, left: 0, right: 0, width: 0, height: 5000, x: 0, y: 0, toJSON() {} } as DOMRect;
          }
          // The five eras, plain flow under the machines' band, 100px apart.
          const era = this.matches(".why-timeline > li") ? Array.from(this.parentElement!.children).indexOf(this) : -1;
          if (era >= 0) {
            const top = ERA_TOPS[era] - scrollY;
            return { top, bottom: top + 80, left: 0, right: 0, width: 0, height: 80, x: 0, y: top, toJSON() {} } as DOMRect;
          }
          const pocket = this.closest<HTMLElement>(".why-pocket");
          const key = pocket?.dataset.whyPocket;
          const band = this.classList.contains("why-pocket-band");
          // The hands' (when asked): a 200px band, the wearable's paragraph 500px under its top.
          if (handsTop && this.matches('[data-why-at="hands-p2"]')) {
            const top = handsTop + 500 - scrollY;
            return { top, bottom: top + 80, left: 0, right: 0, width: 0, height: 80, x: 0, y: top, toJSON() {} } as DOMRect;
          }
          const geo =
            key === "arrives" ? [1000, 600]
            : key === "ceiling" && ceilingTop ? [ceilingTop, 300]
            : key === "hands" && handsTop ? [handsTop, 200]
            : key === "summit" && summitTop ? [summitTop, 200]
            : null;
          const mine = !!geo && (band || this === pocket);
          const top = mine ? geo![0] - scrollY : 0;
          const height = mine ? (band ? 200 : geo![1]) : 0;
          return { top, bottom: top + height, left: 0, right: 0, width: 0, height, x: 0, y: top, toJSON() {} } as DOMRect;
        };
      });
      afterEach(() => {
        Element.prototype.getBoundingClientRect = realRect;
        delete (window as unknown as Record<string, unknown>).scrollY;
        delete (html as unknown as Record<string, unknown>).scrollHeight;
        scrollY = 0;
        scale = 1;
        ceilingTop = 0;
        handsTop = 0;
        summitTop = 0;
      });

      const at = (y: number) => {
        scrollY = y;
        window.dispatchEvent(new Event("scroll"));
        flushFrames();
      };
      const strings = (f: ReturnType<typeof pocketFrameAt>) => ({ pieces: f.pieces.map((x) => [x.d, x.style]), mark: [f.mark.transform, f.mark.style] });
      const shownIn = (svg: Element) => () => {
        const s = svgStrings(svg);
        return { pieces: s.pieces, mark: s.mark };
      };

      it("rises in as the drawing the band before ended on, reforms it on the way up, then steps machine by machine as each era comes up, the same both ways", () => {
        const { container } = render(<WhyPage />);
        const svg = container.querySelector('[data-why-pocket="arrives"] svg')!;
        const shown = shownIn(svg);
        const plan = pocketPlan("r1", "arrives")!;
        const easings = defaultEasings();
        // It opens on the hero's last drawing (the feed) and is the CCTV by the time it pins.
        expect(R1.formations[plan.steps[0]].id).toBe(R1.formations[pocketPlan("r1", "hero")!.steps.at(-1)!].id);
        // A keyed band rises straight into its list: its opening move plays from its top at 95% down to 50%.
        const entry: [number, number] = [1000 - KEYED_ENTRY[0] * window.innerHeight, 1000 - KEYED_ENTRY[1] * window.innerHeight];
        // One move per era after the first, each ending as its era's top reaches its line: the first era's
        // two thirds down, the last's lower, so the band above them is still on screen as they land.
        const moves = plan.steps.length - 2;
        const tops = ERA_TOPS.slice(ERA_TOPS.length - moves);
        const lines = keyedLines(KEYED.arrives.lines, moves).map((l) => l * window.innerHeight);
        // Every move lands while 60% or more of the band (1000..1200) is still on screen.
        const latest = 1000 + (1 - KEYED_SEEN) * 200;
        const ranges = keyedRanges(tops, lines, entry[1], latest);
        const frameAt = (y: number) => strings(keyedFrameAt(R1.phone!, plan, entry, ranges, y, easings));
        at(0);
        expect(shown()).toEqual(strings(R1.phone!.formations[plan.steps[0]].frame));
        at(Math.ceil(entry[1]));
        expect(shown()).toEqual(strings(R1.phone!.formations[plan.steps[1]].frame));
        const ys = [entry[0] + 50, entry[0] + 200, ...ranges.flatMap(([a, b]) => [a - 4, (a + b) / 2, b + 1]), 3000];
        const seen = new Map<number, ReturnType<typeof shown>>();
        for (const y of ys) {
          at(y);
          seen.set(y, shown());
          expect(shown(), `at ${y}`).toEqual(frameAt(y));
        }
        // The rising band moves; each era's move moves; the drawing holds between them, as each era's machine.
        expect(seen.get(entry[0] + 50)).not.toEqual(seen.get(entry[0] + 200));
        ranges.forEach(([a, b], j) => {
          expect(seen.get(a - 4), `before era ${j + 2}`).toEqual(strings(R1.phone!.formations[plan.steps[j + 1]].frame));
          expect(seen.get(b + 1), `at era ${j + 2}`).toEqual(strings(R1.phone!.formations[plan.steps[j + 2]].frame));
          // Crowded items squeeze the later moves, never under KEYED_SQUEEZE, so none plays off screen.
          expect(b - a).toBeGreaterThanOrEqual(KEYED_SQUEEZE);
          expect(Math.min(1200 - b, 200) / 200, `era ${j + 2} lands with the band on screen`).toBeGreaterThanOrEqual(KEYED_SEEN - 1e-9);
        });
        expect(ranges[0][1] - ranges[0][0]).toBeGreaterThanOrEqual(100);
        expect(seen.get(3000)).toEqual(strings(R1.phone!.formations[plan.steps.at(-1)!].frame));
        // Scrolling back up plays it backwards to the same strings.
        for (const y of [...ys].reverse()) {
          at(y);
          expect(shown(), `back at ${y}`).toEqual(seen.get(y));
        }
        // About 40 full frames of every pocket: over 4s under jsdom on a busy machine, past vitest's 5s default.
      }, 20_000);

      it.each([
        [390, 844, true],
        [960, 600, false],
      ] as const)("pins the hero's frame, and only it, on a portrait screen it fits (%i x %i: %s), never on a zoomed desktop", (w, h, pins) => {
        const saved = [window.innerWidth, window.innerHeight];
        Object.defineProperty(window, "innerWidth", { configurable: true, value: w });
        Object.defineProperty(window, "innerHeight", { configurable: true, value: h });
        try {
          const { container } = render(<WhyPage />);
          const pinned = Array.from(container.querySelectorAll<HTMLElement>(".why-frame-pin[data-pin]")).map((el) => el.dataset.whyFrame);
          expect(pinned).toEqual(pins ? ["hero"] : []);
        } finally {
          Object.defineProperty(window, "innerWidth", { configurable: true, value: saved[0] });
          Object.defineProperty(window, "innerHeight", { configurable: true, value: saved[1] });
        }
      });

      it.each([
        // 390 x 844: the band and the hero's sentences fit with the upright band at nearly its own height.
        [390, 844, 386, true],
        // 360 x 640: they would not (the upright band would shrink to about half itself): the phone's own drawing.
        [360, 640, 450, false],
      ] as const)("stands the hero's phone upright where its frame fits at nearly full height (%i x %i), on its side elsewhere", (w, h, lede, upright) => {
        const saved = [window.innerWidth, window.innerHeight];
        Object.defineProperty(window, "innerWidth", { configurable: true, value: w });
        Object.defineProperty(window, "innerHeight", { configurable: true, value: h });
        // The hero's band: the column's width at its pocket's view's shape, never over 42svh; its frame: the
        // band, a unit, and the sentences.
        const fake = Element.prototype.getBoundingClientRect;
        const bandOf = (pocket: HTMLElement) =>
          Math.min(0.42 * h, ((w - 48) * Number(pocket.style.getPropertyValue("--vh"))) / Number(pocket.style.getPropertyValue("--vw")));
        const box = (height: number) => ({ top: 0, bottom: height, left: 0, right: 0, width: w - 48, height, x: 0, y: 0, toJSON() {} }) as DOMRect;
        Element.prototype.getBoundingClientRect = function (this: Element) {
          const hero = document.querySelector<HTMLElement>('[data-why-pocket="hero"]');
          if (hero && this.classList.contains("why-pocket-band") && hero.contains(this)) return box(bandOf(hero));
          if (hero && this.classList.contains("why-frame") && this.contains(hero)) return box(bandOf(hero) + 32 + lede);
          return fake.call(this);
        };
        try {
          const { container } = render(<WhyPage />);
          const pocket = container.querySelector<HTMLElement>('[data-why-pocket="hero"]')!;
          const view = upright ? UPRIGHT.r1!.hero.view : pocketView("r1", "hero");
          expect(pocket.querySelector("svg")!.getAttribute("viewBox")).toBe(view.join(" "));
          expect([pocket.style.getPropertyValue("--vw"), pocket.style.getPropertyValue("--vh")]).toEqual(view.slice(2).map(String));
          // Either way the frame pins, its band and its sentences on the screen together.
          expect(container.querySelector(".why-hero-frame-pin")!.hasAttribute("data-pin")).toBe(true);
          // Upright, the hero's band plays the stage's own formations, so the machines' band (which the phone
          // draws) does not open on a feed lying on its side: it rises as the CCTV, drawn whole and still,
          // never as the CCTV's floor alone over an empty band.
          const plan = pocketPlan("r1", "arrives")!;
          const shown = shownIn(container.querySelector('[data-why-pocket="arrives"] svg')!);
          at(0);
          const want = upright ? R1.phone!.formations[plan.steps[1]].frame : R1.phone!.formations[plan.steps[0]].frame;
          expect(R1.phone!.formations[plan.steps[1]].id).toBe("F06-cctv");
          expect(shown()).toEqual(strings(want));
          if (upright) expect(shown()).not.toEqual(strings(lineOpener(R1.phone!, plan.steps[1], plan.steps[1]).f.frame));
        } finally {
          Element.prototype.getBoundingClientRect = fake;
          Object.defineProperty(window, "innerWidth", { configurable: true, value: saved[0] });
          Object.defineProperty(window, "innerHeight", { configurable: true, value: saved[1] });
        }
      });

      it("puts each pocket's own view back when the motion stops", async () => {
        const saved = [window.innerWidth, window.innerHeight];
        Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
        Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
        try {
          const { container } = render(<WhyPage />);
          html.setAttribute("data-motion", "reduce");
          await flush();
          expect(html.hasAttribute(MODE_ATTR)).toBe(false);
          for (const el of pocketsOf(container)) {
            const key = el.dataset.whyPocket!;
            expect([el.style.getPropertyValue("--vw"), el.style.getPropertyValue("--vh")], key).toEqual(pocketView("r1", key).slice(2).map(String));
          }
        } finally {
          Object.defineProperty(window, "innerWidth", { configurable: true, value: saved[0] });
          Object.defineProperty(window, "innerHeight", { configurable: true, value: saved[1] });
        }
      });

      it("rises as its own first drawing, whole and still, while the band before it is still on screen", () => {
        ceilingTop = 1700;
        const { container } = render(<WhyPage />);
        const plan = pocketPlan("r1", "ceiling")!;
        const shown = shownIn(container.querySelector('[data-why-pocket="ceiling"] svg')!);
        // The machines' band is pinned as the ceiling's comes into view: it never shows the smartphone twice,
        // and never rises as the bare through-line over an empty band either.
        for (const y of [0, 1700 - 768, 1700 - 400, 1700]) {
          at(y);
          expect(shown(), `at ${y}`).toEqual(strings(R1.phone!.formations[plan.steps[1]].frame));
        }
        expect(shown()).not.toEqual(strings(R1.phone!.formations[plan.steps[0]].frame));
        expect(shown()).not.toEqual(strings(lineOpener(R1.phone!, plan.steps[0], plan.steps[1]).f.frame));
      });

      it("forms the hands' glasses as late as their band is still whole on screen, never half under the header", () => {
        handsTop = 3000;
        const { container } = render(<WhyPage />);
        const plan = pocketPlan("r1", "hands")!;
        const shown = shownIn(container.querySelector('[data-why-pocket="hands"] svg')!);
        const easings = defaultEasings();
        expect(KEYED.hands.seen).toBe(1);
        const vh = window.innerHeight;
        // The hands' own span (morph/index.ts ENTRY_FROM_AT, ENTRY_TO_AT), not the keyed default: the people
        // reform into the cane and the dog early in the band's rise.
        const entry = pocketEntry(3000, vh, 0, ENTRY_FROM_AT.hands, ENTRY_TO_AT.hands);
        // The wearable's paragraph would reach its line with the band partly under the header (0px here):
        // the move lands instead the moment the band's top reaches the header, its whole band on screen.
        expect(3500 - KEYED.hands.lines[0] * vh).toBeGreaterThan(3000);
        const ranges = keyedRanges([3500], keyedLines(KEYED.hands.lines, 1).map((l) => l * vh), entry[1], 3000);
        const [a, b] = ranges[0];
        expect(b).toBe(3000);
        expect(b - a).toBeGreaterThanOrEqual(100);
        // The cane and the dog hold whole for 200px or more of scroll before the glasses start to form.
        expect(a - entry[1]).toBeGreaterThanOrEqual(200);
        for (const y of [entry[1] + 1, (entry[1] + a) / 2, a - 1]) {
          at(y);
          expect(shown(), `at ${y}`).toEqual(strings(R1.phone!.formations[plan.steps[1]].frame));
        }
        const frameAt = (y: number) => strings(keyedFrameAt(R1.phone!, plan, entry, ranges, y, easings));
        for (const y of [a - 4, (a + b) / 2, b + 1]) {
          at(y);
          expect(shown(), `at ${y}`).toEqual(frameAt(y));
        }
        at(a - 4);
        expect(shown()).toEqual(strings(R1.phone!.formations[plan.steps[1]].frame));
        at(b + 1);
        expect(shown()).toEqual(strings(R1.phone!.formations[plan.steps[2]].frame));
        expect(R1.phone!.formations[plan.steps[2]].id).toBe("F16-wearable");
      });

      it("never shows whole glasses in the hands' band and the summit's at once: the hands' fold theirs into the line as the summit's grow them out of it", () => {
        // The summit's band 600px under the hands' (each 200px here), so it comes into view while the hands'
        // band is still on screen, the way a tall phone lays them out.
        handsTop = 3000;
        summitTop = 3600;
        const { container } = render(<WhyPage />);
        const vh = window.innerHeight;
        const hands = pocketPlan("r1", "hands")!;
        const glasses = hands.steps[hands.steps.length - 1];
        expect(R1.phone!.formations[glasses].id).toBe("F16-wearable");
        expect(KEYED.hands.fold).toBe(true);
        expect(OPEN_WHOLE).toContain("summit");
        const handsSvg = shownIn(container.querySelector('[data-why-pocket="hands"] svg')!);
        const summitSvg = shownIn(container.querySelector('[data-why-pocket="summit"] svg')!);
        const whole = strings(R1.phone!.formations[glasses].frame);
        let handsHeld = 0;
        let summitHeld = 0;
        // Through the glasses' move, their hold, the fold and the summit's band rising whole into view.
        for (let y = 2860; y <= 3260; y += 16) {
          at(y);
          // Any part of either band on screen.
          const handsInView = 3000 - y + 200 > 0 && 3000 - y < vh;
          const summitInView = 3600 - y + 200 > 0 && 3600 - y < vh;
          const handsGlasses = JSON.stringify(handsSvg()) === JSON.stringify(whole);
          const summitGlasses = JSON.stringify(summitSvg()) === JSON.stringify(whole);
          if (handsInView && handsGlasses) handsHeld++;
          if (summitInView && summitGlasses) summitHeld++;
          expect(handsInView && handsGlasses && summitInView && summitGlasses, `at ${y}`).toBe(false);
        }
        // Each band does hold them whole on screen for a while, and the hands' ends on the line alone (its fold
        // done by the time the summit's band is whole on screen, or KEYED_SQUEEZE after the glasses land).
        expect(handsHeld).toBeGreaterThan(0);
        expect(summitHeld).toBeGreaterThan(0);
        const line = strings(lineOpener(R1.phone!, glasses, glasses, true).f.frame);
        // Before the hand-over the summit's band holds the line the glasses will grow out of; after it the
        // hands' holds that line, unbroken where the glasses stood.
        at(3000);
        expect(summitSvg()).toEqual(line);
        at(Math.max(3600 + 200 - vh, 3000 + 8 + KEYED_SQUEEZE) + 1);
        expect(handsSvg()).toEqual(line);
        expect(summitSvg()).toEqual(whole);
      }, 20_000);

      it("freezes while pinch-zoomed, and picks the scroll back up when the zoom ends", () => {
        const { container } = render(<WhyPage />);
        const svg = container.querySelector('[data-why-pocket="arrives"] svg')!;
        // Inside the second era's move.
        const lines = keyedLines(KEYED.arrives.lines, 4).map((l) => l * window.innerHeight);
        const [a, b] = keyedRanges(ERA_TOPS.slice(1), lines, 1000 - KEYED_ENTRY[1] * window.innerHeight, 1000 + (1 - KEYED_SEEN) * 200)[0];
        at(a + (b - a) * 0.25);
        const before = svgStrings(svg);
        scale = 2;
        vvTarget.dispatchEvent(new Event("resize"));
        at(a + (b - a) * 0.75);
        expect(svgStrings(svg)).toEqual(before);
        expect(html.getAttribute(MODE_ATTR)).toBe("pocket");
        scale = 1;
        vvTarget.dispatchEvent(new Event("resize"));
        flushFrames();
        expect(svgStrings(svg)).not.toEqual(before);
      });
    });

    describe("Pause motion while a block is pinned keeps the reader on the block at the reading line", () => {
      // A fake stage: essay blocks 300px apart; the four after the 10th of them pin 200px down the viewport
      // for a 900px runway from scroll 2800 (the pairs), the blocks after them waiting under the runway.
      // Static: the same blocks 300px apart, nothing pinned, no runway.
      let scrollY = 0;
      const realRect = Element.prototype.getBoundingClientRect;
      const RUN = 900;
      const PIN = [10, 13];
      const blocksOf = (article: Element) => Array.from(article.querySelectorAll(BLOCK_SELECTOR)).filter((el) => !el.closest('[aria-hidden="true"]'));
      beforeEach(() => {
        answers[GATE_QUERIES.big] = true;
        Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
        Object.defineProperty(html, "scrollHeight", { configurable: true, value: 100_000 });
        Element.prototype.getBoundingClientRect = function (this: Element) {
          const article = this.closest("article.why");
          const i = article ? blocksOf(article).indexOf(this) : -1;
          let top = 0;
          if (i >= 0) {
            const motion = html.getAttribute(MODE_ATTR) === "stage" && html.getAttribute("data-motion") !== "reduce";
            const natural = i * 300 + (motion && i > PIN[1] ? RUN : 0);
            top = natural - scrollY;
            const pinStart = PIN[0] * 300 - 200;
            if (motion && !article!.hasAttribute("data-why-measuring") && i >= PIN[0] && i <= PIN[1]) {
              top = natural - scrollY + Math.min(Math.max(scrollY - pinStart, 0), RUN);
            }
          }
          return { top, bottom: top + 40, left: 0, right: 0, width: 0, height: i < 0 ? 0 : 40, x: 0, y: top, toJSON() {} } as DOMRect;
        };
        (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockImplementation((opts: ScrollToOptions) => {
          scrollY = opts.top ?? scrollY;
        });
      });
      afterEach(() => {
        Element.prototype.getBoundingClientRect = realRect;
        delete (window as unknown as Record<string, unknown>).scrollY;
        delete (html as unknown as Record<string, unknown>).scrollHeight;
        scrollY = 0;
      });

      it("restores the pinned block the reader was looking at, at the same offset", async () => {
        scrollY = 3400; // mid-run: the 10th block is pinned 200px down; by its place in the flow, the 12th would be
        const { container } = render(<WhyPage />);
        expect(html.getAttribute(MODE_ATTR)).toBe("stage");
        const article = container.querySelector("article.why")!;
        const block = blocksOf(article)[PIN[0]];
        const before = block.getBoundingClientRect().top;
        expect(before).toBe(200);
        html.setAttribute("data-motion", "reduce");
        await flush();
        expect(html.hasAttribute(MODE_ATTR)).toBe(false);
        expect(Math.abs(block.getBoundingClientRect().top - before)).toBeLessThanOrEqual(2);
        expect(scrollY).toBe(PIN[0] * 300 - 200);
      });
    });

    describe("Pause motion at the climax keeps the pivot's line where it was", () => {
      // A fake stage: blocks 300px apart; the pivot's line pins 226px down for a 1500px runway (its stage),
      // and with motion the blocks after it wait 854px further down, under the stage. The next block (the
      // people's headline) then sits 680px down, nearer the reading line (460.8px of 768) than the line
      // itself, and no block holds the reading line: the navy is all there is there. Static: 300px apart.
      let scrollY = 0;
      const realRect = Element.prototype.getBoundingClientRect;
      const RUN = 1500;
      const SHIFT = 854;
      const blocksOf = (article: Element) => Array.from(article.querySelectorAll(BLOCK_SELECTOR)).filter((el) => !el.closest('[aria-hidden="true"]'));
      beforeEach(() => {
        answers[GATE_QUERIES.big] = true;
        Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
        Object.defineProperty(html, "scrollHeight", { configurable: true, value: 100_000 });
        Element.prototype.getBoundingClientRect = function (this: Element) {
          const article = this.closest("article.why");
          const blocks = article ? blocksOf(article) : [];
          const i = blocks.indexOf(this);
          const pv = blocks.findIndex((el) => el.matches(".why-pivot-line"));
          let top = 0;
          if (i >= 0) {
            const motion = html.getAttribute(MODE_ATTR) === "stage" && html.getAttribute("data-motion") !== "reduce";
            top = i * 300 + (motion && i > pv ? SHIFT : 0) - scrollY;
            const pinStart = pv * 300 - 226;
            if (motion && i === pv && !article!.hasAttribute("data-why-measuring")) top = i * 300 - scrollY + Math.min(Math.max(scrollY - pinStart, 0), RUN);
          }
          return { top, bottom: top + 40, left: 0, right: 0, width: 0, height: i < 0 ? 0 : 40, x: 0, y: top, toJSON() {} } as DOMRect;
        };
        (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockImplementation((opts: ScrollToOptions) => {
          scrollY = opts.top ?? scrollY;
        });
      });
      afterEach(() => {
        Element.prototype.getBoundingClientRect = realRect;
        delete (window as unknown as Record<string, unknown>).scrollY;
        delete (html as unknown as Record<string, unknown>).scrollHeight;
        scrollY = 0;
      });

      it("holds the pinned pivot line within 24px when the reader pauses mid-climax", async () => {
        const { container } = render(<WhyPage />);
        const article = container.querySelector("article.why")!;
        const blocks = blocksOf(article);
        const pv = blocks.findIndex((el) => el.matches(".why-pivot-line"));
        expect(pv).toBeGreaterThan(0);
        scrollY = pv * 300 - 226 + 700;
        window.dispatchEvent(new Event("scroll"));
        flushFrames();
        const line = blocks[pv];
        expect(line.getBoundingClientRect().top).toBe(226);
        expect(blocks[pv + 1].getBoundingClientRect().top).toBe(680);
        html.setAttribute("data-motion", "reduce");
        await flush();
        expect(html.hasAttribute(MODE_ATTR)).toBe(false);
        expect(Math.abs(line.getBoundingClientRect().top - 226)).toBeLessThanOrEqual(24);
      });
    });

    describe("resuming motion keeps the reader's line even where it pins in the new layout", () => {
      // A fake phone: blocks 120px apart; with motion the hero's frame pins its blocks 3 to 7 (from block 3's
      // place, 80px under the top) for a 900px runway, the blocks after it waiting under the runway. Static:
      // 120px apart, nothing pinned. The reader is on block 7, 371px down, with motion paused: pinned, block 7
      // sits 560px down, so the flow's place for it is not where the reader will see it.
      let scrollY = 0;
      const realRect = Element.prototype.getBoundingClientRect;
      const RUN = 900;
      const blocksOf = (article: Element) => Array.from(article.querySelectorAll(BLOCK_SELECTOR)).filter((el) => !el.closest('[aria-hidden="true"]'));
      beforeEach(() => {
        answers[GATE_QUERIES.big] = false;
        Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
        Object.defineProperty(html, "scrollHeight", { configurable: true, value: 100_000 });
        Element.prototype.getBoundingClientRect = function (this: Element) {
          const article = this.closest("article.why");
          const i = article ? blocksOf(article).indexOf(this) : -1;
          let top = 0;
          if (i >= 0) {
            const motion = html.getAttribute(MODE_ATTR) === "pocket" && html.getAttribute("data-motion") !== "reduce";
            top = i * 120 + (motion && i > 7 ? RUN : 0) - scrollY;
            const pinStart = 3 * 120 - 80;
            if (motion && i >= 3 && i <= 7 && !article!.hasAttribute("data-why-measuring")) top = i * 120 - scrollY + Math.min(Math.max(scrollY - pinStart, 0), RUN);
          }
          return { top, bottom: top + 60, left: 0, right: 0, width: 0, height: i < 0 ? 0 : 60, x: 0, y: top, toJSON() {} } as DOMRect;
        };
        (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockImplementation((opts: ScrollToOptions) => {
          scrollY = opts.top ?? scrollY;
        });
      });
      afterEach(() => {
        Element.prototype.getBoundingClientRect = realRect;
        delete (window as unknown as Record<string, unknown>).scrollY;
        delete (html as unknown as Record<string, unknown>).scrollHeight;
        scrollY = 0;
      });

      it("goes back to the exact scroll when motion resumes where the pause left it, the reading block where it was", async () => {
        scrollY = 700; // mid-run: blocks 3 to 7 pinned, block 6 (440px down) at the reading line
        const { container } = render(<WhyPage />);
        expect(html.getAttribute(MODE_ATTR)).toBe("pocket");
        window.dispatchEvent(new Event("scroll"));
        flushFrames();
        const block = blocksOf(container.querySelector("article.why")!)[6];
        expect(block.getBoundingClientRect().top).toBe(440);
        html.setAttribute("data-motion", "reduce");
        await flush();
        expect(html.hasAttribute(MODE_ATTR)).toBe(false);
        expect(Math.abs(block.getBoundingClientRect().top - 440)).toBeLessThanOrEqual(2);
        html.removeAttribute("data-motion");
        await flush();
        expect(html.getAttribute(MODE_ATTR)).toBe("pocket");
        expect(scrollY).toBe(700);
        expect(Math.abs(block.getBoundingClientRect().top - 440)).toBeLessThanOrEqual(2);
      });

      it("puts a block that pins back at its offset within 24px, then back again on a second Pause", async () => {
        html.setAttribute("data-motion", "reduce");
        scrollY = 7 * 120 - 371;
        const { container } = render(<WhyPage />);
        expect(html.hasAttribute(MODE_ATTR)).toBe(false);
        const block = blocksOf(container.querySelector("article.why")!)[7];
        expect(block.getBoundingClientRect().top).toBe(371);
        html.removeAttribute("data-motion");
        await flush();
        expect(html.getAttribute(MODE_ATTR)).toBe("pocket");
        expect(Math.abs(block.getBoundingClientRect().top - 371)).toBeLessThanOrEqual(24);
        html.setAttribute("data-motion", "reduce");
        await flush();
        expect(Math.abs(block.getBoundingClientRect().top - 371)).toBeLessThanOrEqual(24);
      });
    });

    describe("a mode flip keeps the reader's paragraph in place", () => {
      // A fake layout: essay blocks 300px apart on the stage (its gaps), 200px apart in pocket mode.
      let scrollY = 0;
      const pitch = () => (html.getAttribute(MODE_ATTR) === "stage" ? 300 : 200);
      const realRect = Element.prototype.getBoundingClientRect;
      beforeEach(() => {
        Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
        Object.defineProperty(html, "scrollHeight", { configurable: true, value: 100_000 });
        Element.prototype.getBoundingClientRect = function (this: Element) {
          const article = this.closest("article.why");
          const blocks = article ? Array.from(article.querySelectorAll(BLOCK_SELECTOR)) : [];
          const i = blocks.indexOf(this);
          const top = i < 0 ? 0 : i * pitch() - scrollY;
          return { top, bottom: top + 40, left: 0, right: 0, width: 0, height: i < 0 ? 0 : 40, x: 0, y: top, toJSON() {} } as DOMRect;
        };
        (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockImplementation((opts: ScrollToOptions) => {
          scrollY = opts.top ?? scrollY;
        });
      });
      afterEach(() => {
        Element.prototype.getBoundingClientRect = realRect;
        delete (window as unknown as Record<string, unknown>).scrollY;
        delete (html as unknown as Record<string, unknown>).scrollHeight;
        scrollY = 0;
      });

      it("from stage to pocket and back", () => {
        answers[GATE_QUERIES.big] = true;
        // The reading line is 60% down a 768px window (460.8px): block 12 sits 500px down, the nearest to it.
        scrollY = 3100;
        render(<WhyPage />);
        expect(html.getAttribute(MODE_ATTR)).toBe("stage");
        answers[GATE_QUERIES.big] = false;
        fire(GATE_QUERIES.big);
        expect(html.getAttribute(MODE_ATTR)).toBe("pocket");
        expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 12 * 200 - 500, behavior: "instant" });
        expect(scrollY).toBe(1900);
        // Block 12 is still the one at the reading line, so the round trip lands where it began.
        answers[GATE_QUERIES.big] = true;
        fire(GATE_QUERIES.big);
        expect(html.getAttribute(MODE_ATTR)).toBe("stage");
        expect(scrollY).toBe(3100);
      });
    });

    describe("Pause motion keeps the line the reader is on, even when a still opens above it", () => {
      // A fake 1440 x 900 page: essay blocks 120px apart, 60px tall. With motion off, the static page draws
      // a 444px still just above block 24 (a list's drawing), so every block from 24 on moves down by it.
      // The reader is at scroll 2600: the list's blocks 24, 25 and 26 at 280, 400 and 520, the reading line
      // (540) on block 26; block 23 (160) is the topmost block under the header.
      let scrollY = 0;
      const realRect = Element.prototype.getBoundingClientRect;
      const realInner = window.innerHeight;
      const STILL = 444;
      const blocksOf = (article: Element) => Array.from(article.querySelectorAll(BLOCK_SELECTOR)).filter((el) => !el.closest('[aria-hidden="true"]'));
      beforeEach(() => {
        answers[GATE_QUERIES.big] = true;
        Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
        Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
        Object.defineProperty(html, "scrollHeight", { configurable: true, value: 100_000 });
        Element.prototype.getBoundingClientRect = function (this: Element) {
          const article = this.closest("article.why");
          const i = article ? blocksOf(article).indexOf(this) : -1;
          const motion = html.hasAttribute(MODE_ATTR);
          const top = i < 0 ? 0 : i * 120 + (!motion && i >= 24 ? STILL : 0) - scrollY;
          return { top, bottom: top + (i < 0 ? 0 : 60), left: 0, right: 0, width: 0, height: i < 0 ? 0 : 60, x: 0, y: top, toJSON() {} } as DOMRect;
        };
        (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockImplementation((opts: ScrollToOptions) => {
          scrollY = opts.top ?? scrollY;
        });
      });
      afterEach(() => {
        Element.prototype.getBoundingClientRect = realRect;
        Object.defineProperty(window, "innerHeight", { configurable: true, value: realInner });
        delete (window as unknown as Record<string, unknown>).scrollY;
        delete (html as unknown as Record<string, unknown>).scrollHeight;
        scrollY = 0;
      });

      it("holds the blocks at the reading line where they were (within 8px)", async () => {
        scrollY = 2600;
        const { container } = render(<WhyPage />);
        expect(html.getAttribute(MODE_ATTR)).toBe("stage");
        const blocks = blocksOf(container.querySelector("article.why")!);
        const before = [25, 26].map((i) => blocks[i].getBoundingClientRect().top);
        expect(before).toEqual([400, 520]);
        html.setAttribute("data-motion", "reduce");
        await flush();
        expect(html.hasAttribute(MODE_ATTR)).toBe(false);
        [25, 26].forEach((i, k) => expect(Math.abs(blocks[i].getBoundingClientRect().top - before[k]), `block ${i}`).toBeLessThanOrEqual(8));
      });
    });
  });
});

/* ---------------- anchors.ts: where the reader is ---------------- */

describe("pickRestoreAnchor", () => {
  const tops = [100, 400, 700, 1000, 1300];

  it("holds the topmost block at or below the header", () => {
    expect(pickRestoreAnchor(tops, 300, 80)).toEqual({ index: 1, offset: 100 });
    expect(pickRestoreAnchor(tops, 320, 80)).toEqual({ index: 1, offset: 80 });
    expect(pickRestoreAnchor(tops, 321, 80)).toEqual({ index: 2, offset: 379 });
  });

  it("picks by position, not document order", () => {
    expect(pickRestoreAnchor([700, 400, 1000], 0, 80)).toEqual({ index: 1, offset: 400 });
  });

  it("holds the last block once every block is above the header", () => {
    expect(pickRestoreAnchor(tops, 5000, 80)).toEqual({ index: 4, offset: -3700 });
  });

  it("has nothing to hold on an empty page", () => {
    expect(pickRestoreAnchor([], 0, 80)).toBeNull();
  });

  it("with a reading line, holds the innermost block that holds it, else the one whose top is nearest it", () => {
    const heights = [60, 60, 300, 60, 60];
    // Block 2 runs 700..1000: a line at 760 is inside it, one at 430 inside block 1, one at 650 in the gap (nearest top: block 2).
    expect(pickRestoreAnchor(tops, 300, 80, 760, heights)).toEqual({ index: 2, offset: 400 });
    expect(pickRestoreAnchor(tops, 300, 80, 430, heights)).toEqual({ index: 1, offset: 100 });
    expect(pickRestoreAnchor(tops, 300, 80, 650, heights)).toEqual({ index: 2, offset: 400 });
    // A nested block (a term inside its list item) is the one held.
    expect(pickRestoreAnchor([100, 120], 0, 80, 130, [200, 40])).toEqual({ index: 1, offset: 120 });
  });

  it("keeps the line the reader is on when a still is inserted above it", () => {
    const before = [0, 120, 240, 360, 480];
    const heights = [60, 60, 60, 60, 60];
    const anchor = pickRestoreAnchor(before, 0, 80, 0.6 * 600, heights)!;
    expect(anchor.index).toBe(3);
    // The static page inserts a 444px still between blocks 1 and 2.
    const after = before.map((t, i) => (i >= 2 ? t + 444 : t));
    const y = restoreTarget(anchor, { blockTops: after, maxScroll: 10_000 })!;
    expect(after[3] - y).toBe(before[3]);
  });

  it("puts the block back at its offset, inside the scroll range", () => {
    const anchor = { index: 1, offset: 100 };
    expect(restoreTarget(anchor, { blockTops: [0, 900], maxScroll: 5000 })).toBe(800);
    expect(restoreTarget(anchor, { blockTops: [0, 50], maxScroll: 5000 })).toBe(0);
    expect(restoreTarget(anchor, { blockTops: [0, 9000], maxScroll: 5000 })).toBe(5000);
    expect(restoreTarget({ index: 7, offset: 0 }, { blockTops: [0], maxScroll: 10 })).toBeNull();
  });
});

describe("beatY", () => {
  const g = { at: new Map([["s", { top: 1000, height: 200 }]]), svh: 9 };

  it("lands when the anchor's edge reaches the line, plus offset svh", () => {
    expect(beatY({ at: "s" }, g)).toBe(1100 - 0.6 * 900);
    expect(beatY({ at: "s", edge: "top", line: 1 }, g)).toBe(1000 - 900);
    expect(beatY({ at: "s", edge: "bottom", offset: -14 }, g)).toBe(1200 - 540 - 126);
  });

  it("is NaN for a missing anchor", () => {
    expect(beatY({ at: "nope" }, g)).toBeNaN();
    expect(beatY(undefined, g)).toBeNaN();
  });
});
