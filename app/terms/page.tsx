import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Terms — Fathom",
  description: "The terms for using the Fathom app.",
};

export default function TermsPage() {
  return (
    <Section labelledBy="tos-h" className="[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_p]:mt-3 [&_p]:text-[var(--text-secondary)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[var(--text-secondary)]">
      <h1 id="tos-h" className="font-display text-5xl">Terms</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: June 13, 2026</p>

      <h2>Acceptance</h2>
      <p>Fathom is operated by Unruly Vision, LLC (&quot;we&quot;). Using Fathom means you agree to these terms. If you don&apos;t, don&apos;t use the app.</p>

      <h2>Fathom is an aid, not a replacement for your own judgment</h2>
      <p>Fathom helps with awareness and navigation. It does not replace a white cane, guide dog, orientation and mobility training, or your own judgment. Technology can be wrong, slow, or unavailable. Use your established mobility tools. Stay alert. You are responsible for your safety.</p>

      <h2>License</h2>
      <p>We give you a personal, non-transferable license to use Fathom on devices you own or control, for your own use, subject to these terms and the App Store terms.</p>

      <h2>Subscriptions and billing</h2>
      <p>Some features require Fathom Plus, an auto-renewing monthly subscription. New subscribers get a free trial; after the trial it renews at the price shown before you purchase, until you cancel. The on-device safety net, Lookout, and Snapshot don&apos;t require a subscription. Subscriptions bill through your Apple account, and you can manage or cancel them in your Apple account settings.</p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t reverse-engineer, misuse, or attempt to disrupt the app or its services.</li>
        <li>Don&apos;t use Fathom for unlawful purposes or in ways that infringe others&apos; rights.</li>
      </ul>

      <h2>Disclaimers and liability</h2>
      <p>Fathom is provided &quot;as is&quot; without warranties of any kind. To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the app. Nothing here limits liability that cannot be limited under applicable law.</p>

      <h2>Changes</h2>
      <p>We may update these terms. Continued use after an update means you accept the changes.</p>

      <h2>Contact</h2>
      <p><a className="underline" href="mailto:support@fathomvision.app">support@fathomvision.app</a></p>
    </Section>
  );
}
