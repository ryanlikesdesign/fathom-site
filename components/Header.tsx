"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/support", label: "Support" },
  { href: "/feedback", label: "Feedback" },
  { href: "/release-notes", label: "Release notes" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Subtle border/background shift once the page scrolls (matches the landing).
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    function onScroll() {
      el!.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="site-header" role="banner" ref={headerRef}>
        <Link href="/" className="brand" aria-label="Fathom, home">
          <BrandMark />
          <span className="brand-word">fathom</span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <Link href="https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183" className="nav-cta" target="_blank" rel="noopener noreferrer">
            Download free
          </Link>
        </nav>
        <ThemeToggle />
        <button
          className="mobile-nav-toggle"
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      <div
        className={`mobile-nav-overlay${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <button className="mobile-nav-close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
            {n.label}
          </Link>
        ))}
        <Link href="https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183" className="nav-cta" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
          Download free
        </Link>
      </div>
    </>
  );
}
