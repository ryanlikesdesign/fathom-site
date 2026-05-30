# Fathom Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the public Fathom website (6 pages + two email-backed forms) on Next.js, deployed to Vercel via GitHub, built to WCAG AAA.

**Architecture:** Next.js App Router (TypeScript) with a FathomUI design-token layer in CSS custom properties + Tailwind. Pages are server components; the two forms are a single accessible client component posting to one serverless Route Handler that emails submissions via Resend. Light/dark theming via CSS variables and a class toggle; all motion gated behind `prefers-reduced-motion`.

**Tech Stack:** Next.js 15 (App Router, React 19), TypeScript, Tailwind CSS v4, `next/font` (Source Serif 4 + Inter), Resend (email), Vitest + React Testing Library + jest-axe (tests).

**Spec:** `docs/superpowers/specs/2026-05-30-fathom-website-design.md`

**Workspace:** Build directly in the repo root `/Users/ryanhiggins/apps/fathom-site` on `main`. It is a fresh, isolated repo with no remote yet.

---

## File Structure

```
fathom-site/
├── app/
│   ├── layout.tsx                 # Root layout: fonts, theme, header/footer, skip link
│   ├── globals.css                # Tokens (CSS vars), base styles, focus/motion rules
│   ├── page.tsx                   # Home
│   ├── support/page.tsx           # Support (FAQ + contact)
│   ├── feedback/page.tsx          # Feedback form page
│   ├── release-notes/page.tsx     # Release notes
│   ├── privacy/page.tsx           # Privacy policy
│   ├── terms/page.tsx             # Terms of use
│   ├── sitemap.ts                 # SEO sitemap
│   └── api/submit/route.ts        # Form submission → Resend email
├── components/
│   ├── ThemeProvider.tsx          # Light/dark context, localStorage, system pref
│   ├── ThemeToggle.tsx            # Accessible theme switch button
│   ├── Header.tsx                 # Sticky nav (Float register)
│   ├── Footer.tsx                 # Footer nav + legal links
│   ├── Button.tsx                 # Primary / Secondary(glass) / Link variants
│   ├── Surface.tsx                # Glass register wrapper (Base..Peak) + grain
│   ├── Section.tsx                # Page section with standard vertical rhythm
│   ├── ContactForm.tsx            # Accessible form (feedback + early-access modes)
│   ├── Faq.tsx                    # Accessible disclosure/accordion list
│   └── ModeCard.tsx               # Home "modes" card
├── lib/
│   ├── validation.ts              # Pure form-validation functions
│   ├── releases.ts                # Typed release-notes data
│   └── faq.ts                     # Typed FAQ data
├── test/
│   └── setup.ts                   # Vitest + jest-axe setup
├── public/                        # Screenshots, og image, favicon, manifest
├── docs/DEPLOYMENT.md             # GitHub + Vercel + GoDaddy + Resend steps
├── vitest.config.ts
└── (Next.js config, tsconfig, etc. from create-next-app)
```

---

## Task 1: Scaffold the Next.js app

**Files:**
- Create: project scaffold via `create-next-app` in repo root

- [ ] **Step 1: Scaffold into the existing repo**

The repo root already exists with a `.git`, `.gitignore`, and `docs/`. Scaffold into a temp dir and move files in (create-next-app refuses a non-empty dir).

Run:
```bash
cd /Users/ryanhiggins/apps/fathom-site
npx create-next-app@latest .tmp-scaffold --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --no-turbopack --yes
# move everything (including dotfiles) except its own .git
shopt -s dotglob
mv .tmp-scaffold/* ./
rm -rf .tmp-scaffold
shopt -u dotglob
```
Expected: `app/`, `package.json`, `next.config.*`, `tsconfig.json`, `tailwind`/`postcss` config present at repo root. If create-next-app created a nested `.git`, remove it: `rm -rf .git` only if it is NOT the original — verify with `git remote -v` shows nothing and `git log` shows the spec commits first. The original `.git` must be preserved.

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: Build completes without errors.

- [ ] **Step 3: Strip the default boilerplate**

Replace `app/page.tsx` with a minimal placeholder and delete the default hero markup. Replace `app/globals.css` keeping only the Tailwind import line for now (tokens come in Task 3). Remove `public/*.svg` demo assets that won't be used (`next.svg`, `vercel.svg`).

`app/page.tsx`:
```tsx
export default function Home() {
  return <main>Fathom</main>;
}
```

- [ ] **Step 4: Verify dev server runs**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app"
```

---

## Task 2: Testing harness (Vitest + RTL + jest-axe)

**Files:**
- Create: `vitest.config.ts`, `test/setup.ts`
- Modify: `package.json` (scripts, devDeps)

- [ ] **Step 1: Install test deps**

Run:
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-axe @types/jest-axe
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Write `test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
```

- [ ] **Step 4: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: Add a smoke test to verify wiring**

Create `test/smoke.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

function Hello() {
  return <h1>Fathom</h1>;
}

describe("test harness", () => {
  it("renders", () => {
    render(<Hello />);
    expect(screen.getByRole("heading", { name: "Fathom" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: add vitest + RTL + jest-axe harness"
```

---

## Task 3: Design tokens & base styles (FathomUI port)

**Files:**
- Create/Modify: `app/globals.css`
- Modify: `app/layout.tsx` (load fonts)

- [ ] **Step 1: Load fonts in `app/layout.tsx`**

Replace the file with:
```tsx
import type { Metadata } from "next";
import { Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Fathom — Navigate any building. Your first time in.",
  description:
    "Fathom is an AI companion for blind and low-vision people. It sees what's ahead and guides you where you're going, from your iPhone — no maps, beacons, or setup.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Write `app/globals.css` token layer**

Replace the whole file with the ink ramp, semantic tokens, dark mode, base typography, focus, and motion rules:
```css
@import "tailwindcss";

:root {
  /* Ink primitives (warm grayscale) */
  --ink-0: #ffffff;
  --ink-50: #faf8f4;
  --ink-100: #f7f4ee;
  --ink-150: #f0ece3;
  --ink-200: #e4ddd0;
  --ink-300: #c8bfb0;
  --ink-400: #a89888;
  --ink-500: #7a6e62;
  --ink-600: #5c5046;
  --ink-700: #4a4238;
  --ink-800: #342d25;
  --ink-900: #231e18;
  --ink-950: #16130f;
  --ink-1000: #0a0806;

  /* Glass channels (light) */
  --glass: 249 246 240;
  --hi: 255 252 245;
  --sh: 22 19 15;

  /* Semantic (light) */
  --bg: var(--ink-100);
  --bg-subtle: var(--ink-150);
  --text-primary: var(--ink-950);
  --text-secondary: var(--ink-700);
  --text-muted: var(--ink-500);
  --border: var(--ink-200);

  --radius-card: 12px;
  --radius-btn: 6px;
  --section-y: 6rem;

  --dur: 150ms;
}

.dark {
  --glass: 28 24 18;
  --hi: 58 50 40;
  --sh: 0 0 0;

  --bg: var(--ink-950);
  --bg-subtle: var(--ink-900);
  --text-primary: var(--ink-100);
  --text-secondary: var(--ink-300);
  --text-muted: var(--ink-500);
  --border: var(--ink-800);
}

@media (prefers-contrast: more) {
  :root { --text-primary: var(--ink-1000); --text-secondary: var(--ink-950); --border: var(--ink-700); }
  .dark { --text-primary: var(--ink-0); --text-secondary: var(--ink-100); --border: var(--ink-300); }
}

@theme inline {
  --font-serif: var(--font-serif);
  --font-sans: var(--font-sans);
  --color-bg: var(--bg);
  --color-bg-subtle: var(--bg-subtle);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-border: var(--border);
}

* { border-color: var(--border); }

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

h1, h2, .font-display {
  font-family: var(--font-serif), Georgia, serif;
  font-optical-sizing: auto;
  font-weight: 350;
  line-height: 1.15;
}

/* Visible focus on every interactive element */
:where(a, button, input, textarea, select, [tabindex]):focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 3px;
  border-radius: 2px;
}

/* Reduced motion: kill all transitions/animations, no exceptions */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0ms !important;
    scroll-behavior: auto !important;
  }
}

/* Skip link */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  padding: 0.75rem 1.25rem;
  background: var(--bg);
  color: var(--text-primary);
  border: 1px solid var(--border);
  z-index: 100;
}
.skip-link:focus { left: 1rem; top: 1rem; }
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS (Tailwind v4 compiles `@theme`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: FathomUI design tokens and base styles"
```

---

## Task 4: Surface component (glass registers + grain)

**Files:**
- Create: `components/Surface.tsx`
- Test: `test/Surface.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/Surface.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Surface } from "@/components/Surface";

describe("Surface", () => {
  it("renders children and applies register data attribute", () => {
    render(<Surface register="lift">hello</Surface>);
    const el = screen.getByText("hello");
    expect(el).toHaveAttribute("data-register", "lift");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Surface`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `components/Surface.tsx`**

```tsx
import type { ReactNode } from "react";

type Register = "base" | "lift" | "float" | "crest" | "summit" | "peak";

const opacity: Record<Register, number> = {
  base: 0.9, lift: 0.8, float: 0.72, crest: 0.65, summit: 0.5, peak: 0.38,
};
const blur: Record<Register, number> = {
  base: 4, lift: 8, float: 12, crest: 16, summit: 20, peak: 28,
};
const grain: Record<Register, number> = {
  base: 0.032, lift: 0.025, float: 0.018, crest: 0.012, summit: 0.008, peak: 0.005,
};

// Inline SVG fractal-noise grain as a data URI (never animates)
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Surface({
  register = "lift",
  as: Tag = "div",
  className = "",
  children,
}: {
  register?: Register;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      data-register={register}
      className={`relative overflow-hidden rounded-[var(--radius-card)] border ${className}`}
      style={{
        background: `rgba(var(--glass) / ${opacity[register]})`,
        backdropFilter: `blur(${blur[register]}px)`,
        WebkitBackdropFilter: `blur(${blur[register]}px)`,
        boxShadow:
          "0 2px 6px rgba(var(--sh) / 0.08), 0 6px 20px rgba(var(--sh) / 0.06)",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: GRAIN_URL,
          opacity: grain[register],
          mixBlendMode: "overlay",
        }}
      />
      <span className="relative">{children}</span>
    </Tag>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Surface`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Surface glass-register component with grain"
```

---

## Task 5: Theme provider and toggle

**Files:**
- Create: `components/ThemeProvider.tsx`, `components/ThemeToggle.tsx`
- Test: `test/ThemeToggle.test.tsx`

- [ ] **Step 1: Write `components/ThemeProvider.tsx`**

```tsx
"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
```

- [ ] **Step 2: Add an inline anti-flash script and provider to `app/layout.tsx`**

Add inside `<head>` (before body) a blocking script that sets the class before paint, and wrap children in `ThemeProvider`. Update the layout body:
```tsx
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
            }}
          />
        </head>
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
```
Import `ThemeProvider` at top: `import { ThemeProvider } from "@/components/ThemeProvider";`

- [ ] **Step 3: Write the failing test**

`test/ThemeToggle.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

beforeEach(() => localStorage.clear());

describe("ThemeToggle", () => {
  it("toggles the dark class on the html element", async () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    const btn = screen.getByRole("button", { name: /switch to (dark|light) theme/i });
    await userEvent.click(btn);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- ThemeToggle`
Expected: FAIL (ThemeToggle not found).

- [ ] **Step 5: Implement `components/ThemeToggle.tsx`**

```tsx
"use client";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className="rounded-[var(--radius-btn)] border px-3 py-2 text-sm transition-colors"
      style={{ transitionDuration: "var(--dur)" }}
    >
      <span aria-hidden="true">{theme === "dark" ? "☾" : "☀"}</span>
    </button>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- ThemeToggle`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: theme provider and accessible toggle"
```

---

## Task 6: Button and Section primitives

**Files:**
- Create: `components/Button.tsx`, `components/Section.tsx`
- Test: `test/Button.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/Button.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "@/components/Button";

describe("Button", () => {
  it("renders a link when href is provided", () => {
    render(<Button href="/feedback">Send feedback</Button>);
    expect(screen.getByRole("link", { name: "Send feedback" })).toHaveAttribute("href", "/feedback");
  });
  it("renders a button element otherwise", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Button`
Expected: FAIL.

- [ ] **Step 3: Implement `components/Button.tsx`**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "link";
type Size = "default" | "xl";

const base =
  "inline-flex items-center justify-center font-medium rounded-[var(--radius-btn)] transition-transform";
const sizes: Record<Size, string> = {
  default: "text-sm px-5 py-2",
  xl: "text-base px-8 py-3.5",
};
const variants: Record<Variant, string> = {
  primary: "bg-[var(--text-primary)] text-[var(--bg)] hover:-translate-y-px active:translate-y-0",
  secondary: "border bg-[rgba(var(--glass)/0.5)] backdrop-blur hover:-translate-y-px",
  link: "underline underline-offset-4 px-0 py-0",
};

type Props = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  type?: "button" | "submit";
  className?: string;
};

export function Button({ children, href, variant = "primary", size = "default", type = "button", className = "" }: Props) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  const style = { transitionDuration: "var(--dur)" };
  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} style={style}>
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Button`
Expected: PASS.

- [ ] **Step 5: Implement `components/Section.tsx`**

```tsx
import type { ReactNode } from "react";

export function Section({
  children,
  className = "",
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section aria-labelledby={labelledBy} className={`px-6 ${className}`} style={{ paddingTop: "var(--section-y)", paddingBottom: "var(--section-y)" }}>
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Button and Section primitives"
```

---

## Task 7: Header, Footer, layout shell

**Files:**
- Create: `components/Header.tsx`, `components/Footer.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Implement `components/Header.tsx`**

```tsx
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
```

- [ ] **Step 2: Implement `components/Footer.tsx`**

```tsx
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
            <h2 className="text-label uppercase tracking-[0.08em] text-[var(--text-muted)]" style={{ fontSize: "12px" }}>{g.heading}</h2>
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
```

- [ ] **Step 3: Wire shell into `app/layout.tsx`**

Update the body to include skip link, header, main landmark, footer:
```tsx
        <body>
          <ThemeProvider>
            <a href="#main" className="skip-link">Skip to content</a>
            <Header />
            <main id="main">{children}</main>
            <Footer />
          </ThemeProvider>
        </body>
```
Add imports: `import { Header } from "@/components/Header";` and `import { Footer } from "@/components/Footer";`

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: header, footer, layout shell with skip link"
```

---

## Task 8: Form validation utilities (pure, TDD)

**Files:**
- Create: `lib/validation.ts`
- Test: `test/validation.test.ts`

- [ ] **Step 1: Write the failing test**

`test/validation.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { isValidEmail, validateSubmission } from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts a normal address", () => expect(isValidEmail("a@b.co")).toBe(true));
  it("rejects junk", () => expect(isValidEmail("nope")).toBe(false));
  it("rejects empty", () => expect(isValidEmail("")).toBe(false));
});

describe("validateSubmission", () => {
  it("feedback requires a message", () => {
    const r = validateSubmission({ formType: "feedback", message: "" });
    expect(r.ok).toBe(false);
    expect(r.errors.message).toBeTruthy();
  });
  it("feedback passes with a message", () => {
    const r = validateSubmission({ formType: "feedback", message: "It works", email: "" });
    expect(r.ok).toBe(true);
  });
  it("feedback with a bad email fails", () => {
    const r = validateSubmission({ formType: "feedback", message: "hi", email: "bad" });
    expect(r.ok).toBe(false);
    expect(r.errors.email).toBeTruthy();
  });
  it("early-access requires a valid email", () => {
    expect(validateSubmission({ formType: "early-access", email: "" }).ok).toBe(false);
    expect(validateSubmission({ formType: "early-access", email: "a@b.co" }).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- validation`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/validation.ts`**

```ts
export type FormType = "feedback" | "early-access";

export interface SubmissionInput {
  formType: FormType;
  name?: string;
  email?: string;
  category?: string;
  message?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

export function isValidEmail(value: string): boolean {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateSubmission(input: SubmissionInput): ValidationResult {
  const errors: Record<string, string> = {};
  const email = (input.email ?? "").trim();

  if (input.formType === "feedback") {
    if (!(input.message ?? "").trim()) errors.message = "Enter a message so we know what's up.";
    if (email && !isValidEmail(email)) errors.email = "That email doesn't look right.";
  }

  if (input.formType === "early-access") {
    if (!email) errors.email = "Enter your email to request access.";
    else if (!isValidEmail(email)) errors.email = "That email doesn't look right.";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- validation`
Expected: PASS (8 assertions).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: form validation utilities"
```

---

## Task 9: Submission API route (Resend, TDD)

**Files:**
- Create: `app/api/submit/route.ts`
- Test: `test/submit-route.test.ts`

- [ ] **Step 1: Install Resend**

Run: `npm install resend`

- [ ] **Step 2: Write the failing test (mock Resend)**

`test/submit-route.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({ emails: { send: sendMock } })),
}));

import { POST } from "@/app/api/submit/route";

function req(body: unknown) {
  return new Request("http://test/api/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
  process.env.RESEND_API_KEY = "test";
  process.env.CONTACT_EMAIL = "ryan@example.com";
});

describe("POST /api/submit", () => {
  it("rejects invalid submissions with 400 and does not email", async () => {
    const res = await POST(req({ formType: "feedback", message: "" }));
    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("silently drops honeypot hits with 200 and no email", async () => {
    const res = await POST(req({ formType: "feedback", message: "hi", company: "spam" }));
    expect(res.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("emails a valid feedback submission and returns 200", async () => {
    const res = await POST(req({ formType: "feedback", message: "Great app", email: "u@x.co" }));
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const arg = sendMock.mock.calls[0][0];
    expect(arg.to).toBe("ryan@example.com");
    expect(arg.subject).toMatch(/feedback/i);
    expect(arg.text).toContain("Great app");
  });

  it("emails an early-access request and returns 200", async () => {
    const res = await POST(req({ formType: "early-access", email: "u@x.co" }));
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock.mock.calls[0][0].subject).toMatch(/early access/i);
  });

  it("returns 502 when the email provider errors", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "down" } });
    const res = await POST(req({ formType: "early-access", email: "u@x.co" }));
    expect(res.status).toBe(502);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- submit-route`
Expected: FAIL (route not found).

- [ ] **Step 4: Implement `app/api/submit/route.ts`**

```ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { validateSubmission, type FormType } from "@/lib/validation";

export const runtime = "nodejs";

interface Payload {
  formType: FormType;
  name?: string;
  email?: string;
  category?: string;
  message?: string;
  company?: string; // honeypot — real users never fill this
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: pretend success, send nothing.
  if (body.company && body.company.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const result = validateSubmission(body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
  }

  const to = process.env.CONTACT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!to || !apiKey) {
    return NextResponse.json({ ok: false, error: "Server not configured." }, { status: 500 });
  }

  const from = process.env.FROM_EMAIL ?? "Fathom <onboarding@resend.dev>";
  const isFeedback = body.formType === "feedback";
  const subject = isFeedback
    ? `Fathom feedback${body.category ? ` — ${body.category}` : ""}`
    : "Fathom early access request";
  const text = isFeedback
    ? [
        `Category: ${body.category ?? "General"}`,
        `Name: ${body.name ?? "(none)"}`,
        `Email: ${body.email ?? "(none)"}`,
        "",
        body.message ?? "",
      ].join("\n")
    : [`New early access request`, `Name: ${body.name ?? "(none)"}`, `Email: ${body.email}`].join("\n");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: body.email || undefined,
    subject,
    text,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not send. Try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- submit-route`
Expected: PASS (5 tests).

- [ ] **Step 6: Add `.env.example`**

Create `.env.example`:
```
RESEND_API_KEY=
CONTACT_EMAIL=
FROM_EMAIL=Fathom <onboarding@resend.dev>
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: submission API route with Resend email"
```

---

## Task 10: Accessible ContactForm component

**Files:**
- Create: `components/ContactForm.tsx`
- Test: `test/ContactForm.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/ContactForm.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "jest-axe";
import { ContactForm } from "@/components/ContactForm";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ContactForm (feedback)", () => {
  it("has no axe violations", async () => {
    const { container } = render(<ContactForm formType="feedback" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows an error summary when required message is missing", async () => {
    render(<ContactForm formType="feedback" />);
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/message/i);
  });

  it("posts and shows success on valid submit", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm formType="feedback" />);
    await userEvent.type(screen.getByLabelText(/message/i), "Love it");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/thank|received|got it/i);
    expect(fetchMock).toHaveBeenCalledWith("/api/submit", expect.objectContaining({ method: "POST" }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ContactForm`
Expected: FAIL.

- [ ] **Step 3: Implement `components/ContactForm.tsx`**

```tsx
"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { validateSubmission, type FormType } from "@/lib/validation";

const CATEGORIES = ["Bug", "Suggestion", "Accessibility", "General"];

export function ContactForm({ formType }: { formType: FormType }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const summaryRef = useRef<HTMLDivElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      formType,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      category: String(fd.get("category") ?? ""),
      message: String(fd.get("message") ?? ""),
      company: String(fd.get("company") ?? ""), // honeypot
    };

    const v = validateSubmission(payload);
    if (!v.ok) {
      setErrors(v.errors);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad status");
      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p role="status" className="text-lg">
        {formType === "feedback"
          ? "Got it — thank you. I read every message."
          : "You're on the list. I'll be in touch before launch."}
      </p>
    );
  }

  const errorList = Object.entries(errors);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-[var(--radius-card)] border p-4">
          <p className="font-medium">Please fix the following:</p>
          <ul className="mt-2 list-disc pl-5">
            {errorList.map(([field, msg]) => (
              <li key={field}><a href={`#field-${field}`} className="underline">{msg}</a></li>
            ))}
          </ul>
        </div>
      )}

      {/* Honeypot: visually hidden, off-screen, aria-hidden */}
      <div aria-hidden="true" className="absolute left-[-9999px]" style={{ position: "absolute" }}>
        <label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div>
        <label htmlFor="field-name" className="block text-sm font-medium">Name <span className="text-[var(--text-muted)]">(optional)</span></label>
        <input id="field-name" name="name" type="text" autoComplete="name"
          className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-3 py-2" />
      </div>

      <div>
        <label htmlFor="field-email" className="block text-sm font-medium">
          Email {formType === "early-access" ? "" : <span className="text-[var(--text-muted)]">(optional)</span>}
        </label>
        <input id="field-email" name="email" type="email" autoComplete="email"
          aria-invalid={!!errors.email} aria-describedby={errors.email ? "err-email" : undefined}
          className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-3 py-2" />
        {errors.email && <p id="err-email" className="mt-1 text-sm">{errors.email}</p>}
      </div>

      {formType === "feedback" && (
        <>
          <div>
            <label htmlFor="field-category" className="block text-sm font-medium">Category</label>
            <select id="field-category" name="category" defaultValue="General"
              className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-3 py-2">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="field-message" className="block text-sm font-medium">Message</label>
            <textarea id="field-message" name="message" rows={6} required
              aria-invalid={!!errors.message} aria-describedby={errors.message ? "err-message" : undefined}
              className="mt-2 w-full rounded-[var(--radius-btn)] border bg-[var(--bg-subtle)] px-3 py-2" />
            {errors.message && <p id="err-message" className="mt-1 text-sm">{errors.message}</p>}
          </div>
        </>
      )}

      {status === "error" && <p role="alert" className="text-sm">Something went wrong. Please try again.</p>}

      <Button type="submit" variant="primary" size="xl">
        {status === "sending" ? "Sending…" : formType === "feedback" ? "Send feedback" : "Request early access"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ContactForm`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: accessible ContactForm component"
```

---

## Task 11: Home page

**Files:**
- Create: `components/ModeCard.tsx`
- Modify: `app/page.tsx`
- Test: `test/home.test.tsx`

> **Content note:** The `modes` array below uses the live page's four modes (Snapshot/Lookout/Go/Task). This is the flagged open item — Ryan confirms the public mode story at content review. Keeping it in one array makes the swap a one-line edit.

- [ ] **Step 1: Implement `components/ModeCard.tsx`**

```tsx
import { Surface } from "@/components/Surface";

export function ModeCard({ name, description }: { name: string; description: string }) {
  return (
    <Surface register="lift" as="li" className="p-6">
      <h3 className="text-xl font-semibold">{name}</h3>
      <p className="mt-2 text-[var(--text-secondary)]">{description}</p>
    </Surface>
  );
}
```

- [ ] **Step 2: Write `app/page.tsx`**

```tsx
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { ModeCard } from "@/components/ModeCard";
import { ContactForm } from "@/components/ContactForm";

const modes = [
  { name: "Snapshot", description: "One tap describes the space around you — what's ahead, left, right, and any signs or landmarks." },
  { name: "Lookout", description: "Always-on awareness. Fathom watches the path and speaks only when something matters. Silence means it's clear." },
  { name: "Go", description: "Turn-by-turn indoor navigation. Say where you're headed and Fathom reads signs and calls turns until you arrive." },
  { name: "Task", description: "Real-time, step-by-step guidance for a task in front of you — like finding a specific door or item." },
];

const features = [
  "On-device AI vision and depth sensing at 10fps",
  "Haptic feedback in under 100ms",
  "Spatial audio with distinct earcons for each state",
  "Works without a network connection",
  "No beacons, maps, or building setup",
  "Clock-face directions — \"door at 2 o'clock\"",
];

export default function Home() {
  return (
    <>
      <Section labelledBy="hero-h" className="text-center">
        <h1 id="hero-h" className="font-display text-5xl sm:text-6xl">Navigate any building. Your first time in.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          Fathom is an AI companion for blind and low-vision people. It sees what's ahead and guides you where
          you're going, straight from your iPhone — no maps, no beacons, no setup.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button href="#early-access" variant="primary" size="xl">Request early access</Button>
          <Button href="#modes" variant="secondary" size="xl">See how it works</Button>
        </div>
      </Section>

      <Section labelledBy="gap-h" className="bg-[var(--bg-subtle)]">
        <h2 id="gap-h" className="font-display text-4xl">Indoor navigation is still unsolved</h2>
        <p className="mt-4 max-w-3xl text-lg text-[var(--text-secondary)]">
          GPS dies the moment you step inside. The tools that try to fill the gap need pre-built maps most
          buildings don't have, or a sighted person on the other end. Fathom needs neither. It's a full sensory
          companion — for getting around, understanding a space, and finishing the task you came to do.
        </p>
      </Section>

      <Section labelledBy="modes-h">
        <h2 id="modes-h" className="font-display text-4xl">Four ways to use it</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {modes.map((m) => <ModeCard key={m.name} {...m} />)}
        </ul>
      </Section>

      <Section labelledBy="features-h" className="bg-[var(--bg-subtle)]">
        <h2 id="features-h" className="font-display text-4xl">Built to be trusted</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <li key={f} className="flex gap-3 text-[var(--text-secondary)]">
              <span aria-hidden="true">—</span><span>{f}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="a11y-h">
        <h2 id="a11y-h" className="font-display text-4xl">Accessibility isn't a setting. It's the design.</h2>
        <p className="mt-4 max-w-3xl text-lg text-[var(--text-secondary)]">
          High-contrast visuals, large targets, and full VoiceOver support are the starting point, not an
          afterthought. Fathom is built low-vision-first, by a designer who navigates the world with impaired
          vision. Every signal reaches you three ways — sight, sound, and touch.
        </p>
      </Section>

      <Section labelledBy="early-access" className="bg-[var(--bg-subtle)]">
        <h2 id="early-access" className="font-display text-4xl">Request early access</h2>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          Fathom launches summer 2026. Join the TestFlight beta and lock in founding-member pricing.
        </p>
        <div className="mt-8 max-w-md">
          <ContactForm formType="early-access" />
        </div>
      </Section>
    </>
  );
}
```

- [ ] **Step 3: Write `test/home.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import Home from "@/app/page";

describe("Home", () => {
  it("renders the hero heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: /navigate any building/i })).toBeInTheDocument();
  });
  it("has no axe violations", async () => {
    const { container } = render(<Home />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 4: Run test**

Run: `npm test -- home`
Expected: PASS.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: home page"
```

---

## Task 12: Feedback page

**Files:**
- Create: `app/feedback/page.tsx`

- [ ] **Step 1: Write `app/feedback/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Feedback — Fathom",
  description: "Tell us what's working, what's broken, and what would help. Every message is read.",
};

export default function FeedbackPage() {
  return (
    <Section labelledBy="fb-h">
      <h1 id="fb-h" className="font-display text-5xl">Feedback</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
        Found a bug, hit a wall, or have an idea? Tell me. Reports from people who actually use the app shape what
        gets built next. Leave your email if you'd like a reply.
      </p>
      <div className="mt-10 max-w-xl">
        <ContactForm formType="feedback" />
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS, `/feedback` route listed.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: feedback page"
```

---

## Task 13: Support page (FAQ + contact)

**Files:**
- Create: `lib/faq.ts`, `components/Faq.tsx`, `app/support/page.tsx`
- Test: `test/Faq.test.tsx`

- [ ] **Step 1: Write `lib/faq.ts`**

```ts
export interface FaqItem { q: string; a: string; }

export const FAQ: FaqItem[] = [
  { q: "What is Fathom?", a: "An iPhone app that helps blind and low-vision people move through indoor spaces — describing surroundings, warning about hazards, and giving turn-by-turn directions inside buildings." },
  { q: "What do I need to use it?", a: "An iPhone Pro with a LiDAR sensor for full depth features. Fathom uses the camera, so no extra hardware, beacons, or building setup is required." },
  { q: "Does it work without internet?", a: "Core hazard detection runs on-device and works offline. Some richer descriptions use a cloud AI service when you're connected." },
  { q: "Is my camera data private?", a: "Camera frames are processed to generate guidance and are not sold. See the Privacy Policy for exactly what's processed and what's stored." },
  { q: "How much does it cost?", a: "Fathom launches summer 2026 with founding-member pricing for early supporters. Final pricing will be announced before launch." },
  { q: "How do I report a problem?", a: "Use the Feedback page, or email us at the address below. Every message is read." },
];
```

- [ ] **Step 2: Write the failing test for `Faq`**

`test/Faq.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { Faq } from "@/components/Faq";

const items = [{ q: "Question one?", a: "Answer one." }];

describe("Faq", () => {
  it("has no axe violations", async () => {
    const { container } = render(<Faq items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
  it("reveals the answer when the question is activated", async () => {
    render(<Faq items={items} />);
    await userEvent.click(screen.getByRole("button", { name: "Question one?" }));
    expect(screen.getByText("Answer one.")).toBeVisible();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- Faq`
Expected: FAIL.

- [ ] **Step 4: Implement `components/Faq.tsx`** (native `<details>` — accessible by default)

```tsx
import type { FaqItem } from "@/lib/faq";

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <dl className="divide-y" style={{ borderColor: "var(--border)" }}>
      {items.map((it) => (
        <div key={it.q} className="py-2">
          <details className="group">
            <summary className="cursor-pointer list-none py-3 text-lg font-medium [&::-webkit-details-marker]:hidden">
              {/* dt semantics via summary text */}
              <dt className="inline">{it.q}</dt>
            </summary>
            <dd className="pb-4 text-[var(--text-secondary)]">{it.a}</dd>
          </details>
        </div>
      ))}
    </dl>
  );
}
```

> Note: `<summary>` exposes an implicit button role, satisfying the "activated by button" test. The `dt`/`dd` provide definition-list semantics.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- Faq`
Expected: PASS.

- [ ] **Step 6: Write `app/support/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Faq } from "@/components/Faq";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Support — Fathom",
  description: "Answers to common questions about Fathom, and how to get help.",
};

const SUPPORT_EMAIL = "support@fathomvision.app";

export default function SupportPage() {
  return (
    <>
      <Section labelledBy="sup-h">
        <h1 id="sup-h" className="font-display text-5xl">Support</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
          Questions about Fathom, getting set up, or running into trouble? Start here.
        </p>
      </Section>
      <Section labelledBy="faq-h" className="bg-[var(--bg-subtle)]">
        <h2 id="faq-h" className="font-display text-4xl">Frequently asked questions</h2>
        <div className="mt-8"><Faq items={FAQ} /></div>
      </Section>
      <Section labelledBy="contact-h">
        <h2 id="contact-h" className="font-display text-4xl">Still need help?</h2>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">
          Email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or send a note from
          the <Link className="underline" href="/feedback">feedback form</Link>. Read our{" "}
          <Link className="underline" href="/privacy">Privacy Policy</Link> and{" "}
          <Link className="underline" href="/terms">Terms of Use</Link>.
        </p>
      </Section>
    </>
  );
}
```

> **Content note:** `SUPPORT_EMAIL` is a placeholder address — Ryan confirms the real support address at review.

- [ ] **Step 7: Verify build and commit**

Run: `npm run build` → PASS
```bash
git add -A
git commit -m "feat: support page with FAQ"
```

---

## Task 14: Release notes page

**Files:**
- Create: `lib/releases.ts`, `app/release-notes/page.tsx`

- [ ] **Step 1: Write `lib/releases.ts`** (seed with the current beta; Ryan edits going forward)

```ts
export interface Release {
  version: string;
  date: string; // ISO yyyy-mm-dd
  added?: string[];
  improved?: string[];
  fixed?: string[];
}

// Newest first. To add a release, prepend a new object.
export const RELEASES: Release[] = [
  {
    version: "0.9.0",
    date: "2026-03-15",
    added: [
      "Lookout, Go, and Task modes",
      "Snapshot spatial descriptions on the Action Button",
      "On-device LiDAR step and drop-off detection",
    ],
    improved: ["Quieter alerts — Fathom speaks only when something matters"],
    fixed: ["Reduced false hazard alerts in cluttered spaces"],
  },
];
```

- [ ] **Step 2: Write `app/release-notes/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Surface } from "@/components/Surface";
import { RELEASES } from "@/lib/releases";

export const metadata: Metadata = {
  title: "Release notes — Fathom",
  description: "What's new, improved, and fixed in each version of Fathom.",
};

function Group({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <h3 className="text-label uppercase tracking-[0.08em] text-[var(--text-muted)]" style={{ fontSize: "12px" }}>{label}</h3>
      <ul className="mt-2 space-y-1">
        {items.map((i) => (
          <li key={i} className="flex gap-3 text-[var(--text-secondary)]"><span aria-hidden="true">—</span><span>{i}</span></li>
        ))}
      </ul>
    </div>
  );
}

export default function ReleaseNotesPage() {
  return (
    <Section labelledBy="rn-h">
      <h1 id="rn-h" className="font-display text-5xl">Release notes</h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">What's new in each version of Fathom.</p>
      <ol className="mt-10 space-y-8">
        {RELEASES.map((r) => (
          <Surface key={r.version} register="lift" as="li" className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-3xl">Version {r.version}</h2>
              <time dateTime={r.date} className="text-sm text-[var(--text-muted)]">
                {new Date(r.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>
            <Group label="New" items={r.added} />
            <Group label="Improved" items={r.improved} />
            <Group label="Fixed" items={r.fixed} />
          </Surface>
        ))}
      </ol>
    </Section>
  );
}
```

- [ ] **Step 3: Verify build and commit**

Run: `npm run build` → PASS
```bash
git add -A
git commit -m "feat: release notes page"
```

---

## Task 15: Privacy Policy page

**Files:**
- Create: `app/privacy/page.tsx`

> **Content note:** This is a plain-language draft based on the app's known data practices. Ryan reviews; optionally have a lawyer vet before launch. Replace the bracketed effective date and contact at review.

- [ ] **Step 1: Write `app/privacy/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Privacy Policy — Fathom",
  description: "How Fathom handles your camera data and personal information.",
};

export default function PrivacyPage() {
  return (
    <Section labelledBy="pp-h" className="[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_p]:mt-3 [&_p]:text-[var(--text-secondary)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[var(--text-secondary)]">
      <h1 id="pp-h" className="font-display text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: March 2026</p>

      <h2>The short version</h2>
      <p>Fathom uses your iPhone camera to describe your surroundings and guide you. We process what we need to do that, we don't sell your data, and we keep as little as possible.</p>

      <h2>What Fathom processes</h2>
      <ul>
        <li><strong>Camera frames.</strong> To detect hazards and describe spaces, Fathom analyzes your camera feed. Basic detection runs on your device. For richer descriptions, frames may be sent to a cloud AI provider (Google Gemini) for processing in real time.</li>
        <li><strong>Device sensors.</strong> LiDAR depth and motion data are used on-device to detect steps, walls, and drop-offs.</li>
        <li><strong>Voice input.</strong> When you speak to Fathom (for example, naming a destination), audio is processed to understand your request.</li>
      </ul>

      <h2>What we store</h2>
      <p>Fathom is designed to keep your camera feed and audio transient — used to generate guidance in the moment, not stored as a record of where you've been. We do not build a profile of your movements. If you contact us or request early access, we keep the email and message you send so we can reply.</p>

      <h2>Third-party processing</h2>
      <p>Cloud descriptions are handled by Google's Gemini API under their data terms. We share only what's needed to generate a response and request that data not be used to train models where that option is available.</p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>You can use core on-device features without a network connection.</li>
        <li>You can request deletion of any contact information you've shared with us.</li>
        <li>If account features are added in the future, you'll be able to delete your account and associated data from within the app.</li>
      </ul>

      <h2>Children</h2>
      <p>Fathom is not directed at children under 13 and we do not knowingly collect their data.</p>

      <h2>Contact</h2>
      <p>Questions or requests: <a className="underline" href="mailto:privacy@fathomvision.app">privacy@fathomvision.app</a>.</p>
    </Section>
  );
}
```

- [ ] **Step 2: Verify build and commit**

Run: `npm run build` → PASS
```bash
git add -A
git commit -m "feat: privacy policy page (draft)"
```

---

## Task 16: Terms of Use page

**Files:**
- Create: `app/terms/page.tsx`

> **Content note:** Plain-language EULA draft. The safety disclaimer is important for an assistive product. Ryan reviews; vet legally before launch.

- [ ] **Step 1: Write `app/terms/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Terms of Use — Fathom",
  description: "The terms for using the Fathom app.",
};

export default function TermsPage() {
  return (
    <Section labelledBy="tos-h" className="[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_p]:mt-3 [&_p]:text-[var(--text-secondary)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-[var(--text-secondary)]">
      <h1 id="tos-h" className="font-display text-5xl">Terms of Use</h1>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: March 2026</p>

      <h2>Acceptance</h2>
      <p>By downloading or using Fathom, you agree to these terms. If you don't agree, don't use the app.</p>

      <h2>Fathom is an aid, not a replacement for your own judgment</h2>
      <p>Fathom assists with awareness and navigation. It does not replace a white cane, guide dog, orientation and mobility training, or your own senses and judgment. Technology can be wrong, delayed, or unavailable. Always use your established mobility tools and stay alert to your surroundings. You are responsible for your own safety.</p>

      <h2>License</h2>
      <p>We grant you a personal, non-transferable license to use Fathom on devices you own or control, for your own use, subject to these terms and the App Store terms.</p>

      <h2>Subscriptions and billing</h2>
      <p>Some features require a paid subscription. Founding-member pricing applies to eligible early supporters. Subscriptions are billed through your Apple account, renew automatically unless cancelled, and can be managed or cancelled in your Apple account settings. Prices and terms will be shown before you purchase.</p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don't misuse, reverse-engineer, or attempt to disrupt the app or its services.</li>
        <li>Don't use Fathom for unlawful purposes or in ways that infringe others' rights.</li>
      </ul>

      <h2>Disclaimers and limitation of liability</h2>
      <p>Fathom is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the app. Nothing in these terms limits liability that cannot be limited under applicable law.</p>

      <h2>Changes</h2>
      <p>We may update these terms. Continued use after an update means you accept the revised terms.</p>

      <h2>Contact</h2>
      <p>Questions: <a className="underline" href="mailto:support@fathomvision.app">support@fathomvision.app</a>.</p>
    </Section>
  );
}
```

- [ ] **Step 2: Verify build and commit**

Run: `npm run build` → PASS
```bash
git add -A
git commit -m "feat: terms of use page (draft)"
```

---

## Task 17: SEO, sitemap, metadata, manifest

**Files:**
- Create: `app/sitemap.ts`, `app/robots.ts`, `public/manifest.webmanifest`
- Modify: `app/layout.tsx` (metadataBase, OG)

- [ ] **Step 1: Write `app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";

const base = "https://fathomvision.app";
const routes = ["", "/support", "/feedback", "/release-notes", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({ url: `${base}${r}`, changeFrequency: "monthly", priority: r === "" ? 1 : 0.7 }));
}
```

- [ ] **Step 2: Write `app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://fathomvision.app/sitemap.xml",
  };
}
```

- [ ] **Step 3: Add `metadataBase` and OpenGraph to `app/layout.tsx` metadata**

Update the `metadata` export:
```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://fathomvision.app"),
  title: {
    default: "Fathom — Navigate any building. Your first time in.",
    template: "%s",
  },
  description:
    "Fathom is an AI companion for blind and low-vision people. It sees what's ahead and guides you where you're going, from your iPhone — no maps, beacons, or setup.",
  openGraph: {
    title: "Fathom — Navigate any building. Your first time in.",
    description: "An AI navigation companion for blind and low-vision people.",
    url: "https://fathomvision.app",
    siteName: "Fathom",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
};
```

- [ ] **Step 4: Write `public/manifest.webmanifest`**

```json
{
  "name": "Fathom",
  "short_name": "Fathom",
  "description": "AI navigation companion for blind and low-vision people.",
  "start_url": "/",
  "display": "browser",
  "background_color": "#f7f4ee",
  "theme_color": "#16130f"
}
```

- [ ] **Step 5: Verify build and commit**

Run: `npm run build` → PASS (sitemap and robots routes generated)
```bash
git add -A
git commit -m "feat: SEO metadata, sitemap, robots, manifest"
```

---

## Task 18: Full accessibility & verification pass

**Files:**
- Create: `test/a11y.test.tsx` (axe across all pages)

- [ ] **Step 1: Write `test/a11y.test.tsx`**

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import Home from "@/app/page";
import SupportPage from "@/app/support/page";
import FeedbackPage from "@/app/feedback/page";
import ReleaseNotesPage from "@/app/release-notes/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";

const pages: [string, () => JSX.Element][] = [
  ["Home", Home],
  ["Support", SupportPage],
  ["Feedback", FeedbackPage],
  ["ReleaseNotes", ReleaseNotesPage],
  ["Privacy", PrivacyPage],
  ["Terms", TermsPage],
];

describe("accessibility", () => {
  it.each(pages)("%s has no axe violations", async (_name, Page) => {
    const { container } = render(<Page />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: All tests pass. Fix any axe violations surfaced (missing landmark, heading order, contrast attributes) before continuing.

- [ ] **Step 3: Run lint and build**

Run: `npm run lint && npm run build`
Expected: No lint errors; build succeeds.

- [ ] **Step 4: Manual checklist (document results in commit message)**

Verify by hand in `npm run dev`:
- Tab through every page: visible focus on all links, buttons, fields.
- Theme toggle persists across reload and respects system preference on first visit.
- macOS System Settings → enable Reduce Motion → confirm no transitions animate.
- VoiceOver (Safari): heading navigation works; form errors are announced; success message is announced.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: site-wide accessibility checks"
```

---

## Task 19: Deployment guide + ship to GitHub/Vercel/GoDaddy

**Files:**
- Create: `docs/DEPLOYMENT.md`, `README.md`

- [ ] **Step 1: Write `docs/DEPLOYMENT.md`**

```markdown
# Deploying fathomvision.app

## 1. Push to GitHub
- Create a new empty repo (no README) named `fathom-site` under your account.
- `git remote add origin git@github.com:<USERNAME>/fathom-site.git`
- `git push -u origin main`

## 2. Import in Vercel
- New Project → import the `fathom-site` repo (framework auto-detected: Next.js).
- Add Environment Variables (Production + Preview):
  - `RESEND_API_KEY` — from resend.com
  - `CONTACT_EMAIL` — the inbox that receives submissions
  - `FROM_EMAIL` — `Fathom <onboarding@resend.dev>` until your domain is verified in Resend
- Deploy.

## 3. Resend
- Create an account, add an API key, paste it into Vercel as `RESEND_API_KEY`.
- (Recommended) Verify `fathomvision.app` in Resend and set `FROM_EMAIL` to e.g. `Fathom <hello@fathomvision.app>` so mail isn't from a shared sandbox domain.

## 4. Domain (GoDaddy → Vercel)
- In Vercel → Project → Settings → Domains, add `fathomvision.app` and `www.fathomvision.app`.
- Vercel shows the exact records. In GoDaddy → DNS:
  - Apex `fathomvision.app`: A record → `76.76.21.21`
  - `www`: CNAME → `cname.vercel-dns.com`
- `.app` is HTTPS-only (HSTS preload). Vercel provisions the TLS certificate automatically once DNS resolves.
- Set `www` → apex redirect (or vice versa) in Vercel domain settings.

## 5. Verify
- Visit https://fathomvision.app — loads over HTTPS.
- Submit the feedback form and confirm the email arrives at `CONTACT_EMAIL`.
```

- [ ] **Step 2: Write a short `README.md`**

```markdown
# Fathom website

Public site for Fathom (fathomvision.app). Next.js + Tailwind, deployed on Vercel.

- `npm run dev` — local dev
- `npm test` — unit + accessibility tests
- `npm run build` — production build

Forms email submissions via Resend (see `docs/DEPLOYMENT.md` for env vars).
Spec: `docs/superpowers/specs/2026-05-30-fathom-website-design.md`.
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: deployment guide and readme"
```

- [ ] **Step 4: Ship (run with Ryan)**

Execute the steps in `docs/DEPLOYMENT.md` together: push to GitHub, import in Vercel, set env vars, connect the domain. This step requires Ryan's accounts and is performed interactively, not by an autonomous agent.

---

## Self-Review

**Spec coverage check:**
- Stack (Next.js/TS/Tailwind/Resend/Vercel) → Tasks 1, 9, 19 ✓
- 6 pages (home, support, feedback, release-notes, privacy, terms) → Tasks 11–16 ✓
- FathomUI visual port (ink ramp, fonts, glass, grain, dark mode, contrast, reduced motion) → Tasks 3, 4, 5 ✓
- Two forms + email backend + honeypot → Tasks 8, 9, 10 ✓
- Accessibility AAA acceptance criteria → Tasks 3, 10, 18 ✓
- Apple requirements (support URL, privacy, terms, deletion path) → Tasks 13, 15, 16 ✓
- Release notes editable data file → Task 14 ✓
- Deployment + domain → Task 19 ✓
- SEO/sitemap (implied by production site) → Task 17 ✓

**Placeholder scan:** No "TBD"/"implement later" steps. Bracketed content notes (support email, effective date, mode story) are intentional review items, each flagged and given a concrete default so the site builds and runs as-is.

**Type consistency:** `validateSubmission`/`isValidEmail`/`FormType`/`SubmissionInput` defined in Task 8 are used identically in Tasks 9 and 10. `Surface` register prop, `Button` variant/size props, `Release`/`FaqItem` interfaces are consistent across their consumers. The honeypot field is named `company` in the form (Task 10), the API (Task 9), and its test — consistent.

**Open items deferred to content review (non-blocking):** public mode story, real support/privacy email addresses, launch date, pricing/privacy specifics, legal vetting of Privacy/Terms.
