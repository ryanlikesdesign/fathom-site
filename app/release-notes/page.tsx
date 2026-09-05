import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Surface } from "@/components/Surface";
import { RELEASES } from "@/lib/releases";

export const metadata: Metadata = {
  title: "Release notes",
  description: "What's new, improved, and fixed in each version of Fathom — the AI companion for blind and low-vision iPhone users.",
};

function Group({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <h3 className="uppercase tracking-[0.08em] text-[var(--text-secondary)]" style={{ fontSize: "12px" }}>{label}</h3>
      <ul className="mt-2 space-y-1 list-disc list-outside ml-4">
        {items.map((i) => (
          <li key={i} className="pl-1 text-[var(--text-secondary)]">{i}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ReleaseNotesPage() {
  return (
    <Section labelledBy="rn-h">
      <h1 id="rn-h" className="font-display text-5xl">Release notes</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">What&apos;s new in each version of Fathom.</p>
      <ol className="mt-10 space-y-8">
        {RELEASES.map((r) => (
          <Surface key={r.version} register="lift" as="li" className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-3xl">Version {r.version}</h2>
              <time dateTime={r.date} className="text-sm text-[var(--text-muted)]">
                {new Date(r.date).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
              </time>
            </div>
            {r.intro && <p className="mt-4 text-[var(--text-secondary)]">{r.intro}</p>}
            {r.sections
              ? r.sections.map((s) => <Group key={s.label} label={s.label} items={s.items} />)
              : <>
                  <Group label="New" items={r.added} />
                  <Group label="Improved" items={r.improved} />
                  <Group label="Fixed" items={r.fixed} />
                </>}
            {r.closing && <p className="mt-6 text-sm italic text-[var(--text-muted)]">{r.closing}</p>}
          </Surface>
        ))}
      </ol>
    </Section>
  );
}
