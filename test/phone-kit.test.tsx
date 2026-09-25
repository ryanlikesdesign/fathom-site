import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import {
  ActivityCard,
  AppHeader,
  Composer,
  defineScene,
  Glyph,
  GLYPH_NAMES,
  GlyphSprite,
  headlineSize,
  Layer,
  Orb,
  PhoneButton,
  PlanStepRow,
  PlanSteps,
  ReadoutBar,
  Screen,
  SheetFrame,
  SheetGroup,
  SheetRow,
  Stage,
  StageHeadline,
  StatusBar,
  StopControl,
  SuggestionRow,
  Suggestions,
  TAP_MS,
  TouchIndicator,
  Transcript,
  TranscriptTurn,
  Words,
} from "@/components/phone";
import { channelsAt, beatIn } from "@/components/phone/scene";
import { ConversationHero, ConversationJustAsk } from "@/components/phone/screens/Conversation/ConversationScreen";
import { COMPOSER, CONSENT, EXAMPLES, LOOK_NOW, PLAN, READOUT, STAGE, STARTERS, fill } from "@/lib/app-facts";
import { COPY_13 as COPY } from "@/lib/copy-13";
import { isPhoneString } from "./helpers/copy-rules";
import { phoneStrings } from "./helpers/phones";

/** A phone the way the page draws one: decorative, inside the chassis. */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone-screen">{children}</div>
    </div>
  );
}

describe("the primitives render the app's own words", () => {
  it("draws the composer: Type, the mic, More; End only in its face; the session row", () => {
    const { container } = render(
      <Phone>
        <Composer mic="listening" session="pause" />
      </Phone>,
    );
    expect(container.querySelector(".ph-mic")?.getAttribute("data-mic")).toBe("listening");
    expect(phoneStrings(container)).toEqual([COMPOSER.type.value, COMPOSER.end.value, COMPOSER.more.value, COMPOSER.pause.value]);
    // The mic is a glyph: its name ("Speak") is never drawn.
    expect(container.textContent).not.toContain(COMPOSER.speak.value);
  });

  it("draws the header's glyphs and the usage ring around the 24 mark, with no words", () => {
    const { container } = render(
      <Phone>
        <AppHeader transcript="open" connection="offline" narration usage={0.5} />
      </Phone>,
    );
    expect(phoneStrings(container)).toEqual([]);
    expect(container.querySelector(".ph-hdr-toggle")?.hasAttribute("data-open")).toBe(true);
    expect(container.querySelector('[data-connection="offline"] [data-glyph="wifi-slash"]')).not.toBeNull();
    expect(container.querySelector('[data-narration="on"] [data-glyph="speaker-wave-fill"]')).not.toBeNull();
    expect(container.querySelector(".ph-usage-progress")?.getAttribute("stroke-dasharray")).toBe("50 100");
    // The design system's 24 master: a core and two rings.
    expect(container.querySelector(".ph-usage-mark")?.getAttribute("width")).toBe("24");
  });

  it("draws the orb in each mood at both sizes, never as text", () => {
    for (const mood of ["idle", "listening", "working", "speaking"] as const) {
      const { container, unmount } = render(<Orb mood={mood} size={120} />);
      const orb = container.querySelector(".ph-orb")!;
      expect(orb.getAttribute("data-mood")).toBe(mood);
      expect(orb.getAttribute("data-size")).toBe("120");
      expect(orb.getAttribute("aria-hidden")).toBe("true");
      expect(orb.querySelectorAll(".ph-orb-ring")).toHaveLength(3);
      unmount();
    }
  });

  it("sizes the headline by its length, as the app does", () => {
    expect(headlineSize(STAGE.listening.headline.value)).toBe("lg");
    expect(headlineSize(STAGE.idle.headline.value)).toBe("md");
    expect(headlineSize(EXAMPLES.justAsk.answer)).toBe("sm");
    const { container } = render(<StageHeadline eyebrow={STAGE.idle.eyebrow.value} headline={STAGE.idle.headline.value} />);
    expect(container.querySelector(".ph-hl")?.className).toContain("ph-hl-md");
    expect(phoneStrings(container)).toEqual([STAGE.idle.eyebrow.value, STAGE.idle.headline.value]);
  });

  it("reveals a line word by word, and reads it whole", () => {
    const { container } = render(<Words text={EXAMPLES.justAsk.answer} show="answer" />);
    const words = container.querySelector("[data-words]")!;
    expect(words.textContent).toBe(EXAMPLES.justAsk.answer);
    expect(words.querySelectorAll(".ph-w")).toHaveLength(EXAMPLES.justAsk.answer.split(" ").length);
    expect(phoneStrings(container)).toEqual([EXAMPLES.justAsk.answer]);
  });

  it("marks a Plus suggestion with the app's badge", () => {
    const { container } = render(
      <Suggestions>
        <SuggestionRow label={STARTERS.pool[5].value} plus />
        <SuggestionRow label={STARTERS.pool[0].value} />
      </Suggestions>,
    );
    expect(phoneStrings(container)).toEqual([STARTERS.pool[5].value, STARTERS.plusBadge.value, STARTERS.pool[0].value]);
  });

  it("draws sheets, rows, buttons, turns, the readout bar and plan steps from facts", () => {
    const { container } = render(
      <Phone>
        <Screen name="kit">
          <StatusBar />
          <Stage glow="speaking">
            <StopControl />
          </Stage>
          <Transcript>
            <TranscriptTurn who="user" time={EXAMPLES.time} text={EXAMPLES.justAsk.request} />
            <TranscriptTurn who="fathom" time={EXAMPLES.time} label={READOUT.overline.value} text={EXAMPLES.libraryLetter.items[1]} />
          </Transcript>
          <ReadoutBar counter={fill(READOUT.counter, { n: 2, total: 5 })} paused />
          <PlanSteps>
            {EXAMPLES.laundry.plan.steps.map((s) => (
              <PlanStepRow key={s.text} glyph={s.mode === PLAN.stepModes.go.value ? "location-fill" : "checklist"} text={s.text} mode={s.mode} />
            ))}
          </PlanSteps>
          <PhoneButton>{CONSENT.allow.value}</PhoneButton>
          <PhoneButton kind="secondary">{CONSENT.decline.value}</PhoneButton>
          <SheetFrame title={LOOK_NOW.title.value}>
            <SheetGroup label={LOOK_NOW.section.value}>
              {LOOK_NOW.rows.map((row) => (
                <SheetRow key={row.title.value} glyph="camera-viewfinder" title={row.title.value} detail={row.detail.value} />
              ))}
            </SheetGroup>
          </SheetFrame>
        </Screen>
      </Phone>,
    );
    const strings = phoneStrings(container);
    expect(strings.filter((s) => !isPhoneString(s))).toEqual([]);
    for (const s of [EXAMPLES.clock, "2 of 5", READOUT.paused.value, LOOK_NOW.close.value, PLAN.stepModes.lookNow.value]) {
      expect(strings).toContain(s);
    }
    // Plan steps number themselves in CSS: no stray digit is drawn as text.
    expect(container.querySelectorAll(".ph-plan-n")).toHaveLength(4);
    expect(strings).not.toContain("1");
  });

  it("adds a turn whole, never word by word: that is the stage headline's, which follows speech", () => {
    const { container } = render(
      <Screen name="kit" scene={defineScene([{ id: "one", ms: 100, set: { mic: "idle" } }, { id: "two", ms: 0 }])}>
        <Transcript>
          <TranscriptTurn who="fathom" time={EXAMPLES.time} text={EXAMPLES.justAsk.answer} show="two" />
        </Transcript>
      </Screen>,
    );
    const turn = container.querySelector(".ph-turn")!;
    expect(turn.querySelector("[data-words]")).toBeNull();
    expect(turn.querySelector(".ph-turn-text")?.textContent).toBe(EXAMPLES.justAsk.answer);
    expect(turn.hasAttribute("data-on")).toBe(true);
  });

  it("draws every glyph from one sprite, and nothing focusable", () => {
    const { container } = render(
      <div aria-hidden="true">
        <GlyphSprite />
        {GLYPH_NAMES.map((name) => (
          <Glyph key={name} name={name} />
        ))}
      </div>,
    );
    expect(container.querySelectorAll("symbol")).toHaveLength(GLYPH_NAMES.length);
    expect(GLYPH_NAMES.length).toBeGreaterThanOrEqual(20);
    for (const needed of ["mic", "arrow-up", "keyboard", "plus", "text-bubble", "cloud-fill", "cloud", "wifi-slash", "speaker-wave-fill", "speaker-slash-fill", "menu", "arrow-up-right", "stop-circle-fill", "chevron-right", "chevron-left", "camera-viewfinder", "text-viewfinder", "hand-point-up", "eye", "antenna", "pause", "play", "backward", "forward", "repeat", "location", "location-fill", "trash", "checklist"]) {
      expect(GLYPH_NAMES, needed).toContain(needed);
    }
    container.querySelectorAll("svg").forEach((svg) => expect(svg.getAttribute("focusable")).toBe("false"));
  });
});

describe("the kit carries what every scene shares", () => {
  const scene = defineScene([
    { id: "one", ms: TAP_MS, set: { mic: "idle" } },
    { id: "two", ms: 0 },
  ]);

  it("moves a readout's count on beats, one count at a time", () => {
    const counts = [1, 2].map((n, i) => ({ text: fill(READOUT.counter, { n, total: 5 }), show: i === 0 ? "one" : "two" }));
    const { container } = render(
      <Screen name="kit" scene={scene}>
        <ReadoutBar counter={counts} />
      </Screen>,
    );
    const shown = Array.from(container.querySelectorAll(".ph-readout-counts > .ph-readout-counter")).filter((c) => c.hasAttribute("data-on"));
    expect(shown.map((c) => c.textContent)).toEqual(["2 of 5"]);
  });

  it("gives the transport's backward control a tap, and a menu tap to the header", () => {
    const { container } = render(
      <Screen name="kit" scene={scene}>
        <AppHeader menuTouch="one" />
        <Composer session="readout" backTouch="one" />
      </Screen>,
    );
    expect(container.querySelector(".ph-session-icon > .ph-touch")?.getAttribute("data-show")).toBe("one");
    expect(container.querySelector(".ph-hdr-end > .ph-touch")?.getAttribute("data-show")).toBe("one");
  });

  it("folds a suggestion strip that goes away, so what is above it takes the room", () => {
    const { container } = render(
      <Screen name="kit" scene={scene}>
        <Composer
          suggestions={
            <Suggestions show="one">
              <SuggestionRow label={STARTERS.pool[0].value} />
            </Suggestions>
          }
        />
      </Screen>,
    );
    const strip = container.querySelector(".ph-suggest")!;
    expect([strip.classList.contains("ph-layer"), strip.hasAttribute("data-on")]).toEqual([true, false]);
    // The fold is CSS: a 1fr to 0fr row on the settle curve, its edge and padding with it.
    const css = readFileSync("components/phone/phone.css", "utf8").replace(/\s+/g, " ");
    expect(css).toMatch(/\.ph-suggest\.ph-layer:not\(\[data-on\]\) \{ grid-template-rows: 0fr; padding-top: 0; border-top-color: transparent;/);
    expect(css).toContain(".ph-suggest-rows { min-height: 0; overflow: hidden;");
  });

  it("takes a turn's words as parts, and lays out an activity under a top stage", () => {
    const { container } = render(
      <>
        <TranscriptTurn who="fathom" time={EXAMPLES.time} label={READOUT.overline.value}>
          <span className="part">{EXAMPLES.libraryLetter.items[0]}</span>
        </TranscriptTurn>
        <Stage top>
          <StageHeadline headline={STAGE.speaking.headline.value} />
        </Stage>
        <ActivityCard className="mine">{null}</ActivityCard>
      </>,
    );
    expect(container.querySelector(".ph-turn-text > .part")?.textContent).toBe(EXAMPLES.libraryLetter.items[0]);
    expect(container.querySelector(".ph-stage")?.classList.contains("ph-stage-top")).toBe(true);
    expect(container.querySelector(".ph-activity")?.classList.contains("mine")).toBe(true);
  });

  it("holds every tap beat at least as long as the tap's ring", () => {
    // --ph-tap in phone.css is press plus settle, from the DS motion tokens.
    const tokens = readFileSync("design-system/generated/fathom-tokens.css", "utf8");
    const ms = (name: string) => Number(new RegExp(`--fathom-motion-${name}-duration:\\s*(\\d+)ms`).exec(tokens)?.[1]);
    expect(ms("press") + ms("settle")).toBeGreaterThan(0);
    expect(TAP_MS).toBeGreaterThanOrEqual(ms("press") + ms("settle"));
    expect(readFileSync("components/phone/phone.css", "utf8")).toContain(
      "--ph-tap: calc(var(--fathom-motion-press-duration) + var(--fathom-motion-settle-duration));",
    );
  });
});

describe("layers and taps follow the resting frame", () => {
  const scene = defineScene([
    { id: "one", ms: 100, set: { mic: "idle" } },
    { id: "two", ms: 100, set: { mic: "listening" } },
    { id: "three", ms: 0 },
  ]);

  it("renders the resting frame on the server: layers for it on, others off, taps off", () => {
    const { container } = render(
      <Screen name="test" scene={scene}>
        <Layer show="one two">early</Layer>
        <Layer show="three">late</Layer>
        <Layer>always</Layer>
        <TouchIndicator show="three" />
      </Screen>,
    );
    const root = container.querySelector(".screen")!;
    expect(root.getAttribute("data-beat")).toBe("three");
    expect(root.getAttribute("data-mic")).toBe("listening");
    const [early, late, always] = Array.from(root.children) as HTMLElement[];
    expect(early.hasAttribute("data-on")).toBe(false);
    expect(late.hasAttribute("data-on")).toBe(true);
    expect(always.hasAttribute("data-show")).toBe(false);
    // A tap follows the same rule inside a scene (screens never put one on the resting beat).
    expect(root.querySelector(".ph-touch")?.hasAttribute("data-on")).toBe(true);
  });

  it("draws a tap only inside a scene", () => {
    const { container } = render(<TouchIndicator show="one" />);
    expect(container.querySelector(".ph-touch")?.hasAttribute("data-on")).toBe(false);
  });

  it("merges channels from beat 0", () => {
    expect(channelsAt(scene, 0)).toEqual({ mic: "idle" });
    expect(channelsAt(scene, 2)).toEqual({ mic: "listening" });
    expect(beatIn("one two", "two")).toBe(true);
    expect(beatIn("one two", "tw")).toBe(false);
  });

  it("refuses a scene the page would draw wrong", () => {
    expect(() => defineScene([])).toThrow(/at least one beat/);
    expect(() => defineScene([{ id: "a", ms: 1 }, { id: "a", ms: 0 }])).toThrow(/twice/);
    expect(() => defineScene([{ id: "Bad", ms: 0 }])).toThrow(/lowercase/);
    expect(() => defineScene([{ id: "a", ms: -1 }])).toThrow(/0 ms or more/);
    expect(() => defineScene([{ id: "a", ms: 0, set: { beat: "x" } }])).toThrow(/can't be a channel/);
    expect(() => defineScene([{ id: "a", ms: 1 }, { id: "b", ms: 0, set: { mic: "end" } }])).toThrow(/must set channel "mic"/);
  });
});

describe("a step's phone is decorative and passes axe", () => {
  it("the first step, phone and copy together", async () => {
    const step = COPY.steps[0];
    const { container } = render(
      <main>
        <section aria-label="What fathom does">
          <div className="step">
            <div className="step-phone">
              <Phone>
                <ConversationJustAsk active />
              </Phone>
            </div>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">{step.eyebrow}</p>
              <h2>
                <span className="sr-only">{step.eyebrow}: </span>
                {step.headline[0]}
                <br />
                <span className="muted">{step.headline[1]}</span>
              </h2>
              {step.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
    expect(container.querySelectorAll('[aria-hidden="true"] :is(a, button, input, [tabindex])')).toHaveLength(0);
  });

  it("the hero's phone", async () => {
    const { container } = render(
      <main>
        <Phone>
          <ConversationHero />
        </Phone>
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
    expect(phoneStrings(container).every(isPhoneString)).toBe(true);
  });
});
