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
