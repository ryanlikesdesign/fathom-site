import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Faq } from "@/components/Faq";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Support — Fathom",
  description: "Answers to common questions about Fathom, and how to get help.",
};

const SUPPORT_EMAIL = "support@fathomvision.app";

export default function SupportPage() {
  return (
    <>
      <Section labelledBy="sup-h">
        <h1 id="sup-h" className="font-display text-5xl">Support</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          Questions about Fathom, getting set up, or running into trouble? Start here.
        </p>
      </Section>
      <Section labelledBy="faq-h" className="bg-[var(--bg-subtle)]">
        <h2 id="faq-h" className="font-display text-4xl">Frequently asked questions</h2>
        <div className="mt-8"><Faq items={FAQ} /></div>
      </Section>
      <Section labelledBy="contact-h">
        <h2 id="contact-h" className="font-display text-4xl">Still need help?</h2>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">
          Email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or send a note from
          the <Link className="underline" href="/feedback">feedback form</Link>. Read our{" "}
          <Link className="underline" href="/privacy">Privacy Policy</Link> and{" "}
          <Link className="underline" href="/terms">Terms of Use</Link>.
        </p>
      </Section>
    </>
  );
}
