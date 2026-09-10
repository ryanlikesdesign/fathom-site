import Link from "next/link";
import { Section } from "@/components/Section";
import { Faq } from "@/components/Faq";
import { FAQ, SUPPORT_EMAIL, faqAnswerText } from "@/lib/faq";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta(
  "Support",
  "Answers to common questions about Fathom, the AI companion for blind and low-vision iPhone users. Get help, contact us, and troubleshoot.",
  "/support",
);

export default function SupportPage() {
  return (
    <>
      {/* FAQPage structured data, built from the same array the page renders (same pattern as layout.tsx). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((it) => ({
              "@type": "Question",
              name: it.q,
              acceptedAnswer: { "@type": "Answer", text: faqAnswerText(it) },
            })),
          }),
        }}
      />
      <Section labelledBy="sup-h">
        <p className="eyebrow">Help</p>
        <h1 id="sup-h" className="font-display text-5xl">Support</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          Getting set up or running into trouble? This is the place.
        </p>
      </Section>
      <Section labelledBy="faq-h" className="bg-[var(--bg-subtle)]">
        <h2 id="faq-h" className="font-display text-4xl">Common questions</h2>
        <div className="mt-8"><Faq items={FAQ} /></div>
      </Section>
      <Section labelledBy="contact-h">
        <h2 id="contact-h" className="font-display text-4xl">Still stuck?</h2>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">
          Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use the{" "}
          <Link href="/feedback">feedback form</Link>. Either way, a person reads it.
        </p>
      </Section>
    </>
  );
}
