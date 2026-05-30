import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Privacy Policy — Fathom",
  description: "How Fathom handles your camera data and personal information.",
};

export default function PrivacyPage() {
  return (
    <Section labelledBy="pp-h" className="[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_p]:mt-3 [&_p]:text-[var(--text-secondary)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[var(--text-secondary)]">
      <h1 id="pp-h" className="font-display text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: March 2026</p>

      <h2>The short version</h2>
      <p>Fathom uses your iPhone camera to describe your surroundings and guide you. We process what we need to do that, we don't sell your data, and we keep as little as possible.</p>

      <h2>What Fathom processes</h2>
      <ul>
        <li><strong>Camera frames.</strong> To detect hazards and describe spaces, Fathom analyzes your camera feed. Basic detection runs on your device. For richer descriptions, frames may be sent to a cloud AI provider (Google Gemini) for processing in real time.</li>
        <li><strong>Device sensors.</strong> LiDAR depth and motion data are used on-device to detect steps, walls, and drop-offs.</li>
        <li><strong>Voice input.</strong> When you speak to Fathom (for example, naming a destination), audio is processed to understand your request.</li>
      </ul>

      <h2>What we store</h2>
      <p>Fathom is designed to keep your camera feed and audio transient — used to generate guidance in the moment, not stored as a record of where you've been. We do not build a profile of your movements. If you contact us or request early access, we keep the email and message you send so we can reply.</p>

      <h2>Third-party processing</h2>
      <p>Cloud descriptions are handled by Google's Gemini API under their data terms. We share only what's needed to generate a response and request that data not be used to train models where that option is available.</p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>You can use core on-device features without a network connection.</li>
        <li>You can request deletion of any contact information you've shared with us.</li>
        <li>If account features are added in the future, you'll be able to delete your account and associated data from within the app.</li>
      </ul>

      <h2>Children</h2>
      <p>Fathom is not directed at children under 13 and we do not knowingly collect their data.</p>

      <h2>Contact</h2>
      <p>Questions or requests: <a className="underline" href="mailto:privacy@fathomvision.app">privacy@fathomvision.app</a>.</p>
    </Section>
  );
}
