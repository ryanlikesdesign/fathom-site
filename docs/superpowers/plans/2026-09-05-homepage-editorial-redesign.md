# Homepage Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Fathom homepage as a situation-led editorial story with truthful phone mockups and native scroll-driven motion, per `docs/superpowers/specs/2026-09-05-homepage-editorial-redesign-design.md`.

**Architecture:** One file per beat under `components/landing/`, composed by `FathomLanding.tsx`. A single `Phone` frame renders six simplified screens whose captions are real DOM text. All copy and every app-derived label live in a typed fixture, `lib/landing-content.ts`, so tests can prove the site matches the app. Motion is CSS `animation-timeline` with the existing reduced-motion kill-switch as the no-motion path.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (CSS-first), Vitest + Testing Library + jest-axe. No new runtime dependencies.

---

## File structure

| File | Responsibility |
|---|---|
| `lib/landing-content.ts` | Every string on the page and every app-derived fact (mode names, Snapshot options, tiers, price). Single source of truth; tests import it. |
| `components/landing/Phone.tsx` | The device frame: status bar, screen slot, four-item tab bar. Knows nothing about modes. |
| `components/landing/screens/HomeScreen.tsx` … `PointScreen.tsx` | Six simplified screens. Each renders its captions as text. |
| `components/landing/beats/Hero.tsx`, `WalkIn.tsx`, `FindIt.tsx`, `DoIt.tsx`, `PlanIt.tsx`, `JustPoint.tsx`, `UnderTheHood.tsx`, `FreeAndPlus.tsx`, `Download.tsx` | One `<section aria-labelledby>` per beat with its `h2`, copy from the fixture, its phone screen, and its motion classes. |
| `components/landing/landing.css` | Layout and motion for the beats and phone. Scroll-timeline keyframes live here. |
| `components/FathomLanding.tsx` | Composition only: hero, the beats in order, footer hooks. Shrinks from ~750 lines to ~60. |
| `components/fathom-landing.css` | Trimmed to what the header/hero ripples still use; dead selectors removed. |
| `test/landing-content.test.ts` | Fixture matches the app (labels, tiers, price). |
| `test/landing.test.tsx` | Every beat has an `h2`; axe passes per beat; captions render as text; the tab bar names match. |
| `docs/superpowers/reference/2026-09-05-app-screens/` | Simulator captures used as the source of truth for the mockups. Committed, not shipped. |

Deleted: `components/ModeCard.tsx` (no call sites).

---

### Task 1: Content fixture, proven against the app

**Files:**
- Create: `lib/landing-content.ts`
- Test: `test/landing-content.test.ts`

- [ ] **Step 1: Write the failing test.** The values are copied from `project-homer` with their sources; the test is the contract that stops the site drifting again.

```ts
import { describe, it, expect } from "vitest";
import { MODES, SNAPSHOT_OPTIONS, TAB_BAR, ACTIVE_MODE_CONTROLS, PLUS, POINTING } from "@/lib/landing-content";

describe("landing content matches the app", () => {
  it("names the five modes the app has", () => {
    expect(MODES.map((m) => m.name)).toEqual(["Snapshot", "Lookout", "Go", "Task", "Assistant"]);
  });
  it("lists the Snapshot options in the app's order", () => {
    // HomeView.swift:268-274
    expect(SNAPSHOT_OPTIONS).toEqual([
      "Read text", "Identify object", "Ask about what's in view", "What am I pointing at", "Read a screen",
    ]);
  });
  it("uses the app's tab bar", () => {
    // FathomApp.swift:65-79
    expect(TAB_BAR).toEqual(["Home", "Assistant", "History", "Settings"]);
  });
  it("uses the app's active-mode controls", () => {
    // ActiveModeShell.swift:13-19, 412
    expect(ACTIVE_MODE_CONTROLS).toEqual({ primary: "Ask Fathom", end: "End", menu: "More actions" });
  });
  it("gates exactly the four Plus modes", () => {
    // SubscriptionStatus.swift:21-27
    expect(MODES.filter((m) => m.tier === "plus").map((m) => m.name)).toEqual(["Go", "Task", "Assistant"]);
    expect(PLUS.price).toBe("$12.99");
    expect(PLUS.trialDays).toBe(7);
  });
  it("describes pointing in the app's order", () => {
    // FathomViewModel.swift:1856-1857, 1381, 1397; SystemPrompts.swift:540-572
    expect(POINTING.sequence).toEqual(["haptic", "earcon", "thing", "words", "rest"]);
    expect(POINTING.handsFreeIn).toEqual(["Lookout", "Go"]);
  });
});
```

- [ ] **Step 2: Run it.** `npx vitest run test/landing-content.test.ts` → FAIL, module not found.

- [ ] **Step 3: Write the fixture.**

```ts
export type Tier = "free" | "plus";

export interface Mode {
  name: "Snapshot" | "Lookout" | "Go" | "Task" | "Assistant";
  subtitle: string;   // HomeView.swift subtitles
  tier: Tier;
}

/** HomeView.swift:290-381 and FathomApp.swift:69 */
export const MODES: Mode[] = [
  { name: "Snapshot",  subtitle: "Quick scan of your surroundings", tier: "free" },
  { name: "Lookout",   subtitle: "Continuous awareness",            tier: "free" },
  { name: "Go",        subtitle: "Navigate to a destination",       tier: "plus" },
  { name: "Task",      subtitle: "Step-by-step guidance",           tier: "plus" },
  { name: "Assistant", subtitle: "Tell it the goal",                tier: "plus" },
];

/** HomeView.swift:268-274, in the app's order. */
export const SNAPSHOT_OPTIONS = [
  "Read text", "Identify object", "Ask about what's in view", "What am I pointing at", "Read a screen",
] as const;

/** FathomApp.swift:65-79 */
export const TAB_BAR = ["Home", "Assistant", "History", "Settings"] as const;

/** ActiveModeShell.swift:13-19, 412. Every active mode uses exactly these. */
export const ACTIVE_MODE_CONTROLS = { primary: "Ask Fathom", end: "End", menu: "More actions" } as const;

/** PaywallView.swift:135; StoreKit P1W */
export const PLUS = { price: "$12.99", period: "month", trialDays: 7 } as const;

export const POINTING = {
  /** FathomViewModel.swift:1856-1857 (haptic), :1381 (earcon); SystemPrompts.swift:540-572 (beats) */
  sequence: ["haptic", "earcon", "thing", "words", "rest"] as const,
  /** FathomViewModel.swift:1821-1824 */
  handsFreeIn: ["Lookout", "Go"] as const,
  /** SnapshotIntent.swift:38 */
  firstCue: "Looking where you're pointing.",
  /** PointingIntroPrompt.swift:33-36 */
  intro: "Hold your arm out in front of the camera and point at anything for about a second.",
};

/** Page copy. Short copy has no em dashes. */
export const COPY = {
  hero: {
    eyebrow: "Now on the App Store",
    title: ["Navigate any", "building.", "Your first time in."],
    lede: "Fathom is an AI companion for blind and low-vision people. It tells you what's ahead, walks you to where you're going, and helps you do what you came for. On your iPhone. No maps, no beacons, no setup.",
    primary: "Download on the App Store",
    secondary: "See what it does",
  },
  walkIn: {
    eyebrow: "Walk in",
    title: "You walk in. Fathom keeps talking.",
    body: "Lookout narrates what's around you as it changes: doors, signs, people, the thing in your path. Obstacle alerts come through your phone as a tap in under 100 milliseconds, and they keep working with no signal at all.",
    captions: ["Glass doors ahead, opening.", "Reception desk at 11 o'clock, about six meters.", "Person approaching from your left."],
    tier: "free" as Tier,
  },
  findIt: {
    eyebrow: "Find it",
    title: "Say where. Fathom walks you there.",
    body: "Directions on a clock face, in meters, updated as you move.",
    captions: ["The counter is at 2 o'clock, about eight meters.", "Turn slightly right.", "Two meters. It's in front of you."],
    tier: "plus" as Tier,
  },
  doIt: {
    eyebrow: "Do it",
    title: "The form. The kiosk. The thing you came for.",
    body: "Task takes it one step at a time. Live Task adds push-to-talk voice, so you can ask mid-step. Live Task is in beta, as it says in the app.",
    steps: ["Find the sign-in sheet", "Fill in your name and time", "Take a seat near the desk"],
    tier: "plus" as Tier,
  },
  planIt: {
    eyebrow: "Plan it",
    title: "Tell it the goal. It makes the plan and runs it.",
    body: "Assistant turns a goal into steps and hands each one to the right mode.",
    goal: "Renew my library card",
    plan: ["Go to the front desk", "Ask what ID they need", "Task: fill in the renewal form"],
    tier: "plus" as Tier,
  },
  justPoint: {
    eyebrow: "Just point",
    title: "Point at anything. Fathom tells you what it is, then what it says.",
    body: "Hold a point for about a second. You feel a tap, hear the earcon, and get the answer in three parts: the thing in a few words, any words on it read exactly, then the rest. LiDAR measures the distance to what you're pointing at, so it describes what is there instead of guessing. Sweep to something else to hear about that too.",
    where: "Hands-free in Lookout and Go. From the Snapshot menu anywhere.",
    beats: ["A vending machine.", "Buttons read: Water, Cola, Coffee. Coffee is sold out.", "Card reader on the right side, about a meter away."],
    snapshotIntro: "Snapshot's other options, by name:",
    tier: "free" as Tier,
  },
  underTheHood: {
    title: "Under the hood",
    items: [
      { term: "On-device detection", detail: "Objects are found on your phone, up to ten times a second." },
      { term: "LiDAR depth", detail: "Distances are measured, not estimated." },
      { term: "Haptics under 100 ms", detail: "Alerts arrive before a sentence could." },
      { term: "Earcons left and right", detail: "A sound from the side something is on." },
      { term: "Works offline", detail: "Safety alerts never need a connection." },
      { term: "Ask by voice, Siri or the Action button", detail: "Eight shortcuts ship with the app." },
      { term: "Nothing sold", detail: "Frames go to the model and are not kept." },
    ],
  },
  freeAndPlus: {
    title: "Free, and Plus",
    free: "Lookout, Snapshot, pointing and every safety alert are free forever.",
    plus: "Go, Task, Live Task and Assistant are Fathom Plus: $12.99 a month after a seven-day free trial.",
    note: "No account needed.",
  },
  download: {
    title: "Get Fathom",
    button: "Download on the App Store",
    meta: "Free · iPhone",
  },
} as const;
```

- [ ] **Step 4: Run it.** → PASS.
- [ ] **Step 5: Commit.** `git add lib/landing-content.ts test/landing-content.test.ts && git commit -m "Landing content fixture, proven against the app"`

---

### Task 2: Capture the real screens

**Files:**
- Create: `docs/superpowers/reference/2026-09-05-app-screens/{home,snapshot-menu,lookout,go,live-task,assistant,paywall}.png`

- [ ] **Step 1: Build.** `mcp__Claude_Code_iOS_Simulator__build` with `project_path=/Users/ryanhiggins/apps/project-homer/Fathom/Fathom.xcodeproj`, `scheme=Fathom`. Poll `build_status` until the `.app` path is returned.
- [ ] **Step 2: Boot and launch.** `xcrun simctl boot "iPhone 17 Pro"` (or the newest installed), then `control` → `launch` with the `.app` path.
- [ ] **Step 3: Capture.** `control` → `screenshot` on Home; tap the Snapshot chevron and capture the menu; enter Lookout, Go, Live Task (the camera is black in the simulator; the layout and labels are what matter); the Assistant tab; the paywall (tap a Plus mode). Save each to the reference directory.
- [ ] **Step 4: Note.** In `docs/superpowers/reference/2026-09-05-app-screens/README.md`, one line per capture: what it is and any element deliberately omitted from the mockup.
- [ ] **Step 5: Commit.** `git add docs/superpowers/reference && git commit -m "Reference captures of Fathom 1.2.0 for the landing mockups"`

If the simulator cannot launch the app (camera-dependent startup), fall back to the file:line layout from the research: Home grid `HomeView.swift:290-381`, active shell `ActiveModeShell.swift:13-19,80,412`, Assistant `AssistantView.swift:441,483,621-636`.

---

### Task 3: Phone frame

**Files:**
- Create: `components/landing/Phone.tsx`
- Modify: `components/landing/landing.css` (create)
- Test: `test/landing.test.tsx`

- [ ] **Step 1: Failing test.**

```tsx
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Phone } from "@/components/landing/Phone";

it("Phone renders the app's tab bar and a screen", async () => {
  const { container } = render(<Phone activeTab="Home" label="Fathom home screen"><p>Screen</p></Phone>);
  expect(screen.getByRole("img", { name: "Fathom home screen" })).toBeInTheDocument();
  for (const t of ["Home", "Assistant", "History", "Settings"]) expect(screen.getByText(t)).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Signature:

```tsx
export function Phone({ activeTab, label, children }: {
  activeTab: (typeof TAB_BAR)[number];
  label: string;               // accessible name for the whole device, role="img"
  children: React.ReactNode;   // the screen
})
```
The frame is `role="img"` with `aria-label={label}` **and** the caption text inside stays readable: put captions in a sibling `<ul className="sr-only">` in each beat rather than inside the `role="img"` node, so VoiceOver reads them in order after the image name. Status bar shows `9:41`. Tab bar is four `<span>`s with the active one marked `aria-current="true"`. All colors from tokens; the screen background is `--bg-elevated`.

- [ ] **Step 4: Run** → PASS. **Step 5: Commit.**

---

### Task 4: Six screens

**Files:**
- Create: `components/landing/screens/HomeScreen.tsx`, `LookoutScreen.tsx`, `GoScreen.tsx`, `LiveTaskScreen.tsx`, `AssistantScreen.tsx`, `PointScreen.tsx`
- Test: `test/landing.test.tsx`

Each screen is a pure component. Rules from the spec: fewer elements than the app, sized up, only real labels. Required elements, from the captures and `ACTIVE_MODE_CONTROLS`:

- **Home:** the five mode tiles from `MODES` with subtitles; the Snapshot tile is a split control with a chevron labeled "Snapshot options".
- **Lookout / Go / LiveTask:** a caption area (props: `captions: string[]`), a primary **Ask Fathom**, a Snapshot icon button, one **End** tile, a **More** (⋯) icon. Go also shows a clock-face dial (`props: bearing: number, meters: number`). LiveTask shows a push-to-talk ring and a **Beta** chip. No Awareness pill on screen; it's inside More in the app.
- **Assistant:** the goal, the plan list, chips **Activities** and **Ask Fathom**.
- **Point:** a hand outline and the three-beat answer (`props: beats: [string, string, string]`), each beat a `<p>` with a `data-beat` index for the animation.

- [ ] **Step 1: Failing tests.** One per screen asserting its required labels render, e.g.

```tsx
it("active screens use the app's controls", () => {
  render(<LookoutScreen captions={["Glass doors ahead."]} />);
  expect(screen.getByRole("button", { name: "Ask Fathom" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "End" })).toBeInTheDocument();
  expect(screen.queryByText(/quick scan/i)).toBeNull();   // the invented tile must not come back
});
```
- [ ] **Step 2** FAIL → **Step 3** implement → **Step 4** PASS → **Step 5** commit per screen.

---

### Task 5: Scroll-timeline motion utilities

**Files:**
- Modify: `app/globals.css` (utilities only; they are global by design and are checked on every page in Task 9)
- Modify: `components/landing/landing.css`

- [ ] **Step 1: Add the utilities** after the text-wrap block:

```css
/* ── Scroll-driven motion ────────────────────────────────────────────
   Each beat is its own view timeline; children pick a range of it.
   Compositor-only properties. The reduced-motion block below zeroes
   every animation, so the finished keyframe is the resting state. */
.beat { view-timeline-name: --beat; view-timeline-axis: block; }
.rise   { animation: rise   linear both; animation-timeline: --beat; animation-range: entry 10% entry 60%; }
.settle { animation: settle linear both; animation-timeline: --beat; animation-range: entry 0% cover 40%; }
.stagger > * { animation-timeline: --beat; animation-name: rise; animation-fill-mode: both; animation-timing-function: linear; }
.stagger > :nth-child(1) { animation-range: entry 15% entry 55%; }
.stagger > :nth-child(2) { animation-range: entry 30% entry 70%; }
.stagger > :nth-child(3) { animation-range: entry 45% entry 85%; }
@keyframes rise   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes settle { from { transform: scale(1.06); opacity: .0; } to { transform: none; opacity: 1; } }
@supports not (animation-timeline: view()) { .rise, .settle, .stagger > * { animation: none; } }
```
The existing `@media (prefers-reduced-motion: reduce)` block already zeroes durations with `!important`; confirm it also covers `animation-timeline` by adding `animation: none !important` to it.

- [ ] **Step 2: Per-beat keyframes** in `landing.css`: `dial-turn` (rotate the Go clock hand), `tick` (Task steps: a check draws in via `clip-path`), `ptt-pulse` (LiveTask ring, `transform: scale`), `unfold` (Assistant plan lines `clip-path: inset(0 0 100% 0)` → `inset(0)`), `point-extend` (the hand's finger via `transform: translateX`), `beat-in` (Point answer, three ranges). All `linear both` on `--beat`.
- [ ] **Step 3: Verify in the browser**, not by reading: `getComputedStyle(el).animationTimeline` is `--beat`; scroll the beat and read `getAnimations()[0].currentTime` changing; with `prefers-reduced-motion` emulated, `getAnimations()` is empty or every animation reports its end state. Commit.

---

### Task 6: The beats

**Files:**
- Create: the nine files in `components/landing/beats/`
- Test: `test/landing.test.tsx`

Each beat component:
- `<section id="<slug>" aria-labelledby="<slug>-h" className="beat …">`
- `<p className="eyebrow">` + `<h2 id="<slug>-h">` from `COPY`
- body copy from `COPY`
- a tier chip (**Free** / **Plus**) using the existing `--status-*` tokens, text always present
- the `Phone` with its screen
- `<ul className="sr-only">` of the captions/beats so the spoken lines are read as text

- [ ] **Step 1: Failing test** for the composed page:

```tsx
import { FathomLanding } from "@/components/FathomLanding";
it("every beat is a section with a heading, and the page passes axe", async () => {
  const { container } = render(<FathomLanding />);
  const sections = container.querySelectorAll("section[aria-labelledby]");
  expect(sections.length).toBeGreaterThanOrEqual(9);
  sections.forEach((s) => expect(s.querySelector("h1, h2")).not.toBeNull());
  expect(screen.getByRole("heading", { name: /You walk in/ })).toBeInTheDocument();
  expect(screen.getByText("What am I pointing at")).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});
```
- [ ] **Step 2** FAIL. **Step 3** build the beats in order: Hero (keep ripples, add `.settle` on the phone), WalkIn, FindIt, DoIt, PlanIt, JustPoint, UnderTheHood (a `<dl>` of the seven items), FreeAndPlus, Download (the site-native button from the previous commit). **Step 4** PASS. **Step 5** commit after each beat.

---

### Task 7: Compose and clean up

**Files:**
- Modify: `components/FathomLanding.tsx` (rewrite to composition)
- Modify: `components/fathom-landing.css` (remove selectors with no remaining markup: `.scrolly*`, `.step`, `.mode-card*`, `.live-mic-ring`, `.go-arrow-svg`, `.lk-orb-core`, the reduced-motion list of stale selectors)
- Delete: `components/ModeCard.tsx`
- Modify: `test/home.test.tsx`, `test/a11y.test.tsx` (add `/` beats if not already covered)

- [ ] Rewrite `FathomLanding.tsx` to render the beats and keep only the header-height / ripple effects it still needs. Remove the scrolly `activate/pickActive` listener; screen switching is now per-beat. Run `grep -n "scrolly\|mode-card\|ModeCard" components app test` → no output. Run the full suite. Commit.

---

### Task 8: Verify like a user

- [ ] 375 px: no interactive element under 44 px (`getBoundingClientRect` over `main a, main button`).
- [ ] 320 px: `document.documentElement.scrollWidth === 320`.
- [ ] Both themes: computed contrast of every new text/background pair against the tokens ≥ 5.6:1 (secondary) or ≥ 11.2:1 (primary).
- [ ] Reduced motion emulated: page renders in its finished state; no `getAnimations()` still running.
- [ ] VoiceOver order: `read_page` shows eyebrow → h2 → body → captions → controls per beat.
- [ ] Screenshots of each beat in both themes, sent to Ryan.

---

### Task 9: Global-style regression on the other pages

- [ ] For each of `/support`, `/feedback`, `/release-notes`, `/privacy`, `/terms`, in both themes: screenshot, `scrollWidth`, and computed `text-wrap`/`animation-timeline` on their `h1`/`p` to confirm the global utilities are inert there (no `.beat` class → no timeline). Note anything that moved. Commit any fix separately.

---

### Task 10: Reviewers, then ship

- [ ] Run `agents-design-experience:accessibility-specialist` and `agents-design-experience:ui-ux-designer` with the project's `.claude/agents/*.md` rules pasted in, scoped to `components/landing/**`, `lib/landing-content.ts`, `app/globals.css`. Fix blockers.
- [ ] `npm run lint && npx tsc --noEmit && npm run test`, then stop the dev server, `npm run build`.
- [ ] Commit, push, wait for the deploy, re-run the leak scan on `/promo`, and check `/` serves the new headline.

---

## Self-review

- **Spec coverage:** architecture → Task 6/7; copy → Task 1 (fixture) and Task 6; mockups → Tasks 2–4; motion → Task 5/6; consistency and verification → Tasks 8–10; design-system additions (`Phone`, timeline utilities) → Tasks 3 and 5, to be named in the final commit.
- **Placeholders:** none. Per-beat JSX is defined by the required-elements list in Task 4/6 and the fixture in Task 1.
- **Type consistency:** `Tier`, `MODES`, `SNAPSHOT_OPTIONS`, `TAB_BAR`, `ACTIVE_MODE_CONTROLS`, `PLUS`, `POINTING`, `COPY` are defined once in Task 1 and referenced by name everywhere else; `Phone` props (`activeTab`, `label`, `children`) match between Task 3 and Task 6.
