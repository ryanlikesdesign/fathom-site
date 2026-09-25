# The phone kit

The app mockups on the homepage, drawn in HTML and CSS from the design system (`--fathom-*` tokens, `components.md` specs) and matched to the 1.3 reference captures in `~/fathom-evidence/app-1.3/1c229ed/{dark,light}/`. Each step's phone plays a short scene, like watching someone use the app, then rests on a meaningful final frame.

The scroll machinery around the phones is not the kit's: `components/LandingScroll.tsx`, `StickyPhone.tsx`, `MobilePhone.tsx`, the chassis and the switching CSS in `components/fathom-landing.css` stay as they are.

## Rules every screen follows

- **Words.** Every string inside a phone is an app fact from `lib/app-facts.ts` (`.value`, or `fill()` for a pattern) or an `EXAMPLES` string. Nothing else, not even a digit: plan step numbers are a CSS counter. `test/landing.test.tsx` walks every text node in every phone and fails on anything else. An illustrative string goes in `EXAMPLES`, marked as illustrative, and follows the copy rules.
- **Honesty.** fathom never says it saw, checked or guarantees something. Go asks whether you have arrived. No hazard sounds. "Always on" belongs to obstacle alerts only.
- **Decorative.** The phone is `aria-hidden` and nothing inside it is focusable: every "button" is a `span`. The step's own eyebrow, headline and body carry the meaning.
- **Tokens.** Colors, spacing, radii, type and motion are `--fathom-*`. A metric `components.md` gives that the tokens don't carry is named once at the top of `phone.css` with its source. No hex, no pure white: roles that resolve to `bone-0` draw through `--ph-on-accent`, `--ph-raised` and `--ph-chrome` (bone-25 on the web).
- **Type.** Phones draw in the DS system stack (`--fathom-font-sans`: SF on Apple devices), at DS sizes, one pixel per point. The page around them is Atkinson Hyperlegible Next.
- **Motion.** DS motion tokens, transform and opacity (the suggestion strip's fold is the kit's one layout animation). No bounce or overshoot beyond the DS `motion-settle` spring. With reduced motion or Pause motion, scenes do not run and every continuous animation stops on its still frame (one rule at the end of `phone.css`).

## Primitives

All in `components/phone/`, exported from `components/phone/index.ts`, styled in `phone.css`.

| Component | What it draws | Spec |
|---|---|---|
| `Screen` | The screen root (`.screen`), where a scene plays | (scene engine) |
| `StatusBar` | The iOS status bar; the clock is `EXAMPLES.clock` | phone chrome |
| `AppHeader` | Transcript toggle, connection glyph (cloud, device, offline), usage ring around the 24 mark, narration glyph, menu mark. `transcriptTouch` and `menuTouch` tap the toggle and the menu | AssistantConnectionStatusView, AssistantBrandMarkButton, FathomMenuGlyph |
| `Orb` | Three rings and a core; moods `idle`, `listening`, `working`, `speaking`; sizes 128 and 120 | AssistantOrbIndicator |
| `Stage` | The stage between header and footer, with its glow. `top` puts the headline at the top for an activity | ConversationStage, ConversationScreen.stageContent |
| `ActivityCard` | The room under an activity's stage; its hairline edge under Contrast Boost | ActivityCard |
| `StageHeadline` | Eyebrow, headline sized by length (title-lg under 26 characters, title-md under 58, title-sm beyond), subline, optional word reveal | AssistantHeadlineView |
| `StopControl` | `stop.circle.fill` at the stage's top right | ConversationStage |
| `Stack` | Children in one grid cell, so states cross-fade in place. Directly in `.ph-body` it fills the room and each child is a view (the stage, the transcript) | (layout) |
| `Words` | A line revealed word by word, laid out whole from the start | AssistantHeadlineView |
| `Suggestions`, `SuggestionRow` | The strip above the composer; a chip with the Plus badge. A strip with `show` folds away when it is off, so the room above it takes the space | SuggestionRow |
| `Composer` | Type, the mic (idle, listening, end), More; the session row (Pause, Resume, readout transport). `backTouch` taps the transport's backward control | AssistantFooterControls |
| `SheetFrame`, `SheetGroup`, `SheetRow` | A sheet rising over a scrim, its bar with the Close word; a section card whose rows arrive in turn; a row | FathomSheetChrome, AddSheetRow |
| `PhoneButton` | Primary, secondary, tinted, text | FathomButton |
| `Transcript`, `TranscriptTurn` | Turns anchored to the bottom; yours trailing, fathom's with the accent rail; overline time and label. A turn arrives whole, as the app appends one: word by word belongs to the stage headline, which follows speech | TranscriptView |
| `ReadoutBar` | Repeat, "2 of 5" and Paused, overflow, Stop. `counter` is one string, or counts with beats so only the count moves | ReadoutPlaybackBar |
| `PlanSteps`, `PlanStepRow` | The plan card, which can arrive on its beats, its rows in turn; each step numbers itself | AssistantPlanCard |
| `TouchIndicator` | A soft finger-tap ring inside the control it taps; only ever on during a tap beat (`TAP_MS`) | (scenes) |
| `Glyph`, `GlyphSprite` | Hand-drawn stand-ins for the SF Symbols the app uses (SF Symbols can't be redistributed). The sprite renders once on the page | |

Glyph boxes: the stand-ins sit inside a 24 grid with a margin, like SF Symbols, so a glyph's box is its SF point size times `--ph-glyph-scale` (1.35). Solid glyphs with cut-outs take `--ph-glyph-ground`, which a surface sets to its own color.

## Scenes

A scene is a list of beats (`scene/types.ts`):

```ts
import { defineScene } from "@/components/phone";

export const MY_SCENE = defineScene([
  { id: "idle", ms: 1400, set: { mic: "idle", orb: "idle" } }, // the opening frame
  { id: "tap", ms: 500 },                                      // holds 500ms
  { id: "listening", ms: 2000, set: { mic: "listening", orb: "listening" } },
  { id: "answer", ms: 0 },                                     // the resting frame
]);
```

- **The last beat is the resting frame.** The server renders it, reduced motion and Pause motion show it, and a played scene stops on it. Make it the frame that tells the step's story on its own, and never one the step's claim forbids: a question the app asks rests on the question, not on an answer (Go asks whether you have arrived; a plan waits for Accept plan; the consent waits for a choice).
- **The first beat is the opening frame.** A scene waits on it until its screen is on show, then plays from it. It must set every channel the scene uses, and anything that should animate in (words, a sheet, a new row) must be off in it.
- **Channels** are small state words the engine writes on the screen root as `data-<name>`; they are cumulative, so a beat names only what changes. The kit reads: `mic` (`idle`, `listening`, `end`), `orb` (`idle`, `listening`, `working`, `speaking`), `glow` (`none`, `listening`, `speaking`), `transcript` (`closed`, `open`). A screen may add its own and style `.your-screen[data-yours="…"]` in its CSS.
- **Layers** are what comes and goes: `<Layer show="listening tap-send">…</Layer>` is on during those beats and fades with `motion-crossfade`. `mode="flag"` keeps it drawn and only toggles `data-on` for its own CSS. `Words`, `TouchIndicator`, and every primitive's `show` and `…Touch` props are layers too.
- **Everything else** keys off `.your-screen[data-beat="…"]` in the screen's CSS, as CSS transitions on DS motion tokens.
- **Taps** are beats named `tap` or `tap-…`, each held `TAP_MS` (600ms, at least the ring's press plus settle), with a `TouchIndicator` or a primitive's `…Touch` prop on that beat only. Every scene paces its taps the same way. Nothing opens by itself: a sheet, a screen or a view that the person would open follows a tap (a sheet the app raises on its own, like the consent at launch, may rise without one).
- **Only what the app draws.** A line the app only speaks (an offer, a narration, a Point to Ask answer) is shown as speaking, and the step's own text carries the words. No scene devices that read as app UI: the finger ring is the one convention.

### What the kit does in every scene

So every phone moves the same way, these live in `phone.css`, not in a screen:

| When | What it does |
|---|---|
| A layer turns on or off | Crossfades (`motion-crossfade`); nothing inside an off layer keeps animating |
| A turn arrives, or the transcript arrives as a view | Settles up `space-3` on `motion-settle` as it fades in, whole |
| A suggestion strip goes away or comes back (`Suggestions show`) | Folds to nothing (or unfolds) on `motion-settle` as it crossfades, so the stage re-centers and a transcript comes down onto the composer. The kit's one layout animation |
| Rows arrive in a sheet's card or a plan's card (`.ph-stagger`) | Each fades in and settles up, `--ph-stagger` apart after `--ph-stagger-lead` |
| A sheet is up | It rises on `motion-settle`; the header recedes (the captures show only the backdrop above a sheet) and nothing under it animates |
| A finger presses a button, a sheet row or the transport | Its content takes `opacity-pressed` at press speed and lets go at color speed; a button also scales to `--ph-press-scale` (FathomButton's 0.97); a row takes `bg-pressed` |
| A readout's count moves | One count at a time, crossfading at color speed |

`defineScene` throws on a scene the page would draw wrong: no beats, a repeated or malformed id, a negative hold, a reserved channel name, or a channel the opening frame doesn't set.

### When a scene plays (`scene/engine.ts`)

A scene plays only while motion is allowed, its screen is active (`.is-active`), at least 35% of it is in view (the engine's own IntersectionObserver), the tab is visible, and, in the desktop sticky phone, a step holds the center (LandingScroll sets `data-live` on `.scrolly-sticky .phone-screen` while one does).

| What happens | What the engine does |
|---|---|
| Motion reduced (OS) or paused (`html[data-motion="reduce"]`), or no IntersectionObserver | Shows the resting frame, starts no timers (`data-scene="rest"`) |
| The screen comes on show | Jumps to the opening frame with transitions off, then plays (`"play"`) |
| Desktop: LandingScroll moves `.is-active` away | Stops, holds the frame while the screen fades out; replays from the top when it is active again |
| Desktop: no step holds the center (the reader is in the section above) | Waits on the opening frame, or holds its frame if it was playing; plays from the top when a step takes the center |
| It leaves the view | Stops and waits on the opening frame (`"ready"`), so it replays when it comes back |
| The tab is hidden | Pauses the beat; finishes it when the tab is back |

On desktop, LandingScroll moves `.is-active` between the sticky screens; the first is rendered active for no-JS readers, and `data-live` keeps it waiting until step 1 holds the center. On narrow widths, each step's `MobilePhone` renders its screen active, and the scene starts when that phone is in view. The hero's phone is a still. LandingScroll's `.is-off` still pauses CSS animations in phones far off screen.

## A screen: one folder

```
components/phone/screens/<Name>/
  <Name>Screen.tsx   the component (and its scene), exported under the name the registry imports
  <Name>.css         its own styles, every rule under the screen's root class
```

- Import the kit from `@/components/phone`, the words from `@/lib/app-facts`, and your CSS as `import "./<Name>.css"`.
- The root is `<Screen name={screenKey} scene={SCENE} active={active} className="your-screen">`. `name` is the step's `ScreenKey` (`lib/copy-13.ts`): LandingScroll pairs `.step[data-step]` with `.screen[data-screen]` by it.
- Lay out the screen the way the app does: `StatusBar`, `AppHeader` (or a sheet's own bar), a `div.ph-body` for the middle, `Composer` at the foot, a `SheetFrame` last so it covers the rest.
- Edit nothing shared from inside a screen: not the kit, not `phone.css`, not another screen, not `fathom-landing.css`. If the kit is missing something, say so; anything two screens need goes into the kit, once, not into two folders.
- Weights are `--ph-weight-medium` and `--ph-weight-semibold` (SwiftUI's .medium and .semibold over a DS style), never a bare number.
- Export your scene too, so a test can play it.

### The registry

`components/phone/screens/index.ts` maps every `ScreenKey` to its component (`SCREENS`) and its scene (`SCENES`), and the homepage renders `SCREENS[step.screen]` in the sticky phone and in each step's own phone. A new screen keeps its export names, so the registry needs no edit beyond them.

| ScreenKey | Folder | Export |
|---|---|---|
| `conversation` | `Conversation` | `ConversationJustAsk` (and `ConversationHero` for the hero) |
| `look-now` | `LookNow` | `LookNowScreen` |
| `readout` | `Readout` | `ReadoutScreen` |
| `activity-lookout` | `ActivityLookout` | `ActivityLookoutScreen` |
| `memory-review` | `MemoryReview` | `MemoryReviewScreen` |
| `activity-go` | `ActivityGo` | `ActivityGoScreen` |
| `plan-review` | `PlanReview` | `PlanReviewScreen` |
| `activity-live` | `ActivityLive` | `ActivityLiveScreen` |
| `conversation-skills` | `Conversation` | `ConversationSkills` |
| `cloud-consent` | `CloudConsent` | `CloudConsentScreen` |

## Tests

- `test/phone-kit.test.tsx`: the primitives, layers at rest, turns that arrive whole, the strip's fold, `defineScene`, `TAP_MS` against the ring, axe on a step.
- `test/scrolly.test.tsx`: the step and screen contract, the announcer, the engine (plays, replays, re-arms, pauses, rests with no timers), and every step's scene through `SCENES` (screens/index.ts): a short story, taps of one length with a finger only on tap beats, layers that name only their own beats, the hero a still, desktop and phone start and stop.
- `test/phone-look-read.test.tsx`, `test/phone-activities.test.tsx`, `test/phone-memory-plan-consent.test.tsx`: each screen's resting frame, words and scene beat by beat.
- `test/landing.test.tsx`: every phone string is an app fact or an example, nothing focusable in a phone, axe.

Run the ones you touch: `npx vitest run test/phone-*.test.tsx test/scrolly.test.tsx test/landing.test.tsx`.
