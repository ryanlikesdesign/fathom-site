import type { ReactNode } from 'react';
import Link from 'next/link';
import { MIN_IOS, PLUS_SENTENCE } from '@/lib/landing-content';

/* ================================================================
   The support FAQ. The page renders `a`; the FAQPage JSON-LD reads
   faqAnswerText(), so a JSX answer carries a `plain` twin that says the
   same thing.

   Every non-legal answer follows the copy rules (test/copy.test.ts) and
   states only what the app does (lib/app-facts.ts, and the app source
   noted beside each answer). The privacy answer is legal text: its words
   are frozen, and test/privacy-copy.test.tsx holds them. So is Apple's
   own label in the cancel answer ("choose Fathom").

   This module is in every page's client bundle (app/error.tsx imports
   SUPPORT_EMAIL from it), so it reads the app facts it needs through
   lib/landing-content.ts, which test/landing-content.test.ts holds to
   lib/app-facts.ts, and never imports lib/app-facts.ts itself.
   ================================================================ */

export const SUPPORT_EMAIL = 'support@fathomvision.app';

export interface FaqItem {
  q: string;
  /** Rendered answer. May carry inline links. */
  a: ReactNode;
  /** Plain-text twin of `a` for FAQPage JSON-LD. Only needed when `a` is JSX. */
  plain?: string;
}

export const FAQ: FaqItem[] = [
  {
    q: 'What is fathom?',
    // COPY_13.tagline and hero; the safety net: SAFETY_SHIELD, PAYWALL.safetyNet.title.
    a: 'Visual assistance you can talk to, for blind and low-vision people on iPhone. Ask what’s in front of you, what a letter says, or where you left your keys. It remembers what you tell it, and you decide what it keeps. Obstacle alerts are always on, and always free.',
  },
  {
    q: 'What do I need to use it?',
    // MIN_IOS (project.pbxproj); no account (the privacy page); PROFILE.intro;
    // LiDAR: PAYWALL.safetyNet.detail, and the app's own note on phones
    // without it (FathomViewModel.swift:1029).
    a: `An iPhone on iOS ${MIN_IOS} or later. There’s no account to make, and every setup question is optional. On iPhone 12 Pro and later Pro models, LiDAR adds depth for step and drop-off alerts.`,
  },
  {
    q: 'Does it work with VoiceOver?',
    // COPY_13.footerNote: Magic Tap (ConversationScreen.swift:1665-1675), the
    // adjustable suggestion row (SuggestionRow.swift:48-83), readout headings
    // (ReadoutResultView.swift:94), Contrast Boost (ProfileSetupView.swift:156);
    // text sizes: the design system's accessibility sizes.
    a: 'Yes, from the first screen. Magic Tap opens the mic. The suggestions are one stop, and you swipe up or down to move through them. Long readouts have headings on the rotor. If you have some sight, text grows to the largest accessibility sizes, and fathom comes in light, dark, and Contrast Boost.',
  },
  {
    q: 'Does it work without internet?',
    // SAFETY.onPhone; AI_MODES.onDeviceSummary; talking needs Cloud AI
    // (SAFETY.cloudOffAnswer); AI_MODES.cloudSummary "Needs internet".
    a: 'Obstacle alerts run on your phone and never need a connection. With On-device AI, reading text works on every iPhone, and on iOS 27 with Apple Intelligence, Look Now can also describe what is around you. Talking to fathom, Go, Task, step-by-step plans, and Live mode use Cloud AI, which needs internet.',
  },
  {
    q: 'Which iPhones support pointing and LiDAR?',
    // Pointing is Vision hand pose, on the phone (PointingDetector.swift);
    // naming the thing is a Look Now answer: Cloud AI, or on-device on iOS 27
    // (LocalVisionDescriber.swift:42-45). Without LiDAR: "Step and drop-off
    // detection is limited" (FathomViewModel.swift:1029).
    a: `Pointing works on any iPhone that runs iOS ${MIN_IOS} or later. fathom names what you’re pointing at with Cloud AI, or on your phone on iOS 27 with Apple Intelligence. LiDAR is on the Pro and Pro Max models from iPhone 12 Pro on, and adds depth for step and drop-off alerts. Other iPhones warn you about obstacles with the camera, and their step and drop-off alerts are more limited.`,
  },
  {
    q: 'Is my camera data private?',
    a: (
      <>
        With Cloud AI on, pictures from your camera, the text of what you say, and what fathom remembers about you go to Google&apos;s Gemini AI so it can answer you. While Lookout, Go, or a task is running, fathom sends a picture every few seconds. What you say is turned into text on your phone, and only the text is sent. In Live mode, your voice is sent too, while the microphone is on. fathom&apos;s backend stores none of the pictures, text, or audio. With On-device AI, nothing goes to Google. Usage data, including recordings of fathom&apos;s menu screens, is on by default in both modes, and you can turn it off in Settings. We never sell your data or use it for ads. The <Link href="/privacy">Privacy Policy</Link> has the full picture.
      </>
    ),
    plain:
      "With Cloud AI on, pictures from your camera, the text of what you say, and what fathom remembers about you go to Google's Gemini AI so it can answer you. While Lookout, Go, or a task is running, fathom sends a picture every few seconds. What you say is turned into text on your phone, and only the text is sent. In Live mode, your voice is sent too, while the microphone is on. fathom's backend stores none of the pictures, text, or audio. With On-device AI, nothing goes to Google. Usage data, including recordings of fathom's menu screens, is on by default in both modes, and you can turn it off in Settings. We never sell your data or use it for ads. The Privacy Policy has the full picture.",
  },
  {
    q: 'How much does it cost?',
    // COPY_13.download: FREE_CAPABILITIES, PLUS_CAPABILITIES, PAYWALL.offer,
    // SAFETY.pastAllowance.
    a: `fathom is free to download. Talking to fathom, Look Now, Lookout, Point to Ask, memory, and every obstacle alert are free. fathom plus adds step-by-step plans, Go, Task with Live mode, and skills, for ${PLUS_SENTENCE}. Cloud AI has a monthly allowance, and obstacle alerts keep working when it runs out.`,
  },
  {
    q: 'How do I cancel fathom plus?',
    a: 'Subscriptions are managed by Apple. Open Settings, tap your name, then Subscriptions, choose Fathom and tap Cancel. You keep fathom plus until the end of the period you paid for.',
  },
  {
    q: 'Is it safe to rely on?',
    // SAFETY.caution, the app's own words; then the Terms' rule
    // (SAFETY.keepYourAids), which names every aid, not only a cane or a dog.
    a: 'fathom uses AI and it can make mistakes. Don’t rely on it alone. Keep using your cane, guide dog, sighted guide, or whatever else you use to get around, and your own judgment.',
  },
  {
    q: 'How do I report a problem?',
    a: (
      <>
        Use the <Link href="/feedback">feedback form</Link> or email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Either way, a person reads it.
      </>
    ),
    plain: `Use the feedback form or email ${SUPPORT_EMAIL}. Either way, a person reads it.`,
  },
];

/** Answer as plain text, for structured data. Falls back to `plain` when the answer is JSX. */
export function faqAnswerText(item: FaqItem): string {
  if (typeof item.a === 'string') return item.a;
  if (item.plain) return item.plain;
  throw new Error(`FAQ item "${item.q}" has a JSX answer but no plain text twin.`);
}
