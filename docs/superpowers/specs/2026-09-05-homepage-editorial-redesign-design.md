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

Hero, later the same day, on Ryan's note that "Navigate any building" was too
narrow for an app meant to make an inaccessible world usable: headline is now
*Walk in. Know the room. / Do what you came for.* (two lines on desktop, one
sentence per line under 600px), lede opens with "Most places were built
without you in mind." The footer tagline and the OG image carry the same line.

Mockup pass and motion, later the same day. The Assistant active-session
screen was rebuilt against `AssistantActiveSessionView.swift`: it uses the
shared ActiveModeShell, so it now shows the same Ask Fathom + End footer and
⋯ menu as every other active mode, the step number in the shell title, a
120pt orb, the step text, executor status and one Next Step button. The
invented End/Done bar, step card, chevrons and "+" tile are gone, along with
the `&check;` entity that was rendering literally. The Snapshot subtitle holds
to two lines at every width. Short windows now scale the whole device
(`--phone-scale`) instead of squeezing screens designed for a 780px phone,
which was pushing content under the footers.

Motion, added at Ryan's request and gated on `@supports (animation-timeline:
scroll())`: the hero phone sits at a fixed 3D tilt and straightens, lifts and
settles as the page scrolls away; the sonar rings drift outward and fade
behind it; the scrolly phone turns slowly through the feature story on a
`view-timeline` named on `.scrolly`. Reveals gained depth (translateZ plus a
small rotateX) and the spectrum cards stagger. Every resting state is the
static composition, so engines without scroll timelines and readers with
reduced motion get the page whole, and the reduced-motion block names the
three new animated elements explicitly.

Phone geometry, after Ryan flagged the chrome as wonky. The device is now
drawn once at a single design size (380px) and scaled per context with `zoom`,
instead of each context setting its own width. Everything inside a phone is
fixed pixels, so a per-context width made the status bar and the app content
disagree on their insets at every size but the design width. The bezel is
1.1% of the body (about 3px as rendered) and the frame and screen radii are
percentages of each axis, so they stay concentric at any scale; before, a
fixed 54/44 pair only lined up on the 380px phone and the screen's corners cut
into the status bar on the smaller ones. The Dynamic Island is dark enough to
read against the dark screen.

The pinned hero, per Ryan: the hero never moves at all. It is sticky for the
length of a 260vh stage, and everything below it sits in a `.hero-cover` plane
pulled up a full viewport, so the page rides over the pinned hero and has
covered it completely by the time it unpins. Through that, the device recedes
subtly (to 80% and slightly toward the sonar's center) while the rings tighten
and hold. Desktop and windows at least 720px tall only; everywhere else the
hero is an ordinary section.

Motion is otherwise the page's existing reveal-on-scroll and scrolly screen
switching.
The scroll-scrubbed choreography in the section above is not shipped; if it
returns, it should be applied to the existing screens, not to new ones.

Re-review fixes, 2026-09-09. The sticky scrolly phone is now the same 380px
device as the hero and the inline step phones, scaled with `zoom` (its old
360x780 layout re-wrapped the Snapshot subtitle differently from the hero);
the zoom steps land on the heights the old scale breakpoints produced. On
landscape phones the sticky device has one sizing path (the height clamp no
longer stacks on the short-window zoom, which had shrunk it to 96x207 at
932x430 and clipped the Home mode list), and the inline step phone stays at a
readable .62 instead of .35. The 28% step dim is gated on the scroll island
(`html[data-motion-ready]`), so a no-JS load reads every step at full
strength, and OS Reduce Motion now un-dims the steps exactly as the Pause
motion button does. Light-theme screens get a Contrast Boost path (the app's
boost is dark-only, so the light screens take the site's own boosted light
ink). The Activities tap indicator lost its solid dot, which sat on the one
label the step tells the reader to tap. The Home mockup's Task row shows the
default backend with no BETA badge, since the app pairs the badge only with
the "uses more AI budget" subtitle. Each step's visible eyebrow is
`aria-hidden`; the heading already carries it. Site chrome: the header
collapses to the icon-only controls at 1024px, not 940 (it overflowed from
941 to 999px, the 200% zoom band); both control labels are visually hidden
rather than `display:none`, so "Toggle theme" stays in the button's name; the
mobile menu inerts the header and the skip link along with `main` and
`footer`; the light `--field-border` is 0.5 alpha (3.49:1 on the field, was
2.26). `lib/landing-content.ts` lost the titles, bodies, captions, steps,
goal, plan and notes nothing rendered; it now holds only what the page reads.

Accepted AAA gap, recorded like the step dim above: a set of `aria-hidden`
mockup spots sit under the site's 5.6:1 secondary floor because they mirror
`FathomColors.swift` for fidelity. Measured against the shipped tokens on
2026-09-09 (the earlier record named only three). Light theme: the Assistant
composer field (`.as-input`, `--s-ink-3` on `--s-surface-2`, 4.66:1) and the
plan step subtitles (`.as-plan-sub`, 4.66:1); the "Analyzing..." line
(`.as-step-analyzing`, `--s-ink-4` on `--s-bg`, 4.64:1); the next-step tile
(`.as-next-step`, `--s-bg` on `--s-green-fill`, 4.84:1); the Home row chevron
(`.row-chev`, `--s-ink-4` on `--s-surface`, 4.98:1; it was the one consumer of
`--s-faint` at 4.12:1, a token the Contrast Boost block never lifted, so that
token is gone); the `--s-ink-3` captions on `--s-bg` at 5.16:1 (`.home-tag`,
the Home AI disclaimer, `.as-sub`, the RECENT divider, `.go-sub`); the tab-bar
labels and plan step numbers (`.tab small`, `.as-plan-n`, 5.39:1); and the
Assistant chips (`.as-chip`, 5.53:1 on `--s-surface`). Dark theme: `.as-input`
and `.as-plan-sub` (`--s-ink-3` on `--s-surface-2`, 5.08:1) and `.as-next-step`
(5.41:1). All clear AA, are hidden from readers, and are restated in the page
text. Under Contrast Boost the ink spots lift to 10:1 or better in both themes
(`--s-ink-2/3/4` are boosted; `.as-plan-n` on `--s-accent-text` is boosted in
dark only); the green next-step tile keeps its app color. Making them stronger
is a `fathomTextSecondary` / `fathomTextTertiary` light-mode change in
project-homer, which the site would then mirror, not a site-only edit.

Also from the 2026-09-09 re-review: the phone islands (`StickyPhone`,
`MobilePhone`) now render both sets on the server and the hydration pass and
let the 861px CSS breakpoint show one, so a no-JS load has its mockups (it had
none but the hero's). That is a deliberate, no-JS-only exception to the "never
a second hidden copy of every screen" rule in those files; a JS visitor still
unmounts the losing set one render after hydration. The primary CTA carries a
`--accent-signal` edge (7.4:1 on the dark ground; invisible in light, where
the token equals the fill). The Pause motion control keeps one cue (a fixed
name plus `aria-pressed`) and, with OS Reduce Motion on, reads "Motion off,
set by your device" and is `aria-disabled`, since the OS block in
`globals.css` cannot be overridden from the page.

## Design-system additions

Reported for the decision log: `.mode-actions` / `.mode-primary` / `.mode-icon`
/ `.mode-end` / `.mode-more` (the real active-mode footer, in the screen-token
vocabulary), `.snap-anchor` / `.snap-menu`, `.pt-*` for the pointing state, and
`.step-example` for a quoted spoken example inside a step, all in
`components/fathom-landing.css`. One new screen token, `--s-shadow-pop`, in both
theme blocks, for floating menus inside the phones. No new color tokens.
