import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Privacy — Fathom",
  description:
    "How Fathom handles your camera, voice, location, and usage data. We collect as little as possible and keep sensitive things on your device.",
};

export default function PrivacyPage() {
  return (
    <Section
      labelledBy="pp-h"
      className="[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-lg [&_p]:mt-3 [&_p]:text-[var(--text-secondary)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[var(--text-secondary)] [&_li]:mt-1"
    >
      <h1 id="pp-h" className="font-display text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: June 2026</p>

      <p>
        Fathom helps blind and low-vision people understand their surroundings using the camera,
        on-device sensors, and AI. Fathom is operated by Unruly Vision, LLC (&quot;we&quot;). We designed
        it to collect as little as possible and to keep sensitive things on your device.{" "}
        <strong>You do not create an account to use Fathom.</strong>
      </p>

      <h2>What Fathom processes, and why</h2>

      <h3>Camera images — to describe your surroundings</h3>
      <p>
        When a guidance mode is active, Fathom sends individual camera frames to Google&apos;s Gemini
        AI to generate spoken descriptions and navigation cues. Frames travel through Fathom&apos;s own
        secure backend (which holds the AI key and relays the request) and on to Google — sent only
        while a mode is running, used to produce that response, and not stored by Fathom or its
        backend. There is no photo-library access, and no camera preview is recorded by our analytics.
      </p>

      <h3>Voice — to understand what you ask</h3>
      <p>
        When you speak to Fathom, your speech is transcribed using Apple&apos;s speech recognition.
        In interactive Task mode, audio is sent to Google&apos;s Gemini AI to answer you. Audio is used
        to fulfil your request and is not stored by Fathom.
      </p>

      <h3>Approximate location — to recognize your home and rooms</h3>
      <p>
        If you enable it, Fathom uses your location to tell when you&apos;re inside your home and to
        apply the room labels you&apos;ve saved (for example, &quot;kitchen&quot;). Your coordinates
        never leave your device. Room names you create may be included as context in AI requests if
        you keep &quot;Send profile to AI&quot; turned on.
      </p>

      <h3>Things you save — stored on your device</h3>
      <p>
        Your name, mobility-aid preference, saved facts, and room labels are stored locally on your
        device. They are included in AI requests only while &quot;Send profile to AI&quot; is enabled
        (Settings → Memory). You can clear them at any time.
      </p>

      <h3>Anonymous usage analytics &amp; session recordings — to improve the app</h3>
      <p>
        Fathom uses PostHog to understand how features are used and to find and fix problems,
        including the navigation and accessibility issues we actively work on. This includes
        product-interaction events (which modes you open, session timing, AI cost and latency
        metrics) and masked session replay of the app&apos;s screens.
      </p>
      <p>
        Session replay is masked: there is no camera view in the app, typed text and images are
        hidden, and screens that show personal content (saved facts, room labels, your name, saved
        destinations, and journey history) are redacted. Analytics are tied to a random, per-install
        identifier — not your name, email, or Apple ID — and we do not use Apple&apos;s advertising
        identifier (IDFA) or track you across other apps or websites.
      </p>

      <h2>Who processes your data</h2>
      <ul>
        <li><strong>Fathom backend (Supabase)</strong> — our own secure server relays AI requests to Google, holding the API key and enforcing usage limits. Camera and voice pass through it in real time to reach Google; it does not store them.</li>
        <li><strong>Google (Gemini API)</strong> — processes camera frames and voice to generate descriptions and guidance, as a service provider acting on our behalf.</li>
        <li><strong>Apple</strong> — on-device speech recognition for transcription.</li>
        <li><strong>PostHog</strong> — anonymous product analytics and masked session replay, as a service provider.</li>
      </ul>
      <p>We do not sell your data, share it with advertisers, or use it for advertising.</p>

      <h2>What stays on your device</h2>
      <p>
        On-device obstacle detection (YOLO), LiDAR depth and hazard sensing, your GPS coordinates,
        and your saved profile and memory are processed and stored on your device.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Turn off &quot;Send profile to AI&quot; (Settings → Memory) to keep your profile out of AI requests.</li>
        <li>Clear your home location, saved places, or entire profile in Settings → Memory.</li>
        <li>Revoke Camera, Microphone, Location, Motion, or Speech permission in iOS Settings at any time (some features will stop working).</li>
        <li>Turn off &quot;Share anonymous usage data&quot; (Settings → Privacy) to stop all analytics and session recording. Your choice is remembered across launches.</li>
      </ul>

      <h2>Data retention</h2>
      <p>
        Camera frames and audio are processed transiently to fulfil a request and are not retained by
        Fathom. Analytics events and masked replays are retained by PostHog for a limited period.
        On-device data persists until you delete it or remove the app.
      </p>

      <h2>Children</h2>
      <p>Fathom is not directed to children under 13 and does not knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>We&apos;ll update this policy as the app changes and revise the date above.</p>

      <h2>Contact</h2>
      <p>
        Questions about privacy:{" "}
        <a className="underline" href="mailto:privacy@fathomvision.app">privacy@fathomvision.app</a>
      </p>
    </Section>
  );
}
