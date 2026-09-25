import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  ACTIVITY,
  AI_MODES,
  APP_BUILD,
  APP_FACTS,
  APP_SOURCE,
  APP_VERSION,
  COMPOSER,
  CONSENT,
  EXAMPLES,
  FREE_CAPABILITIES,
  GO,
  LIVE,
  LOOK_NOW,
  MEMORY,
  MIN_IOS,
  PAYWALL,
  PLAN,
  PLUS_CAPABILITIES,
  PLUS_GATE,
  READOUT,
  SAFETY_SHIELD,
  SHORTCUT_COUNT,
  SHORTCUT_PHRASES,
  SHORTCUT_TITLES,
  SKILLS,
  STAGE,
  STARTERS,
  TRIAL_DAYS,
  consentParagraphs,
  fill,
  flattenFacts,
  isAppFact,
} from "@/lib/app-facts";

const SOURCES_JSON = path.resolve(__dirname, "../lib/app-facts.sources.json");

/** What scripts/check-app-facts.mjs reads. Regenerate with WRITE_APP_FACTS=1. */
function sourcesDocument() {
  return { source: APP_SOURCE, facts: flattenFacts(APP_FACTS) };
}

const v = (xs: readonly { value: string }[]) => xs.map((x) => x.value);

// Every expected value below was read from the app at APP_SOURCE.commit.
// scripts/check-app-facts.mjs proves the file and line; this suite proves
// nobody edited the value here by accident.
describe("app facts are pinned to the reference build", () => {
  it("names the build", () => {
    expect(APP_SOURCE).toEqual({
      repo: "ryanlikesdesign/homer",
      checkout: "device-test",
      commit: "ba8e462",
      version: "1.3.0 (17)",
    });
    expect(`${APP_VERSION.value} (${APP_BUILD.value})`).toBe(APP_SOURCE.version);
    expect(MIN_IOS.value).toBe("17");
  });

  it("keeps the checker's JSON in sync with this file", () => {
    const doc = sourcesDocument();
    if (process.env.WRITE_APP_FACTS) {
      writeFileSync(SOURCES_JSON, `${JSON.stringify(doc, null, 2)}\n`);
    }
    expect(JSON.parse(readFileSync(SOURCES_JSON, "utf8"))).toEqual(doc);
  });

  it("gives every fact a path and a line, and a source only when it's derived", () => {
    const facts = flattenFacts(APP_FACTS);
    expect(facts.length).toBeGreaterThan(100);
    for (const f of facts) {
      expect(f.path, f.key).toMatch(/^Fathom\//);
      expect(Number.isInteger(f.line) && f.line > 0, f.key).toBe(true);
      if (f.source !== undefined) expect(f.source.trim().length, f.key).toBeGreaterThan(0);
      if (f.countOf !== undefined) expect(typeof f.value, f.key).toBe("number");
    }
    expect(new Set(facts.map((f) => f.key)).size).toBe(facts.length);
  });

  it("quotes every fact whole, except the few that name their source", () => {
    // The checker wants the rest as whole string literals. Adding a `source`
    // loosens that for one fact, so each one is a deliberate choice.
    const withSource = flattenFacts(APP_FACTS).filter((f) => f.source !== undefined).map((f) => f.key);
    expect(withSource).toEqual([
      "STARTERS.goToPlace",
      // The tail of one concatenated utterance (AssistantOrchestrator.swift:1264).
      "SKILLS.offerAsk",
      "SKILLS.repeatsBeforeOffer",
      "SAFETY.caution",
      "PAYWALL.price",
      "PAYWALL.trial",
      "PLUS_GATE",
      "MIN_IOS",
      "APP_VERSION",
      "APP_BUILD",
    ]);
  });

  it("stores app punctuation, not straight quotes, and no uppercase eyebrows", () => {
    for (const f of flattenFacts(APP_FACTS)) {
      if (typeof f.value !== "string") continue;
      expect(f.value, f.key).not.toMatch(/['"]/);
      expect(f.value, f.key).not.toMatch(/\\u\{/);
    }
    expect(STAGE.idle.eyebrow.value).toBe("Ready");
    expect(READOUT.overline.value).toBe("Look Now");
  });

  it("pins the conversation stage", () => {
    expect(STAGE.idle.headline.value).toBe("Ask by voice, type, or tap More to look now.");
    expect(STAGE.listening.eyebrow.value).toBe("Listening");
    expect(STAGE.listening.headline.value).toBe("Tap again to send");
    expect(STAGE.thinking.headline.value).toBe("Thinking");
    expect(STAGE.speaking.headline.value).toBe("Speaking");
    expect(STAGE.speaking.subline.value).toBe("Tap anywhere to stop");
    expect(STAGE.notConnected.headline.value).toBe("Obstacle alerts still work. Ask again to retry.");
    expect(STAGE.noCamera.headline.value).toBe("fathom can’t see. Check nothing is covering the lens.");
  });

  it("pins the composer and the first-run starters", () => {
    expect([COMPOSER.type, COMPOSER.more, COMPOSER.pause, COMPOSER.resume, COMPOSER.end].map((f) => f.value)).toEqual([
      "Type",
      "More",
      "Pause",
      "Resume",
      "End",
    ]);
    expect(v(STARTERS.firstRun)).toEqual(["Describe what’s around me", "Watch for obstacles", "Read this text"]);
    expect(STARTERS.pool).toHaveLength(9);
    expect(fill(STARTERS.goToPlace, { place: "the laundry room" })).toBe("Take me to the laundry room");
    expect(STARTERS.plusBadge.value).toBe("Plus");
  });

  it("lists the six Look Now rows in the app's order", () => {
    expect(LOOK_NOW.title.value).toBe("More ways to start");
    expect(LOOK_NOW.section.value).toBe("Look Now");
    expect(LOOK_NOW.rows.map((r) => [r.title.value, r.detail.value])).toEqual([
      ["Describe what’s around me", "One scan of the whole scene"],
      ["Read text", "Labels, mail, signs, read word for word"],
      ["What is this?", "Identify one thing you’re holding"],
      ["Read a screen", "A kiosk, ATM, monitor or appliance panel"],
      ["What am I pointing at?", "Point a finger and I’ll name it"],
      ["Take a closer look", "A fresh picture and a more careful look"],
    ]);
  });

  it("pins the readout, activity, Go, plan and Live strings", () => {
    expect(fill(READOUT.counter, { n: 2, total: 5 })).toBe("2 of 5");
    expect(READOUT.showText.value).toBe("Show text");
    expect(READOUT.askAbout.value).toBe("Ask fathom about this");
    expect(ACTIVITY.running.value).toBe("Running");
    expect(ACTIVITY.paused.lookout.value).toBe("Lookout paused. Obstacle alerts stay on.");
    expect([GO.gettingClose.value, GO.almostThere.value]).toEqual(["Getting close", "Almost there"]);
    expect(GO.arrivedButton.value).toBe("I’ve arrived");
    expect(GO.shakeHint.value).toBe("or shake your phone");
    expect(fill(GO.arrival, { destination: "the laundry room" })).toBe("It looks like you’ve reached the laundry room");
    expect([GO.yes.value, GO.notYet.value, GO.arrived.value]).toEqual(["Yes, finished", "Not yet", "You’re here."]);
    expect([PLAN.title.value, PLAN.accept.value, PLAN.edit.value, PLAN.dismiss.value]).toEqual([
      "Your plan",
      "Accept plan",
      "Edit",
      "Dismiss",
    ]);
    // AssistantEnums.swift displayName, all five step modes.
    expect(Object.values(PLAN.stepModes).map((f) => f.value)).toEqual(["Look Now", "Lookout", "Go", "Task", "Kiosk"]);
    expect(LIVE.micOff.value).toBe("Microphone off");
    expect(LIVE.listening.value).toBe("Listening…");
  });

  it("pins memory and skills, with their count patterns", () => {
    expect(MEMORY.title.value).toBe("Remember these?");
    expect(fill(MEMORY.subtitle, { checked: 3, total: 3 })).toBe("3 of 3 checked. Uncheck anything that’s wrong.");
    expect(fill(MEMORY.rememberN, { n: 2 })).toBe("Remember these 2");
    expect([MEMORY.uncheckAll.value, MEMORY.noThanks.value]).toEqual(["Uncheck all", "No thanks"]);
    expect(MEMORY.empty.value).toBe("fathom asks before saving anything. What it saves shows up here.");
    expect(SKILLS.repeatsBeforeOffer.value).toBe("3");
    expect(EXAMPLES.laundry.skill.offer).toBe(
      "That’s the third time you’ve done the laundry. Want me to save it as a skill so you can just say run the laundry? Say save this as a skill and I’ll keep it.",
    );
    expect(EXAMPLES.laundry.skill.row).toBe("Run the laundry");
    expect(EXAMPLES.laundry.skill.siri).toBe("Run the laundry with fathom");
  });

  it("quotes the consent pop-up, and splits it where the app does", () => {
    expect(CONSENT.title.value).toBe("Allow cloud AI?");
    expect(CONSENT.subtitle.value).toBe("fathom uses cloud AI to describe what it sees");
    expect([CONSENT.allow.value, CONSENT.decline.value, CONSENT.readAloud.value]).toEqual([
      "Allow cloud AI",
      "Keep fathom on-device",
      "Read it to me",
    ]);
    expect(CONSENT.privacyPolicy.value).toBe("Read the full Privacy Policy");
    const paragraphs = consentParagraphs();
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs.join(" ")).toBe(CONSENT.disclosure.value);
    expect(paragraphs[1].startsWith("Google uses this")).toBe(true);
    expect(paragraphs[2].startsWith("Obstacle alerts run")).toBe(true);
  });

  it("keeps the AI modes and the one 'always on' line", () => {
    expect([AI_MODES.cloud.value, AI_MODES.onDevice.value]).toEqual(["Cloud AI", "On-device AI"]);
    expect(AI_MODES.onDeviceSummary.value.startsWith("Camera pictures and your voice stay on your phone.")).toBe(true);
    expect(SAFETY_SHIELD.value).toBe("Obstacle alerts are always on. This only sets how much fathom talks.");
  });

  it("pins the price and the trial", () => {
    expect(PAYWALL.price.value).toBe("$12.99");
    expect(PAYWALL.trial.value).toBe("7 days");
    expect(TRIAL_DAYS).toBe(7);
    expect(PAYWALL.offer.value).toBe(`${PAYWALL.trial.value} free, then ${PAYWALL.price.value} a month`);
    expect(v(PAYWALL.features)).toEqual(["Step-by-step plans", "Go", "Task", "Live mode"]);
  });

  it("splits the tiers the way FathomCapability does", () => {
    // FathomCapability.swift:89: the plus gate. Everything else is free.
    expect(PLUS_GATE.value).toBe("go, task, live_task, assistant, run_skill");
    expect(PLUS_CAPABILITIES.map((c) => c.id)).toEqual(PLUS_GATE.value.split(", "));
    expect(PLUS_CAPABILITIES.map((c) => c.name.value)).toEqual(["Go", "Task", "Live mode", "Step-by-step plans", "Skills"]);
    expect(FREE_CAPABILITIES.map((c) => c.id)).toEqual([
      "snapshot",
      "read_text",
      "lookout_start",
      "remember",
      "recall",
      "closer_look",
    ]);
    const plus = new Set(PLUS_CAPABILITIES.map((c) => c.id));
    for (const c of FREE_CAPABILITIES) expect(plus.has(c.id), c.id).toBe(false);
    // Every paywall feature is a plus capability; skills are plus but not on the paywall.
    const plusNames = PLUS_CAPABILITIES.map((c) => c.name.value);
    for (const feature of v(PAYWALL.features)) expect(plusNames).toContain(feature);
    // First-run starters are all free (StarterSuggestions.firstRunIsFreeTierOnly).
    expect(STARTERS.pool.slice(0, STARTERS.freeCount).map((f) => f.value)).toEqual(
      expect.arrayContaining(v(STARTERS.firstRun)),
    );
  });

  it("counts nine Siri shortcuts and names them", () => {
    expect(SHORTCUT_COUNT.value).toBe(9);
    expect(SHORTCUT_TITLES).toHaveLength(SHORTCUT_COUNT.value);
    expect(SHORTCUT_PHRASES.look.value).toBe("Look with fathom");
    expect(SHORTCUT_PHRASES.whereIs.value).toBe("fathom, where did I put it");
  });

  it("marks examples as examples, never as facts", () => {
    const walk = (node: unknown): void => {
      expect(isAppFact(node)).toBe(false);
      if (node && typeof node === "object") Object.values(node).forEach(walk);
    };
    walk(EXAMPLES);
    expect(EXAMPLES.laundry.plan.steps.map((s) => s.mode)).toEqual(["Go", "Task", "Look Now", "Task"]);
    expect(EXAMPLES.libraryLetter.items).toHaveLength(5);
    expect(fill(READOUT.counter, { n: EXAMPLES.libraryLetter.current, total: EXAMPLES.libraryLetter.items.length })).toBe(
      "2 of 5",
    );
  });
});
