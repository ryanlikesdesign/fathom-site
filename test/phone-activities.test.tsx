import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { axe } from "jest-axe";
import { channelsAt, sceneLength, type Scene } from "@/components/phone/scene";
import { SCREENS } from "@/components/phone/screens";
import { ActivityGoScreen, GO_ARRIVAL } from "@/components/phone/screens/ActivityGo/ActivityGoScreen";
import { ActivityLiveScreen, LIVE_TALK } from "@/components/phone/screens/ActivityLive/ActivityLiveScreen";
import { ActivityLookoutScreen, LOOKOUT_WALK } from "@/components/phone/screens/ActivityLookout/ActivityLookoutScreen";
import { ACTIVITY, COMPOSER, EXAMPLES, GO, LIVE, LOOKOUT, STAGE, fill } from "@/lib/app-facts";
import { isPhoneString, marketingViolations } from "./helpers/copy-rules";
import { FakeIntersectionObserver, phoneStrings } from "./helpers/phones";

/* ================================================================
   Steps 4 (Lookout and Point to Ask), 6 (Go) and 8 (Task and Live
   mode): each screen's resting frame and its words, its accessibility,
   the reduced-motion path, and its scene beat by beat.
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
const screenOf = (container: HTMLElement) => container.querySelector<HTMLElement>(".screen")!;

/**
 * The strings a phone shows right now: every phone string outside a
 * faded-out layer (.ph-layer without data-on). A word-by-word line counts
 * when its words are on; the mic's End face only when the mic reads End.
 */
function shownStrings(root: Element): string[] {
  const clone = root.cloneNode(true) as Element;
  clone.querySelectorAll(".ph-layer:not([data-on])").forEach((layer) => layer.remove());
  clone.querySelectorAll("[data-words][data-show]:not([data-on])").forEach((words) => words.remove());
  const mic = clone.getAttribute("data-mic") ?? clone.querySelector(".ph-mic")?.getAttribute("data-mic");
  if (mic !== "end") clone.querySelectorAll(".ph-mic-end").forEach((face) => face.remove());
  return phoneStrings(clone);
}

/** Reports `el` in view (or not) to the scene engine watching it. */
function view(el: Element, ratio: number) {
  act(() => {
    for (const io of FakeIntersectionObserver.watching(el)) if (io.thresholds.length > 1) io.fire(el, ratio);
  });
}

/** Plays `scene` from its opening frame to beat `id`. */
function playTo(scene: Scene, id: string) {
  const i = scene.beats.findIndex((b) => b.id === id);
  if (i < 0) throw new Error(`no beat ${id}`);
  const ms = scene.beats.slice(0, i).reduce((sum, b) => sum + b.ms, 0);
  act(() => vi.advanceTimersByTime(ms));
}

const SCENES = [
  ["activity-lookout", ActivityLookoutScreen, LOOKOUT_WALK],
  ["activity-go", ActivityGoScreen, GO_ARRIVAL],
  ["activity-live", ActivityLiveScreen, LIVE_TALK],
] as const;

const DESTINATION = EXAMPLES.laundry.destination;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-motion");
});

describe("the registry draws these three screens for steps 4, 6 and 8", () => {
  it("maps each activity key to its screen", () => {
    expect(SCREENS["activity-lookout"]).toBe(ActivityLookoutScreen);
    expect(SCREENS["activity-go"]).toBe(ActivityGoScreen);
    expect(SCREENS["activity-live"]).toBe(ActivityLiveScreen);
  });

  it.each(SCENES)("%s plays a short scene that rests on its last beat", (_key, _El, scene) => {
    expect(scene.rest).toBe(scene.beats[scene.beats.length - 1].id);
    expect(sceneLength(scene)).toBeGreaterThan(4000);
    expect(sceneLength(scene)).toBeLessThan(12000);
  });
});

describe("every string is an app fact or a marked example, in every beat", () => {
  it.each(SCENES)("%s", (_key, El) => {
    const { container } = render(
      <Phone>
        <El active />
      </Phone>,
    );
    const strings = phoneStrings(container);
    expect(strings.length).toBeGreaterThan(4);
    expect(strings.filter((s) => !isPhoneString(s))).toEqual([]);
    for (const s of strings) expect(marketingViolations(s), s).toEqual([]);
    expect(container.textContent).not.toMatch(/—/);
    // The mic is a glyph; its name is never drawn.
    expect(container.textContent).not.toContain(COMPOSER.speak.value);
  });
});

describe("step 4, Lookout: the resting frame", () => {
  beforeEach(() => vi.stubGlobal("IntersectionObserver", undefined));

  it("rests on fathom talking during Lookout: Running, Tap anywhere to stop, Listening…, Pause", () => {
    const { container } = render(<ActivityLookoutScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-screen")).toBe("activity-lookout");
    expect(attr(screen, "data-scene")).toBe("rest");
    expect(attr(screen, "data-beat")).toBe(LOOKOUT_WALK.rest);
    expect([attr(screen, "data-orb"), attr(screen, "data-glow")]).toEqual(["speaking", "speaking"]);
    expect(container.querySelector(".ph-orb")?.getAttribute("data-size")).toBe("120");
    expect(shownStrings(screen)).toEqual([
      EXAMPLES.clock,
      ACTIVITY.titles.lookout.value,
      ACTIVITY.running.value,
      STAGE.speaking.subline.value,
      LOOKOUT.status.value,
      COMPOSER.type.value,
      COMPOSER.more.value,
      COMPOSER.pause.value,
    ]);
    expect(on(container.querySelector(".ph-stop"))).toBe(true);
  });

  it("draws no narration and no answer: both are spoken in the app, never shown", () => {
    const { container } = render(<ActivityLookoutScreen active />);
    expect(container.textContent).not.toContain(EXAMPLES.oatMilk.answer);
    expect(container.querySelector(".ph-transcript")).toBeNull();
  });

  it("draws nothing the shipping app doesn't: no hazard echo, no buzz rings, no hand", () => {
    const { container } = render(<ActivityLookoutScreen active />);
    // The hazard echo is mounted only in AssistantScreenV2Preview at 6f85740.
    expect(container.querySelector(".ph-hazard, .lo-buzz, .lo-point, [data-glyph=\"hand-point-up\"]")).toBeNull();
    container.querySelectorAll(".ph-touch").forEach((t) => expect(on(t)).toBe(false));
  });

  it("points the way the app does: a finger holds the center, where the orb is", () => {
    const { container } = render(<ActivityLookoutScreen active />);
    const touches = container.querySelectorAll(".ph-touch");
    expect(touches).toHaveLength(1);
    expect(touches[0].closest(".lo-orb")?.querySelector(".ph-orb")).not.toBeNull();
    expect(touches[0].getAttribute("data-show")).toBe("tap-point");
  });
});

describe("step 6, Go: the resting frame", () => {
  beforeEach(() => vi.stubGlobal("IntersectionObserver", undefined));

  it("rests on the question, never on an arrival: It looks like…, then Did you arrive…? with its answers", () => {
    const { container } = render(<ActivityGoScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-screen")).toBe("activity-go");
    expect(attr(screen, "data-beat")).toBe(GO_ARRIVAL.rest);
    expect(GO_ARRIVAL.rest).toBe("ask");
    expect(on(container.querySelector(".go-dialog"))).toBe(true);
    expect(on(container.querySelector(".ph-scrim"))).toBe(true);
    expect(shownStrings(screen)).toEqual([
      EXAMPLES.clock,
      ACTIVITY.titles.go.value,
      ACTIVITY.running.value,
      fill(GO.arrival, { destination: DESTINATION }),
      COMPOSER.type.value,
      COMPOSER.more.value,
      COMPOSER.pause.value,
      fill(GO.arrivalQuestion, { destination: DESTINATION }),
      GO.yes.value,
      GO.notYet.value,
      GO.cancel.value,
    ]);
  });

  it("never asserts arrival: no You’re here., no Back to the conversation…, anywhere in the scene", () => {
    const { container } = render(<ActivityGoScreen active />);
    expect(container.textContent).not.toContain(GO.arrived.value);
    expect(container.textContent).not.toContain(GO.backToConversation.value);
    expect(container.querySelector(".go-reached")?.textContent).toMatch(/^It looks like/);
    // The app's dialog: both answers, then its own Cancel on a card of its own.
    const groups = Array.from(container.querySelectorAll(".go-dialog-group"));
    expect(groups.map((g) => Array.from(g.querySelectorAll(".go-dialog-action")).map((a) => a.textContent))).toEqual([
      [GO.yes.value, GO.notYet.value],
      [GO.cancel.value],
    ]);
    expect(container.querySelectorAll(".ph-touch")).toHaveLength(0);
  });
});

describe("step 8, Task and Live mode: the resting frame", () => {
  beforeEach(() => vi.stubGlobal("IntersectionObserver", undefined));

  it("rests on fathom’s reply in the transcript, over the Task card with the mic off again", () => {
    const { container } = render(<ActivityLiveScreen active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-screen")).toBe("activity-live");
    expect(attr(screen, "data-beat")).toBe(LIVE_TALK.rest);
    expect([attr(screen, "data-orb"), attr(screen, "data-transcript")]).toEqual(["speaking", "open"]);
    // The reply arrives whole; what you asked has scrolled up out of the room.
    expect(container.querySelector("[data-words]")).toBeNull();
    expect(shownStrings(screen)).toEqual([
      EXAMPLES.clock,
      ACTIVITY.titles.task.value,
      EXAMPLES.time,
      EXAMPLES.activityLines.liveReply,
      EXAMPLES.laundry.task.goal,
      fill(LIVE.step, { n: 2 }),
      LIVE.micOff.value,
      COMPOSER.type.value,
      COMPOSER.more.value,
      COMPOSER.pause.value,
    ]);
  });

  it("opens the mic with a tap on the card, never a hold, and leaves the composer's mic alone", () => {
    const { container } = render(<ActivityLiveScreen active />);
    const touches = container.querySelectorAll(".ph-touch");
    expect(touches).toHaveLength(1);
    expect(touches[0].closest(".lt-card")).not.toBeNull();
    expect(container.querySelector(".ph-mic")?.getAttribute("data-mic")).toBe("idle");
    expect(container.textContent).not.toMatch(/\bhold\b/i);
  });
});

describe("the phones are decorative and pass axe", () => {
  beforeEach(() => vi.stubGlobal("IntersectionObserver", undefined));

  it.each(SCENES)("%s has nothing focusable and no axe violations", async (_key, El) => {
    const { container } = render(
      <main>
        <h2>Step</h2>
        <Phone>
          <El active />
        </Phone>
      </main>,
    );
    const phone = container.querySelector(".phone")!;
    expect(phone.querySelectorAll("a, button, input, select, textarea, [tabindex], [contenteditable]")).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("with motion reduced or paused, each scene rests with no timers", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  function expectResting(screen: HTMLElement, scene: Scene) {
    expect(attr(screen, "data-scene")).toBe("rest");
    expect(attr(screen, "data-beat")).toBe(scene.rest);
    for (const [k, v] of Object.entries(channelsAt(scene, scene.beats.length - 1))) expect(attr(screen, `data-${k}`)).toBe(v);
    screen.querySelectorAll(".ph-touch").forEach((t) => expect(on(t)).toBe(false));
  }

  it.each(SCENES)("%s under Pause motion (html[data-motion=reduce])", (_key, El, scene) => {
    document.documentElement.setAttribute("data-motion", "reduce");
    const { container } = render(<El active />);
    const screen = screenOf(container);
    view(screen, 1);
    expectResting(screen, scene);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(SCENES)("%s under prefers-reduced-motion", (_key, El, scene) => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) => ({ ...original(query), matches: query.includes("prefers-reduced-motion") });
    try {
      const { container } = render(<El active />);
      const screen = screenOf(container);
      view(screen, 1);
      expectResting(screen, scene);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      window.matchMedia = original;
    }
  });

  it("rests at once when motion is paused mid-scene", async () => {
    const { container } = render(<ActivityGoScreen active />);
    const screen = screenOf(container);
    view(screen, 1);
    playTo(GO_ARRIVAL, "almost");
    expect(on(container.querySelector(".go-dialog"))).toBe(false);
    await act(async () => document.documentElement.setAttribute("data-motion", "reduce"));
    expectResting(screen, GO_ARRIVAL);
    expect(on(container.querySelector(".go-dialog"))).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("each scene plays beat by beat while its screen is active and in view", () => {
  beforeEach(() => {
    FakeIntersectionObserver.reset();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  });

  it.each(SCENES)("%s waits on its opening frame, plays every beat, and rests on the last", (_key, El, scene) => {
    const { container } = render(<El active />);
    const screen = screenOf(container);
    expect(attr(screen, "data-scene")).toBe("ready");
    expect(attr(screen, "data-beat")).toBe(scene.beats[0].id);
    expect(vi.getTimerCount()).toBe(0);

    view(screen, 1);
    const seen: string[] = [];
    for (const beat of scene.beats) {
      seen.push(attr(screen, "data-beat")!);
      act(() => vi.advanceTimersByTime(beat.ms));
    }
    expect(seen).toEqual(scene.beats.map((b) => b.id));
    expect(attr(screen, "data-beat")).toBe(scene.rest);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("Lookout: talks, hushes, a finger holds the center to point, it looks, and names it", () => {
    const { container } = render(<ActivityLookoutScreen active />);
    const screen = screenOf(container);
    const stop = container.querySelector(".ph-stop")!;
    const finger = container.querySelector(".lo-orb .ph-touch")!;
    view(screen, 1);
    expect([attr(screen, "data-orb"), on(stop), on(finger)]).toEqual(["idle", false, false]);

    playTo(LOOKOUT_WALK, "narrate");
    expect([attr(screen, "data-orb"), attr(screen, "data-glow"), on(stop)]).toEqual(["speaking", "speaking", true]);
    expect(shownStrings(screen)).toContain(STAGE.speaking.subline.value);

    act(() => vi.advanceTimersByTime(LOOKOUT_WALK.beats[1].ms));
    expect([attr(screen, "data-beat"), attr(screen, "data-orb"), on(stop)]).toEqual(["hush", "idle", false]);

    act(() => vi.advanceTimersByTime(LOOKOUT_WALK.beats[2].ms));
    expect([attr(screen, "data-beat"), on(finger)]).toEqual(["tap-point", true]);

    act(() => vi.advanceTimersByTime(LOOKOUT_WALK.beats[3].ms));
    expect([attr(screen, "data-orb"), on(finger)]).toEqual(["working", false]);

    act(() => vi.advanceTimersByTime(LOOKOUT_WALK.beats[4].ms));
    expect([attr(screen, "data-beat"), attr(screen, "data-orb"), on(stop)]).toEqual(["name", "speaking", true]);
  });

  it("Go: Getting close, then Almost there with a new instruction, then it guesses, and it ends asking", () => {
    const { container } = render(<ActivityGoScreen active />);
    const screen = screenOf(container);
    view(screen, 1);
    expect(shownStrings(screen)).toEqual(
      expect.arrayContaining([GO.gettingClose.value, EXAMPLES.laundry.goInstruction, GO.arrivedButton.value, GO.shakeHint.value]),
    );
    expect(shownStrings(screen)).not.toContain(GO.almostThere.value);
    expect(shownStrings(screen)).not.toContain(GO.arrived.value);

    playTo(GO_ARRIVAL, "almost");
    expect(shownStrings(screen)).toEqual(
      expect.arrayContaining([GO.almostThere.value, EXAMPLES.activityLines.goFinalApproach, GO.arrivedButton.value, GO.shakeHint.value]),
    );
    expect(shownStrings(screen)).not.toContain(GO.gettingClose.value);
    expect(attr(screen, "data-orb")).toBe("speaking");

    act(() => vi.advanceTimersByTime(GO_ARRIVAL.beats[1].ms));
    expect(attr(screen, "data-beat")).toBe("arrive");
    expect(shownStrings(screen)).toContain(EXAMPLES.laundry.arrival);
    expect(on(container.querySelector(".go-dialog"))).toBe(false);

    act(() => vi.advanceTimersByTime(GO_ARRIVAL.beats[2].ms));
    expect(attr(screen, "data-beat")).toBe("ask");
    expect([on(container.querySelector(".go-dialog")), on(container.querySelector(".ph-scrim"))]).toEqual([true, true]);
    expect(shownStrings(screen)).toEqual(expect.arrayContaining([EXAMPLES.laundry.arrival, GO.yes.value, GO.notYet.value, GO.cancel.value]));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("Live: Microphone off until the tap, then Listening… and Sending…, then the reply lands", () => {
    const { container } = render(<ActivityLiveScreen active />);
    const screen = screenOf(container);
    const status = () => Array.from(container.querySelectorAll(".lt-status > *")).filter(on).map((p) => p.textContent);
    const reply = container.querySelector(".ph-turn-fathom")!;
    view(screen, 1);
    expect(status()).toEqual([LIVE.micOff.value]);
    expect([attr(screen, "data-orb"), on(reply), on(container.querySelector(".lt-history"))]).toEqual(["idle", false, false]);

    playTo(LIVE_TALK, "tap");
    expect(on(container.querySelector(".lt-card .ph-touch"))).toBe(true);
    expect(status()).toEqual([LIVE.micOff.value]);

    act(() => vi.advanceTimersByTime(LIVE_TALK.beats[1].ms));
    expect([status(), attr(screen, "data-orb")]).toEqual([[LIVE.listening.value], "listening"]);
    // Live mode's mic is the card's own: the composer's mic stays as it was.
    expect(container.querySelector(".ph-mic")?.getAttribute("data-mic")).toBe("idle");

    act(() => vi.advanceTimersByTime(LIVE_TALK.beats[2].ms));
    expect([status(), attr(screen, "data-orb")]).toEqual([[LIVE.sending.value], "working"]);

    act(() => vi.advanceTimersByTime(LIVE_TALK.beats[3].ms));
    expect([status(), attr(screen, "data-orb")]).toEqual([[LIVE.micOff.value], "speaking"]);
    expect([on(reply), on(container.querySelector(".lt-history"))]).toEqual([true, true]);
    // What you asked rides up and out, so the still is never cut at the top.
    expect(on(container.querySelector(".lt-history .ph-turn-user"))).toBe(false);
  });

  it("replays from the opening frame when the screen is active again", async () => {
    const { container } = render(<ActivityLiveScreen active />);
    const screen = screenOf(container);
    view(screen, 1);
    act(() => vi.advanceTimersByTime(sceneLength(LIVE_TALK)));
    expect(attr(screen, "data-beat")).toBe("reply");
    await act(async () => screen.classList.remove("is-active"));
    await act(async () => screen.classList.add("is-active"));
    expect(attr(screen, "data-beat")).toBe("off");
    expect(attr(screen, "data-scene")).toBe("play");
  });
});
