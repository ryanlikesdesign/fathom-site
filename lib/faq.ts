export interface FaqItem { q: string; a: string; }

export const FAQ: FaqItem[] = [
  { q: "What is Fathom?", a: "An iPhone app for blind and low-vision people. It describes what's around you, warns you about hazards before you reach them, and guides you turn-by-turn through buildings you've never been in before." },
  { q: "What do I need to use it?", a: "An iPhone Pro with LiDAR. Fathom runs on the camera and sensors already in the phone — no beacons, no building setup, nothing to install." },
  { q: "Does it work without internet?", a: "The safety layer — obstacle detection, step warnings, depth sensing — runs on-device and never needs a connection. Richer scene descriptions use cloud AI when you're online." },
  { q: "Is my camera data private?", a: "Camera images and audio go to Google's Gemini AI in real time to describe your surroundings — used to answer your request, not stored by Fathom. There's also an on-device mode that sends nothing to the cloud. We never sell your data or use it for advertising, and you can turn off anonymous analytics anytime in Settings. The Privacy Policy has the full picture." },
  { q: "How much does it cost?", a: "Fathom is free to download, and the safety features — obstacle detection, step warnings, depth sensing — are always free, along with Lookout and Snapshot. Fathom Plus is $12.99 a month with a 7-day free trial and adds the Assistant, Go, Task, and Live Task." },
  { q: "How do I report a problem?", a: "Use the feedback form or email us directly. Either way, a person reads it." },
];
