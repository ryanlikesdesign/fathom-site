import type { ReactNode } from "react";

/**
 * Prose rhythm for the statement pages (privacy, terms, accessibility). One
 * string so the measure and spacing can't drift apart between them;
 * max-w-prose keeps body copy near 65 to 75 characters a line at desktop
 * widths.
 */
export const LEGAL_PROSE =
  "[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:max-w-prose [&_h3]:max-w-prose [&_p]:mt-3 [&_p]:max-w-prose [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:max-w-prose [&_li]:mt-1";

export function Section({
  children,
  className = "",
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  // Vertical rhythm (and the header clearance on a page's first section)
  // lives on .page-section in globals.css, next to the other section tokens.
  return (
    <section aria-labelledby={labelledBy} className={`page-section px-6 ${className}`}>
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
