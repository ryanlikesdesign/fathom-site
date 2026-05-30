export interface FaqItem { q: string; a: string; }

export const FAQ: FaqItem[] = [
  { q: "What is Fathom?", a: "An iPhone app that helps blind and low-vision people move through indoor spaces — describing surroundings, warning about hazards, and giving turn-by-turn directions inside buildings." },
  { q: "What do I need to use it?", a: "An iPhone Pro with a LiDAR sensor for full depth features. Fathom uses the camera, so no extra hardware, beacons, or building setup is required." },
  { q: "Does it work without internet?", a: "Core hazard detection runs on-device and works offline. Some richer descriptions use a cloud AI service when you're connected." },
  { q: "Is my camera data private?", a: "Camera frames are processed to generate guidance and are not sold. See the Privacy Policy for exactly what's processed and what's stored." },
  { q: "How much does it cost?", a: "Fathom launches summer 2026 with founding-member pricing for early supporters. Final pricing will be announced before launch." },
  { q: "How do I report a problem?", a: "Use the Feedback page, or email us at the address below. Every message is read." },
];
