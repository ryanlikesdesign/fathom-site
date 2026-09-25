import { describe, it, expect } from "vitest";
import { COPY_13 as COPY, EXAMPLES } from "@/lib/copy-13";
import {
  AI_MODES,
  APP_FACTS,
  CONSENT,
  MEMORY,
  MIN_IOS,
  PAYWALL,
  PLUS_CAPABILITIES,
  SHORTCUT_COUNT,
  TRIAL_DAYS,
  consentParagraphs,
  flattenFacts,
} from "@/lib/app-facts";
import {
  alwaysOnMisuse,
  isPhoneString,
  marketingViolations,
  phoneFacts,
  retiredTerms,
  stringsIn,
} from "./helpers/copy-rules";

/** Numbers the deck spells out. Extend when a new one is spelled. */
const SPELLED: Record<number, string> = { 7: "seven", 9: "nine" };

/** Every string in the deck, labeled by where it sits. */
function labeled(node: unknown, key = "COPY"): [string, string][] {
  if (typeof node === "string") return [[key, node]];
  if (Array.isArray(node)) return node.flatMap((child, i) => labeled(child, `${key}.${i}`));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, child]) => labeled(child, `${key}.${k}`));
  }
  return [];
}

const eyebrows = () => [
  COPY.hero.eyebrow,
  COPY.gap.eyebrow,
  ...COPY.steps.map((s) => s.eyebrow),
  COPY.safetyNet.eyebrow,
  COPY.download.eyebrow,
];

const allText = () => stringsIn(COPY).join("\n");

describe("the copy rules catch what they are for", () => {
  const rules = (text: string) => marketingViolations(text).map((v) => v.rule);

  it("flags each kind of mistake", () => {
    expect(rules("Fast — and clear.")).toContain("em dash");
    expect(rules("Pick a colour.")).toContain("British spelling");
    expect(rules("Travelling to the centre.")).toEqual(["British spelling", "British spelling"]);
    expect(rules("Fathom reads it.")).toContain("capitalized Fathom");
    expect(rules("FATHOM PLUS")).toContain("capitalized Fathom");
    expect(rules("Try Snapshot.")).toContain("retired term");
    expect(rules("Live Task is here.")).toContain("retired term");
    expect(rules("Free forever, unlimited.")).toEqual(["retired term", "retired term"]);
    expect(rules("It all stays on your phone.")).toContain("retired term");
    expect(rules("A second set of eyes.")).toContain("retired term");
    expect(rules("We guarantee it.")).toContain("retired term");
    expect(rules("Lookout is always on.")).toContain("always on");
    expect(rules("Live mode is in beta.")).toContain("beta");
    expect(rules("It's here.")).toContain("straight quote");
  });

  it("allows the exceptions", () => {
    expect(marketingViolations("Fathom: Visual Assistance")).toEqual([]);
    expect(marketingViolations("Open Subscriptions, choose Fathom and tap Cancel.")).toEqual([]);
    expect(marketingViolations("Obstacle alerts are always on.")).toEqual([]);
    expect(marketingViolations(AI_MODES.onDeviceSummary.value)).toEqual([]);
    expect(marketingViolations("A realistic organism.")).toEqual([]);
  });
});

describe("the 1.3 homepage deck follows the copy rules", () => {
  it.each(labeled(COPY))("%s", (_key, text) => {
    expect(marketingViolations(text)).toEqual([]);
  });

  it("never puts fathom in an eyebrow, which CSS uppercases", () => {
    for (const e of eyebrows()) expect(e).not.toMatch(/fathom/i);
  });

  it("says 'always on' only in the one obstacle-alert line", () => {
    const text = allText();
    expect(alwaysOnMisuse(text)).toEqual([]);
    expect(text.match(/always on/gi)).toHaveLength(1);
    expect(COPY.safetyNet.title[0]).toBe("Obstacle alerts are always on.");
  });

  it("quotes the On-device sentence whole, and nothing else says what stays on the phone", () => {
    const choice = COPY.steps.find((s) => s.slug === "your-choice");
    expect(choice?.body.join(" ")).toContain(AI_MODES.onDeviceSummary.value);
    expect(retiredTerms(allText())).toEqual([]);
  });

  it("keeps the claims the review corrected", () => {
    const text = allText();
    // Live mode opens the mic by itself after a question (LiveTaskActiveView.swift:352-355).
    expect(text).not.toMatch(/until you tap/i);
    expect(COPY.steps.find((s) => s.slug === "task-live")?.body.join(" ")).toMatch(/opens the mic after it asks/);
    // The checklist is fathom plus; free saves are spoken back.
    const memory = COPY.steps.find((s) => s.slug === "memory");
    expect(memory?.body.join(" ")).toMatch(/fathom plus shows you a checklist/);
    expect(memory?.whisper).toContain("fathom plus");
    // Memory sits under More options (AdvancedSettingsView.swift:327-332).
    expect(text).not.toMatch(/Settings under Memory/);
    expect(memory?.body.join(" ")).toContain("Settings, under More options, then Memory");
    // The composer has no one-tap camera; Look Now is behind More.
    expect(COPY.steps.find((s) => s.slug === "look-now")?.headline[0]).not.toMatch(/one tap/i);
  });

  it("uses serial commas in its lists", () => {
    const text = allText();
    for (const list of ["Lookout, Go, and tasks", "Arrived, and Listening", "Light, dark, and Contrast Boost"]) {
      expect(text).toContain(list);
    }
    expect(text).not.toMatch(/\bon the mat\b/);
  });

  it("never paraphrases what Google keeps", () => {
    // CloudConsentView.swift:88 says it once; the site links to the privacy page.
    const text = allText();
    expect(text).not.toMatch(/limited time|improve its products|misuse/i);
    expect(CONSENT.disclosure.value).toMatch(/limited time/);
  });
});

describe("the deck's shape", () => {
  it("has the hero line Ryan chose", () => {
    expect(COPY.hero.title.join(" ")).toBe("Visual assistance you can talk to.");
    expect(COPY.tagline).toBe("Visual assistance you can talk to.");
  });

  it("tells the story in exactly ten steps, in order", () => {
    expect(COPY.steps.map((s) => s.slug)).toEqual([
      "just-ask",
      "look-now",
      "read",
      "lookout",
      "memory",
      "go",
      "plans",
      "task-live",
      "skills",
      "your-choice",
    ]);
    expect(new Set(COPY.steps.map((s) => s.screen)).size).toBe(10);
    for (const s of COPY.steps) {
      expect(s.headline, s.slug).toHaveLength(2);
      expect(s.body.length, s.slug).toBeGreaterThan(0);
    }
  });

  it("marks the fathom plus steps the way the app gates them", () => {
    // FathomCapability.swift:89: go, task (and Live mode), plans, skills.
    expect(PLUS_CAPABILITIES.map((c) => c.id)).toEqual(["go", "task", "live_task", "assistant", "run_skill"]);
    expect(COPY.steps.filter((s) => s.tier === "plus").map((s) => s.slug)).toEqual([
      "go",
      "plans",
      "task-live",
      "skills",
    ]);
    for (const s of COPY.steps) {
      if (s.tier === "plus") expect(s.whisper, s.slug).toContain("fathom plus");
      else expect(s.whisper, s.slug).toMatch(/^Free\b/);
    }
  });

  it("uses only EXAMPLES strings as step examples", () => {
    const examples = new Set(stringsIn(EXAMPLES));
    for (const s of COPY.steps) if (s.example !== undefined) expect(examples.has(s.example), s.slug).toBe(true);
  });

  it("states the price, the trial and the plus features from the app", () => {
    const { plusLine, freeLine, metaLine, allowanceLine } = COPY.download;
    expect(plusLine).toContain(`${PAYWALL.price.value} a month after a ${SPELLED[TRIAL_DAYS]}-day free trial`);
    for (const feature of PAYWALL.features) expect(plusLine.toLowerCase()).toContain(feature.value.toLowerCase());
    expect(plusLine).toContain("skills");
    expect(plusLine.startsWith("fathom plus")).toBe(true);
    expect(freeLine).not.toMatch(/forever/);
    expect(metaLine).toBe(`Free · iPhone · iOS ${MIN_IOS.value}+`);
    // The app shows a percentage, never money or minutes.
    expect(allowanceLine).not.toMatch(/\d|\$/);
  });

  it("spells the shortcut count from the app", () => {
    const siri = COPY.dayToDay.cards.find((c) => c.title === "Siri and the Action Button");
    expect(siri?.body.toLowerCase()).toContain(`${SPELLED[SHORTCUT_COUNT.value]} siri shortcuts`);
    expect(COPY.dayToDay.cards).toHaveLength(4);
  });
});

describe("strings shown inside the phones follow the rules too", () => {
  it.each(flattenFacts(APP_FACTS).filter((f) => typeof f.value === "string").map((f) => [f.key, String(f.value)]))(
    "app fact %s",
    (_key, text) => {
      expect(marketingViolations(text)).toEqual([]);
    },
  );

  it.each(labeled(EXAMPLES, "EXAMPLES"))("%s", (_key, text) => {
    expect(marketingViolations(text)).toEqual([]);
  });

  it("recognizes app strings and examples", () => {
    for (const ok of [
      "2 of 5",
      "Take me to the laundry room",
      "It looks like you’ve reached the laundry room",
      "Heading to the laundry room…",
      "Did you arrive at the laundry room?",
      "3 of 3 checked. Uncheck anything that’s wrong.",
      "Remember these 2",
      "Run the laundry",
      "Step 2",
      "Kiosk",
      EXAMPLES.laundry.memories[0],
      EXAMPLES.laundry.skill.offer,
      ...consentParagraphs(),
    ]) {
      expect(isPhoneString(ok), ok).toBe(true);
    }
    expect(isPhoneString(MEMORY.title.value)).toBe(true);
  });

  it("rejects anything invented, even when it fits a pattern", () => {
    for (const invented of [
      "Ask Fathom",
      "Quick Scan",
      // Site copy, not app strings.
      "Most of the day asks you to look.",
      // Placeholders take only EXAMPLE_SLOTS values or digits.
      "Step into a world of zoom",
      "Take me to any building",
      "Run anything you like, no limits",
      "Heading to the moon…",
      "Remember these many",
      "Step two",
      // Code facts are never on screen.
      "3",
      "17",
      "1.3.0",
      "go, task, live_task, assistant, run_skill",
    ]) {
      expect(isPhoneString(invented), invented).toBe(false);
    }
  });

  it("leaves only code and spoken facts out of the phone", () => {
    const shown = new Set(phoneFacts().map((f) => f.key));
    const left = flattenFacts(APP_FACTS)
      .filter((f) => typeof f.value === "string" && !shown.has(f.key))
      .map((f) => f.key);
    expect(left).toEqual([
      "STARTERS.goToPlace",
      // A plural the app builds in code: the phone shows EXAMPLES.libraryLetter.summary.
      "READOUT.summary",
      "PLAN.readback",
      "SKILLS.offerAsk",
      "SKILLS.repeatsBeforeOffer",
      // The same, shown as EXAMPLES.laundry.skill.saved.
      "SKILLS.saved",
      "SAFETY.caution",
      "PAYWALL.price",
      "PAYWALL.trial",
      "PLUS_GATE",
      "MIN_IOS",
      "APP_VERSION",
      "APP_BUILD",
    ]);
  });
});
