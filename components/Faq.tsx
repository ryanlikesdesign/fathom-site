import type { FaqItem } from "@/lib/faq";

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
      {items.map((it) => (
        <details key={it.q} className="group py-2">
          <summary role="button" className="cursor-pointer list-none py-3 text-lg font-medium [&::-webkit-details-marker]:hidden">
            {it.q}
          </summary>
          <div className="pb-4 text-[var(--text-secondary)]">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
