import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { axe } from "jest-axe";
import { channelsAt, sceneLength, type Scene } from "@/components/phone/scene";
import { SCREENS } from "@/components/phone/screens";
import { CONSENT_ASK, CloudConsentScreen } from "@/components/phone/screens/CloudConsent/CloudConsentScreen";
import { MemoryReviewScreen, REMEMBER_KEYS } from "@/components/phone/screens/MemoryReview/MemoryReviewScreen";
import { PLAN_REVIEW, PlanReviewScreen } from "@/components/phone/screens/PlanReview/PlanReviewScreen";
import { CONSENT, EXAMPLES, MEMORY, MEMORY_SCREEN, PLAN, REMEMBER, consentParagraphs } from "@/lib/app-facts";
import { isPhoneString, marketingViolations } from "./helpers/copy-rules";
import { FakeIntersectionObserver, phoneStrings } from "./helpers/phones";

/* ================================================================
   Step 5 (Memory), step 7 (Step-by-step plans) and step 10 (Your
   choice): each screen's resting frame, its words, its accessibility,
   and its scene beat by beat.
   ================================================================ */

/** A phone the way the page draws one: decorative, inside the chassis. */
function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone-screen">{children}</div>
    </div>
  );
}

const attr = (el: Element, name: string) => el.getAttribute(name);
const on = (el: Element | null) => el?.hasAttribute("data-on") ?? false;
const text = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const screenOf = (container: HTMLElement) => container.querySelector<HTMLElement>(".screen")!;

/** Reports `el` in view (or not) to the scene engine watching it. */
function view(el: Element, ratio: number) {
  act(() => {
    for (const io of FakeIntersectionObserver.watching(el)) if (io.thresholds.length > 1) io.fire(el, ratio);
  });
}

/** Plays `scene` from its opening frame, calling `at` on each beat before it holds. */
function playThrough(screen: HTMLElement, scene: Scene, at: (beat: string) => void = () => {}) {
  const seen: string[] = [];
  for (const beat of scene.beats) {
    seen.push(attr(screen, "data-beat")!);
    at(beat.id);
    act(() => vi.advanceTimersByTime(beat.ms));
  }
  return seen;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-motion");
  FakeIntersectionObserver.reset();
});

const CASES = [
  { key: "memory-review", Component: MemoryReviewScreen, scene: REMEMBER_KEYS },
  { key: "plan-review", Component: PlanReviewScreen, scene: PLAN_REVIEW },
  { key: "cloud-consent", Component: CloudConsentScreen, scene: CONSENT_ASK },
] as const;

describe("the registry draws these three screens for steps 5, 7 and 10", () => {
  it.each(CASES)("maps $key to its screen, with a short scene", ({ key, Component, scene }) => {
    expect(SCREENS[key]).toBe(Component);
    expect(sceneLength(scene)).toBeLessThan(12000);
    expect(scene.rest).toBe(scene.beats[scene.beats.length - 1].id);
  });
});

describe("every screen draws only app strings and marked examples, and stays decorative", () => {
  it.each(CASES)("$key: its strings are facts or examples, to the copy rules", ({ Component }) => {
    const { container } = render(
      <Phone>
        <Component active />
      </Phone>,
    );
    const strings = phoneStrings(container);
    expect(strings.length).toBeGreaterThan(5);
    expect(strings.filter((s) => !isPhoneString(s))).toEqual([]);
    for (const s of strings) expect(marketingViolations(s), s).toEqual([]);
    expect(container.textContent).not.toMatch(/—/);
  });

  it.each(CASES)("$key: nothing focusable, and axe passes", async ({ Component }) => {
    const { container } = render(
      <Phone>
        <Component active />
      </Phone>,
    );
    expect(container.querySelectorAll("a, button, input, select, textarea, [tabindex], [contenteditable]")).toHaveLength(0);
    // Every drawing is hidden itself or inside a hidden part (the orb), not only by the phone.
    container.querySelectorAll(".screen svg").forEach((svg) => {
      expect(svg.closest('.screen [aria-hidden="true"], .screen[aria-hidden="true"]')).not.toBeNull();
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("step 5, Memory: the free path says back what it saved", () => {
  it("rests on the Memory list, the new memory at the top of Where things are", () => {
    const { container } = render(<MemoryReviewScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-scene")).toBe("rest");
    expect(attr(screen, "data-beat")).toBe("saved");
    expect(attr(screen, "data-transcript")).toBe("open");

    const sheet = container.querySelector(".mr-sheet");
    expect(on(sheet)).toBe(true);
    expect(text(sheet!.querySelector(".ph-sheet-title"))).toBe(MEMORY_SCREEN.title.value);
    expect(text(sheet!.querySelector(".mr-back"))).toBe(MEMORY_SCREEN.back.value);
    expect(Array.from(sheet!.querySelectorAll(".mr-tab")).map(text)).toEqual(MEMORY_SCREEN.tabs.map((t) => t.value));
    expect(text(sheet!.querySelector(".mr-tab.is-selected"))).toBe("Memories");
    expect(text(sheet!.querySelector(".mr-section"))).toBe(MEMORY_SCREEN.whereThingsAre.value);

    const rows = Array.from(sheet!.querySelectorAll(".mr-row"));
    expect(rows.map((r) => text(r.querySelector(".mr-row-memory")))).toEqual([
      EXAMPLES.laundry.memories[1],
      EXAMPLES.laundry.memories[2],
      EXAMPLES.laundry.memories[0],
    ]);
    expect(rows.map((r) => text(r.querySelector(".mr-row-note")))).toEqual([
      EXAMPLES.remember.confirmed,
      EXAMPLES.remember.confirmedEarlier,
      EXAMPLES.remember.confirmedEarlier,
    ]);
    expect(rows[0].classList.contains("mr-row-new")).toBe(true);
    expect(on(rows[0])).toBe(true);
    rows.forEach((row) => expect(row.querySelector(".mr-trash svg")).not.toBeNull());
    expect(text(sheet!.querySelector(".mr-forget"))).toBe(MEMORY_SCREEN.forgetEverything.value);
    container.querySelectorAll(".ph-touch").forEach((touch) => expect(on(touch)).toBe(false));
  });

  it("quotes the stored sentence back, and never asks or shows the plus checklist", () => {
    expect(EXAMPLES.remember.echo).toBe(`${REMEMBER.echoLead.value}${EXAMPLES.laundry.memories[1]}`);
    expect(EXAMPLES.remember.echo).toBe("Remembered: My keys hang on the hook by the door.");
    expect(EXAMPLES.remember.confirmed.startsWith(MEMORY_SCREEN.confirmedLead.value)).toBe(true);

    const { container } = render(<MemoryReviewScreen active />);
    const turns = Array.from(container.querySelectorAll(".ph-turn"));
    expect(turns.map((t) => text(t.querySelector(".ph-turn-text")))).toEqual([
      EXAMPLES.justAsk.request,
      EXAMPLES.justAsk.answer,
      EXAMPLES.remember.request,
      EXAMPLES.remember.echo,
    ]);
    // The echo arrives whole, as the app appends a turn, and is shown at rest.
    expect(container.querySelector("[data-words]")).toBeNull();
    expect(on(turns[3])).toBe(true);
    // The free path asks nothing: no question, no "Remember these?" checklist.
    const strings = phoneStrings(container);
    expect(strings).not.toContain(MEMORY.title.value);
    expect(strings.filter((s) => s.endsWith("?") && s !== EXAMPLES.justAsk.request)).toEqual([]);
  });

  it("plays: listening, send, your words, the echo, a tap on the menu, then the list with the new row", () => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    const { container } = render(<MemoryReviewScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-scene")).toBe("ready");
    expect(attr(screen, "data-beat")).toBe("listening");
    const sheet = container.querySelector(".mr-sheet")!;
    const newRow = container.querySelector(".mr-row-new")!;
    const menu = container.querySelector(".ph-hdr-end > .ph-touch")!;
    const [, , said, echo] = Array.from(container.querySelectorAll(".ph-turn"));
    expect([on(sheet), on(newRow), on(said), on(echo)]).toEqual([false, false, false, false]);
    view(screen, 1);
    expect(attr(screen, "data-scene")).toBe("play");

    const seen = playThrough(screen, REMEMBER_KEYS, (beat) => {
      if (beat === "listening") expect(attr(screen, "data-mic")).toBe("listening");
      if (beat === "tap-send") expect(on(container.querySelector(".ph-mic .ph-touch"))).toBe(true);
      if (beat === "said") expect([attr(screen, "data-mic"), on(said), on(echo)]).toEqual(["idle", true, false]);
      if (beat === "echo") expect([on(echo), on(sheet), on(menu)]).toEqual([true, false, false]);
      // Nothing opens by itself: a finger taps the menu first.
      if (beat === "tap-menu") expect([on(menu), on(sheet)]).toEqual([true, false]);
      // The sheet rises (the kit takes the conversation's header away under it); the new row follows.
      if (beat === "open") expect([on(sheet), on(newRow), on(menu)]).toEqual([true, false, false]);
      if (beat === "saved") expect([on(sheet), on(newRow)]).toEqual([true, true]);
    });
    expect(seen).toEqual(REMEMBER_KEYS.beats.map((b) => b.id));
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("step 7, Step-by-step plans: nothing starts until you accept", () => {
  it("rests on the review: Your plan, the goal, four steps, and Accept plan, Edit and Dismiss, all open", () => {
    const { container } = render(<PlanReviewScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-beat")).toBe("steps");
    const cover = container.querySelector(".pr-cover")!;
    expect(on(cover)).toBe(true);
    expect(on(container.querySelector(".pr-cover .ph-plan"))).toBe(true);
    expect(Array.from(cover.querySelectorAll(".ph-planstep")).every(on)).toBe(true);
    expect(on(container.querySelector(".pr-actions"))).toBe(true);
    // The plan is not running: no running stage, no Pause, no finger on Accept plan.
    expect(container.querySelector(".pr-running")).toBeNull();
    expect(container.querySelector(".ph-session-button")).toBeNull();
    container.querySelectorAll(".ph-touch").forEach((touch) => expect(on(touch)).toBe(false));
    expect(cover.querySelector(".pr-actions .ph-touch")).toBeNull();
  });

  it("draws the plan takeover from the app: Your plan, the goal, four numbered steps, the three answers", () => {
    const { container } = render(<PlanReviewScreen active />);
    const cover = container.querySelector(".pr-cover")!;
    expect(text(cover.querySelector(".pr-cover-title"))).toBe(PLAN.title.value);
    expect(text(cover.querySelector(".pr-cover-goal"))).toBe(EXAMPLES.laundry.plan.goal);
    const steps = Array.from(cover.querySelectorAll(".ph-planstep"));
    expect(steps.map((s) => [text(s.querySelector(".ph-plan-desc")), text(s.querySelector(".ph-plan-mode"))])).toEqual(
      EXAMPLES.laundry.plan.steps.map((s) => [s.text, s.mode]),
    );
    // Numbers are a CSS counter: no digit sits in the DOM.
    steps.forEach((s) => expect(text(s.querySelector(".ph-plan-n"))).toBe(""));
    // Mode glyphs: Go's filled location, Task's checklist, Look Now's viewfinder.
    expect(steps.map((s) => s.querySelector("[data-glyph]")?.getAttribute("data-glyph"))).toEqual([
      "location-fill",
      "checklist",
      "camera-viewfinder",
      "checklist",
    ]);
    expect(Array.from(cover.querySelectorAll(".ph-btn")).map((b) => [b.className.includes("primary") ? "primary" : "secondary", text(b)])).toEqual([
      ["primary", PLAN.accept.value],
      ["secondary", PLAN.edit.value],
      ["secondary", PLAN.dismiss.value],
    ]);
    // Your request, in the transcript the cover rises over.
    const turns = Array.from(container.querySelectorAll(".ph-turn")).map((t) => text(t.querySelector(".ph-turn-text")));
    expect(turns).toEqual([EXAMPLES.remember.request, EXAMPLES.remember.echo, EXAMPLES.planRequest]);
  });

  it("plays: you ask, the cover rises, the plan builds step by step, and it waits", () => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    const { container } = render(<PlanReviewScreen active />);
    const screen = screenOf(container);
    const cover = container.querySelector(".pr-cover")!;
    const steps = Array.from(container.querySelectorAll(".pr-cover .ph-planstep"));
    const request = Array.from(container.querySelectorAll(".ph-turn"))[2];
    const send = container.querySelector(".ph-mic .ph-touch")!;
    expect(attr(screen, "data-beat")).toBe("listening");
    expect([on(cover), on(request), steps.some(on)]).toEqual([false, false, false]);
    view(screen, 1);

    const seen = playThrough(screen, PLAN_REVIEW, (beat) => {
      if (beat === "listening") expect(attr(screen, "data-mic")).toBe("listening");
      if (beat === "tap-send") expect(on(send)).toBe(true);
      if (beat === "asked") expect([on(request), on(cover)]).toEqual([true, false]);
      if (beat === "review") expect([on(cover), on(container.querySelector(".pr-cover .ph-plan")), steps.some(on)]).toEqual([true, false, false]);
      if (beat === "steps") {
        expect([on(cover), on(container.querySelector(".pr-cover .ph-plan")), steps.every(on), on(container.querySelector(".pr-actions"))]).toEqual([
          true,
          true,
          true,
          true,
        ]);
      }
    });
    expect(seen).toEqual(PLAN_REVIEW.beats.map((b) => b.id));
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("step 10, Your choice: the consent, quoted, and a no that keeps fathom on-device", () => {
  it("quotes the pop-up whole: the headline leading the first of the app's three paragraphs", () => {
    const { container } = render(<CloudConsentScreen active />);
    const sheet = container.querySelector(".cc-sheet")!;
    expect(sheet.querySelector('[data-glyph="antenna"]')).not.toBeNull();
    expect(text(sheet.querySelector(".cc-title"))).toBe(CONSENT.title.value);
    expect(text(sheet.querySelector(".ph-btn-tinted"))).toBe(CONSENT.readAloud.value);
    expect(sheet.querySelector('.ph-btn-tinted [data-glyph="speaker-wave-fill"]')).not.toBeNull();
    const paragraphs = Array.from(sheet.querySelectorAll(".cc-text p"));
    expect(paragraphs).toHaveLength(3);
    expect(text(paragraphs[0].querySelector(".cc-lead"))).toBe(CONSENT.subtitle.value);
    // Word for word: the subtitle, then each paragraph exactly as consentParagraphs() splits the disclosure.
    expect(phoneStrings(sheet.querySelector(".cc-text")!)).toEqual([CONSENT.subtitle.value, ...consentParagraphs()]);
    expect(text(sheet.querySelector(".cc-policy"))).toBe(CONSENT.privacyPolicy.value);
    expect(Array.from(sheet.querySelectorAll(".cc-answers .ph-btn")).map(text)).toEqual([CONSENT.allow.value, CONSENT.decline.value]);
    expect(sheet.querySelector(".cc-answers .ph-btn-secondary")?.textContent).toBe(CONSENT.decline.value);
  });

  it("rests on the question: the pop-up up at its top, both answers open, no finger on either", () => {
    const { container } = render(<CloudConsentScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-beat")).toBe("ask");
    expect(attr(screen, "data-scroll")).toBe("top");
    const sheet = container.querySelector(".cc-sheet")!;
    expect(on(sheet)).toBe(true);
    expect(on(container.querySelector(".ph-scrim"))).toBe(true);
    expect(text(sheet.querySelector(".cc-title"))).toBe(CONSENT.title.value);
    expect(Array.from(sheet.querySelectorAll(".cc-answers .ph-btn")).map(text)).toEqual([CONSENT.allow.value, CONSENT.decline.value]);
    expect(container.querySelectorAll(".ph-touch")).toHaveLength(0);
    // One header, on Cloud AI: nothing has been answered.
    expect(container.querySelectorAll(".ph-header")).toHaveLength(1);
    expect(container.querySelector('[data-connection="cloud"] [data-glyph="cloud-fill"]')).not.toBeNull();
  });

  it("plays: the pop-up rises, reads to its end, and comes back to the question", () => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    const { container } = render(<CloudConsentScreen active />);
    const screen = screenOf(container);
    const sheet = container.querySelector(".cc-sheet")!;
    expect([attr(screen, "data-beat"), attr(screen, "data-scroll"), on(sheet)]).toEqual(["idle", "top", false]);
    view(screen, 1);

    const seen = playThrough(screen, CONSENT_ASK, (beat) => {
      if (beat === "rise") expect([on(sheet), attr(screen, "data-scroll")]).toEqual([true, "top"]);
      if (beat === "read") expect([on(sheet), attr(screen, "data-scroll")]).toEqual([true, "end"]);
      if (beat === "ask") expect([on(sheet), attr(screen, "data-scroll")]).toEqual([true, "top"]);
    });
    expect(seen).toEqual(CONSENT_ASK.beats.map((b) => b.id));
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("with motion reduced or paused, each screen shows its resting frame and starts no timers", () => {
  function expectResting(screen: HTMLElement, scene: Scene) {
    expect(attr(screen, "data-scene")).toBe("rest");
    expect(attr(screen, "data-beat")).toBe(scene.rest);
    for (const [k, v] of Object.entries(channelsAt(scene, scene.beats.length - 1))) expect(attr(screen, `data-${k}`)).toBe(v);
  }

  it.each(CASES)("$key, Pause motion (html[data-motion=reduce])", ({ Component, scene }) => {
    document.documentElement.setAttribute("data-motion", "reduce");
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { container } = render(<Component active />);
    const screen = screenOf(container);
    view(screen, 1);
    expectResting(screen, scene);
    expect(vi.getTimerCount()).toBe(0);
    container.querySelectorAll(".ph-touch").forEach((touch) => expect(on(touch)).toBe(false));
  });

  it.each(CASES)("$key, the OS setting (prefers-reduced-motion)", ({ Component, scene }) => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) => ({ ...original(query), matches: query.includes("prefers-reduced-motion") });
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const { container } = render(<Component active />);
      const screen = screenOf(container);
      view(screen, 1);
      expectResting(screen, scene);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      window.matchMedia = original;
    }
  });

  it.each(CASES)("$key replays from its opening frame when it is active again", async ({ Component, scene }) => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    const { container } = render(<Component active />);
    const screen = screenOf(container);
    view(screen, 1);
    act(() => vi.advanceTimersByTime(sceneLength(scene)));
    expect(attr(screen, "data-beat")).toBe(scene.rest);
    await act(async () => screen.classList.remove("is-active"));
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => screen.classList.add("is-active"));
    expect([attr(screen, "data-scene"), attr(screen, "data-beat")]).toEqual(["play", scene.beats[0].id]);
  });
});
