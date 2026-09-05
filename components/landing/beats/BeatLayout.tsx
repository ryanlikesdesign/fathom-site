import type { ReactNode } from "react";
import type { Tier } from "@/lib/landing-content";

/**
 * One beat of the story: a section with its own heading, copy, a tier chip,
 * the phone, and the phone's spoken lines repeated as real text.
 *
 * The `.beat` class gives the section its own scroll timeline; children pick
 * ranges of it. With motion off, every element is simply visible.
 */
export function BeatLayout({
  slug,
  eyebrow,
  title,
  tier,
  children,
  phone,
  spoken,
  spokenLabel = "What Fathom says",
}: {
  slug: string;
  eyebrow: string;
  title: string;
  tier?: Tier;
  children: ReactNode;
  phone: ReactNode;
  spoken?: readonly string[];
  spokenLabel?: string;
}) {
  return (
    <section id={slug} aria-labelledby={`${slug}-h`} className="beat">
      <div className="beat-inner">
        <div className="beat-copy rise">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${slug}-h`}>
            {title}
            {tier && (
              <span className={`tier is-${tier}`}>
                {tier === "free" ? "Free" : "Plus"}
              </span>
            )}
          </h2>
          {children}
          {spoken && (
            <ul className="sr-only" aria-label={spokenLabel}>
              {spoken.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="beat-phone settle">{phone}</div>
      </div>
    </section>
  );
}
