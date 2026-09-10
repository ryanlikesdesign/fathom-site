/* ================================================================
   Every fact the homepage borrows from the app, and the copy it renders
   from here. What this file feeds the page, and nothing else:
     - the hero (eyebrow, title, lede, both buttons)
     - each feature step's eyebrow and whisper line, and the Point step's
       spoken example and body
     - the free and Plus sentences, and the download section
     - the app-derived labels and numbers (modes, Snapshot options, tab bar,
       active-mode controls, price, trial, shortcut count, minimum iOS)
   Step headings and bodies, and the phone mockups, live in
   FathomLanding.tsx. Every key here is rendered or asserted; a key nobody
   renders is a string the next editor changes for nothing.

   Single source of truth. The tests in test/landing-content.test.ts pin
   the app-derived values to their sources in project-homer, so the site
   cannot quietly drift into showing controls the app doesn't have, which
   is how every phone mockup ended up wrong last time.

   Short copy has no em dashes. Numbers only where the code supports them.
   ================================================================ */

export type Tier = "free" | "plus";

export interface Mode {
  name: "Snapshot" | "Lookout" | "Go" | "Task" | "Assistant";
  /** HomeView.swift tile subtitles */
  subtitle: string;
  tier: Tier;
}

/** HomeView.swift:290-381; Assistant is a top-level tab, FathomApp.swift:69 */
export const MODES: Mode[] = [
  { name: "Snapshot", subtitle: "Quick scan of your surroundings", tier: "free" },
  { name: "Lookout", subtitle: "Continuous awareness", tier: "free" },
  { name: "Go", subtitle: "Navigate to a destination", tier: "plus" },
  { name: "Task", subtitle: "Step-by-step guidance", tier: "plus" },
  { name: "Assistant", subtitle: "Tell it the goal", tier: "plus" },
];

/** HomeView.swift:268-274, in the app's order. */
export const SNAPSHOT_OPTIONS = [
  "Read text",
  "Identify object",
  "Ask about what's in view",
  "What am I pointing at",
  "Read a screen",
] as const;

/** FathomApp.swift:65-79 */
export const TAB_BAR = ["Home", "Assistant", "History", "Settings"] as const;

/** ActiveModeShell.swift:13-19, :298, :412. Every active mode uses exactly these. */
export const ACTIVE_MODE_CONTROLS = {
  primary: "Ask Fathom",
  end: "End",
  menu: "More actions",
} as const;

/**
 * HomeView.swift:378-386. Shown only with the live Task backend, and that
 * state also swaps the row subtitle to "Step-by-step • uses more AI budget";
 * the badge never sits beside "Step-by-step guidance". The Home mockup shows
 * the default backend, so this is pinned here but not rendered.
 */
export const LIVE_TASK_BADGE = "BETA";

/** PaywallView.swift:135; StoreKit trial P1W */
export const PLUS = { price: "$12.99", period: "month", trialDays: 7 } as const;

/** PLUS.trialDays spelled out, so the sentence reads as prose. Tested against the number. */
export const PLUS_TRIAL_LABEL = "seven-day";

/** The one Plus sentence, everywhere the price appears. */
export const PLUS_SENTENCE = `${PLUS.price} a ${PLUS.period} after a ${PLUS_TRIAL_LABEL} free trial`;

/** Intents/FathomShortcuts.swift: 8 AppShortcut entries */
export const SHORTCUT_COUNT = 8;

/** SHORTCUT_COUNT spelled out, sentence-initial. Tested against the number. */
export const SHORTCUT_WORD = "Eight";

/** project.pbxproj IPHONEOS_DEPLOYMENT_TARGET = 17.0 */
export const MIN_IOS = "17";

export const POINTING = {
  /**
   * FathomViewModel.swift:1856-1857 (haptic), :1381 (earcon);
   * SystemPrompts.swift:540-572 (answer in three beats).
   */
  sequence: ["haptic", "earcon", "thing", "words", "where it is and what's around it"] as const,
  /** FathomViewModel.swift:1821-1824 */
  handsFreeIn: ["Lookout", "Go"] as const,
  /** SnapshotIntent.swift:38 */
  firstCue: "Looking where you're pointing.",
  /** PointingIntroPrompt.swift:33-36 */
  intro: "Hold your arm out in front of the camera and point at anything for about a second.",
} as const;

export const COPY = {
  hero: {
    eyebrow: "Now on the App Store",
    /** First two parts share a line; the third is the accent line. */
    title: ["Walk in.", "Know the room.", "Do what you came for."],
    lede: "Fathom is an AI companion for blind and low-vision people. Most places were built without you in mind. Fathom tells you what's around you, walks you to where you're going, and works through the task with you. On your iPhone. No maps, no beacons, no setup.",
    primary: "Download on the App Store",
    secondary: "See what it does",
  },
  walkIn: {
    slug: "walk-in",
    eyebrow: "Lookout",
    whisper: "On-device object detection, several times a second. Works without a network.",
    tier: "free" as Tier,
  },
  // Two Go claims on the landing page are pinned here by source, not by text:
  // "down to where the door handle is": Config/SystemPrompts.swift, Go arrival
  // example ("Door handle is at about 3 o'clock"); "obstacle alerts pulse faster
  // as you approach": Features/Lookout/FathomViewModel.swift, proximity pulse
  // interval shortens from proximityPulseIntervalFar as wall distance drops.
  findIt: {
    slug: "find-it",
    eyebrow: "Go",
    whisper: "Turns are called about ten steps early. Shake when you've arrived.",
    tier: "plus" as Tier,
  },
  doIt: {
    slug: "do-it",
    eyebrow: "Task",
    whisper: "Live Task sends your camera and, while you hold the button, your voice. Fathom talks back. It's in beta, and the app says so.",
    tier: "plus" as Tier,
  },
  planIt: {
    slug: "plan-it",
    eyebrow: "Assistant",
    /** Shown on the active-session step, where the plan runs. */
    whisper: "End the session any time. Move on with a tap, or shake when a step is done.",
    tier: "plus" as Tier,
  },
  justPoint: {
    slug: "just-point",
    eyebrow: "Just point",
    body: "Point at anything. LiDAR on Pro models measures the distance to what you're pointing at; every recent iPhone gets the name, then the words on it, then where it is and what's around it.",
    beats: [
      "A vending machine.",
      "Buttons read: Water, Cola, Coffee. Coffee is sold out.",
      "Card reader on the right side, about three feet away.",
    ] as const,
    tier: "free" as Tier,
  },
  freeAndPlus: {
    slug: "free-and-plus",
    free: "Lookout, Snapshot, pointing and every safety alert are free forever.",
    plus: `Go, Task, Live Task and Assistant are Fathom Plus: ${PLUS_SENTENCE}.`,
  },
  download: {
    slug: "download",
    eyebrow: "On the App Store",
    title: "Download Fathom free.",
    lede: "No account. Nothing to set up.",
    button: "Download on the App Store",
    meta: `Free · iPhone · iOS ${MIN_IOS}+`,
  },
} as const;
