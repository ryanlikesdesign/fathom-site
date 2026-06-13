import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Privacy — Fathom",
  description:
    "How Fathom handles camera, microphone, account, and anonymous usage data. Fathom works on your device as much as possible and never sells your data.",
};

export default function PrivacyPage() {
  return (
    <Section
      labelledBy="pp-h"
      className="[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_p]:mt-3 [&_p]:text-[var(--text-secondary)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[var(--text-secondary)] [&_li]:mt-1"
    >
      <h1 id="pp-h" className="font-display text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: June 13, 2026</p>

      <p>
        Fathom is made by Unruly Vision, LLC. This policy explains what Fathom collects, why, and
        what happens to it. We&apos;ve written it plainly, because you deserve to understand it.
      </p>
      <p>
        The short version: Fathom works on your device as much as possible. When it uses the cloud,
        it sends only what&apos;s needed to answer your request. We never sell your data or use it for
        advertising.
      </p>

      <h2>What Fathom collects</h2>
      <p>
        <strong>Camera and microphone.</strong>{" "}To describe your surroundings and help with tasks,
        Fathom sends camera images and, during voice features, your audio to Google&apos;s Gemini AI
        for processing. This happens in real time to answer your request, and Fathom does not store
        these images or recordings. You can also use Fathom in an on-device mode that sends nothing
        to the cloud.
      </p>
      <p>
        <strong>Your account.</strong>{" "}If you subscribe to Fathom Plus, you sign in with Apple. We
        receive and store your email address and an account identifier through our authentication
        provider, Supabase, so we can manage your subscription. You do not need an account to use
        Fathom&apos;s free features.
      </p>
      <p>
        <strong>Anonymous usage data.</strong>{" "}To understand how Fathom is used and to fix problems,
        we collect anonymous analytics through PostHog: which features are used, app performance, and
        crash reports. This is tied to a random identifier created on your device, not to your name,
        email, or account. Any screen recordings have all text and images masked.
      </p>
      <p>
        <strong>Purchases.</strong>{" "}Subscriptions are handled by Apple through the App Store. We do
        not receive or store your payment details.
      </p>

      <h2>Who we share data with</h2>
      <ul>
        <li><strong>Google (Gemini AI)</strong> processes camera and audio in real time to generate descriptions and guidance.</li>
        <li><strong>Supabase</strong> stores your account (email and account ID) for sign-in and subscription management.</li>
        <li><strong>PostHog</strong> receives anonymous usage and diagnostic data.</li>
        <li><strong>Apple</strong> handles App Store purchases and Sign in with Apple.</li>
      </ul>
      <p>
        We do not sell your data. We do not use it for advertising or share it with data brokers.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Camera images and audio sent for processing are not stored by Fathom. Your account
        information is kept while your account exists. Anonymous analytics are kept only as long as
        needed to improve the app.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can turn off analytics any time in Settings.</li>
        <li>You can use Fathom&apos;s on-device mode to keep camera and audio off the cloud.</li>
        <li>You can request access to or deletion of your account data by contacting us.</li>
      </ul>

      <h2>Children</h2>
      <p>
        Fathom is not directed at children under 13, and we do not knowingly collect their data.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we&apos;ll update the date above and, for significant changes, let
        you know in the app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a className="underline" href="mailto:privacy@fathomvision.app">privacy@fathomvision.app</a>{" "}
        or visit <a className="underline" href="https://fathomvision.app">fathomvision.app</a>.
      </p>
      <p className="mt-6 text-sm text-[var(--text-muted)]">Unruly Vision, LLC</p>
    </Section>
  );
}
