/* ================================================================
   COPY_13: the 1.3 homepage deck.

   The site's own words for the revamped homepage, in reading order:
   hero, the gap, ten steps, the safety net, day to day, download. Nothing
   renders it yet. When the new page lands (P5) it moves into
   lib/landing-content.ts as COPY, replacing today's deck there.

   It lives in its own module until then because landing-content.ts is in
   every page's client bundle (app/error.tsx is a client component and
   imports lib/faq.tsx, which imports PLUS from landing-content). This
   file, and the app facts it reads, stay out of that graph until P5.

   Rules (test/copy.test.ts runs test/helpers/copy-rules.ts over every
   string here):
     - fathom is lowercase everywhere; the tier is "fathom plus".
     - No eyebrow contains "fathom": eyebrows are uppercased by CSS.
     - Every product claim is an app fact (lib/app-facts.ts) or a line of
       the privacy page. The source is noted beside each claim.
     - "Always on" only in "Obstacle alerts are always on". No "second set
       of eyes", no "guarantee", no hazard-sound claims, and Google's
       retention is never paraphrased (the consent pop-up quotes it).
     - Go asks; it never says you've arrived.
     - Curly quotes and apostrophes, American English, serial commas, no
       em dashes.
   ================================================================ */

import {
  AI_MODES,
  EXAMPLES,
  MIN_IOS,
  PAYWALL,
  SHORTCUT_COUNT,
  TRIAL_DAYS,
} from "./app-facts";
import type { Tier } from "./landing-content";

export { EXAMPLES } from "./app-facts";

/** Which phone screen a step shows. P3 maps each to a component in components/phone/. */
export type ScreenKey =
  | "conversation"
  | "look-now"
  | "readout"
  | "activity-lookout"
  | "memory-review"
  | "activity-go"
  | "plan-review"
  | "activity-live"
  | "conversation-skills"
  | "cloud-consent";

export interface Step {
  slug: string;
  /** Uppercased by CSS. Never contains "fathom". */
  eyebrow: string;
  /** The h2: first line, then the muted second line. */
  headline: readonly [string, string];
  body: readonly string[];
  /** A spoken or shown example, as real DOM text. From EXAMPLES. */
  example?: string;
  /** The tier line under the step. A plus step's always names "fathom plus". */
  whisper: string;
  tier: Tier;
  screen: ScreenKey;
  /** An optional link under the body. */
  link?: { label: string; href: string };
}

/** Numbers the copy spells out, keyed by the app fact they come from. */
const SPELLED: Record<number, string> = { 7: "seven", 9: "nine" };
const spell = (n: number) => {
  const word = SPELLED[n];
  if (!word) throw new Error(`copy-13: spell ${n} out in SPELLED first.`);
  return word;
};
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const STEPS: readonly Step[] = [
  {
    // ConversationStageModel.swift:195-196 (idle stage); the welcome tour's
    // "Talk to fathom" card (OnboardingContent.swift:42); Magic Tap opens the
    // mic (ConversationScreen.swift:1665-1675); "Tap anywhere to stop"
    // (ConversationStage.swift:171). Talking needs Cloud AI
    // (ConversationTools.swift:71).
    slug: "just-ask",
    eyebrow: "Just ask",
    headline: ["One screen.", "Say what you need."],
    body: [
      "Speak, type, or take a suggestion, and fathom does it on the same screen. There are no modes to switch.",
      "The mic is always in the same place, and Magic Tap opens it. Tap anywhere to stop fathom talking.",
    ],
    whisper: "Free. Talking to fathom uses Cloud AI.",
    tier: "free",
    screen: "conversation",
  },
  {
    // LOOK_NOW: the More sheet's six rows (AssistantAddSheet.swift:92-252),
    // reached from COMPOSER.more; the composer has no one-tap camera
    // (AssistantFooterControls.swift:124-140). Reading on every iPhone:
    // AI_MODES.onDeviceSummary.
    slug: "look-now",
    eyebrow: "Look Now",
    headline: ["Tap More.", "Six ways to look."],
    body: [
      "Pick one: describe the whole scene in one scan, read text word for word, identify what you’re holding, read a kiosk or appliance screen, name what you’re pointing at, or take a closer look.",
    ],
    whisper: "Free. With On-device AI, reading text works on every iPhone.",
    tier: "free",
    screen: "look-now",
  },
  {
    // READOUT: Previous item, Next item, Repeat item, Pause, "Ask fathom
    // about this" (ReadoutPlaybackBar.swift, AssistantFooterControls.swift).
    // Headings on the rotor: ReadoutResultView.swift:94 (.isHeader).
    slug: "read",
    eyebrow: "Read",
    headline: ["Long text.", "At your pace."],
    body: [
      "A long letter becomes a document you move through. Go back, skip ahead, repeat a part, or pause.",
      "With VoiceOver, it’s real text, with headings on the rotor. When you’re done, ask fathom about it.",
    ],
    example: EXAMPLES.libraryLetter.items[1],
    whisper: "Free.",
    tier: "free",
    screen: "readout",
  },
  {
    // LOOKOUT.about (OnboardingContent.swift:44), LOOKOUT.levels
    // (AwarenessLevel.swift:45-47), LOOKOUT.pointingIntro
    // (PointingIntroPrompt.swift:37). Whisper: SAFETY.onPhone, the consent
    // pop-up's own sentence.
    slug: "lookout",
    eyebrow: "Lookout and Point to Ask",
    headline: ["It talks as you walk.", "Point, and it names it."],
    body: [
      "Lookout keeps describing what’s around you while you move. You choose how much it says: Hazards Only, Balanced, or Full Awareness.",
      "Point at anything for about a second, and fathom tells you what it is.",
    ],
    example: EXAMPLES.oatMilk.answer,
    whisper: "Free. Obstacle alerts run on your phone and never use the cloud.",
    tier: "free",
    screen: "activity-lookout",
  },
  {
    // Memory is free (FathomCapability.swift:78-89). Saying "Remember …"
    // saves at once and says back what was saved (ConversationController.swift:
    // 605-633, DirectMemoryCommands.swift:155-159). The "Remember these?"
    // checklist (MEMORY, LiveTaskWritebackView.swift) runs only after a Task,
    // Live mode or plan session of 60 seconds or more (MemoryWritebackFlow
    // .minimumSessionSeconds; call sites LiveTaskSession.swift:1047,
    // RESTTaskSession.swift:973, AssistantOrchestrator.swift:1284), all
    // fathom plus. Settings, More options, Memory: AdvancedSettingsView.swift
    // :327-332, :504, and the privacy page. Kept on the phone and sent with
    // Cloud AI requests: the privacy page and CONSENT.disclosure.
    // The screen still shows the checklist; that pairing is a question for
    // Ryan (copy deck, Questions).
    slug: "memory",
    eyebrow: "Memory",
    headline: ["It learns your world.", "It asks first."],
    body: [
      "Tell it where things are, then ask later. When you tell it something, it says back what it saved.",
      "After a longer task or plan, fathom plus shows you a checklist of what it learned before it keeps any of it. Uncheck anything that’s wrong.",
      "Everything it keeps is in Settings, under More options, then Memory, where you can correct it or delete it.",
    ],
    example: EXAMPLES.laundry.teach,
    whisper:
      "Free. The checklist after a task or plan comes with fathom plus. What it remembers is kept on your iPhone, and sent to Google with your requests when Cloud AI is on.",
    tier: "free",
    screen: "memory-review",
  },
  {
    // GO.savedPlaces.detail "Go to a place you’ve named"; the camera: the
    // "Guide by camera instead" hint (GoActiveView.swift:325); the buzz:
    // HAPTICS.somethingClose; asking: GO.arrival and GO.arrivalQuestion;
    // shaking: GO.shake. Plus: FathomCapability.swift:89.
    slug: "go",
    eyebrow: "Go",
    headline: ["Say where.", "When it thinks you’re there, it asks."],
    body: [
      "Go guides you to places you’ve named, like the laundry room. It works from what the camera sees, and buzzes when something’s close.",
      "Shake your phone when you’ve arrived, or answer when it asks.",
    ],
    example: EXAMPLES.laundry.goRow,
    whisper: "fathom plus. Guided by the camera.",
    tier: "plus",
    screen: "activity-go",
  },
  {
    // PLAN.pitch (PaywallView.swift:102), PLAN.readback
    // (AssistantOrchestrator.swift:672), PLAN.accept / edit / dismiss;
    // pause and End (COMPOSER), "Change the plan" (PLAN.change).
    slug: "plans",
    eyebrow: "Step-by-step plans",
    headline: ["See the plan", "before you start."],
    body: [
      "Tell fathom the whole job. It lays out the steps and reads them to you first. Accept the plan, edit it, or dismiss it.",
      "Once it’s running, you can pause it, change the plan, or end it.",
    ],
    example: EXAMPLES.laundry.plan.goal,
    whisper: "fathom plus. Nothing starts until you accept.",
    tier: "plus",
    screen: "plan-review",
  },
  {
    // TASK.pitch, LIVE.pitch (PaywallView.swift:112, :117); a tap, never a
    // hold (design system README). The mic opens on a tap, Magic Tap or
    // fathom's own question (LiveTaskActiveView.swift:352-355; auto-listen,
    // LiveTaskSession.swift:1576-1600); LIVE.micOff otherwise. Whisper:
    // CONSENT.disclosure, and the privacy page's "the times fathom turns
    // the microphone on by itself after asking you a question".
    slug: "task-live",
    eyebrow: "Task and Live mode",
    headline: ["Hands busy?", "Talk it through."],
    body: [
      "Task coaches you through one hands-on job in front of the camera.",
      "Turn on Live mode and it becomes a conversation. Tap the mic and talk while you work. fathom also opens the mic after it asks you something. When the mic is off, the screen says “Microphone off.”",
    ],
    example: EXAMPLES.laundry.task.goal,
    whisper: "fathom plus. In Live mode, your voice is sent to Google while the microphone is on.",
    tier: "plus",
    screen: "activity-live",
  },
  {
    // SKILLS.howTo (SkillsListView.swift:92), SKILLS.offer after
    // SKILLS.repeatsBeforeOffer (RoutineOffer.swift:39, RoutineDetector.swift:92),
    // the "Run" row (STARTERS.runSkill), the Skills list's Run
    // (SkillsListView.swift:147), Siri (SHORTCUT_PHRASES.runSkill). Plus:
    // FathomCapability.swift:89.
    slug: "skills",
    eyebrow: "Skills",
    headline: ["Teach it once.", "Run it by name."],
    body: [
      "After a task, say “save this as a skill.” When you do the same job a third time, fathom offers to keep it for you.",
      "Then run it from the suggestions, from the Skills list, or from Siri.",
    ],
    example: EXAMPLES.laundry.skill.offer,
    whisper: `fathom plus. Or ask Siri: “${EXAMPLES.laundry.skill.siri}.”`,
    tier: "plus",
    screen: "conversation-skills",
  },
  {
    // AI_MODES.cloudSummary and CONSENT.disclosure (what goes); the privacy
    // page ("With On-device AI … nothing is sent to Google", "fathom asks
    // before anything goes to Google"); AI_MODES.onDeviceSummary, quoted
    // whole. Google's retention is linked, never paraphrased.
    slug: "your-choice",
    eyebrow: "Your choice",
    headline: ["Cloud or on-device.", "It asks before anything goes to Google."],
    body: [
      "With Cloud AI, fathom sends camera pictures, the text of what you say, and what it remembers about you to Google’s Gemini AI. In Live mode, your voice is sent too, while the microphone is on.",
      `With On-device AI, nothing is sent to Google. ${AI_MODES.onDeviceSummary.value}`,
    ],
    link: { label: "What goes to Google, and what Google keeps", href: "/privacy#to-google" },
    whisper: "Free either way. Switch any time in Settings, under AI Mode.",
    tier: "free",
    screen: "cloud-consent",
  },
];

export const COPY_13 = {
  meta: {
    title: "fathom: visual assistance you can talk to",
    description:
      "Visual assistance for blind and low-vision people. Ask, and fathom describes what’s around you, reads text, and watches for obstacles. It asks before it remembers anything. Free on iPhone.",
  },
  og: {
    alt: "fathom. Visual assistance you can talk to. For blind and low-vision people, free on the App Store.",
    lines: ["Visual assistance", "you can talk to.", "For blind and low-vision people. Free on the App Store."],
  },
  /** Footer, manifest and anywhere the brand line stands alone. */
  tagline: "Visual assistance you can talk to.",
  hero: {
    eyebrow: "For blind and low-vision people",
    /** Ryan's line. The two parts render on two lines. */
    title: ["Visual assistance", "you can talk to."],
    // Describes: Look Now. Reads: Read text. Guides to places you've named:
    // Go (GO.savedPlaces.detail). Learns rooms and where things are, asks
    // first: MemoryItem kinds (Place, Where things are) and MEMORY.empty. Obstacle alerts on the
    // phone, free: SAFETY.onPhone and PAYWALL.safetyNet.
    lede: "Ask, and fathom describes what’s around you, reads what’s in front of you, and guides you to places you’ve named. It learns your rooms and where you keep things, and asks before it saves anything. Obstacle alerts run on your iPhone, free.",
    ctas: {
      primary: "Download on the App Store",
      secondary: "See what it does",
    },
  },
  gap: {
    eyebrow: "The gap",
    title: ["Most of the day", "asks you to look."],
    body: "The letter in today’s mail. The label on the can. Which door is the laundry room, and where you put your keys down. The kiosk that’s only a screen. So you ask someone, or guess, or wait.",
    accent: "fathom is something you can ask instead.",
  },
  steps: STEPS,
  safetyNet: {
    eyebrow: "The safety net",
    // The one place "always on" appears (SAFETY_SHIELD). Always free:
    // PAYWALL.safetyNet.title.
    title: ["Obstacle alerts are always on.", "And always free."],
    body: [
      // Buzz first: the critique's wording, backed by the haptic channel
      // (design system README, Sound and touch). On the phone, with or
      // without Cloud AI: SAFETY.onPhone. Paused: ACTIVITY.paused. Past the
      // allowance: SAFETY.pastAllowance.
      "When fathom notices a hazard, it buzzes first. Obstacle alerts run on your phone in Lookout, Go, and tasks, with Cloud AI on or off. Pausing doesn’t stop them, and they keep working after this month’s Cloud AI allowance runs out.",
      // SAFETY.caution; the Terms: SAFETY.keepYourAids.
      "fathom uses AI and it can make mistakes. Keep your cane or your dog.",
    ],
  },
  dayToDay: {
    title: "It fits how you already work.",
    cards: [
      {
        // HAPTICS (OnboardingContent.swift:95-146): a pattern for each, felt in setup.
        title: "Cues you feel",
        body: "fathom talks through touch too. Something’s close, Arrived, and Listening each have their own pattern, and setup lets you feel every one.",
      },
      {
        // SHORTCUT_COUNT, SIRI.description, SHORTCUT_PHRASES.whereIs.
        title: "Siri and the Action Button",
        body: `${capitalize(spell(SHORTCUT_COUNT.value))} Siri shortcuts, and the Action Button can open Look Now. Ask Siri “fathom, where did I put it” and hear the answer without opening the app.`,
      },
      {
        // LANGUAGE.follow, LANGUAGE.footer, LANGUAGE.voice, LANGUAGE.voiceWhen.
        title: "Your language, your voice",
        body: "fathom answers in your iPhone’s language when it can. Buttons and short alerts stay in English. With VoiceOver off, it speaks in the best voice installed on your phone.",
      },
      {
        // PROFILE.intro, .sight, .gettingAround, .caneOrDog; sent with
        // requests: CONSENT.disclosure ("what you’ve told fathom about yourself").
        title: "It knows how you get around",
        body: "Three quick questions at setup: your sight, how you get around, and anything else. Every one is optional. fathom won’t narrate things your cane or dog already handles. With Cloud AI on, your answers are sent with your requests.",
      },
    ],
  },
  // Magic Tap, the adjustable suggestion row (SuggestionRow.swift:48-83),
  // readout headings, Contrast Boost (ProfileSetupView.swift:156).
  footerNote:
    "Built for VoiceOver from the first screen. Magic Tap opens the mic. The suggestions are one stop, and you swipe up or down to move through them. Readouts have headings on the rotor. Light, dark, and Contrast Boost.",
  download: {
    eyebrow: "On the App Store",
    title: "Download fathom free.",
    // No account: the privacy page. Optional: PROFILE.intro.
    lede: "No account. Every setup question is optional.",
    metaLine: `Free · iPhone · iOS ${MIN_IOS.value}+`,
    // FREE_CAPABILITIES, plus talking and the safety net.
    freeLine: "Free: talking to fathom, Look Now, Lookout, Point to Ask, memory, and every obstacle alert.",
    // PLUS_CAPABILITIES; PAYWALL.price and PAYWALL.trial.
    plusLine: `fathom plus adds step-by-step plans, Go, Task with Live mode, and skills. ${PAYWALL.price.value} a month after a ${spell(TRIAL_DAYS)}-day free trial.`,
    // SAFETY.pastAllowance. No numbers: the app shows a percentage, never money.
    allowanceLine: "Cloud AI has a monthly allowance. Obstacle alerts keep working when it runs out.",
  },
} as const;
