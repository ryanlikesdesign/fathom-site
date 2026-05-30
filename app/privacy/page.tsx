import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Privacy — Fathom",
  description: "How Fathom handles your camera data and personal information.",
};

export default function PrivacyPage() {
  return (
    <Section labelledBy="pp-h" className="[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_p]:mt-3 [&_p]:text-[var(--text-secondary)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[var(--text-secondary)]">
      <h1 id="pp-h" className="font-display text-5xl">Privacy</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: March 2026</p>

      <h2>The short version</h2>
      <p>Fathom uses your iPhone camera to describe your surroundings and guide you through them. We process what we need, nothing more, and we don&apos;t sell it.</p>

      <h2>What Fathom processes</h2>
      <ul>
        <li><strong>Camera frames.</strong> Fathom analyzes the camera feed to detect hazards and describe spaces. Basic detection runs on your device. For richer descriptions, frames may be sent to Google Gemini for processing in real time.</li>
        <li><strong>Device sensors.</strong> LiDAR depth and motion data are used on-device to detect steps, walls, and drop-offs.</li>
        <li><strong>Voice input.</strong> When you speak to Fathom — naming a destination, for example — audio is processed to understand your request.</li>
      </ul>

      <h2>What we store</h2>
      <p>Camera feed and audio are transient — used to generate guidance in the moment, not logged. We don&apos;t build a profile of where you&apos;ve been. If you email us or request early access, we keep that message to reply to it.</p>

      <h2>Third-party processing</h2>
      <p>Cloud descriptions go through Google&apos;s Gemini API. We share only what&apos;s needed to generate a response. Where we have the option to opt out of model training, we do.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Core on-device features work without a network connection.</li>
        <li>You can request deletion of any contact information you&apos;ve shared with us.</li>
        <li>If account features are added in the future, you&apos;ll be able to delete your account and associated data from within the app.</li>
      </ul>

      <h2>Children</h2>
      <p>Fathom is not directed at children under 13 and we do not knowingly collect their data.</p>

      <h2>Contact</h2>
      <p><a className="underline" href="mailto:support@fathomvision.app">support@fathomvision.app</a></p>
    </Section>
  );
}
