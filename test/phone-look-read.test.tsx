import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { axe } from "jest-axe";
import { channelsAt, sceneLength, type Scene } from "@/components/phone/scene";
import { SCREENS } from "@/components/phone/screens";
import { LOOK_NOW_SHEET, LookNowScreen } from "@/components/phone/screens/LookNow/LookNowScreen";
import { READ_ALONG, ReadoutScreen } from "@/components/phone/screens/Readout/ReadoutScreen";
import { COMPOSER, EXAMPLES, LOOK_NOW, READOUT, STAGE, fill } from "@/lib/app-facts";
import { COPY_13 as COPY } from "@/lib/copy-13";
import { isPhoneString, marketingViolations } from "./helpers/copy-rules";
import { FakeIntersectionObserver, phoneStrings } from "./helpers/phones";

/* ================================================================
   Step 2 (Look Now) and step 3 (Read): each screen's resting frame, its
   words, its accessibility, and its scene beat by beat.
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
const on = (el: Element) => el.hasAttribute("data-on");
const text = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const screenOf = (container: HTMLElement) => container.querySelector<HTMLElement>(".screen")!;

const LETTER = EXAMPLES.libraryLetter.items;
const count = (n: number) => fill(READOUT.counter, { n, total: LETTER.length });

/** The count the readout bar shows right now (the one layer that is on). */
function shownCount(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".ph-readout-counts .ph-readout-counter")).filter(on).map(text);
}
/** The Look Now section's rows: the first card. */
const lookNowRows = (container: HTMLElement) => Array.from(container.querySelectorAll(".ph-sheet-group:first-child .ph-sheet-card > .ph-sheet-row"));

/** Reports `el` in view (or not) to the scene engine watching it. */
function view(el: Element, ratio: number) {
  act(() => {
    for (const io of FakeIntersectionObserver.watching(el)) if (io.thresholds.length > 1) io.fire(el, ratio);
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-motion");
});

describe("the registry draws these two screens for steps 2 and 3", () => {
  it("maps look-now and readout to them", () => {
    expect(SCREENS["look-now"]).toBe(LookNowScreen);
    expect(SCREENS.readout).toBe(ReadoutScreen);
  });
});

describe("step 2, Look Now: the resting frame", () => {
  beforeEach(() => vi.stubGlobal("IntersectionObserver", undefined));

  it("rests on the More sheet, up over its scrim: the six Look Now rows, then Saved, in the app's order", () => {
    const { container } = render(<LookNowScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-screen")).toBe("look-now");
    expect(attr(screen, "data-beat")).toBe(LOOK_NOW_SHEET.rest);
    expect(attr(screen, "data-scene")).toBe("rest");

    const sheet = container.querySelector(".ph-sheet")!;
    expect(on(sheet)).toBe(true);
    expect(on(container.querySelector(".ph-scrim")!)).toBe(true);

    const rows = lookNowRows(container);
    expect(rows).toHaveLength(6);
    rows.forEach((row) => expect(on(row)).toBe(true));
    expect(phoneStrings(sheet)).toEqual([
      LOOK_NOW.title.value,
      LOOK_NOW.close.value,
      LOOK_NOW.section.value,
      ...LOOK_NOW.rows.flatMap((row) => [row.title.value, row.detail.value]),
      LOOK_NOW.saved.section.value,
      ...LOOK_NOW.saved.rows.flatMap((row) => [row.title.value, row.detail.value]),
    ]);
    // Saved is drawn with the sheet, a still: no beats of its own.
    const saved = Array.from(container.querySelectorAll(".ph-sheet-group:nth-child(2) .ph-sheet-row"));
    expect(saved).toHaveLength(3);
    saved.forEach((row) => expect(row.hasAttribute("data-show")).toBe(false));
    expect(saved.map((row) => row.querySelector(".ph-row-glyph [data-glyph]")?.getAttribute("data-glyph"))).toEqual(["checklist", "location", "repeat"]);
    // Each row's stand-in for the app's SF Symbol.
    expect(rows.map((row) => row.querySelector(".ph-row-glyph [data-glyph]")?.getAttribute("data-glyph"))).toEqual([
      "camera-viewfinder",
      "text-viewfinder",
      "viewfinder-circle",
      "display",
      "hand-point-up",
      "magnifier-plus",
    ]);
  });

  it("holds “Read text” as the picked row, with no finger on screen", () => {
    const { container } = render(<LookNowScreen active />);
    const picked = Array.from(container.querySelectorAll(".ph-sheet-row")).filter((row) => row.querySelector(":scope > .ph-touch"));
    expect(picked).toHaveLength(1);
    expect(text(picked[0].querySelector(".ph-row-title"))).toBe(LOOK_NOW.rows[1].title.value);
    container.querySelectorAll(".ph-touch").forEach((touch) => expect(on(touch)).toBe(false));
  });

  it("keeps the idle conversation under the sheet: Ready, its line, Type and More", () => {
    const { container } = render(<LookNowScreen active />);
    const strings = phoneStrings(container.querySelector(".ph-body")!);
    expect(strings).toEqual([STAGE.idle.eyebrow.value, STAGE.idle.headline.value]);
    const footer = phoneStrings(container.querySelector(".ph-footer")!);
    expect(footer).toContain(COMPOSER.type.value);
    expect(footer).toContain(COMPOSER.more.value);
  });
});

describe("step 3, Read: the resting frame", () => {
  beforeEach(() => vi.stubGlobal("IntersectionObserver", undefined));

  it("rests on the stage mid-read: Speaking, the bar at “2 of 5”, the transport at Pause", () => {
    const { container } = render(<ReadoutScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-screen")).toBe("readout");
    expect(attr(screen, "data-beat")).toBe(READ_ALONG.rest);
    expect(attr(screen, "data-transcript")).toBe("closed");
    expect(on(container.querySelector(".rd-stage")!)).toBe(true);
    expect(on(container.querySelector(".rd-transcript")!)).toBe(false);

    expect(shownCount(container)).toEqual([count(EXAMPLES.libraryLetter.current)]);
    // Still reading: the transport's middle control is Pause, and nothing says Paused.
    expect(phoneStrings(container.querySelector(".ph-session")!)).toEqual([READOUT.pause.value]);
    expect(container.textContent).not.toContain(READOUT.paused.value);
    container.querySelectorAll(".ph-touch").forEach((touch) => expect(on(touch)).toBe(false));
  });

  it("writes only the Look Now turn's line to the transcript, never the letter: the app keeps the text out", () => {
    const { container } = render(<ReadoutScreen active />);
    const turns = Array.from(container.querySelectorAll(".ph-transcript .ph-turn"));
    expect(turns).toHaveLength(2);
    expect(turns[0].classList.contains("ph-turn-user")).toBe(true);
    expect(text(turns[0].querySelector(".ph-turn-text"))).toBe(EXAMPLES.libraryLetter.request);
    expect(turns[1].classList.contains("ph-turn-fathom")).toBe(true);
    expect(text(turns[1].querySelector(".ph-turn-label"))).toBe(READOUT.overline.value);
    expect(text(turns[1].querySelector(".ph-turn-time"))).toBe(EXAMPLES.time);
    expect(text(turns[1].querySelector(".ph-turn-text"))).toBe(EXAMPLES.libraryLetter.summary);
    expect(EXAMPLES.libraryLetter.summary).toBe(`${READOUT.documentType.value}. ${LETTER.length} items.`);
    for (const item of LETTER) expect(container.textContent).not.toContain(item);
    expect(container.querySelector(".rd-item")).toBeNull();
  });

  it("rests on the count of the line the step quotes beside it", () => {
    const step = COPY.steps.find((s) => s.screen === "readout");
    const quoted = LETTER.findIndex((item) => item === step?.example) + 1;
    expect(quoted).toBe(EXAMPLES.libraryLetter.current);
    const { container } = render(<ReadoutScreen active />);
    expect(shownCount(container)).toEqual([count(quoted)]);
  });

  it("draws the speaking stage as the app does: the orb in its speaking mood, no stop, no glow", () => {
    const { container } = render(<ReadoutScreen active />);
    const stageView = container.querySelector(".rd-stage")!;
    expect(container.querySelector(".ph-orb")?.getAttribute("data-mood")).toBe("speaking");
    expect(phoneStrings(stageView)).toEqual([STAGE.speaking.headline.value]);
    expect(container.querySelector(".ph-stop")).toBeNull();
    expect(container.querySelector(".ph-glow")?.getAttribute("data-glow")).toBe("none");
  });
});

describe("both screens: words, accessibility, focus", () => {
  beforeEach(() => vi.stubGlobal("IntersectionObserver", undefined));

  it.each([
    ["look-now", LookNowScreen],
    ["readout", ReadoutScreen],
  ] as const)("%s draws only app strings and marked examples, to the copy rules", (_key, Screen) => {
    const { container } = render(
      <Phone>
        <Screen active />
      </Phone>,
    );
    const strings = phoneStrings(container);
    expect(strings.length).toBeGreaterThan(5);
    expect(strings.filter((s) => !isPhoneString(s))).toEqual([]);
    for (const s of strings) expect(marketingViolations(s), s).toEqual([]);
    expect(container.textContent).not.toMatch(/—/);
  });

  it.each([
    ["look-now", LookNowScreen],
    ["readout", ReadoutScreen],
  ] as const)("%s passes axe with nothing focusable inside the phone", async (_key, Screen) => {
    const { container } = render(
      <main>
        <h1>fathom</h1>
        <Phone>
          <Screen active />
        </Phone>
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
    expect(container.querySelectorAll(".phone :is(a, button, input, select, textarea, [tabindex], [contenteditable])")).toHaveLength(0);
    expect(container.querySelector(".screen")?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe("with motion reduced or paused, each scene shows its final beat with no timers", () => {
  const cases: [string, typeof LookNowScreen, Scene][] = [
    ["look-now", LookNowScreen, LOOK_NOW_SHEET],
    ["readout", ReadoutScreen, READ_ALONG],
  ];

  beforeEach(() => {
    FakeIntersectionObserver.reset();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  function expectResting(container: HTMLElement, scene: Scene) {
    const screen = screenOf(container);
    expect(attr(screen, "data-scene")).toBe("rest");
    expect(attr(screen, "data-beat")).toBe(scene.rest);
    for (const [k, v] of Object.entries(channelsAt(scene, scene.beats.length - 1))) expect(attr(screen, `data-${k}`)).toBe(v);
    expect(vi.getTimerCount()).toBe(0);
  }

  it.each(cases)("%s: Pause motion (html[data-motion=reduce])", (_key, Screen, scene) => {
    document.documentElement.setAttribute("data-motion", "reduce");
    const { container } = render(<Screen active />);
    view(screenOf(container), 1); // on show, active and in view: still nothing plays
    expectResting(container, scene);
  });

  it.each(cases)("%s: the OS setting (prefers-reduced-motion)", (_key, Screen, scene) => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) => ({ ...original(query), matches: query.includes("prefers-reduced-motion") || query.includes("min-width") });
    try {
      const { container } = render(<Screen active />);
      view(screenOf(container), 1);
      expectResting(container, scene);
    } finally {
      window.matchMedia = original;
    }
  });

  it("the resting frames are the stories' final beats: the sheet up, and the reading at 2 of 5", () => {
    document.documentElement.setAttribute("data-motion", "reduce");
    const look = render(<LookNowScreen active />);
    view(screenOf(look.container), 1);
    expect(on(look.container.querySelector(".ph-sheet")!)).toBe(true);
    look.unmount();

    const read = render(<ReadoutScreen active />);
    view(screenOf(read.container), 1);
    expect(shownCount(read.container)).toEqual([count(2)]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("motion paused mid-scene jumps to the final beat and clears the timer", async () => {
    document.documentElement.removeAttribute("data-motion");
    const { container } = render(<ReadoutScreen active />);
    const screen = screenOf(container);
    view(screen, 1);
    expect(attr(screen, "data-scene")).toBe("play");
    act(() => vi.advanceTimersByTime(2900));
    expect(attr(screen, "data-beat")).toBe("read-2");
    await act(async () => document.documentElement.setAttribute("data-motion", "reduce"));
    expectResting(container, READ_ALONG);
  });
});

describe("the scenes play while their screen is active and in view", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  });

  it("Look Now: idle, a tap on More, the sheet and its rows, the press on Read text, then rest", () => {
    const { container } = render(<LookNowScreen active />);
    const screen = screenOf(container);
    const sheet = container.querySelector(".ph-sheet")!;
    const rows = lookNowRows(container);
    const moreTouch = container.querySelector(".ph-ctl .ph-touch")!;
    const readTouch = rows[1].querySelector(":scope > .ph-touch")!;

    // Out of view: waiting on the opening frame, the sheet down, no timers.
    expect(attr(screen, "data-scene")).toBe("ready");
    expect(attr(screen, "data-beat")).toBe("idle");
    expect(on(sheet)).toBe(false);
    rows.forEach((row) => expect(on(row)).toBe(false));
    expect(vi.getTimerCount()).toBe(0);

    view(screen, 1);
    const seen: { beat: string; sheet: boolean; rows: boolean; more: boolean; read: boolean }[] = [];
    for (const beat of LOOK_NOW_SHEET.beats) {
      seen.push({ beat: attr(screen, "data-beat")!, sheet: on(sheet), rows: rows.every(on), more: on(moreTouch), read: on(readTouch) });
      act(() => vi.advanceTimersByTime(beat.ms));
    }
    expect(seen).toEqual([
      { beat: "idle", sheet: false, rows: false, more: false, read: false },
      { beat: "tap-more", sheet: false, rows: false, more: true, read: false },
      { beat: "sheet", sheet: true, rows: true, more: false, read: false },
      { beat: "tap-read", sheet: true, rows: true, more: false, read: true },
      { beat: "read", sheet: true, rows: true, more: false, read: false },
    ]);
    expect(vi.getTimerCount()).toBe(0);
    expect(sceneLength(LOOK_NOW_SHEET)).toBeLessThan(12000);
  });

  it("Read: the summary at 1 of 5, the transcript closes, 2 of 5, 3 of 5, back to 2 of 5", () => {
    const { container } = render(<ReadoutScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-scene")).toBe("ready");
    expect(attr(screen, "data-beat")).toBe("summary");
    expect(attr(screen, "data-transcript")).toBe("open");

    view(screen, 1);
    const seen: { beat: string; transcript: string; count: string[] }[] = [];
    for (const beat of READ_ALONG.beats) {
      seen.push({ beat: attr(screen, "data-beat")!, transcript: attr(screen, "data-transcript")!, count: shownCount(container) });
      act(() => vi.advanceTimersByTime(beat.ms));
    }
    expect(seen).toEqual([
      { beat: "summary", transcript: "open", count: [count(1)] },
      { beat: "tap-transcript", transcript: "open", count: [count(1)] },
      { beat: "read-2", transcript: "closed", count: [count(2)] },
      { beat: "read-3", transcript: "closed", count: [count(3)] },
      { beat: "tap-back", transcript: "closed", count: [count(3)] },
      { beat: "back", transcript: "closed", count: [count(2)] },
    ]);
    expect(vi.getTimerCount()).toBe(0);
    expect(sceneLength(READ_ALONG)).toBeLessThan(12000);
  });

  it("Read: the finger closes the transcript on its beat, and it gives way to the stage", () => {
    const { container } = render(<ReadoutScreen active />);
    const screen = screenOf(container);
    const toggleTouch = container.querySelector(".ph-hdr-toggle .ph-touch")!;
    const transcriptView = container.querySelector(".rd-transcript")!;
    const stageView = container.querySelector(".rd-stage")!;
    view(screen, 1);
    expect([on(transcriptView), on(stageView), on(toggleTouch)]).toEqual([true, false, false]);
    act(() => vi.advanceTimersByTime(READ_ALONG.beats[0].ms));
    expect(attr(screen, "data-beat")).toBe("tap-transcript");
    expect(on(toggleTouch)).toBe(true);
    act(() => vi.advanceTimersByTime(READ_ALONG.beats[1].ms));
    expect([on(transcriptView), on(stageView), on(toggleTouch)]).toEqual([false, true, false]);
  });

  it("Read: a finger taps the transport's backward control on its beat, and only then", () => {
    const { container } = render(<ReadoutScreen active />);
    const screen = screenOf(container);
    const back = container.querySelector(".ph-session-icon:first-child > .ph-touch")!;
    view(screen, 1);
    const on_: Record<string, boolean> = {};
    for (const beat of READ_ALONG.beats) {
      on_[attr(screen, "data-beat")!] = on(back);
      act(() => vi.advanceTimersByTime(beat.ms));
    }
    expect(Object.entries(on_).filter(([, v]) => v).map(([k]) => k)).toEqual(["tap-back"]);
  });

  it.each([
    ["look-now", LookNowScreen, LOOK_NOW_SHEET],
    ["readout", ReadoutScreen, READ_ALONG],
  ] as const)("%s stops off screen and replays from its opening frame when active again", async (_key, Screen, scene) => {
    const { container } = render(<Screen active />);
    const screen = screenOf(container);
    view(screen, 1);
    act(() => vi.advanceTimersByTime(sceneLength(scene)));
    expect(attr(screen, "data-beat")).toBe(scene.rest);

    await act(async () => screen.classList.remove("is-active"));
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => screen.classList.add("is-active"));
    expect(attr(screen, "data-beat")).toBe(scene.beats[0].id);
    expect(attr(screen, "data-scene")).toBe("play");

    view(screen, 0);
    expect(attr(screen, "data-scene")).toBe("ready");
    expect(vi.getTimerCount()).toBe(0);
  });
});
