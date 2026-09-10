"use client";

import { useEffect } from "react";

// Last resort: the root layout itself failed, so nothing from globals.css,
// next/font or the theme provider exists here. This file supplies its own
// <html> and <body>, and the handful of tokens it paints with are spelled
// out inline in one block below (the same warm ink and paper as globals.css,
// never pure black or white, both schemes). Everything else follows the
// site's floor: a 44px target, a visible focus ring, no motion to reduce.
const TOKENS = `
:root{--bg:#0e1013;--fg:#e8e4db;--fg-secondary:#a8a29a;--accent:#1a3b52;--accent-signal:#6fa8c9;--on-accent:#ede8de;--focus-ring:#6fa8c9;color-scheme:dark}
@media (prefers-color-scheme: light){:root{--bg:#f2ede4;--fg:#0e1013;--fg-secondary:#3a424c;--accent:#1a3b52;--accent-signal:#1a3b52;--on-accent:#ede8de;--focus-ring:#1a3b52;color-scheme:light}}
body{margin:0;background:var(--bg);color:var(--fg);font-family:-apple-system,system-ui,sans-serif;font-size:16px;line-height:1.7;-webkit-font-smoothing:antialiased}
main{max-width:64rem;margin:0 auto;padding:6rem 1.5rem}
h1{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:2.5rem;line-height:1.15;margin:0}
.eyebrow{margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent-signal)}
p{max-width:42rem}
.lede{margin:1rem 0 0;font-size:1.125rem;color:var(--fg-secondary)}
a{color:var(--fg);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;text-decoration-color:var(--accent-signal)}
.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:2rem}
.btn{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:1rem 1.5rem;border-radius:999px;border:0;font:inherit;font-weight:600;cursor:pointer;background:var(--accent);color:var(--on-accent)}
.btn-secondary{background:transparent;color:var(--fg);border:1px solid var(--fg-secondary);border-radius:8px;font-weight:500}
:where(a,button):focus-visible{outline:2px solid var(--focus-ring);outline-offset:3px}
`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <title>Something went wrong | Fathom</title>
        <style>{TOKENS}</style>
        <main id="main">
          <p className="eyebrow">Something broke</p>
          <h1>Fathom&apos;s site hit a problem</h1>
          <p className="lede">
            This isn&apos;t anything you did. Try again, and if it keeps happening, email{" "}
            <a href="mailto:support@fathomvision.app">support@fathomvision.app</a> and a person will
            look into it.
          </p>
          {error.digest && <p className="lede">Reference: {error.digest}</p>}
          <div className="actions">
            <button type="button" className="btn" onClick={() => reset()}>
              Try again
            </button>
            {/* A plain anchor on purpose: the root layout is what failed, so
                Home must be a full page load, not a client-side navigation
                inside the same broken tree. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="btn btn-secondary">
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
