import Link from "next/link";

const groups = [
  { heading: "Product", links: [["/", "Home"], ["/release-notes", "Release notes"]] },
  { heading: "Help", links: [["/support", "Support"], ["/feedback", "Feedback"]] },
  { heading: "Legal", links: [["/privacy", "Privacy"], ["/terms", "Terms"]] },
];

export function Footer() {
  return (
    <footer className="border-t px-6 py-12">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
        {groups.map((g) => (
          <nav key={g.heading} aria-label={g.heading}>
            <h2 className="uppercase tracking-[0.08em] text-[var(--text-secondary)]" style={{ fontSize: "12px" }}>{g.heading}</h2>
            <ul className="mt-3 space-y-2">
              {g.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-5xl text-sm text-[var(--text-muted)]">
        © {new Date().getFullYear()} Fathom. Built with lived experience.
      </p>
    </footer>
  );
}
