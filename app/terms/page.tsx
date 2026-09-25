import { LEGAL_PROSE, Section } from "@/components/Section";
import { PLUS, PLUS_TRIAL_LABEL } from "@/lib/landing-content";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta(
  "Terms",
  "The terms for using fathom: what it is for, what it is not, subscriptions and the free trial, acceptable use, and how to reach us.",
  "/terms",
);

export default function TermsPage() {
  return (
    <Section labelledBy="tos-h" className={LEGAL_PROSE}>
      <p className="eyebrow">Legal</p>
      <h1 id="tos-h" className="font-display text-5xl">Terms</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: September 24, 2026</p>

      <h2>Acceptance</h2>
      <p>fathom is operated by Unruly Vision, LLC (&quot;we&quot;). Using fathom means you agree to these terms. If you don&apos;t, don&apos;t use the app.</p>

      <h2>fathom is an aid, not a replacement for your own judgment</h2>
      <p>fathom is an AI companion that helps with awareness, getting around, and everyday tasks. It does not replace a white cane, guide dog, orientation and mobility training, or your own judgment. Technology can be wrong, slow, or unavailable. Use your established mobility tools. Stay alert. You are responsible for your safety.</p>

      <h2>License</h2>
      <p>We give you a personal, non-transferable license to use fathom on devices you own or control, for your own use, subject to these terms and the App Store terms.</p>

      <h2>Subscriptions and billing</h2>
      <p>Some features require fathom plus, an auto-renewing monthly subscription. New subscribers get a {PLUS_TRIAL_LABEL} free trial; after the trial it renews at {PLUS.price} a {PLUS.period}, the price shown before you purchase, until you cancel. The on-device safety net, Lookout, and Look Now don&apos;t require a subscription. Subscriptions are managed by Apple. Open Settings, tap your name, then Subscriptions, choose Fathom and tap Cancel. You keep Plus until the end of the period you paid for.</p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t reverse-engineer, misuse, or attempt to disrupt the app or its services.</li>
        <li>Don&apos;t use fathom for unlawful purposes or in ways that infringe others&apos; rights.</li>
      </ul>

      <h2>Disclaimers and liability</h2>
      <p>fathom is provided &quot;as is&quot; without warranties of any kind. To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the app. Nothing here limits liability that cannot be limited under applicable law.</p>

      {/* TODO(ryan): confirm governing-law state before adding this clause */}

      <h2>Changes</h2>
      <p>We may update these terms. Continued use after an update means you accept the changes.</p>

      <h2>Contact</h2>
      <p><a href="mailto:support@fathomvision.app">support@fathomvision.app</a></p>
    </Section>
  );
}
