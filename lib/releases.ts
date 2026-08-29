export interface ReleaseSection {
  label: string;
  items: string[];
}

export interface Release {
  version: string;
  date: string; // ISO yyyy-mm-dd
  intro?: string;
  sections?: ReleaseSection[]; // custom-labeled groups; used instead of added/improved/fixed when present
  added?: string[];
  improved?: string[];
  fixed?: string[];
  closing?: string;
}

// Newest first. To add a release, prepend a new object.
export const RELEASES: Release[] = [
  {
    version: '1.2.0',
    date: '2026-08-29',
    added: [
      'Point at something — a label, a sign, a dial, a door, a screen, handwriting — and Fathom names it, then reads what\'s written on it.',
      'Setup is now tap-to-answer. A few quick questions about your sight and how you get around, every one skippable, no microphone required.',
      'Notifications, if you want them — a few tips, a monthly usage note, occasional news from the developer. Never anything safety-related; hazards always stay in the app, spoken and by touch.',
    ],
    improved: [
      'Fathom now runs the camera and depth sensors at their optimal rate during Lookout and Go instead of full speed, for less heat and better battery life on longer walks.',
      'Pointing is harder to trigger by accident — a relaxed hand resting near the camera no longer starts a scan.',
      'Refined contrast and visual polish throughout, including better support for larger text sizes.',
    ],
  },
  {
    version: '1.1.1',
    date: '2026-08-21',
    fixed: [
      'Fathom runs cooler and lasts longer on your battery during longer Lookout and Live Task sessions.',
      "Fixed VoiceOver sometimes talking over Lookout's narration.",
      'Live Task reconnects more smoothly, with fewer drops mid-conversation.',
    ],
    improved: [
      'Auto-start on the Home screen is now one clear setting, so what you turn on is what actually happens.',
    ],
  },
  {
    version: '1.1',
    date: '2026-06-15',
    added: [
      '"Read this with Fathom" via Siri or the Action Button now works reliably — signs, labels, mail, anything on screen.',
      "New onboarding walks you through Snapshot's core moves (read text, name an object, ask a question) and how to run Fathom hands-free.",
      'Haptic strength and Awareness level are now part of first-run setup. Skip them if you want to.',
      'A "Cloud AI & Privacy" screen in Settings shows what leaves your device and what stays on it.',
    ],
    improved: [
      'Voice profile is opt-in now. Fathom only listens when you ask it to.',
      'Cleaner recovery when things go wrong, and a clearer message when you hit your monthly cloud limit.',
    ],
  },
  {
    version: '1.0',
    date: '2026-03-15',
    intro: 'Fathom is a spoken navigation aid for blind and low-vision users. Built around VoiceOver and meant to be used by ear.',
    sections: [
      {
        label: 'Free',
        items: [
          'Lookout — spoken description of what\'s ahead, updating as you move.',
          'Snapshot — a one-shot scan of the scene in front of you, read aloud.',
          'On-device safety layer — obstacle alerts with haptics, step and drop-off warnings, and object detection. No internet needed.',
        ],
      },
      {
        label: 'Fathom Plus',
        items: [
          'Go — turn-by-turn navigation to a destination.',
          'Task — step-by-step help with a hands-on task.',
          'Live Task — ongoing two-way guidance while the camera watches.',
          'Assistant — tell Fathom your goal and it builds a plan, then walks you through it.',
        ],
      },
      {
        label: 'Built around you',
        items: [
          'No account, no sign-in. Works on the first launch.',
          'Every control is labeled for VoiceOver.',
          'Cloud AI is opt-in. A consent screen explains what leaves your device before anything is sent: camera frames and the text of your requests go to Google\'s Gemini; your speech is transcribed on your phone first, so raw audio never leaves it. You can also run Fathom fully on-device.',
          'iPhone Pro models get LiDAR-based step and drop-off detection. Other recent iPhones use camera-based detection instead.',
        ],
      },
    ],
    closing:
      'Fathom is an assistive aid, not a replacement for a white cane, guide dog, or orientation-and-mobility training.',
  },
];
