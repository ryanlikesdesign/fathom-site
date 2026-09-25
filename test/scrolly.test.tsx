import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { FathomLanding } from "@/components/FathomLanding";
import { SCENES, SCREENS } from "@/components/phone/screens";
import { ConversationJustAsk, ConversationSkills, JUST_ASK, SKILLS_OFFER } from "@/components/phone/screens/Conversation/ConversationScreen";
import { beatIn, channelsAt, sceneLength, TAP_MS, type Scene } from "@/components/phone/scene";
import { EXAMPLES } from "@/lib/app-facts";
import { COPY_13 as COPY } from "@/lib/copy-13";
import { FakeIntersectionObserver, renderAt } from "./helpers/phones";

/* ================================================================
   The scrolly's contract with LandingScroll and the scene engine:
     - every step pairs with exactly one screen, by data-step = data-screen;
     - the announcer says "Step n of 10, <eyebrow>";
     - a scene waits on its opening frame, plays while its screen is
       active and in view, replays on re-activation, pauses with the tab,
       and with motion reduced or paused shows its resting frame with no
       timers at all.
   ================================================================ */

const STEP_ROOT_MARGIN = "-50% 0px -50% 0px";

beforeEach(() => {
  FakeIntersectionObserver.reset();
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-motion");
  document.documentElement.removeAttribute("data-motion-ready");
});

/** Reports `el` in view (or not) to the engine watching it. */
function view(el: Element, ratio: number) {
  act(() => {
    for (const io of FakeIntersectionObserver.watching(el)) if (io.thresholds.length > 1) io.fire(el, ratio);
  });
}

const attr = (el: Element, name: string) => el.getAttribute(name);

describe("the step and screen contract", () => {
  it("pairs every step with one sticky screen, in the same order", () => {
    const { container } = renderAt("wide", <FathomLanding />);
    const steps = Array.from(container.querySelectorAll<HTMLElement>(".scrolly .step")).map((s) => s.dataset.step);
    const screens = Array.from(container.querySelectorAll<HTMLElement>(".scrolly-sticky .phone-screen > .screen")).map(
      (s) => s.dataset.screen,
    );
    expect(steps).toEqual(COPY.steps.map((s) => s.screen));
    expect(screens).toEqual(steps);
    expect(new Set(steps).size).toBe(10);
    // The first screen is on show before the island runs; the rest wait.
    const active = container.querySelectorAll(".scrolly-sticky .screen.is-active");
    expect(active).toHaveLength(1);
    expect(attr(active[0], "data-screen")).toBe(COPY.steps[0].screen);
  });

  it("registers a screen for every ScreenKey the deck uses", () => {
    expect(Object.keys(SCREENS).sort()).toEqual(COPY.steps.map((s) => s.screen).sort());
  });

  it("gives each step on a phone its own screen, active", () => {
    const { container } = renderAt("narrow", <FathomLanding />);
    container.querySelectorAll<HTMLElement>(".scrolly .step").forEach((step) => {
      const screen = step.querySelector<HTMLElement>(".step-phone .screen");
      expect(screen?.dataset.screen).toBe(step.dataset.step);
      expect(screen?.classList.contains("is-active")).toBe(true);
    });
  });
});

describe("the step announcer", () => {
  it("says which step holds the center, and moves the sticky screen with it", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { container } = renderAt("wide", <FathomLanding />);
    const status = container.querySelector("[data-step-status]")!;
    const stepIO = FakeIntersectionObserver.instances.find((io) => io.rootMargin === STEP_ROOT_MARGIN);
    expect(stepIO, "LandingScroll's step observer").toBeDefined();
    const steps = Array.from(container.querySelectorAll<HTMLElement>(".scrolly .step"));

    act(() => stepIO!.fire(steps[0], 1));
    expect(status.textContent).toBe(`Step 1 of 10, ${COPY.steps[0].eyebrow}`);
    expect(status.textContent).toBe("Step 1 of 10, Just ask");

    act(() => stepIO!.fire(steps[4], 1));
    expect(status.textContent).toBe(`Step 5 of 10, ${COPY.steps[4].eyebrow}`);
    const sticky = (key: string) => container.querySelector(`.scrolly-sticky .screen[data-screen="${key}"]`)!;
    expect(sticky(COPY.steps[4].screen).classList.contains("is-active")).toBe(true);
    expect(sticky(COPY.steps[0].screen).classList.contains("is-active")).toBe(false);
    expect(steps[4].classList.contains("is-visible")).toBe(true);
    expect(steps[0].classList.contains("is-visible")).toBe(false);
  });
});

describe("every step plays its own scene, to the same rules", () => {
  const keys = COPY.steps.map((s) => s.screen);
  const isTap = (id: string) => id === "tap" || id.startsWith("tap-");

  it("has a scene for every screen: a short story that rests on its last beat", () => {
    expect(Object.keys(SCENES).sort()).toEqual(Object.keys(SCREENS).sort());
    for (const key of keys) {
      const scene = SCENES[key];
      expect(scene.beats.length, key).toBeGreaterThanOrEqual(3);
      expect(sceneLength(scene), key).toBeGreaterThan(4000);
      expect(sceneLength(scene), key).toBeLessThan(12000);
    }
  });

  it("holds every tap for the same length, and puts a finger on screen only during a tap", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    for (const key of keys) {
      const scene = SCENES[key];
      for (const beat of scene.beats.slice(0, -1)) if (isTap(beat.id)) expect(beat.ms, `${key} ${beat.id}`).toBe(TAP_MS);
      const Screen = SCREENS[key];
      const { container, unmount } = render(<Screen active />);
      container.querySelectorAll(".ph-touch").forEach((touch) => {
        const beats = (touch.getAttribute("data-show") ?? "").split(/\s+/);
        for (const id of beats) expect(isTap(id), `${key}: a finger on "${id}"`).toBe(true);
        // Never on in the resting frame.
        expect(touch.hasAttribute("data-on"), key).toBe(false);
      });
      unmount();
    }
  });

  it("names only its own beats in every layer (a typo would leave a part on or off for good)", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    for (const key of keys) {
      const scene = SCENES[key];
      const ids = new Set(scene.beats.map((b) => b.id));
      const Screen = SCREENS[key];
      const { container, unmount } = render(<Screen active />);
      container.querySelectorAll("[data-show]").forEach((el) => {
        for (const id of (el.getAttribute("data-show") ?? "").split(/\s+/)) expect(ids.has(id), `${key}: "${id}"`).toBe(true);
      });
      // The server renders the resting frame: every layer as the last beat has it.
      container.querySelectorAll("[data-show]").forEach((el) => {
        if (el.classList.contains("ph-touch")) return;
        expect(el.hasAttribute("data-on"), `${key}: ${el.className}`).toBe(beatIn(el.getAttribute("data-show")!, scene.rest));
      });
      unmount();
    }
  });

  it("keeps the hero's phone a still: no scene, the orb breathing", () => {
    const { container } = render(<FathomLanding />);
    const hero = container.querySelector<HTMLElement>(".hero-phone .screen")!;
    expect(hero.dataset.screen).toBe("hero");
    expect(hero.hasAttribute("data-scene")).toBe(false);
    expect(hero.classList.contains("is-active")).toBe(true);
    expect(hero.querySelectorAll("[data-show]")).toHaveLength(0);
  });
});

describe("the page's phones start and stop with the reader", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  });

  it("desktop: the step at the center plays its screen from the top; the one it replaced stops", async () => {
    const { container } = renderAt("wide", <FathomLanding />);
    const stepIO = FakeIntersectionObserver.instances.find((io) => io.rootMargin === STEP_ROOT_MARGIN)!;
    const steps = Array.from(container.querySelectorAll<HTMLElement>(".scrolly .step"));
    const sticky = Array.from(container.querySelectorAll<HTMLElement>(".scrolly-sticky .screen"));
    sticky.forEach((screen) => view(screen, 1));
    // In view, but no step holds the center yet: every screen waits.
    expect(sticky.map((screen) => attr(screen, "data-scene"))).toEqual(Array(10).fill("ready"));
    await act(async () => stepIO.fire(steps[0], 1));
    expect(sticky.map((screen) => attr(screen, "data-scene"))).toEqual(["play", ...Array(9).fill("ready")]);

    // The engine hears the class change as a mutation, after the event.
    await act(async () => stepIO.fire(steps[3], 1));
    const [first, fourth] = [sticky[0], sticky[3]];
    const scene = SCENES[COPY.steps[3].screen];
    expect([attr(fourth, "data-scene"), attr(fourth, "data-beat")]).toEqual(["play", scene.beats[0].id]);
    const held = attr(first, "data-beat");
    act(() => vi.advanceTimersByTime(scene.beats[0].ms));
    expect(attr(fourth, "data-beat")).toBe(scene.beats[1].id);
    // The screen it replaced holds its frame while it fades out, then waits.
    expect(attr(first, "data-beat")).toBe(held);

    // Back to step 1: it replays from its opening frame.
    await act(async () => stepIO.fire(steps[0], 1));
    expect([attr(first, "data-scene"), attr(first, "data-beat")]).toEqual(["play", JUST_ASK.beats[0].id]);
  });

  it("phones: each step's phone waits until it is in view, plays, and re-arms when it leaves", () => {
    const { container } = renderAt("narrow", <FathomLanding />);
    const inline = Array.from(container.querySelectorAll<HTMLElement>(".step-phone .screen"));
    expect(inline).toHaveLength(10);
    inline.forEach((screen) => expect(attr(screen, "data-scene"), screen.dataset.screen).toBe("ready"));
    for (const [i, screen] of inline.entries()) {
      const scene = SCENES[COPY.steps[i].screen];
      view(screen, 1);
      expect([attr(screen, "data-scene"), attr(screen, "data-beat")], screen.dataset.screen).toEqual(["play", scene.beats[0].id]);
      view(screen, 0);
      expect(attr(screen, "data-scene")).toBe("ready");
    }
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("with motion reduced or paused, every scene rests with no timers", () => {
  const scenes: [string, Scene][] = Object.entries(SCENES);

  function expectResting(container: HTMLElement) {
    const played = container.querySelectorAll<HTMLElement>(".screen[data-scene]");
    expect(played.length).toBeGreaterThan(0);
    played.forEach((screen) => {
      expect(attr(screen, "data-scene"), screen.dataset.screen).toBe("rest");
      const scene = scenes.find(([key]) => key === screen.dataset.screen)?.[1];
      if (scene) {
        expect(attr(screen, "data-beat")).toBe(scene.rest);
        for (const [k, v] of Object.entries(channelsAt(scene, scene.beats.length - 1))) expect(attr(screen, `data-${k}`)).toBe(v);
      }
    });
  }

  it.each(["wide", "narrow"] as const)("Pause motion (html[data-motion=reduce]), %s", (width) => {
    document.documentElement.setAttribute("data-motion", "reduce");
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { container } = renderAt(width, <FathomLanding />);
    // Even on show, active and in view, nothing plays.
    container.querySelectorAll(".screen[data-scene]").forEach((screen) => view(screen, 1));
    expectResting(container);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("the OS setting (prefers-reduced-motion)", () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) => ({ ...original(query), matches: query.includes("prefers-reduced-motion") || query.includes("min-width") });
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const { container } = render(<ConversationJustAsk active />);
      view(container.querySelector(".screen")!, 1);
      expectResting(container);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      window.matchMedia = original;
    }
  });

  it("an engine with no IntersectionObserver reads finished, like the rest of the page", () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("IntersectionObserver", undefined);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { container } = render(<ConversationJustAsk active />);
    expectResting(container);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("server-renders the resting frame: the answer shown, taps off, the transcript open", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<ConversationJustAsk active />);
    const screen = container.querySelector(".screen")!;
    expect(attr(screen, "data-beat")).toBe("answer");
    const answer = container.querySelector(".ph-turn-fathom")!;
    expect(answer.textContent).toContain(EXAMPLES.justAsk.answer);
    expect(answer.closest(".ph-layer")?.hasAttribute("data-on")).toBe(true);
    container.querySelectorAll(".ph-touch").forEach((touch) => expect(touch.hasAttribute("data-on")).toBe(false));
    expect(attr(screen, "data-transcript")).toBe("open");
  });
});

describe("a scene plays while its screen is active and in view", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  });

  it("waits on its opening frame, then plays every beat and rests on the last", () => {
    const { container } = render(<ConversationJustAsk active />);
    const screen = container.querySelector<HTMLElement>(".screen")!;
    // Out of view: armed on the opening frame, no timers.
    expect(attr(screen, "data-scene")).toBe("ready");
    expect(attr(screen, "data-beat")).toBe("idle");
    expect(vi.getTimerCount()).toBe(0);

    view(screen, 1);
    expect(attr(screen, "data-scene")).toBe("play");
    const seen: string[] = [];
    for (const beat of JUST_ASK.beats) {
      seen.push(attr(screen, "data-beat")!);
      act(() => vi.advanceTimersByTime(beat.ms));
    }
    expect(seen).toEqual(JUST_ASK.beats.map((b) => b.id));
    expect(attr(screen, "data-beat")).toBe(JUST_ASK.rest);
    expect(vi.getTimerCount()).toBe(0);
    expect(sceneLength(JUST_ASK)).toBeLessThan(12000);
  });

  it("writes each beat's channels and turns its layers on and off", () => {
    const { container } = render(<ConversationJustAsk active />);
    const screen = container.querySelector<HTMLElement>(".screen")!;
    view(screen, 1);
    const suggestions = container.querySelector(".ph-suggest")!;
    const answer = container.querySelector(".ph-turn-fathom")!.closest(".ph-layer")!;
    expect([attr(screen, "data-mic"), attr(screen, "data-orb"), attr(screen, "data-transcript")]).toEqual(["idle", "idle", "closed"]);
    expect(suggestions.hasAttribute("data-on")).toBe(true);
    expect(answer.hasAttribute("data-on")).toBe(false);

    act(() => vi.advanceTimersByTime(JUST_ASK.beats[0].ms + JUST_ASK.beats[1].ms)); // idle, tap-mic
    expect(attr(screen, "data-beat")).toBe("listening");
    expect([attr(screen, "data-mic"), attr(screen, "data-orb"), attr(screen, "data-glow")]).toEqual(["listening", "listening", "listening"]);
    expect(suggestions.hasAttribute("data-on")).toBe(false);

    act(() => vi.advanceTimersByTime(sceneLength(JUST_ASK)));
    expect(attr(screen, "data-transcript")).toBe("open");
    expect(answer.hasAttribute("data-on")).toBe(true);
    // The strip stays folded away once the mic has opened.
    expect(suggestions.hasAttribute("data-on")).toBe(false);
  });

  it("stops when deactivated and replays from the top when active again", async () => {
    const { container } = render(<ConversationJustAsk active />);
    const screen = container.querySelector<HTMLElement>(".screen")!;
    view(screen, 1);
    act(() => vi.advanceTimersByTime(2500));
    expect(attr(screen, "data-beat")).toBe("listening");

    await act(async () => screen.classList.remove("is-active"));
    expect(vi.getTimerCount()).toBe(0);
    expect(attr(screen, "data-beat")).toBe("listening"); // held while it fades out

    await act(async () => screen.classList.add("is-active"));
    expect(attr(screen, "data-beat")).toBe("idle");
    expect(attr(screen, "data-scene")).toBe("play");
    expect(vi.getTimerCount()).toBe(1);
  });

  it("re-arms on its opening frame when it leaves the view", () => {
    const { container } = render(<ConversationSkills active />);
    const screen = container.querySelector<HTMLElement>(".screen")!;
    view(screen, 1);
    act(() => vi.advanceTimersByTime(sceneLength(SKILLS_OFFER)));
    expect(attr(screen, "data-beat")).toBe("saved");
    view(screen, 0);
    expect(attr(screen, "data-scene")).toBe("ready");
    expect(attr(screen, "data-beat")).toBe("offer");
    view(screen, 1);
    expect(attr(screen, "data-scene")).toBe("play");
  });

  it("rests at once when motion is paused mid-scene", async () => {
    const { container } = render(<ConversationJustAsk active />);
    const screen = container.querySelector<HTMLElement>(".screen")!;
    view(screen, 1);
    act(() => vi.advanceTimersByTime(2500));
    await act(async () => document.documentElement.setAttribute("data-motion", "reduce"));
    expect(attr(screen, "data-scene")).toBe("rest");
    expect(attr(screen, "data-beat")).toBe("answer");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses with the tab and finishes the beat when it comes back", () => {
    const { container } = render(<ConversationJustAsk active />);
    const screen = container.querySelector<HTMLElement>(".screen")!;
    view(screen, 1);
    act(() => vi.advanceTimersByTime(1000));
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(attr(screen, "data-beat")).toBe("idle");

    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(600));
    expect(attr(screen, "data-beat")).toBe("tap-mic");
    hidden.mockRestore();
  });

  it("starts the sticky phone's first scene when step 1 holds the center, not when the phone comes into view", async () => {
    const { container } = renderAt("wide", <FathomLanding />);
    const stepIO = FakeIntersectionObserver.instances.find((io) => io.rootMargin === STEP_ROOT_MARGIN)!;
    const steps = Array.from(container.querySelectorAll<HTMLElement>(".scrolly .step"));
    const host = container.querySelector<HTMLElement>(".scrolly-sticky .phone-screen")!;
    const first = container.querySelector<HTMLElement>(".scrolly-sticky .screen.is-active")!;
    const second = container.querySelector<HTMLElement>('.scrolly-sticky .screen[data-screen="conversation-skills"]')!;
    expect(attr(first, "data-scene")).toBe("ready");
    // The reader is still in the section above: the phone is in view, step 1 is not centered.
    view(first, 1);
    view(second, 1);
    expect([attr(first, "data-scene"), attr(first, "data-beat")]).toEqual(["ready", JUST_ASK.beats[0].id]);
    expect(host.hasAttribute("data-live")).toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    // Step 1 takes the center: its scene plays from the top.
    await act(async () => stepIO.fire(steps[0], 1));
    expect(host.hasAttribute("data-live")).toBe(true);
    expect([attr(first, "data-scene"), attr(first, "data-beat")]).toEqual(["play", JUST_ASK.beats[0].id]);
    // Inactive screens wait on their opening frame, even in view.
    expect(attr(second, "data-scene")).toBe("ready");
    expect(attr(second, "data-beat")).toBe(SKILLS_OFFER.beats[0].id);

    // Back up into the section above, and down again: it holds, then replays from the top.
    act(() => vi.advanceTimersByTime(JUST_ASK.beats[0].ms));
    await act(async () => stepIO.fire(steps[0], 0));
    expect(host.hasAttribute("data-live")).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => stepIO.fire(steps[0], 1));
    expect([attr(first, "data-scene"), attr(first, "data-beat")]).toEqual(["play", JUST_ASK.beats[0].id]);
  });
});
