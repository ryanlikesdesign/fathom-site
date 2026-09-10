import type { FaqItem } from "@/lib/faq";

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
      {items.map((it) => (
        <details key={it.q} className="group py-2">
          {/* The chevron is the only visual hint that a row opens; VoiceOver
              gets the native disclosure state from <summary> itself. The
              focus ring is restated because the global :where() rule loses
              to the marker reset's specificity. */}
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-medium [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)]">
            {it.q}
            <svg aria-hidden="true" className="h-5 w-5 flex-none transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </summary>
          <div className="pb-4">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
