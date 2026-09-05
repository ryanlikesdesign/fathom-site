# Homepage editorial redesign — Design

**Date:** 2026-09-05
**Owner:** Ryan Higgins
**Status:** Approved in conversation; implementation follows directly
**Supersedes:** the home-page section of `2026-05-30-fathom-website-design.md` (mode story, launch-phase copy, animation notes). Everything else in that spec still holds.

## Goal

Make the homepage tell the truth about Fathom 1.2.0, explain its value editorially rather than as a feature menu, and do it with motion good enough to read as authored. The audience is the app's audience: blind and low-vision people, plus the sighted allies who look on their behalf.

## Scope

Homepage only (`app/page.tsx`, `components/FathomLanding.tsx`, `components/fathom-landing.css`). Any change to a global style (`app/globals.css`) must be verified on Support, Feedback, Release notes, Privacy and Terms before it ships. That is an acceptance criterion, not a courtesy.

Out of scope: Support/FAQ copy, release notes, legal pages, the `/promo` tools.

## What the site currently gets wrong

From a code-level comparison of the site against `project-homer`:

- Every phone mockup shows controls that do not exist ("Ask or Command", a filled "Quick Scan" tile, "Mark Complete", "End Navigation"). The app's primary in every active mode is **Ask Fathom**, with a single **End** tile and Snapshot as an icon.
- Four modes are shown; the app has five. Assistant is a top-level tab.
- "10 fps" detection is true for Go only (Lookout 7, Task 5, capped to 5 alongside cloud).
- "Spatial audio: left, right, ahead, behind" overstates. The app pans left/right.
- Nothing about pointing, the Snapshot options, Read a screen, Siri shortcuts, LiDAR grounding, or which modes are Plus.
- `ModeCard.tsx` has no call sites.

## Page architecture

Situation-led. Each beat is one `<section aria-labelledby>` with a real `<h2>`, so a screen-reader user can move through the page by heading and get the whole story with no motion at all.

| # | Beat | Mode | Tier |
|---|---|---|---|
| 0 | Hero | | |
| 1 | Walk in | Lookout | Free |
| 2 | Find it | Go | Plus |
| 3 | Do it | Task, Live Task (beta) | Plus |
| 4 | Plan it | Assistant | Plus |
| 5 | Just point | Point-to-ask, Snapshot options | Free |
| 6 | Under the hood | | |
| 7 | Free and Plus | | |
| 8 | Download | | |

## Copy

Principles: direct, concrete, second person, no em dashes in short copy, no listicle energy, no claim that the code does not support. Every number and label below is sourced from the app.

**Hero.** Headline stays: *Navigate any building. Your first time in.* Lede: *Fathom is an AI companion for blind and low-vision people. It tells you what's ahead, walks you to where you're going, and helps you do what you came for. On your iPhone. No maps, no beacons, no setup.*

**1 · Walk in.** *You walk in. Fathom keeps talking.* Lookout narrates what's around you as it changes. Obstacle alerts arrive through haptics in under 100 ms and keep working with no connection. Pointing works hands-free here.

**2 · Find it.** *Say where. Fathom walks you there.* Directions on a clock face: *the counter is at 2 o'clock, about eight meters.* Pointing works hands-free here too.

**3 · Do it.** *The form. The kiosk. The thing you came for.* Task guides step by step. Live Task adds push-to-talk voice and is labeled beta, as it is in the app.

**4 · Plan it.** *Tell it the goal. It makes the plan and runs it.* Assistant turns a goal into steps and hands off to the right mode.

**5 · Just point.** *Point at anything. Fathom tells you what it is, then what it says.* The real sequence, in order: hold a point for about a second, feel a tap, hear the earcon, then the answer in three parts: the thing in a few words, any words on it read exactly, then the rest. LiDAR measures the distance to what you're pointing at, so it describes what is there rather than guessing. Sweep to something else to hear about that. Hands-free in Lookout and Go; from the Snapshot menu anywhere. Then the Snapshot options by their real names: Read text, Identify object, Ask about what's in view, What am I pointing at, Read a screen.

**6 · Under the hood.** On-device object detection up to ten times a second. LiDAR depth so distances are measured. Haptics under 100 ms. Earcons from the left or right. Safety alerts that work offline. Ask Fathom by voice, Siri or the Action button. Nothing sold, nothing kept it doesn't need.

**7 · Free and Plus.** *Lookout, Snapshot, pointing and every safety alert are free forever. Go, Task, Live Task and Assistant are Fathom Plus: $12.99 a month after a seven-day free trial. No account needed.*

**8 · Download.** Site-native primary button. The "iOS 17+" line stays only if the app's deployment target confirms it.

## Phone mockups

Simplified versions of the real screens, built from simulator captures of 1.2.0 so nothing is invented. Each shows fewer elements than the app, sized up for a 176-px-wide phone and for readers at 200% zoom, using only labels and controls the app has.

- One shared `Phone` frame with the iOS status bar and the app's four-item tab bar (Home, Assistant, History, Settings).
- Screens: Home (mode grid with the Snapshot split button), Lookout active, Go active, Live Task active, Assistant, and a Point state. Every active screen has **Ask Fathom** as primary, the Snapshot icon, one **End** tile, and the ⋯ menu.
- Captions ("spoken lines") are real text in the DOM, marked so VoiceOver reads them in order; they are not baked into images.
- `ModeCard.tsx` is deleted.

## Motion

Native CSS scroll-driven animation (`animation-timeline: view()` / `scroll()`, `animation-range`), no library. Rules:

1. Scrub, don't trigger. Beats progress with the scroll position and reverse when the reader scrolls back.
2. Compositor-only properties: `transform`, `opacity`, `clip-path`. Nothing that lays out.
3. One named timeline per beat; children stagger with `animation-range` offsets rather than JavaScript.
4. The existing global `prefers-reduced-motion` kill-switch is the no-motion path. Every element's finished state is its resting state, so a reader with motion off, or an older engine, sees the complete page.
5. Motion never carries a meaning the text does not also carry.
6. The hero keeps its sonar ripple and gains a scroll-linked settle into the phone.

Per beat: Lookout captions rise in as spoken lines; Go's clock-face dial rotates and the distance counts down; Task steps tick and the push-to-talk ring pulses; Assistant's goal unfolds into a plan; the pointing hand extends and the three-part answer arrives in three scroll-linked beats; Under the hood is a quiet reveal.

Motion is added for a beat with JavaScript only if CSS cannot express it, and that is called out in the PR.

Performance: no jank on an iPhone 12 at 60 fps; Lighthouse performance stays at or above the current score.

## Consistency and verification

- Global-style changes are checked on every other public page in both themes.
- Measured, not read: touch targets at 375 px, no horizontal overflow at 320 px, computed contrast against the tokens, VoiceOver reading order, reduced motion.
- jest-axe on the new landing sections; a test that every beat has an `h2`; a test that the mode labels match a fixture derived from the app.
- Both project reviewers run on the result.

## Revision, same day

The nine-beat rebuild described above was implemented, reviewed by Ryan, and
rejected: structurally right, visually far weaker than the page it replaced.
The decision was to rebuild **inside the existing visual system** rather than
replace it. What shipped instead:

- The previous landing (hero, "The gap", the scrolly with its crafted iOS
  screens, "Everywhere", "Spectrum", download) stays, with its CSS intact.
- Every mockup control that the app doesn't have is replaced by the real
  active-mode footer (Ask Fathom · Snapshot · End) with More actions as a flat
  icon in the top bar. The Awareness pill is removed from screens; it lives
  inside More actions in the app. Live Task's chip reads BETA.
- Two scrolly steps are added in the same visual language: **Snapshot** (the
  Home screen with its five-option menu open) and **Point to ask**.
- Copy fixes: five modes including Assistant; Awareness levels named as the
  app names them; "several times a second" instead of "10 fps"; "Directional
  sound" instead of "Spatial audio … ahead, behind"; the Plus tier and price
  stated on the download card; em dashes removed from short copy.
- Mockup `<button>`s become `<span>`s: nothing focusable inside an
  `aria-hidden` phone. The landing's own `:focus-visible` and `.skip-link`
  overrides are removed; `globals.css` owns those.
- `lib/landing-content.ts` and its tests remain the source of every
  app-derived label; `test/landing.test.tsx` holds the page to it.
- The `Phone` component, six screens, nine beat components and the
  scroll-timeline utilities are deleted. `ModeCard.tsx` stays deleted.

Both reviewers ran on the result. Applied: step headings' muted half and the
whisper line moved from `--fg-tertiary` to `--fg-secondary` (the tertiary pair
was 3.3:1 in dark); inactive scrolly steps stay dimmed but go to full opacity
under `prefers-contrast: more`; the pointing example is now visible text in the
Point step (it was only inside the hidden phones); the Snapshot chevron is an
SVG in `--s-on-accent` (it was invisible on its own background); `title`
attributes and dead ARIA came off the mockups; the mobile phones' footer no
longer wraps "Ask Fathom"; the Point stage centres like Lookout's; the Home step
reuses `HomeScreen` instead of a second copy of the markup; the dead
`.seg-*`, `.lk-action*`, `.go-action*` and `.live-*` control rules are gone.
Not applied: replacing the 28% dimming of inactive steps, which is part of the
scrolly's design; recorded here as a known AAA gap for low-vision readers
using magnification without `prefers-contrast`.

Motion is the page's existing reveal-on-scroll and scrolly screen switching.
The scroll-scrubbed choreography in the section above is not shipped; if it
returns, it should be applied to the existing screens, not to new ones.

## Design-system additions

Reported for the decision log: `.mode-actions` / `.mode-primary` / `.mode-icon`
/ `.mode-end` / `.mode-more` (the real active-mode footer, in the screen-token
vocabulary), `.snap-anchor` / `.snap-menu`, `.pt-*` for the pointing state, and
`.step-example` for a quoted spoken example inside a step, all in
`components/fathom-landing.css`. One new screen token, `--s-shadow-pop`, in both
theme blocks, for floating menus inside the phones. No new color tokens.
