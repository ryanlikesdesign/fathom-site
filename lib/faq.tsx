import type { ReactNode } from 'react';
import Link from 'next/link';
import { PLUS, PLUS_TRIAL_LABEL } from '@/lib/landing-content';

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
    q: 'What is Fathom?',
    a: "An AI companion for blind and low-vision people, on iPhone. It tells you what's around you, warns you before you reach a hazard, walks you to where you're going inside a building, and works through the task with you once you get there. Or hand it the goal and let the Assistant figure out the steps.",
  },
  {
    q: 'What do I need to use it?',
    a: "A recent iPhone. That's it. Fathom runs on the camera and sensors already in the phone, with no beacons, no building setup, and nothing to install. On iPhone Pro models, LiDAR adds depth-based hazard detection.",
  },
  {
    q: 'Does it work with VoiceOver?',
    a: 'Yes, from the first screen. Every control has a label and a hint, the rotor works, and everything Fathom notices is spoken. You can use it with the screen off. If you have some sight, the contrast is high and the targets are large, and it works without VoiceOver too.',
  },
  {
    q: 'Does it work without internet?',
    a: "The safety layer (obstacle detection, step warnings, depth sensing) runs on-device and never needs a connection. Richer scene descriptions use cloud AI when you're online.",
  },
  {
    q: 'Which iPhones support pointing and LiDAR?',
    a: 'Pointing works on any iPhone that runs iOS 17. Depth-based hazard detection uses LiDAR, which is on the Pro and Pro Max models (iPhone 12 Pro and later). Other iPhones use camera-based detection instead.',
  },
  {
    q: 'Is my camera data private?',
    a: (
      <>
        Camera frames and the text of what you ask go through Fathom&apos;s backend to Google&apos;s Gemini to answer your request, then are discarded. Your speech is turned into text on your phone, not sent as audio. The one exception is Live Task: while the microphone button is on, your voice streams to Gemini so it can hear you directly, and it stops the instant you turn the button off. There&apos;s also an on-device mode that sends nothing to the cloud. We never sell your data or use it for ads, and you can turn off anonymous analytics anytime in Settings. The <Link href="/privacy">Privacy Policy</Link> has the full picture.
      </>
    ),
    plain:
      "Camera frames and the text of what you ask go through Fathom's backend to Google's Gemini to answer your request, then are discarded. Your speech is turned into text on your phone, not sent as audio. The one exception is Live Task: while the microphone button is on, your voice streams to Gemini so it can hear you directly, and it stops the instant you turn the button off. There's also an on-device mode that sends nothing to the cloud. We never sell your data or use it for ads, and you can turn off anonymous analytics anytime in Settings. The Privacy Policy has the full picture.",
  },
  {
    q: 'How much does it cost?',
    a: `Free to download. The safety layer, Lookout, Snapshot and pointing are always free. Fathom Plus is ${PLUS.price} a ${PLUS.period} after a ${PLUS_TRIAL_LABEL} free trial and adds Go, Task, Live Task and the Assistant.`,
  },
  {
    q: 'How do I cancel Fathom Plus?',
    a: 'Subscriptions are managed by Apple. Open Settings, tap your name, then Subscriptions, choose Fathom and tap Cancel. You keep Plus until the end of the period you paid for.',
  },
  {
    q: 'Is it safe to rely on?',
    a: "Fathom uses AI and it can make mistakes. Keep your cane, your dog and your own judgment. Fathom is there for what they can't tell you.",
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
