import { describe, it, expect } from "vitest";
import {
  ACTIVE_MODE_CONTROLS,
  COPY,
  LIVE_TASK_BADGE,
  MIN_IOS,
  MODES,
  PLUS,
  POINTING,
  SHORTCUT_COUNT,
  SNAPSHOT_OPTIONS,
  TAB_BAR,
} from "@/lib/landing-content";

// Every expected value below is copied from project-homer with its source, so
// this suite is the contract that stops the site drifting from the app again.
describe("landing content matches the app", () => {
  it("names the five modes the app has", () => {
    expect(MODES.map((m) => m.name)).toEqual(["Snapshot", "Lookout", "Go", "Task", "Assistant"]);
  });

  it("lists the Snapshot options in the app's order", () => {
    // HomeView.swift:268-274
    expect([...SNAPSHOT_OPTIONS]).toEqual([
      "Read text",
      "Identify object",
      "Ask about what's in view",
      "What am I pointing at",
      "Read a screen",
    ]);
  });

  it("uses the app's tab bar", () => {
    // FathomApp.swift:65-79
    expect([...TAB_BAR]).toEqual(["Home", "Assistant", "History", "Settings"]);
  });

  it("uses the app's active-mode controls and nothing invented", () => {
    // ActiveModeShell.swift:13-19, :298, :412
    expect(ACTIVE_MODE_CONTROLS).toEqual({ primary: "Ask Fathom", end: "End", menu: "More actions" });
    expect(LIVE_TASK_BADGE).toBe("BETA"); // HomeView.swift:380
  });

  it("gates exactly the Plus modes", () => {
    // SubscriptionStatus.swift:21-27; Task covers Task and Live Task
    expect(MODES.filter((m) => m.tier === "plus").map((m) => m.name)).toEqual(["Go", "Task", "Assistant"]);
    expect(PLUS.price).toBe("$12.99"); // PaywallView.swift:135
    expect(PLUS.trialDays).toBe(7);
    expect(COPY.freeAndPlus.plus).toContain("$12.99");
  });

  it("describes pointing in the app's order and only where it runs hands-free", () => {
    // FathomViewModel.swift:1856-1857, :1381; SystemPrompts.swift:540-572
    expect([...POINTING.sequence]).toEqual(["haptic", "earcon", "thing", "words", "rest"]);
    // FathomViewModel.swift:1821-1824
    expect([...POINTING.handsFreeIn]).toEqual(["Lookout", "Go"]);
    expect(COPY.justPoint.beats).toHaveLength(3);
  });

  it("keeps the other numbers honest", () => {
    expect(SHORTCUT_COUNT).toBe(8); // Intents/FathomShortcuts.swift
    expect(MIN_IOS).toBe("17"); // project.pbxproj IPHONEOS_DEPLOYMENT_TARGET
    expect(COPY.download.meta).toContain(`iOS ${MIN_IOS}+`);
  });

  it("uses no em dashes in short copy", () => {
    const short = [
      ...COPY.hero.title,
      COPY.walkIn.title,
      COPY.findIt.title,
      COPY.doIt.title,
      COPY.planIt.title,
      COPY.justPoint.title,
      COPY.freeAndPlus.free,
      COPY.freeAndPlus.plus,
      COPY.download.button,
    ];
    for (const s of short) expect(s).not.toMatch(/—/);
  });
});
