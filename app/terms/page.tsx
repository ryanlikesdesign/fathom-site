import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Terms of Use — Fathom",
  description: "The terms for using the Fathom app.",
};

export default function TermsPage() {
  return (
    <Section labelledBy="tos-h" className="[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_p]:mt-3 [&_p]:text-[var(--text-secondary)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[var(--text-secondary)]">
      <h1 id="tos-h" className="font-display text-5xl">Terms of Use</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: March 2026</p>

      <h2>Acceptance</h2>
      <p>By downloading or using Fathom, you agree to these terms. If you don&apos;t agree, don&apos;t use the app.</p>

      <h2>Fathom is an aid, not a replacement for your own judgment</h2>
      <p>Fathom assists with awareness and navigation. It does not replace a white cane, guide dog, orientation and mobility training, or your own senses and judgment. Technology can be wrong, delayed, or unavailable. Always use your established mobility tools and stay alert to your surroundings. You are responsible for your own safety.</p>

      <h2>License</h2>
      <p>We grant you a personal, non-transferable license to use Fathom on devices you own or control, for your own use, subject to these terms and the App Store terms.</p>

      <h2>Subscriptions and billing</h2>
      <p>Some features require a paid subscription. Founding-member pricing applies to eligible early supporters. Subscriptions are billed through your Apple account, renew automatically unless cancelled, and can be managed or cancelled in your Apple account settings. Prices and terms will be shown before you purchase.</p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t misuse, reverse-engineer, or attempt to disrupt the app or its services.</li>
        <li>Don&apos;t use Fathom for unlawful purposes or in ways that infringe others&apos; rights.</li>
      </ul>

      <h2>Disclaimers and limitation of liability</h2>
      <p>Fathom is provided &quot;as is&quot; without warranties of any kind. To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the app. Nothing in these terms limits liability that cannot be limited under applicable law.</p>

      <h2>Changes</h2>
      <p>We may update these terms. Continued use after an update means you accept the revised terms.</p>

      <h2>Contact</h2>
      <p>Questions: <a className="underline" href="mailto:support@fathomvision.app">support@fathomvision.app</a>.</p>
    </Section>
  );
}
