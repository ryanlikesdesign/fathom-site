"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Lockup } from "@/components/brand/Lockup";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppleMark } from "@/components/AppleMark";
import { MotionToggle } from "@/components/MotionToggle";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/support", label: "Support" },
  { href: "/feedback", label: "Feedback" },
  { href: "/release-notes", label: "Release notes" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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

  // The mobile menu is a modal: while it is open the page behind it is
  // pinned in place (position:fixed holds the scroll offset, which
  // overflow:hidden alone does not on iOS), hidden from readers and the
  // tab order with inert, and focus moves to Close. Closing restores the
  // scroll offset and hands focus back to the toggle that opened it.
  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const { body } = document;
    const toggle = toggleRef.current;
    // Everything that is not the dialog. The skip link and the header are
    // the overlay's siblings: painted under it, but still in the tab order
    // without this. The toggle goes inert with the header; cleanup lifts
    // inert before handing focus back to it.
    const behind = [
      document.querySelector(".skip-link"),
      headerRef.current,
      document.querySelector("main"),
      document.querySelector("footer"),
    ];
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    behind.forEach((el) => el?.setAttribute("inert", ""));
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflow = "";
      behind.forEach((el) => el?.removeAttribute("inert"));
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
      toggle?.focus();
    };
  }, [open]);

  return (
    <>
      <header className="site-header" role="banner" ref={headerRef}>
        {/* The link names the lockup, so the drawing itself stays decorative. */}
        <Link href="/" className="brand" aria-label="fathom, home">
          <Lockup height={26} className="brand-lockup" markClassName="lockup-mark" />
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
          <Link href="https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183" className="nav-cta" rel="noopener noreferrer">
            <AppleMark />
            Download<span className="sr-only"> on the App Store</span>
          </Link>
        </nav>
        <div className="header-controls">
          <MotionToggle />
          <ThemeToggle />
        </div>
        <button
          className="mobile-nav-toggle"
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          ref={toggleRef}
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      <div
        id="mobile-nav"
        className={`mobile-nav-overlay${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <button className="mobile-nav-close" type="button" aria-label="Close menu" ref={closeRef} onClick={() => setOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined} onClick={() => setOpen(false)}>
            {n.label}
          </Link>
        ))}
        <Link href="https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183" className="nav-cta" rel="noopener noreferrer" onClick={() => setOpen(false)}>
          <AppleMark />
          Download<span className="sr-only"> on the App Store</span>
        </Link>
      </div>
    </>
  );
}
