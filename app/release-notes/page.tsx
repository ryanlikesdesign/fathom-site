import { Section } from "@/components/Section";
import { Surface } from "@/components/Surface";
import { RELEASES } from "@/lib/releases";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta(
  "Release notes",
  "What's new, improved, and fixed in each version of Fathom, the AI companion for blind and low-vision iPhone users.",
  "/release-notes",
);

function Group({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <h3 className="label-caps">{label}</h3>
      <ul className="mt-2 space-y-1 list-disc list-outside ml-4">
        {items.map((i) => (
          <li key={i} className="pl-1">{i}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ReleaseNotesPage() {
  return (
    <Section labelledBy="rn-h">
      <p className="eyebrow">What&apos;s new</p>
      <h1 id="rn-h" className="font-display text-5xl">Release notes</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">What&apos;s new in each version of Fathom.</p>
      <ol className="mt-10 max-w-3xl space-y-8">
        {RELEASES.map((r) => (
          <Surface key={r.version} register="lift" as="li" className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-3xl">Version {r.version}</h2>
              <time dateTime={r.date} className="text-sm text-[var(--text-muted)]">
                {/* ISO dates parse as UTC midnight; format in UTC too so the day never slips. */}
                {new Date(r.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
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
