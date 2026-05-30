import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Feedback — Fathom",
  description: "Tell us what's working, what's broken, and what would help. Every message is read.",
};

export default function FeedbackPage() {
  return (
    <Section labelledBy="fb-h">
      <h1 id="fb-h" className="font-display text-5xl">Feedback</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
        Found a bug, hit a wall, or have an idea? Tell me. Reports from people who actually use the app shape what
        gets built next. Leave your email if you'd like a reply.
      </p>
      <div className="mt-10 max-w-xl">
        <ContactForm formType="feedback" />
      </div>
    </Section>
  );
}
