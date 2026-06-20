import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Faq } from "@/components/Faq";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Support",
  description: "Answers to common questions about Fathom — the AI navigation app for blind and low-vision iPhone users. Get help, contact us, and troubleshoot.",
};

const SUPPORT_EMAIL = "support@fathomvision.app";

export default function SupportPage() {
  return (
    <>
      <Section labelledBy="sup-h">
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
          Email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use the{" "}
          <Link className="underline" href="/feedback">feedback form</Link>. Either way, a person reads it.
        </p>
      </Section>
    </>
  );
}
