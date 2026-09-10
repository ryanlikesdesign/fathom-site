import Link from "next/link";
import { LEGAL_PROSE, Section } from "@/components/Section";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta(
  "Privacy",
  "How Fathom handles camera, microphone, and anonymous usage data. Fathom works on your device, needs no account, doesn't track you, and never sells your data.",
  "/privacy",
);

export default function PrivacyPage() {
  return (
    <Section labelledBy="pp-h" className={LEGAL_PROSE}>
      <p className="eyebrow">Legal</p>
      <h1 id="pp-h" className="font-display text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: August 28, 2026</p>

      <p>
        Fathom is made by Unruly Vision, LLC. This policy explains what Fathom collects, why, and
        what happens to it. We&apos;ve written it plainly, because you deserve to understand it.
      </p>
      <p>
        The short version: Fathom works on your device as much as possible. When it uses the cloud,
        it sends only what&apos;s needed to answer your request. You don&apos;t create an account, and
        we never sell your data or use it for advertising.
      </p>

      <h2>What Fathom collects</h2>
      <h3 className="mt-6 font-medium">No account</h3>
      <p>
        There is no sign-up, no sign-in, and no login of any kind. You
        never give us your name, email, or any personal identity to use Fathom, so nothing you do in
        the app is tied to a personal profile.
      </p>
      <h3 className="mt-6 font-medium">Camera and microphone</h3>
      <p>
        To describe your surroundings and help with tasks,
        Fathom sends images from your camera through Fathom&apos;s own secure backend to Google&apos;s
        Gemini AI for processing. When you use voice features, your speech is turned into text on your
        device, and only that text is sent.
      </p>
      <p>
        The one exception is a Live Task conversation: while the microphone button is on, your
        voice is streamed over an encrypted connection to Gemini so the AI can hear your question
        directly. The microphone stops streaming the moment the button is
        off, and no voice is ever sent outside of that. This happens in real time to answer your
        request. The images, text, and audio are processed and then discarded; they are not stored by
        Fathom or its backend. All connections are encrypted. You can also use Fathom in an on-device
        mode that sends nothing to the cloud.
      </p>
      <h3 className="mt-6 font-medium">Anonymous usage data</h3>
      <p>
        To understand how Fathom is used and to fix problems,
        we collect anonymous analytics through PostHog: which features are used, app performance,
        crash reports, and screen recordings of how the app is used, which can include text and other
        content shown on screen. This is tied to a random identifier created on your device, not to
        you personally. We do not use an advertising identifier, and we do not track you across other
        apps or websites.
      </p>
      <h3 className="mt-6 font-medium">Purchases</h3>
      <p>
        Subscriptions are handled by Apple through the App Store. We do
        not receive or store your payment details.
      </p>
      <h3 className="mt-6 font-medium">Notifications</h3>
      <p>
        Notifications are optional, and there are three kinds you
        can switch on or off separately in Settings. Tips and AI usage updates are scheduled entirely
        on your phone and involve no server. The third, News from Fathom, uses Apple&apos;s push
        service: while it is on, your device&apos;s notification token is stored on Fathom&apos;s
        backend next to the same random identifier described above, so an announcement can reach your
        device. It is not linked to your name or any personal identity, and turning the setting off
        deletes it. Notifications never carry safety information. Obstacles and hazards always reach
        you inside the app, out loud and through touch, as they happen.
      </p>

      <h2>Who we share data with</h2>
      <ul>
        <li><strong>Google (Gemini AI)</strong> processes camera images, text, and, in Live Task while the microphone button is on, voice audio in real time to generate descriptions and guidance.</li>
        <li><strong>Supabase</strong> hosts Fathom&apos;s secure backend, which relays those requests to Google and enforces usage limits. Camera images and text pass through it in real time and are not stored. If you turn on News from Fathom, it also stores your notification token so announcements can be delivered.</li>
        <li><strong>PostHog</strong> receives anonymous usage and diagnostic data.</li>
        <li><strong>Apple</strong> handles App Store purchases.</li>
      </ul>
      <p>We do not sell your data. We do not use it for advertising or share it with data brokers.</p>

      <h2>How long we keep it</h2>
      <p>
        Camera images and text sent for processing are not stored by Fathom or its backend.
        Anonymous analytics are kept only as long as needed to improve the app. A notification token
        is kept only while News from Fathom is switched on, and is deleted when you switch it off or
        remove the app. Anything you save in the app stays on your device until you delete it or
        remove the app.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can turn off analytics any time in Settings.</li>
        <li>You can turn off any or all notifications in Settings, which also deletes your notification token.</li>
        <li>You can use Fathom&apos;s on-device mode, which sends nothing to the cloud.</li>
        <li>You can clear anything you&apos;ve saved in the app by deleting it or removing the app.</li>
      </ul>
      <p>
        Because Fathom has no account, there is no personal profile for us to look up, correct, or
        delete. Analytics is anonymous and not tied to your name, email, or Apple ID, so we cannot
        connect it back to you. If you want analytics to stop, turn it off in Settings or remove the
        app. You are always welcome to email us with a privacy question.
      </p>

      <h2>Children</h2>
      <p>Fathom is not directed at children under 13, and we do not knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we&apos;ll update the date above and, for significant changes, let
        you know in the app.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a href="mailto:privacy@fathomvision.app">privacy@fathomvision.app</a>{" "}
        or visit <Link href="/">fathomvision.app</Link>.
      </p>
      <p className="mt-6 text-sm text-[var(--text-muted)]">Unruly Vision, LLC</p>
    </Section>
  );
}
