import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "/", label: "Home" },
  { href: "/support", label: "Support" },
  { href: "/feedback", label: "Feedback" },
  { href: "/release-notes", label: "Release notes" },
];

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: "rgba(var(--glass) / 0.72)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    >
      <nav aria-label="Primary" className="mx-auto flex h-[60px] max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-display text-lg font-medium">Fathom</Link>
        <ul className="flex items-center gap-1">
          {nav.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                className="rounded px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {n.label}
              </Link>
            </li>
          ))}
          <li><ThemeToggle /></li>
        </ul>
      </nav>
    </header>
  );
}
