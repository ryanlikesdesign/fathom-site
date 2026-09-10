import { Section } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta(
  "Feedback",
  "Found a bug or have an idea? Tell me. Every message is read.",
  "/feedback",
);

export default function FeedbackPage() {
  return (
    <Section labelledBy="fb-h">
      <p className="eyebrow">Talk to the maker</p>
      <h1 id="fb-h" className="font-display text-5xl">Feedback</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
        Found a bug, hit a wall, or have an idea? Tell me. What you run into shapes what I build next. Leave your email if you want a reply.
      </p>
      <div className="mt-10 max-w-xl">
        <ContactForm formType="feedback" />
      </div>
    </Section>
  );
}
