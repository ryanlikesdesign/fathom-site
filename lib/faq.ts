export interface FaqItem { q: string; a: string; }

export const FAQ: FaqItem[] = [
  { q: "What is Fathom?", a: "An iPhone app for blind and low-vision people. It describes what's around you, warns you about hazards before you reach them, and guides you turn-by-turn through buildings you've never been in before." },
  { q: "What do I need to use it?", a: "An iPhone Pro with LiDAR. Fathom runs on the camera and sensors already in the phone — no beacons, no building setup, nothing to install." },
  { q: "Does it work without internet?", a: "The safety layer — obstacle detection, step warnings, depth sensing — runs on-device and never needs a connection. Richer scene descriptions use cloud AI when you're online." },
  { q: "Is my camera data private?", a: "Camera frames are sent — only while a guidance mode is running — through Fathom's own secure backend to Google's Gemini AI to generate descriptions. They're used to produce that response and are not stored by Fathom, and we never sell your data. There's no account, your location stays on your device, and you can turn off anonymous usage analytics in Settings. The Privacy Policy has the full picture." },
  { q: "How much does it cost?", a: "Summer 2026. Early supporters get founding-member pricing — we'll share the details before launch." },
  { q: "How do I report a problem?", a: "Use the feedback form or email us directly. Either way, a person reads it." },
];
