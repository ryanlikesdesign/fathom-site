/* ================================================================
   Everything the homepage says, and every fact it borrows from the app.

   Single source of truth. The tests in test/landing-content.test.ts pin
   the app-derived values to their sources in project-homer, so the site
   cannot quietly drift into showing controls the app doesn't have — which
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

/** HomeView.swift:380 */
export const LIVE_TASK_BADGE = "BETA";

/** PaywallView.swift:135; StoreKit trial P1W */
export const PLUS = { price: "$12.99", period: "month", trialDays: 7 } as const;

/** Intents/FathomShortcuts.swift — 8 AppShortcut entries */
export const SHORTCUT_COUNT = 8;

/** project.pbxproj IPHONEOS_DEPLOYMENT_TARGET = 17.0 */
export const MIN_IOS = "17";

export const POINTING = {
  /**
   * FathomViewModel.swift:1856-1857 (haptic), :1381 (earcon);
   * SystemPrompts.swift:540-572 (answer in three beats).
   */
  sequence: ["haptic", "earcon", "thing", "words", "rest"] as const,
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
    title: ["Walk in. Know the room.", "Do what you came for."],
    lede: "Fathom is an AI companion for blind and low-vision people. Most places were built without you in mind. Fathom tells you what's around you, walks you to where you're going, and works through the task with you. On your iPhone. No maps, no beacons, no setup.",
    primary: "Download on the App Store",
    secondary: "See what it does",
  },
  walkIn: {
    slug: "walk-in",
    eyebrow: "Walk in",
    title: "You walk in. Fathom keeps talking.",
    body: "Lookout narrates what's around you as it changes: doors, signs, people, the thing in your path. Obstacle alerts come through your phone as a tap in under 100 milliseconds, and they keep working with no signal at all.",
    captions: [
      "Glass doors ahead, opening.",
      "Reception desk at 11 o'clock, about 20 feet.",
      "Person approaching from your left.",
    ],
    tier: "free" as Tier,
  },
  // Two Go claims on the landing page are pinned here by source, not by text:
  // "down to where the door handle is" — Config/SystemPrompts.swift, Go arrival
  // example ("Door handle is at about 3 o'clock"); "obstacle alerts pulse faster
  // as you approach" — Features/Lookout/FathomViewModel.swift, proximity pulse
  // interval shortens from proximityPulseIntervalFar as wall distance drops.
  findIt: {
    slug: "find-it",
    eyebrow: "Find it",
    title: "Say where. Fathom walks you there.",
    body: "Directions on a clock face, in feet, updated as you move.",
    captions: [
      "The counter is at 2 o'clock, about 25 feet.",
      "Turn slightly right.",
      "Six feet. It's in front of you.",
    ],
    tier: "plus" as Tier,
  },
  doIt: {
    slug: "do-it",
    eyebrow: "Do it",
    title: "The form. The kiosk. The thing you came for.",
    body: "Task takes it one step at a time. Live Task adds push-to-talk voice, so you can ask mid-step. Live Task is in beta, and the app says so.",
    steps: ["Find the sign-in sheet", "Fill in your name and time", "Take a seat near the desk"],
    tier: "plus" as Tier,
  },
  planIt: {
    slug: "plan-it",
    eyebrow: "Plan it",
    title: "Tell it the goal. It makes the plan and runs it.",
    body: "Assistant turns a goal into steps and hands each one to the right mode.",
    goal: "Renew my library card",
    plan: ["Go to the front desk", "Ask what ID they need", "Task: fill in the renewal form"],
    tier: "plus" as Tier,
  },
  justPoint: {
    slug: "just-point",
    eyebrow: "Just point",
    title: "Point at anything. Fathom tells you what it is, then what it says.",
    body: "Hold a point for about a second. You feel a tap, hear the earcon, and get the answer in three parts: the thing in a few words, any words on it read exactly, then the rest. LiDAR measures the distance to what you're pointing at, so it describes what is there instead of guessing. Sweep to something else to hear about that too.",
    where: "Hands-free in Lookout and Go. From the Snapshot menu anywhere.",
    beats: [
      "A vending machine.",
      "Buttons read: Water, Cola, Coffee. Coffee is sold out.",
      "Card reader on the right side, about three feet away.",
    ] as const,
    snapshotIntro: "Snapshot's other options, by name.",
    tier: "free" as Tier,
  },
  underTheHood: {
    slug: "under-the-hood",
    title: "Under the hood",
    items: [
      { term: "On-device detection", detail: "Objects are found on your phone, up to ten times a second." },
      { term: "LiDAR depth", detail: "Distances are measured, not estimated." },
      { term: "Haptics under 100 ms", detail: "An alert reaches you before a sentence could." },
      { term: "Earcons left and right", detail: "A sound from the side something is on." },
      { term: "Works offline", detail: "Safety alerts never need a connection." },
      { term: "Ask by voice, Siri or the Action button", detail: "Eight shortcuts ship with the app." },
      { term: "Nothing sold", detail: "Images are processed, then discarded. We do not sell your data." },
    ],
  },
  freeAndPlus: {
    slug: "free-and-plus",
    title: "Free, and Plus",
    free: "Lookout, Snapshot, pointing and every safety alert are free forever.",
    plus: "Go, Task, Live Task and Assistant are Fathom Plus: $12.99 a month after a seven-day free trial.",
    note: "No account needed.",
  },
  download: {
    slug: "download",
    title: "Get Fathom",
    button: "Download on the App Store",
    meta: "Free · iPhone · iOS 17+",
  },
} as const;
