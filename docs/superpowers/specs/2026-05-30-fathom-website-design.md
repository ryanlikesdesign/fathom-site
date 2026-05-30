# Fathom Website — Design Spec

**Date:** 2026-05-30
**Domain:** fathomvision.app (registered at GoDaddy)
**Owner:** Ryan Higgins
**Status:** Approved — ready for implementation plan

## Goal

Ship the public marketing and support website for Fathom, the iOS indoor-navigation app for blind and low-vision people. Port the existing page at ryanhiggins.me/fathom as the home page, add a support page and a feedback form, and include the legal pages Apple requires for App Store submission. The site is hosted on Vercel and managed through GitHub.

The site's own accessibility is a credibility statement. It is built to the same WCAG AAA bar as the app, not a lower one.

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Vercel-native, zero-config deploys, serverless route handlers for forms |
| Styling | Tailwind CSS | Token-mappable to FathomUI, fast to build, small output |
| Forms backend | Next.js Route Handler → Resend | Email submissions without a separate backend |
| Hosting | Vercel (Hobby tier) | Connected to GitHub repo, auto-deploy on push |
| Source control | GitHub | Single repo, `main` auto-deploys to production |
| Fonts | Source Serif 4 + Inter (Google Fonts, self-hosted via `next/font`) | Matches FathomUI; self-hosting avoids layout shift and third-party requests |

Rejected: Astro (less Vercel-idiomatic, form glue heavier) and plain HTML/CSS (needs third-party form service, manual deploys).

## Site structure

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Ported from ryanhiggins.me/fathom |
| `/support` | Support | FAQ + contact. Serves as Apple "Support URL" |
| `/feedback` | Feedback | Open to all users; emails Ryan |
| `/privacy` | Privacy Policy | Apple requirement |
| `/terms` | Terms of Use (EULA) | Apple requirement (subscription pricing) |
| `/release-notes` | Release Notes | Version history / "What's New" |

Global: sticky header (brand + nav + theme toggle), footer (nav + legal links + contact), skip-to-content link on every page.

## Home page content

Ported and lightly restructured from the live page. Sections:

1. **Hero** — "Navigate any building. Your first time in." + value prop (AI companion for blind/low-vision; sees what's ahead, guides where you're going; iPhone, no maps/beacons/setup). Primary CTA: Request early access. Secondary: Learn how it works.
2. **The Gap** — Indoor navigation is unsolved; GPS fails indoors; existing tools need pre-built maps or sighted help. Fathom is a full sensory companion: navigation, exploration, task completion.
3. **Modes** — Card grid. **Mode list is a content decision flagged for review** (see Open Items). Default to the live page's four: Snapshot, Lookout, Go, Task.
4. **Key features** — On-device AI vision + depth sensing (10fps), haptics under 100ms, spatial audio + earcons, works offline, no building setup, clock-face directions.
5. **Accessibility design** — High contrast, large targets, VoiceOver, low-vision-first (not a bolt-on).
6. **Early-access CTA** — Email capture form, founding-member framing, launch summer 2026.

All copy follows Ryan's brand voice: minimal, direct, no AI tells, no listicle energy.

## Release notes page

A reverse-chronological list of app versions, each with version number, date, and grouped notes (New · Improved · Fixed). Content lives as a typed data file (or one Markdown file per release) in the repo, so adding a release is a small, copy-paste-shaped edit you can do without touching layout code. Newest version anchored at top; each entry is a Lift-register card. Styled to match the App Store "What's New" tone so the copy is reusable.

## Visual system (FathomUI port)

Direct port of the FathomUI design system to web tokens.

- **Color:** Warm grayscale ramp (`p-ink-0`…`p-ink-1000`). No pure black/white. Semantic tokens flip for dark mode. Light bg `#F7F4EE`, dark bg `#16130F`. Primary text hits 11.2:1 (AAA).
- **Type:** Source Serif 4 (display/headings, weights 300–400, optical sizing auto), Inter (body/UI). Body line-height 1.7. Scale per FathomUI (`text-display` 72px → `text-label` 12px).
- **Surfaces:** Glass register system (Base→Peak) implemented with CSS backdrop-blur + layered borders (top highlight, bottom shadow) + grain overlay (SVG `feTurbulence`, `mix-blend-mode: overlay`, per-register opacity). Grain never animates.
- **Buttons:** Primary (solid), Secondary (glass/Summit), Link. Kinetic hover lift + pressed inset shadow. Focus = 2px warm outline, 3px offset.
- **Motion:** 150ms ease-out default. `prefers-reduced-motion` → 0ms, no exceptions.
- **Dark mode:** System preference + manual toggle. Persisted in localStorage. Honors `prefers-contrast: more`.

## Forms

Both forms post to a Next.js Route Handler that sends email via Resend to Ryan's chosen address. Shared submission component with full accessibility:

- Native `<label>` per field, `fieldset`/`legend` for groups.
- Required-field validation with an error summary region (`role="alert"`, focus moved to it on submit failure) plus per-field `aria-describedby` error text.
- Success state announced via `aria-live="polite"`.
- Hidden honeypot field for spam; submissions with it filled are silently dropped.
- Progressive enhancement: server validates regardless of client JS.

**Feedback form** (`/feedback`, all users):
- Name (optional, text)
- Email (optional, for follow-up)
- Category (select: Bug · Suggestion · Accessibility · General)
- Message (required, textarea)

**Early-access form** (home):
- Email (required)
- Name (optional)

## Legal pages

Drafted from the app's real data practices, for Ryan to review and a lawyer to optionally vet:

- **Privacy Policy** — camera frames sent to Google Gemini cloud for vision; on-device YOLO/LiDAR processing; what is and isn't stored; no sale of data; contact for data requests; account/data deletion path (even if no accounts today, state it).
- **Terms of Use (EULA)** — subscription/founding-member terms, acceptable use, disclaimers (the app is an aid, not a replacement for a cane/guide dog or independent judgment — important for a safety-adjacent product), limitation of liability, governing law.

## Deployment & domain

1. Push repo to GitHub (`main`).
2. Import repo in Vercel; set `RESEND_API_KEY` and `CONTACT_EMAIL` as environment variables.
3. Add `fathomvision.app` (and `www`) as domains in Vercel.
4. In GoDaddy DNS, point the apex + `www` at Vercel per Vercel's instructions (A record `76.76.21.21` for apex, or Vercel nameservers; CNAME for `www`). `.app` is HSTS-preloaded, so HTTPS is mandatory — Vercel provisions the certificate automatically.
5. Optional: verify `fathomvision.app` in Resend so form email sends from a branded address instead of `onboarding@resend.dev`.

## Accessibility acceptance criteria

- Primary text ≥ 11.2:1 contrast; secondary ≥ 5.6:1.
- Every interactive element keyboard-reachable with a visible focus state.
- No information by color alone.
- `prefers-reduced-motion` disables all transitions.
- `prefers-contrast: more` increases text weight and border visibility.
- All forms: labeled fields, programmatic error association, live-region announcements.
- Tested with VoiceOver (Safari) and keyboard-only navigation before launch.
- Touch targets ≥ 44px.

## What's needed from Ryan (deploy phase)

1. GitHub username + whether to create the repo locally or use an existing empty one.
2. Vercel account (free).
3. Resend account + API key + recipient email for submissions.
4. GoDaddy DNS access to add records.
5. Approval to use screenshots in `project-homer/Fathom Screenshots` and a logo/wordmark.

## Open items (confirm at content review)

- **Mode story:** Live page shows 4 (Snapshot/Lookout/Go/Task). App CLAUDE.md lists Lookout/Go/Live Task/Assistant with Snapshot embedded. Pick the public narrative.
- **Launch date:** Live page says summer 2026 — confirm.
- **Pricing:** Founding-member/subscription specifics for the Terms page.
- **Privacy specifics:** Confirm exactly what data leaves the device and what (if anything) is retained.

## Out of scope (YAGNI)

- CMS / blog.
- User accounts or auth.
- Analytics (can add later if wanted).
- Internationalization.
- A database (email-only submissions per decision).
