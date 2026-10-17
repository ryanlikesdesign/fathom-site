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
//
// Every line follows the site's copy rules (test/copy.test.ts): lowercase
// fathom, curly quotes, no claim the app can't back today. The names a
// release shipped under (Snapshot, Live Task) stay, since they are history.
export const RELEASES: Release[] = [
  {
    version: '1.3.0',
    date: '2026-10-01',
    // From the App Store “What’s New” for 1.3.0 (App Store Connect, en-US), quotes made curly. One heading is reworded: the store’s “your voice stays on your phone” is a retired claim on this site (test/helpers/copy-rules.ts).
    intro: 'fathom is one conversation now. Ask by voice or by typing on one screen. Look Now, Lookout, Go and Task all run there. Past sessions are in History, in the menu.',
    sections: [
      { label: 'You’ll see the Cloud AI question once more', items: [
        'If you use Cloud AI, a short pop-up now says exactly what fathom sends to Google, including what it remembers for you. Choose Allow cloud AI or Keep fathom on-device.',
      ] },
      { label: 'Hazards have sounds', items: [
        'A short sound plays at a step down or a drop-off, and when you walk into something.',
        'Hazard words are short, like “Step down ahead,” and wait for the end of fathom’s sentence unless a step or drop-off can’t wait.',
        'Speak hazard alerts is now on by default. With the sounds on, fathom names steps, drop-offs and things the camera spots close by, and you feel walls as vibrations. Change both in Settings, under Narration and haptics.',
        'Vibrations play either way, and urgent ones always play at full strength.',
      ] },
      { label: 'Obstacle alerts pause while you type', items: [
        'Opening Type pauses them, and fathom says so. They also pause while Settings or another full screen is open, and come back when you close it.',
      ] },
      { label: 'Tell it the whole job', items: [
        'Say something like “find my cup and fill it at the water dispenser.” fathom may ask a few short questions, then reads you the whole plan. Accept, change or dismiss it. While it runs, pause, change or end it.',
        'Step-by-step plans are part of fathom plus.',
      ] },
      { label: 'fathom remembers what you tell it', items: [
        'Say “remember my keys are on the hook,” and it says back exactly what it saved. Later, ask “where are my keys?” fathom asks before it saves anything it suggested.',
        'Read, edit or forget memories in Settings, under More options, then Memory. Memory is free.',
      ] },
      { label: 'Pin a spot and find it again', items: [
        'Stand at the front door and say “remember where the front door is.” fathom saves it and pins the spot. Later, say “take me to the front door,” and Go guides you back, even when the spot is behind you.',
        'Pinning needs an iPhone with a LiDAR Scanner. Go is part of fathom plus.',
      ] },
      { label: 'Go asks when you’ve arrived', items: [
        'When fathom thinks you’re there, it asks, and waits for your answer. You can also tap I’ve arrived, or shake your phone.',
      ] },
      { label: 'Teach it a routine', items: [
        'Say “teach you how I make coffee,” then talk through the steps. Later, say “run” and the skill’s name. Running a skill is part of fathom plus.',
      ] },
      { label: 'Take a closer look', items: [
        'After fathom describes something, choose Take a closer look, or say it, for a fresh picture and a more careful look.',
      ] },
      { label: 'Siri knows more', items: [
        'Say “fathom, remember this” or “fathom, where is it,” and Siri answers without opening the app. “Look with fathom” describes what’s in front of you. Siri can also take you to a place you taught fathom, or run a skill.',
        'Siri’s phrase to stop fathom is gone. In the app, say stop or use End.',
      ] },
      { label: 'Your voice and your language', items: [
        'With VoiceOver off, you can choose fathom’s voice in Settings.',
        'fathom answers in your iPhone’s language when it can also understand speech in it. If it can’t, it tells you once and uses English.',
      ] },
      { label: 'More works without the internet', items: [
        'Reading text works with no connection. On iOS 27 with Apple Intelligence on, Look Now can describe what’s around you without the cloud.',
      ] },
      { label: 'Outside Live mode, your speech becomes text on your phone', items: [
        'fathom turns what you say into text on the phone, and with Cloud AI on, only the text is sent. If your iPhone can’t do that for your language, fathom tells you, and you can type.',
        'You feel a tap when the microphone opens and when it closes. It closes when you stop talking.',
      ] },
      { label: 'Your data can move with you', items: [
        'In Settings, under More options, then Your data, you can export your profile, memories, skills and routes to one file, import it, or delete them.',
      ] },
      { label: 'Also in this release', items: [
        'Snapshot is now Look Now. Live Task is now Live mode, a fathom plus switch for Task.',
        'fathom has a new look and app icon, and its screens fit the largest text sizes.',
      ] },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-08-29',
    added: [
      'Point at something (a label, a sign, a dial, a door, a screen, handwriting) and fathom names it, then reads what’s written on it.',
      'Setup is now tap-to-answer. A few quick questions about your sight and how you get around, every one skippable, no microphone required.',
      'Notifications, if you want them: a few tips, a monthly usage note, occasional news from the developer. Never anything safety-related; hazards always stay in the app, spoken and by touch.',
    ],
    improved: [
      'fathom now runs the camera and depth sensors at their optimal rate during Lookout and Go instead of full speed, for less heat and better battery life on longer walks.',
      'Pointing is harder to trigger by accident: a relaxed hand resting near the camera no longer starts a scan.',
      'Refined contrast and visual polish throughout, including better support for larger text sizes.',
    ],
  },
  {
    version: '1.1.1',
    date: '2026-08-21',
    fixed: [
      'fathom runs cooler and lasts longer on your battery during longer Lookout and Live Task sessions.',
      'Fixed VoiceOver sometimes talking over Lookout’s narration.',
      'Live Task reconnects more smoothly, with fewer drops mid-conversation.',
    ],
    improved: [
      'Auto-start on the Home screen is now one clear setting, so what you turn on is what actually happens.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-06-15',
    added: [
      '“Read this with fathom” via Siri or the Action Button now works reliably: signs, labels, mail, anything on screen.',
      'New onboarding walks you through Snapshot’s core moves (read text, name an object, ask a question) and how to run fathom hands-free.',
      'Haptic strength and Awareness level are now part of first-run setup. Skip them if you want to.',
      'A “Cloud AI & Privacy” screen in Settings shows what leaves your device and what stays on it.',
    ],
    improved: [
      'Voice profile is opt-in now. fathom only listens when you ask it to.',
      'Cleaner recovery when things go wrong, and a clearer message when you hit your monthly cloud limit.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-03-15',
    intro: 'fathom is visual assistance for blind and low-vision people, spoken first. Built around VoiceOver and meant to be used by ear.',
    sections: [
      {
        label: 'Free',
        items: [
          'Lookout: spoken description of what’s ahead, updating as you move.',
          'Snapshot: a one-shot scan of the scene in front of you, read aloud.',
          'On-device safety layer: obstacle alerts with haptics, step and drop-off warnings, and object detection. No internet needed.',
        ],
      },
      {
        // The tier's name, retitled: label-caps uppercases it, and the brand is
        // never set in capitals (design system README).
        label: 'Subscription',
        items: [
          'Go: guidance to a destination by camera.',
          'Task: step-by-step help with a hands-on task.',
          'Live Task: ongoing two-way guidance while the camera watches.',
          'Assistant: tell fathom your goal and it builds a plan, then walks you through it.',
        ],
      },
      {
        label: 'Built around you',
        items: [
          'No account, no sign-in. Works on the first launch.',
          'Every control is labeled for VoiceOver.',
          'Cloud AI is opt-in. A consent screen explains what leaves your device before anything is sent: camera frames and the text of your requests go to Google’s Gemini. You can also switch to On-device AI, and nothing goes to Google.',
          'iPhone 12 Pro and later Pro models get LiDAR-based step and drop-off detection. Other recent iPhones use camera-based detection instead.',
        ],
      },
    ],
    closing:
      'fathom is an assistive aid, not a replacement for a white cane, guide dog, or orientation-and-mobility training.',
  },
];

/** The in-page anchor for a version on /release-notes, e.g. "v1-3-0". */
/** A version as people say it: "1.3" for 1.3.0, the patch only when it is not zero ("1.2.1"). The release bar and the release notes both name a version this way. */
export function versionName(version: string): string {
  return version.replace(/\.0$/, "");
}

export function releaseId(version: string): string {
  return `v${version.replace(/\./g, "-")}`;
}
