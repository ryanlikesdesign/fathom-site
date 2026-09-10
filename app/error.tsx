"use client";

import { useEffect } from "react";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { SUPPORT_EMAIL } from "@/lib/faq";

// Route-level error boundary: a page below the root layout threw. The header
// and footer are still standing, so this reads as the site with one section
// swapped for an explanation and a way to try again. Nothing here depends on
// what failed; `reset` re-renders the segment that did.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section labelledBy="err-h">
      <p className="eyebrow">Something broke</p>
      <h1 id="err-h" className="font-display text-5xl">Something went wrong on our end</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
        This isn&apos;t anything you did. Try again, and if it keeps happening, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and a person will look into it.
      </p>
      {error.digest && (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="xl" onClick={() => reset()}>Try again</Button>
        <Button href="/" variant="secondary" size="xl">Home</Button>
      </div>
    </Section>
  );
}
