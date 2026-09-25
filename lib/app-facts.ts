/* ================================================================
   App facts: every string the homepage borrows from the fathom app.

   Each fact is { value, path, line }. `path` is relative to the root of
   the app repo and `line` is 1-based, both at APP_SOURCE.commit. The
   value is the string as the app draws it: curly apostrophes and quotes,
   the real ellipsis, and the app's own casing. Anything uppercase on the
   site comes from CSS, never from a value here.

   `{name}` in a value marks a runtime value the app fills in ("{n} of
   {total}"); `fill()` renders one. The checker wants each value as a
   whole string literal, or whole sentences of one. `source` is set only
   when that can't hold: the value is derived from code (MIN_IOS), or is a
   piece of a longer literal (the price inside the offer line). The
   checker then looks for `source` instead, anywhere in the window.
   `countOf` makes a number checkable: the checker counts that literal in
   the file. A fact with `source` or `countOf` is never matched as a phone
   string; mockups show it through an EXAMPLES string instead.

   `scripts/check-app-facts.mjs` re-reads every fact with `git show` at a
   given SHA, so a fact can never be pinned to uncommitted work. It reads
   `lib/app-facts.sources.json`, which test/app-facts.test.ts keeps in sync
   with this file. After editing a fact, regenerate the JSON with
     WRITE_APP_FACTS=1 npx vitest run test/app-facts.test.ts
   then run `node scripts/check-app-facts.mjs`.

   EXAMPLES at the bottom are illustrative, not app facts: the site's own
   sample content (the laundry thread, the library letter, oat milk), shown
   inside phone mockups where the app would show the user's own things.
   ================================================================ */

export interface AppFact<T extends string | number = string> {
  /** The string as the app renders it. `{name}` marks a runtime value. */
  readonly value: T;
  /** Path from the app repo root, at APP_SOURCE.commit. */
  readonly path: string;
  /** 1-based line at APP_SOURCE.commit. The checker allows +/-3 lines. */
  readonly line: number;
  /** When the value is derived from code or is part of a longer literal: the source text to look for. */
  readonly source?: string;
  /** For a count: the literal whose occurrences in the file must equal `value`. */
  readonly countOf?: string;
}

function fact(value: string, path: string, line: number, source?: string): AppFact {
  return source === undefined ? { value, path, line } : { value, path, line, source };
}

/** The app build every fact is pinned to. */
export const APP_SOURCE = {
  repo: "ryanlikesdesign/homer",
  checkout: "device-test",
  commit: "ba8e462",
  version: "1.3.0 (17)",
} as const;

// Paths, from the app repo root.
const F = "Fathom/Fathom";
const PBXPROJ = "Fathom/Fathom.xcodeproj/project.pbxproj";
const STAGE_MODEL = `${F}/Features/Conversation/ConversationStageModel.swift`;
const STAGE_VIEW = `${F}/UI/Components/ConversationStage.swift`;
const FOOTER = `${F}/UI/Components/AssistantFooterControls.swift`;
const STARTERS_SRC = `${F}/Features/Conversation/StarterSuggestions.swift`;
const CONTROLLER = `${F}/Features/Conversation/ConversationController.swift`;
const SUGGESTION_ROW = `${F}/UI/Components/SuggestionRow.swift`;
const ADD_SHEET = `${F}/UI/Components/AssistantAddSheet.swift`;
const SNAPSHOT_ITEMS = `${F}/Features/Snapshot/SnapshotIntentItem.swift`;
const SHEET_CHROME = `${F}/FathomUI/Components/FathomSheetChrome.swift`;
const READOUT_BAR = `${F}/FathomUI/Components/ReadoutPlaybackBar.swift`;
const TRANSCRIPT = `${F}/UI/Components/TranscriptView.swift`;
const ACTIVITY_KIND = `${F}/Features/Conversation/TranscriptEntry.swift`;
const PAUSE_RULE = `${F}/Features/Conversation/ActivityPauseRule.swift`;
const LOOKOUT_VIEW = `${F}/UI/Screens/LookoutActiveView.swift`;
const SIDE_SHEET = `${F}/UI/Components/AssistantSideSheet.swift`;
const AWARENESS = `${F}/Config/AwarenessLevel.swift`;
const POINTING_INTRO = `${F}/UI/Components/PointingIntroPrompt.swift`;
const GO_VIEW = `${F}/UI/Screens/GoActiveView.swift`;
const CONVERSATION_SCREEN = `${F}/UI/Screens/ConversationScreen.swift`;
const PLAN_CARD = `${F}/UI/Components/AssistantPlanCard.swift`;
const ASSISTANT_ENUMS = `${F}/Models/AssistantEnums.swift`;
const LIVE_VIEW = `${F}/UI/Screens/LiveTaskActiveView.swift`;
const ADVANCED_SETTINGS = `${F}/UI/Screens/AdvancedSettingsView.swift`;
const WRITEBACK = `${F}/UI/Screens/LiveTaskWritebackView.swift`;
const MEMORY_LIST = `${F}/UI/Screens/MemoryReviewList.swift`;
const ROUTINE_OFFER = `${F}/Features/Skills/RoutineOffer.swift`;
const ROUTINE_DETECTOR = `${F}/Features/Skills/RoutineDetector.swift`;
const SKILLS_LIST = `${F}/UI/Screens/SkillsListView.swift`;
const CONSENT_VIEW = `${F}/UI/Screens/CloudConsentView.swift`;
const PRESET = `${F}/Config/SettingsPreset.swift`;
const PAYWALL_VIEW = `${F}/UI/Screens/PaywallView.swift`;
const CAPABILITY = `${F}/Capabilities/FathomCapability.swift`;
const SHORTCUTS_SRC = `${F}/Intents/FathomShortcuts.swift`;
const ONBOARDING = `${F}/Data/OnboardingContent.swift`;
const PROFILE_SETUP = `${F}/Features/Onboarding/ProfileSetupView.swift`;
const ANSWER_LANGUAGE = `${F}/UI/Screens/AnswerLanguageView.swift`;
const VOICE_ROW = `${F}/UI/Components/NarrationVoiceRow.swift`;
const CONVERSATION_TOOLS = `${F}/Features/Conversation/ConversationTools.swift`;
const AUDIO_SERVICE = `${F}/Services/Audio/AudioService.swift`;
const TERMS_VIEW = `${F}/UI/Screens/TermsOfServiceView.swift`;
const SPLASH = `${F}/UI/Screens/SplashView.swift`;
const ORCHESTRATOR = `${F}/Features/Assistant/AssistantOrchestrator.swift`;
const READOUT_DOC = `${F}/Features/Snapshot/ReadoutDocument.swift`;
const DIRECT_SKILL = `${F}/Features/Skills/DirectSkillCommands.swift`;

/* ---------------------------------------------------------------- *
 * The conversation screen
 * ---------------------------------------------------------------- */

/**
 * The stage above the orb. `eyebrow` is drawn only when the state has a
 * second line (ConversationStage.swift:161); Thinking and Speaking show
 * their one word as the headline.
 */
export const STAGE = {
  idle: {
    eyebrow: fact("Ready", STAGE_MODEL, 195),
    headline: fact("Ask by voice, type, or tap More to look now.", STAGE_MODEL, 196),
  },
  listening: {
    eyebrow: fact("Listening", STAGE_MODEL, 92),
    headline: fact("Tap again to send", STAGE_MODEL, 98),
  },
  thinking: {
    headline: fact("Thinking", STAGE_MODEL, 121),
  },
  speaking: {
    headline: fact("Speaking", STAGE_MODEL, 145),
    subline: fact("Tap anywhere to stop", STAGE_VIEW, 171),
  },
  notConnected: {
    eyebrow: fact("Not connected", STAGE_MODEL, 169),
    headline: fact("Obstacle alerts still work. Ask again to retry.", STAGE_MODEL, 170),
  },
  noCamera: {
    eyebrow: fact("No camera", STAGE_MODEL, 188),
    headline: fact("fathom can’t see. Check nothing is covering the lens.", STAGE_MODEL, 189),
  },
  /** A paused activity: the headline is that activity's pause line (ACTIVITY.paused). */
  paused: {
    eyebrow: fact("Paused", STAGE_MODEL, 113),
  },
} as const;

/** The composer row: Type, the mic, More; then the session row below it. */
export const COMPOSER = {
  type: fact("Type", FOOTER, 126),
  /** The mic's accessibility name. The mic is a glyph; this word is never drawn. */
  speak: fact("Speak", FOOTER, 417),
  more: fact("More", FOOTER, 138),
  pause: fact("Pause", FOOTER, 554),
  resume: fact("Resume", FOOTER, 555),
  /** The paused mic becomes a square with this word. */
  end: fact("End", FOOTER, 463),
} as const;

/** The welcome tour's card for talking. */
export const TALK = fact(
  "Say what you need and fathom answers. Ask it to start Lookout or read a sign, and it does that instead of telling you where to tap.",
  ONBOARDING,
  42,
);

/** Suggestion rows. First run always shows `firstRun`, in this order. */
export const STARTERS = {
  firstRun: [
    fact("Describe what’s around me", STARTERS_SRC, 108),
    fact("Watch for obstacles", STARTERS_SRC, 109),
    fact("Read this text", STARTERS_SRC, 110),
  ],
  /** Every starter the picker chooses from: five free, then four fathom plus. */
  pool: [
    fact("Describe what’s around me", STARTERS_SRC, 92),
    fact("Read this text", STARTERS_SRC, 93),
    fact("Watch for obstacles", STARTERS_SRC, 94),
    fact("Where did I leave my keys?", STARTERS_SRC, 95),
    fact("Remember where this is", STARTERS_SRC, 96),
    fact("Take me somewhere", STARTERS_SRC, 98),
    fact("Help me with a few steps", STARTERS_SRC, 99),
    fact("Walk me through something", STARTERS_SRC, 100),
    fact("Stay with me while I do this", STARTERS_SRC, 101),
  ],
  /** How many of `pool` are free; the rest are fathom plus. */
  freeCount: 5,
  /** The Go row once a place is known. "to" comes from PoseHint.to. */
  goToPlace: fact("Take me to {place}", STARTERS_SRC, 190, "Take me {place}"),
  /** A saved skill's row, on top for fathom plus users with skills. */
  runSkill: fact("Run {skill}", CONTROLLER, 1345),
  /** The badge on a fathom plus row. A badge, never a sentence. */
  plusBadge: fact("Plus", SUGGESTION_ROW, 243),
} as const;

/** The More sheet's Look Now section, rows in the app's order. */
export const LOOK_NOW = {
  title: fact("More ways to start", ADD_SHEET, 142),
  close: fact("Close", SHEET_CHROME, 107),
  section: fact("Look Now", ADD_SHEET, 92),
  rows: [
    {
      title: fact("Describe what’s around me", ADD_SHEET, 233),
      detail: fact("One scan of the whole scene", ADD_SHEET, 237),
    },
    {
      title: fact("Read text", SNAPSHOT_ITEMS, 24),
      detail: fact("Labels, mail, signs, read word for word", ADD_SHEET, 242),
    },
    {
      title: fact("What is this?", SNAPSHOT_ITEMS, 25),
      detail: fact("Identify one thing you’re holding", ADD_SHEET, 243),
    },
    {
      title: fact("Read a screen", SNAPSHOT_ITEMS, 28),
      detail: fact("A kiosk, ATM, monitor or appliance panel", ADD_SHEET, 244),
    },
    {
      title: fact("What am I pointing at?", SNAPSHOT_ITEMS, 27),
      detail: fact("Point a finger and I’ll name it", ADD_SHEET, 245),
    },
    {
      title: fact("Take a closer look", SNAPSHOT_ITEMS, 31),
      detail: fact("A fresh picture and a more careful look", ADD_SHEET, 252),
    },
  ],
  /** The Saved section under it, shown while nothing runs (AssistantAddSheet.swift:107-121). */
  saved: {
    section: fact("Saved", ADD_SHEET, 120),
    rows: [
      {
        title: fact("Saved tasks", ADD_SHEET, 110),
        detail: fact("Pick a task you’ve saved before", ADD_SHEET, 111),
      },
      {
        title: fact("Saved places", ADD_SHEET, 112),
        detail: fact("Go to a place you’ve named", ADD_SHEET, 113),
      },
      {
        title: fact("Run a past session again", ADD_SHEET, 115),
        detail: fact("Repeat something you did before", ADD_SHEET, 116),
      },
    ],
  },
} as const;

/** A long answer read as a document, and the transcript line above it. */
export const READOUT = {
  /** The overline on a Look Now answer in the transcript. */
  overline: fact("Look Now", TRANSCRIPT, 181),
  /**
   * The Look Now turn's one line for a readout, spoken and written to the
   * transcript; the text itself is not (ConversationScreen.swift:2019-2027).
   * `{plural}` is "s" unless there is one item. Mockups show
   * EXAMPLES.libraryLetter.summary.
   */
  summary: fact("{type}. {n} item{plural}.", READOUT_DOC, 71),
  /** The summary's `{type}` for a letter (ReadoutContentType.document). */
  documentType: fact("Document", READOUT_DOC, 32),
  counter: fact("{n} of {total}", READOUT_BAR, 107),
  paused: fact("Paused", READOUT_BAR, 114),
  previous: fact("Previous item", FOOTER, 494),
  pause: fact("Pause", FOOTER, 501),
  next: fact("Next item", FOOTER, 515),
  repeat: fact("Repeat item", READOUT_BAR, 79),
  showText: fact("Show text", READOUT_BAR, 82),
  askAbout: fact("Ask fathom about this", READOUT_BAR, 154),
} as const;

/** The empty transcript. */
export const TRANSCRIPT_EMPTY = fact(
  "Tap the microphone and tell me what you need, or tap More to hear what’s around you.",
  TRANSCRIPT,
  79,
);

/* ---------------------------------------------------------------- *
 * Activities: Lookout, Go, Task, plans
 * ---------------------------------------------------------------- */

/** The stage while an activity runs: its title as the eyebrow, "Running" below. */
export const ACTIVITY = {
  running: fact("Running", STAGE_MODEL, 138),
  titles: {
    lookout: fact("Lookout", ACTIVITY_KIND, 24),
    go: fact("Go", ACTIVITY_KIND, 25),
    /** Task, with or without Live mode: one name. */
    task: fact("Task", ACTIVITY_KIND, 33),
    /** A running step-by-step plan. */
    plan: fact("Assistant", ACTIVITY_KIND, 41),
  },
  /** Spoken when a session is paused, and shown as the stage headline. */
  paused: {
    lookout: fact("Lookout paused. Obstacle alerts stay on.", PAUSE_RULE, 59),
    go: fact("Go paused. Obstacle alerts stay on.", PAUSE_RULE, 60),
    task: fact("Task paused. Obstacle alerts stay on.", PAUSE_RULE, 66),
  },
} as const;

export const LOOKOUT = {
  status: fact("Listening…", LOOKOUT_VIEW, 153),
  /** The menu sheet's switch, and its subtitle when on. */
  switchTitle: fact("Lookout", SIDE_SHEET, 283),
  switchOn: fact("Continuous narration. fathom talks without being asked.", SIDE_SHEET, 287),
  levels: [
    fact("Hazards Only", AWARENESS, 45),
    fact("Balanced", AWARENESS, 46),
    fact("Full Awareness", AWARENESS, 47),
  ],
  /** The welcome tour's Lookout card. */
  about: fact(
    "Continuous narration. It keeps describing your surroundings while you move, with obstacle alerts as you go.",
    ONBOARDING,
    44,
  ),
  /** Point to Ask's intro, first sentence. */
  pointingIntro: fact(
    "Hold your arm out in front of the camera and point at anything for about a second, and fathom tells you what it is.",
    POINTING_INTRO,
    37,
  ),
} as const;

export const GO = {
  gettingClose: fact("Getting close", GO_VIEW, 287),
  almostThere: fact("Almost there", GO_VIEW, 287),
  heading: fact("Heading to {destination}…", GO_VIEW, 322),
  /** A text button under the guidance; it asks the arrival question, as a shake does. */
  arrivedButton: fact("I’ve arrived", GO_VIEW, 344),
  shakeHint: fact("or shake your phone", GO_VIEW, 357),
  /** Go never says you arrived. It says it looks like it, and asks. */
  arrival: fact("It looks like you’ve reached {destination}", GO_VIEW, 409),
  arrivalQuestion: fact("Did you arrive at {destination}?", GO_VIEW, 61),
  yes: fact("Yes, finished", GO_VIEW, 71),
  notYet: fact("Not yet", GO_VIEW, 75),
  /** The dialog's own Cancel, which decides nothing (GoActiveView.swift:76-79). */
  cancel: fact("Cancel", GO_VIEW, 76),
  arrived: fact("You’re here.", GO_VIEW, 453),
  backToConversation: fact("Back to the conversation…", GO_VIEW, 462),
  savedPlaces: {
    title: fact("Saved places", ADD_SHEET, 112),
    detail: fact("Go to a place you’ve named", ADD_SHEET, 113),
  },
} as const;

/** A step-by-step plan, before it starts. */
export const PLAN = {
  /** The paywall's line for plans. */
  pitch: fact(
    "Tell fathom the whole job, like getting checked in and finding your gate, and it builds the steps and guides you through them.",
    PAYWALL_VIEW,
    102,
  ),
  /** Spoken when the plan appears, before anything starts. */
  readback: fact(
    "Here is the plan, {n} {steps}. {itinerary} Start it, or tell me what to change.",
    ORCHESTRATOR,
    672,
  ),
  title: fact("Your plan", CONVERSATION_SCREEN, 1087),
  accept: fact("Accept plan", PLAN_CARD, 139),
  edit: fact("Edit", PLAN_CARD, 155),
  dismiss: fact("Dismiss", PLAN_CARD, 163),
  /** The More sheet row while a plan runs. */
  change: fact("Change the plan", ADD_SHEET, 98),
  changeDetail: fact("Hold here and fix the steps", ADD_SHEET, 99),
  /** The mode line under each step. */
  stepModes: {
    lookNow: fact("Look Now", ASSISTANT_ENUMS, 20),
    lookout: fact("Lookout", ASSISTANT_ENUMS, 21),
    go: fact("Go", ASSISTANT_ENUMS, 22),
    task: fact("Task", ASSISTANT_ENUMS, 23),
    kiosk: fact("Kiosk", ASSISTANT_ENUMS, 24),
  },
} as const;

/** Task, the paywall's line for it. */
export const TASK = {
  pitch: fact(
    "Hands-on help. Work through anything step by step, from finding a gate to using a kiosk, with the camera as your guide.",
    PAYWALL_VIEW,
    112,
  ),
} as const;

/** Task with Live mode on. */
export const LIVE = {
  mode: fact("Live mode", ADVANCED_SETTINGS, 205),
  /** The paywall's line for Live mode. */
  pitch: fact(
    "Talk it through. Turn any task into a continuous conversation. fathom watches, listens, and answers in the moment instead of waiting between steps.",
    PAYWALL_VIEW,
    117,
  ),
  /** Until a tap opens the mic. Never "Listening" before it is. */
  micOff: fact("Microphone off", LIVE_VIEW, 360),
  listening: fact("Listening…", LIVE_VIEW, 354),
  sending: fact("Sending…", LIVE_VIEW, 354),
  step: fact("Step {n}", LIVE_VIEW, 198),
} as const;

/* ---------------------------------------------------------------- *
 * Memory and skills
 * ---------------------------------------------------------------- */

export const MEMORY = {
  title: fact("Remember these?", WRITEBACK, 99),
  subtitle: fact("{checked} of {total} checked. Uncheck anything that’s wrong.", WRITEBACK, 49),
  uncheckAll: fact("Uncheck all", WRITEBACK, 132),
  checkAll: fact("Check all", WRITEBACK, 132),
  rememberN: fact("Remember these {n}", WRITEBACK, 59),
  rememberOne: fact("Remember this one", WRITEBACK, 58),
  noThanks: fact("No thanks", WRITEBACK, 176),
  empty: fact("fathom asks before saving anything. What it saves shows up here.", MEMORY_LIST, 209),
} as const;

export const SKILLS = {
  /** Said after a routine repeats. `{times}` is "the third time". */
  offer: fact(
    "That’s {times} you’ve done {subject}. Want me to save it as a skill so you can just say run {subject}?",
    ROUTINE_OFFER,
    39,
  ),
  third: fact("the third time", ROUTINE_OFFER, 50),
  /**
   * Said right after the offer, in the same utterance
   * (AssistantOrchestrator.swift:1264): `RoutineOffer.line(...) + " Say save…"`.
   * Part of a concatenation, so the checker looks for `source`.
   */
  offerAsk: fact(
    "Say save this as a skill and I’ll keep it.",
    ORCHESTRATOR,
    1264,
    "Say save this as a skill and I'll keep it.",
  ),
  /** How many repeats before the offer. */
  repeatsBeforeOffer: fact("3", ROUTINE_DETECTOR, 92, "static let repeatsBeforeOffering = 3"),
  listTitle: fact("Skills", SKILLS_LIST, 60),
  empty: fact("No skills yet", SKILLS_LIST, 88),
  howTo: fact("Run a task with fathom, then say “save this as a skill”.", SKILLS_LIST, 92),
  run: fact("Run", SKILLS_LIST, 147),
  /** The suggestion row for a saved skill (same fact as STARTERS.runSkill). */
  row: fact("Run {skill}", CONTROLLER, 1345),
  /**
   * The answer to "save this as a skill", written to the transcript
   * (ConversationController.swift:815-829). `{plural}` is "s" unless there
   * is one step. Mockups show EXAMPLES.laundry.skill.saved.
   */
  saved: fact("Saved {skill}, {n} step{plural}. Say run {skill} any time.", DIRECT_SKILL, 165),
} as const;

/* ---------------------------------------------------------------- *
 * Privacy, AI modes and the safety net
 * ---------------------------------------------------------------- */

/** The Cloud AI consent pop-up. Quoted, never paraphrased. */
export const CONSENT = {
  title: fact("Allow cloud AI?", CONSENT_VIEW, 61),
  subtitle: fact("fathom uses cloud AI to describe what it sees", CONSENT_VIEW, 66),
  disclosure: fact(
    "To do that, it sends pictures from your camera to Google’s Gemini AI. It also sends what you’ve told fathom about yourself and what it remembers for you, including whether you’re at home and which room you’re in. What you say is turned into text on your phone, and only the text is sent. In Live mode, your voice is sent too, while the microphone is on. Google uses this to answer you, and doesn’t use it to improve its products. Google keeps it for a limited time, only to check for misuse. Obstacle alerts run on your phone and never use the cloud. You can switch to On-device AI in Settings any time.",
    CONSENT_VIEW,
    88,
  ),
  allow: fact("Allow cloud AI", CONSENT_VIEW, 119),
  decline: fact("Keep fathom on-device", CONSENT_VIEW, 120),
  readAloud: fact("Read it to me", CONSENT_VIEW, 129),
  privacyPolicy: fact("Read the full Privacy Policy", CONSENT_VIEW, 148),
} as const;

/**
 * The disclosure as the pop-up draws it: three paragraphs, split before
 * "Google uses this" and "Obstacle alerts run" (CloudConsentView.swift:94-104).
 */
export function consentParagraphs(text: string = CONSENT.disclosure.value): string[] {
  const out: string[] = [];
  let rest = text;
  for (const start of ["Google uses this", "Obstacle alerts run"]) {
    const at = rest.indexOf(start);
    if (at < 0) continue;
    out.push(rest.slice(0, at).trim());
    rest = rest.slice(at);
  }
  out.push(rest);
  return out;
}

export const AI_MODES = {
  cloud: fact("Cloud AI", PRESET, 32),
  onDevice: fact("On-device AI", PRESET, 33),
  cloudSummary: fact(
    "Richer descriptions from Google Gemini. Sends camera pictures, the text of what you say, and what fathom remembers about you to Google. In Live mode, your voice is sent too, while the microphone is on. Needs internet.",
    PRESET,
    46,
  ),
  /** The only sentence on the site allowed to say what stays on your phone. */
  onDeviceSummary: fact(
    "Camera pictures and your voice stay on your phone. Obstacle alerts and reading text work on every iPhone. On iOS 27 with Apple Intelligence, Look Now can also describe what is around you.",
    PRESET,
    69,
  ),
} as const;

/** The only place "always on" appears. */
export const SAFETY_SHIELD = fact(
  "Obstacle alerts are always on. This only sets how much fathom talks.",
  SIDE_SHEET,
  306,
);

export const SAFETY = {
  /** The app's own caution, without its "Remember," lead. */
  caution: fact(
    "fathom uses AI and it can make mistakes.",
    AUDIO_SERVICE,
    2715,
    "\"Remember, fathom uses AI and it can make mistakes.\"",
  ),
  keepYourAids: fact(
    "Always use your cane, guide dog, sighted guide, or other established mobility tools as your primary source of awareness.",
    TERMS_VIEW,
    148,
  ),
  onPhone: fact("Obstacle alerts run on your phone and never use the cloud.", CONSENT_VIEW, 88),
  /** The monthly Cloud AI limit. */
  pastAllowance: fact("Obstacle alerts still work, and it resets next month.", CONVERSATION_TOOLS, 48),
  /** Talking needs Cloud AI. */
  cloudOffAnswer: fact("I can’t answer questions with Cloud AI off.", CONVERSATION_TOOLS, 71),
} as const;

/* ---------------------------------------------------------------- *
 * Tiers and price
 * ---------------------------------------------------------------- */

export const PAYWALL = {
  title: fact("fathom plus", PAYWALL_VIEW, 72),
  features: [
    fact("Step-by-step plans", PAYWALL_VIEW, 101),
    fact("Go", PAYWALL_VIEW, 106),
    fact("Task", PAYWALL_VIEW, 111),
    fact("Live mode", PAYWALL_VIEW, 116),
  ],
  safetyNet: {
    title: fact("Your safety net is always free", PAYWALL_VIEW, 127),
    detail: fact(
      "On-device obstacle haptics, step and drop-off alerts, and object detection never need a subscription.",
      PAYWALL_VIEW,
      128,
    ),
  },
  offer: fact("7 days free, then $12.99 a month", PAYWALL_VIEW, 136),
  /** Both read from the offer line above. */
  price: fact("$12.99", PAYWALL_VIEW, 136, "\"7 days free, then $12.99 a month\""),
  trial: fact("7 days", PAYWALL_VIEW, 136, "\"7 days free, then $12.99 a month\""),
} as const;

/** The trial length as a number, from PAYWALL.trial. */
export const TRIAL_DAYS = Number.parseInt(PAYWALL.trial.value, 10);

export interface Capability {
  /** The capability's id in the app (FathomCapability raw value). */
  readonly id: string;
  /** What the site calls it, from the app's own user-facing name. */
  readonly name: AppFact;
}

/** The fathom plus gate: `case .go, .task, .liveTask, .assistant, .runSkill: return .plus`. */
export const PLUS_GATE = fact(
  "go, task, live_task, assistant, run_skill",
  CAPABILITY,
  89,
  ".go, .task, .liveTask, .assistant, .runSkill: return .plus",
);

/** Everything the gate covers. Live mode is the live_task engine. */
export const PLUS_CAPABILITIES: readonly Capability[] = [
  { id: "go", name: fact("Go", CAPABILITY, 104) },
  { id: "task", name: fact("Task", CAPABILITY, 105) },
  { id: "live_task", name: fact("Live mode", PAYWALL_VIEW, 116) },
  { id: "assistant", name: fact("Step-by-step plans", PAYWALL_VIEW, 101) },
  { id: "run_skill", name: fact("Skills", SKILLS_LIST, 60) },
];

/** The free capabilities a person can ask for (`default: return .free`). Talking itself is free too. */
export const FREE_CAPABILITIES: readonly Capability[] = [
  { id: "snapshot", name: fact("Look Now", CAPABILITY, 100) },
  { id: "read_text", name: fact("Read text", CAPABILITY, 103) },
  { id: "lookout_start", name: fact("Lookout", CAPABILITY, 101) },
  { id: "remember", name: fact("Remember", CAPABILITY, 130) },
  { id: "recall", name: fact("Recall", CAPABILITY, 131) },
  { id: "closer_look", name: fact("Take a closer look", CAPABILITY, 137) },
];

/* ---------------------------------------------------------------- *
 * Siri, setup, language
 * ---------------------------------------------------------------- */

/** One entry per AppShortcut, by its short title, in the app's order. */
export const SHORTCUT_TITLES = [
  fact("Look Now", SHORTCUTS_SRC, 43),
  fact("Lookout", SHORTCUTS_SRC, 56),
  fact("Read", SHORTCUTS_SRC, 75),
  fact("Go", SHORTCUTS_SRC, 94),
  fact("Task", SHORTCUTS_SRC, 107),
  fact("Skill", SHORTCUTS_SRC, 133),
  fact("Step-by-step plans", SHORTCUTS_SRC, 146),
  fact("Where is", SHORTCUTS_SRC, 162),
  fact("Remember", SHORTCUTS_SRC, 175),
] as const;

/** How many Siri shortcuts the app registers. */
export const SHORTCUT_COUNT: AppFact<number> = {
  value: 9,
  path: SHORTCUTS_SRC,
  line: 19,
  countOf: "AppShortcut(",
};

/** Siri phrases, with the app name as Siri hears it. */
export const SHORTCUT_PHRASES = {
  look: fact("Look with fathom", SHORTCUTS_SRC, 35),
  lookout: fact("Start Lookout with fathom", SHORTCUTS_SRC, 51),
  read: fact("Read this with fathom", SHORTCUTS_SRC, 69),
  goTo: fact("Take me to {place} with fathom", SHORTCUTS_SRC, 86),
  runSkill: fact("Run {skill} with fathom", SHORTCUTS_SRC, 129),
  plan: fact("Plan something with fathom", SHORTCUTS_SRC, 142),
  whereIs: fact("fathom, where did I put it", SHORTCUTS_SRC, 158),
  remember: fact("fathom, remember this", SHORTCUTS_SRC, 171),
} as const;

export const SIRI = {
  headline: fact("Hands-free with Siri", ONBOARDING, 68),
  description: fact(
    "Run fathom without opening it. Ask Siri, or set the Action Button to launch Look Now instantly.",
    ONBOARDING,
    69,
  ),
} as const;

/** The haptic patterns setup teaches, by name. */
export const HAPTICS = {
  headline: fact("Feel the language", ONBOARDING, 95),
  somethingClose: fact("Something’s close", ONBOARDING, 112),
  gotIt: fact("Got it", ONBOARDING, 118),
  arrived: fact("Arrived", ONBOARDING, 130),
  listening: fact("Listening", ONBOARDING, 142),
} as const;

export const PROFILE = {
  title: fact("A little about you", PROFILE_SETUP, 110),
  intro: fact(
    "Three quick questions. They help fathom describe things the way you need. Every one is optional, and you can change them anytime in Settings.",
    PROFILE_SETUP,
    117,
  ),
  sight: fact("Your sight", PROFILE_SETUP, 129),
  gettingAround: fact("How you get around", PROFILE_SETUP, 186),
  caneOrDog: fact("fathom won’t narrate things your cane or dog already handles.", PROFILE_SETUP, 187),
} as const;

export const LANGUAGE = {
  follow: fact("Follow my device", ANSWER_LANGUAGE, 36),
  footer: fact(
    "Changes fathom’s descriptions and directions. Buttons, settings, and fathom’s own short alerts, like hazard warnings, stay in English.",
    ANSWER_LANGUAGE,
    38,
  ),
  voice: fact("fathom picks your best installed voice. It cannot read your VoiceOver voice.", VOICE_ROW, 172),
  voiceWhen: fact("This setting applies when VoiceOver is off.", VOICE_ROW, 162),
} as const;

/** The splash screen's line. */
export const SPLASH_LINE = fact("Visual assistance", SPLASH, 41);

export const MIN_IOS = fact("17", PBXPROJ, 311, "IPHONEOS_DEPLOYMENT_TARGET = 17.0");
export const APP_VERSION = fact("1.3.0", PBXPROJ, 410, "MARKETING_VERSION = 1.3.0");
export const APP_BUILD = fact("17", PBXPROJ, 389, "CURRENT_PROJECT_VERSION = 17");

/* ---------------------------------------------------------------- *
 * Added for the memory, plan and consent screens (steps 5, 7, 10)
 * ---------------------------------------------------------------- */

const DIRECT_MEMORY = `${F}/Features/Memory/DirectMemoryCommands.swift`;
const MEMORY_SETTINGS = `${F}/UI/Screens/MemorySettingsView.swift`;
const MEMORY_ITEM = `${F}/Models/MemoryItem.swift`;

/**
 * Memory the free way: "remember …" (DirectMemoryCommands.remember). The
 * request is the consent, so fathom asks nothing back; it says what it
 * stored, quoted: "Remembered: " + the stored sentence (:439). The lead
 * is a whole literal with its space; mockups show EXAMPLES.remember.echo.
 */
export const REMEMBER = {
  echoLead: fact("Remembered: ", DIRECT_MEMORY, 439),
} as const;

/** Settings, More options, Memory (MemorySettingsView, MemoryReviewList). */
export const MEMORY_SCREEN = {
  title: fact("Memory", MEMORY_SETTINGS, 64),
  /** FathomBackButton's word on a pushed screen. */
  back: fact("Back", SHEET_CHROME, 264),
  tabs: [fact("About you", MEMORY_SETTINGS, 34), fact("Places", MEMORY_SETTINGS, 35), fact("Memories", MEMORY_SETTINGS, 36)],
  /** The section a "where things are" memory sits under (MemoryKind.objectLocation). */
  whereThingsAre: fact("Where things are", MEMORY_ITEM, 52),
  /** A row's footnote: this lead, then the date it was agreed to. Mockups show EXAMPLES.remember.confirmed. */
  confirmedLead: fact("Confirmed ", MEMORY_LIST, 290),
  forgetEverything: fact("Forget everything", MEMORY_LIST, 134),
} as const;

/** A running plan's card: the control that moves it on (ConversationScreen.swift:2549). */
export const PLAN_RUNNING = {
  next: fact("Next step", CONVERSATION_SCREEN, 2550),
} as const;

/* ---------------------------------------------------------------- *
 * Helpers
 * ---------------------------------------------------------------- */

/** Every fact group, for the checker and the tests. */
export const APP_FACTS = {
  STAGE,
  COMPOSER,
  TALK,
  STARTERS,
  LOOK_NOW,
  READOUT,
  TRANSCRIPT_EMPTY,
  ACTIVITY,
  LOOKOUT,
  GO,
  PLAN,
  TASK,
  LIVE,
  MEMORY,
  SKILLS,
  CONSENT,
  AI_MODES,
  SAFETY_SHIELD,
  SAFETY,
  PAYWALL,
  PLUS_GATE,
  PLUS_CAPABILITIES,
  FREE_CAPABILITIES,
  SHORTCUT_TITLES,
  SHORTCUT_COUNT,
  SHORTCUT_PHRASES,
  SIRI,
  HAPTICS,
  PROFILE,
  LANGUAGE,
  SPLASH_LINE,
  MIN_IOS,
  APP_VERSION,
  APP_BUILD,
  REMEMBER,
  MEMORY_SCREEN,
  PLAN_RUNNING,
} as const;

export function isAppFact(x: unknown): x is AppFact<string | number> {
  return (
    typeof x === "object" &&
    x !== null &&
    "value" in x &&
    "path" in x &&
    "line" in x &&
    typeof (x as AppFact).path === "string" &&
    typeof (x as AppFact).line === "number"
  );
}

/** One row per fact, keyed by where it sits in APP_FACTS ("LOOK_NOW.rows.0.title"). */
export interface FlatFact extends AppFact<string | number> {
  readonly key: string;
}

export function flattenFacts(root: object = APP_FACTS): FlatFact[] {
  const out: FlatFact[] = [];
  const walk = (node: unknown, key: string) => {
    if (isAppFact(node)) {
      const row: FlatFact = { key, value: node.value, path: node.path, line: node.line };
      out.push({
        ...row,
        ...(node.source !== undefined ? { source: node.source } : {}),
        ...(node.countOf !== undefined ? { countOf: node.countOf } : {}),
      });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, `${key}.${i}`));
      return;
    }
    if (typeof node === "object" && node !== null) {
      for (const [k, child] of Object.entries(node)) walk(child, key ? `${key}.${k}` : k);
    }
  };
  walk(root, "");
  return out;
}

/** Renders a pattern fact: fill(GO.arrival, { destination: "the laundry room" }). */
export function fill(f: AppFact | string, values: Record<string, string | number>): string {
  const template = typeof f === "string" ? f : f.value;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    if (!(name in values)) throw new Error(`fill: no value for {${name}} in "${template}"`);
    return String(values[name]);
  });
}

/* ================================================================
   EXAMPLES: illustrative, not app facts.

   The site's own sample content for the phone mockups, where the app
   would show the user's own places, memories and text. One household
   thread (laundry) runs through memory, Go, the plan, Task and skills.
   Every string here still follows the copy rules, and every entry's note
   starts "Illustrative" and names the step that shows it.
   ================================================================ */

const LAUNDRY_ROOM = "the laundry room";
const LAUNDRY_SKILL = "the laundry";
/** The memory step 5 saves; the Memory list keeps it with the others (EXAMPLES.laundry.memories). */
const KEYS_MEMORY = "My keys hang on the hook by the door.";

export const EXAMPLES = {
  /** Illustrative, steps 5 to 9: the laundry thread. */
  laundry: {
    /** Memories fathom keeps about the house, as step 5's Memory list shows them. */
    memories: ["The laundry room is off the kitchen.", KEYS_MEMORY, "The detergent is on the shelf above the washer."],
    /** Go's destination, as the app says it after "reached". */
    destination: LAUNDRY_ROOM,
    /** Step 6's quote: the starter that starts Go. */
    goRow: fill(STARTERS.goToPlace, { place: LAUNDRY_ROOM }),
    /** Go's instruction while it guides. */
    goInstruction: "The laundry room door is ahead, a little to your left.",
    arrival: fill(GO.arrival, { destination: LAUNDRY_ROOM }),
    /** Step 7: the plan fathom lays out. */
    plan: {
      goal: "Do a load of laundry",
      steps: [
        { text: "Go to the laundry room", mode: PLAN.stepModes.go.value },
        { text: "Sort the darks from the lights", mode: PLAN.stepModes.task.value },
        { text: "Read the washer’s dial", mode: PLAN.stepModes.lookNow.value },
        { text: "Start the wash", mode: PLAN.stepModes.task.value },
      ],
    },
    /** Step 8: the Task step running in Live mode. */
    task: {
      goal: "Sort the darks from the lights",
      step: fill(LIVE.step, { n: 2 }),
    },
    /** Step 9: the routine fathom offers to keep. */
    skill: {
      name: LAUNDRY_SKILL,
      row: fill(STARTERS.runSkill, { skill: LAUNDRY_SKILL }),
      /**
       * The whole line the app speaks: the offer, then how to say yes. Spoken
       * only, never written to the transcript (AssistantOrchestrator.swift:1262).
       */
      offer: `${fill(SKILLS.offer, { times: SKILLS.third.value, subject: LAUNDRY_SKILL })} ${SKILLS.offerAsk.value}`,
      /** What you say to keep it: the app's own phrase (SKILLS.howTo, SKILLS.offerAsk), as your turn. */
      save: "Save this as a skill.",
      /** fathom's answer: the four steps of the laundry plan, kept under its name. */
      saved: fill(SKILLS.saved, { skill: LAUNDRY_SKILL, n: 4, plural: "s" }),
      siri: fill(SHORTCUT_PHRASES.runSkill, { skill: LAUNDRY_SKILL }),
    },
  },
  /** Illustrative, step 1: a question said aloud and fathom's answer, as the transcript shows them. */
  justAsk: {
    request: "What’s on the table in front of me?",
    answer: "A white mug about a foot to your left, a set of keys beside it, and a folded letter closer to you.",
  },
  /** Illustrative, every phone: the status bar clock, and the time over a transcript turn. */
  clock: "9:41",
  time: "9:41 AM",
  /** Illustrative, step 3: a letter read as a document, resting on "2 of 5". */
  libraryLetter: {
    request: STARTERS.firstRun[2].value,
    items: [
      "Riverside Public Library",
      "Your hold is ready to pick up.",
      "We’ll keep it at the front desk until Friday, October 9.",
      "Bring your library card or a photo ID.",
      "Questions? Call us at 555-0142.",
    ],
    current: 2,
    /** The Look Now turn's line for it: "Document. 5 items." */
    summary: fill(READOUT.summary, { type: READOUT.documentType.value, n: 5, plural: "s" }),
  },
  /** Illustrative, step 4's quote: Point to Ask names the thing first, then the words on it. */
  oatMilk: {
    answer: "Oat milk. The label says Barista Edition.",
  },
  /**
   * Illustrative, steps 6 and 8: lines drawn only where the app itself
   * draws a line: Go's instruction (GoActiveView draws the current
   * instruction), and in the transcript the spoken request
   * (ConversationController.submit) and a Live mode reply
   * (ConversationController.appendModeNarration).
   */
  activityLines: {
    /** Go's instruction on the final approach, after EXAMPLES.laundry.goInstruction. */
    goFinalApproach: "The door is about 4 feet ahead, handle on the right.",
    /** What you asked, by voice, that started the task (a conversation turn, so the transcript keeps it). */
    liveAsk: "Help me sort the darks from the lights.",
    /** fathom's coaching reply in Live mode, for the task EXAMPLES.laundry.task. */
    liveReply: "That one looks dark blue. It goes with the darks, on your left.",
  },
  /**
   * Illustrative, step 5: memory the free way, as the transcript and the
   * Memory list show it. The request is also the step's quote. The echo is
   * the app's lead and the stored sentence; the dates are the list's
   * abbreviated format.
   */
  remember: {
    request: "Remember my keys hang on the hook by the door.",
    echo: `${REMEMBER.echoLead.value}${KEYS_MEMORY}`,
    confirmed: `${MEMORY_SCREEN.confirmedLead.value}Oct 2, 2026`,
    confirmedEarlier: `${MEMORY_SCREEN.confirmedLead.value}Sep 24, 2026`,
  },
  /** Illustrative, step 7: the request the laundry plan answers. */
  planRequest: "Help me do a load of laundry.",
} as const;

/**
 * What a mockup may put in a fact's `{placeholder}`, by name. Counts
 * ({n}, {total}, {checked}) take digits; everything else takes only these.
 * A new example place or skill goes here first, or the phone test fails.
 */
export const EXAMPLE_SLOTS = {
  place: [LAUNDRY_ROOM],
  destination: [LAUNDRY_ROOM],
  skill: [LAUNDRY_SKILL],
  subject: [LAUNDRY_SKILL],
  times: [SKILLS.third.value],
} as const satisfies Record<string, readonly string[]>;
