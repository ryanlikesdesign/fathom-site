import './fathom-landing.css';
import { LandingScroll } from './LandingScroll';
import { StickyPhone } from './StickyPhone';
import { MobilePhone } from './MobilePhone';
import { AppleMark } from '@/components/AppleMark';
import { GlyphSprite } from '@/components/phone';
import { ConversationHero, SCREENS } from '@/components/phone/screens';
import { COPY_13 as COPY } from '@/lib/copy-13';

// Every word on the page renders from the 1.3 deck (lib/copy-13.ts), and
// every word inside a phone from lib/app-facts.ts (app strings and marked
// examples), so the tests pin what the page says, not a copy of it.

const APP_STORE_URL = 'https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183';

/** The day-to-day cards' icons, in the deck's order: drawn in CSS, decorative. */
const CARD_ICONS = [
  <div key="haptic" className="spec-icon spec-icon-haptic" aria-hidden="true"><span className="haptic-dot" /><span className="haptic-ring" /><span className="haptic-ring haptic-ring-2" /></div>,
  <div key="action" className="spec-icon spec-icon-action" aria-hidden="true"><span className="ab-phone"><span className="ab-btn" /></span></div>,
  <div key="sound" className="spec-icon spec-icon-sound" aria-hidden="true"><span className="wave w1" /><span className="wave w2" /><span className="wave w3" /></div>,
  <div key="low" className="spec-icon spec-icon-low" aria-hidden="true"><span className="lv-bar" /><span className="lv-bar lv-bar-2" /><span className="lv-bar lv-bar-3" /></div>,
];

// ── Main Component ───────────────────────────────────────────────
// A server component: the markup is static, and every scroll behavior
// (progress rail, step switching, inert hero, off-screen pause) lives in the
// LandingScroll island. Each phone screen plays its own scene
// (components/phone/scene), keyed to the .is-active LandingScroll moves.
export function FathomLanding() {
  const { hero, gap, steps, safetyNet, dayToDay, download } = COPY;
  return (
    <div className="fathom-root">
      <LandingScroll />
      {/* The phone glyphs, once: every screen references them with <use>. */}
      <GlyphSprite />
      <div className="progress-rail" aria-hidden="true">
        <div className="progress-fill" />
      </div>
      {/* VoiceOver's copy of the sticky-phone switch: LandingScroll writes
          "Step n of 10, <eyebrow>" here as each step takes the center. */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-step-status />

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="hero-stage">
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-ripples" aria-hidden="true">
          <span className="ripple r1" /><span className="ripple r2" /><span className="ripple r3" /><span className="ripple r4" />
        </div>
        <div className="hero-inner">
          <p className="eyebrow hero-eyebrow">{hero.eyebrow}</p>
          <h1 className="hero-title" id="hero-title">
            <span className="line-a">{hero.title[0]}</span>{' '}
            <span className="line-b line-accent">{hero.title[1]}</span>
          </h1>
          <p className="hero-lede">{hero.lede}</p>
          <div className="hero-actions">
            <a href={APP_STORE_URL} className="btn btn-primary" rel="noopener noreferrer">
              <AppleMark />Download<span className="sr-only"> on the App Store</span>
            </a>
            <a href="#features" className="btn btn-ghost">{hero.ctas.secondary}</a>
          </div>
        </div>
        <div className="hero-phone" aria-hidden="true">
          <div className="phone">
            <div className="phone-screen">
              <ConversationHero />
              <div className="phone-reflect" />
            </div>
          </div>
        </div>
        <div className="hero-scroll-cue" aria-hidden="true">
          <span className="scroll-word">Scroll to explore</span>
          <span className="scroll-line" />
        </div>
      </section>
      </div>

      {/* Everything from here rides up over the pinned hero. */}
      <div className="hero-cover">

      {/* ── The gap ───────────────────────────────────────── */}
      <section className="problem" id="gap" aria-labelledby="gap-title">
        <div className="problem-inner">
          <p className="eyebrow reveal" aria-hidden="true">{gap.eyebrow}</p>
          <h2 id="gap-title" className="h-display reveal"><span className="sr-only">{gap.eyebrow}: </span>{gap.title[0]}<br /><span className="muted">{gap.title[1]}</span></h2>
          <div className="problem-body">
            <p className="reveal">{gap.body}</p>
            <p className="problem-accent reveal accent">{gap.accent}</p>
          </div>
        </div>
      </section>

      {/* ── The ten steps ─────────────────────────────────── */}
      <section className="scrolly" id="features" aria-label="What fathom does">
        <StickyPhone>
          {steps.map((step, i) => {
            const StepScreen = SCREENS[step.screen];
            return <StepScreen key={step.screen} active={i === 0} />;
          })}
        </StickyPhone>

        <div className="scrolly-steps">
          {steps.map((step, i) => {
            const StepScreen = SCREENS[step.screen];
            return (
              <div className={i === 0 ? 'step is-visible' : 'step'} data-step={step.screen} data-tier={step.tier} key={step.slug}>
                <MobilePhone><StepScreen active /></MobilePhone>
                {/* The visible eyebrow is decorative for readers: the h2
                    carries it as an sr-only prefix, so it is announced once. */}
                <div className="step-copy">
                  <p className="eyebrow" aria-hidden="true">{step.eyebrow}</p>
                  <h2><span className="sr-only">{step.eyebrow}: </span>{step.headline[0]}<br /><span className="muted">{step.headline[1]}</span></h2>
                  {step.body.map((paragraph) => <p className="step-body" key={paragraph}>{paragraph}</p>)}
                  {step.example ? (
                    <blockquote className="step-example"><p>“{step.example}”</p></blockquote>
                  ) : null}
                  {step.link ? (
                    <p className="step-link"><a href={step.link.href}>{step.link.label}</a></p>
                  ) : null}
                  <p className="step-whisper">{step.whisper}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── The safety net ────────────────────────────────── */}
      <section className="everywhere" id="safety-net" aria-labelledby="safety-title">
        <div className="everywhere-inner">
          <p className="eyebrow reveal" aria-hidden="true">{safetyNet.eyebrow}</p>
          <h2 id="safety-title" className="h-display reveal"><span className="sr-only">{safetyNet.eyebrow}: </span>{safetyNet.title[0]}<br /><span className="muted">{safetyNet.title[1]}</span></h2>
          <div className="everywhere-body">
            {safetyNet.body.map((paragraph) => <p className="reveal" key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </section>

      {/* ── Day to day ────────────────────────────────────── */}
      <section className="spectrum" aria-labelledby="spectrum-title">
        <div className="spectrum-inner">
          <h2 id="spectrum-title" className="h-display reveal">{dayToDay.title}</h2>
          <div className="spectrum-grid">
            {dayToDay.cards.map((card, i) => (
              <article className="spec-card reveal" key={card.title}>
                {CARD_ICONS[i]}
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
          <p className="spectrum-footer reveal">{COPY.footerNote}</p>
        </div>
      </section>

      {/* ── Download ──────────────────────────────────────── */}
      <section className="signup" id="download" aria-labelledby="download-title">
        <div className="signup-inner">
          <div className="signup-left">
            <p className="eyebrow reveal">{download.eyebrow}</p>
            <h2 id="download-title" className="h-display reveal">{download.title}</h2>
            <p className="signup-lede reveal">{download.lede}</p>
            <div className="press-line reveal">
              <p><strong>Press or media?</strong> Email <a href="mailto:support@fathomvision.app">support@fathomvision.app</a> for the press kit.</p>
            </div>
          </div>

          <div className="download-card reveal">
            <a href={APP_STORE_URL} className="btn btn-primary" rel="noopener noreferrer">
              <AppleMark />Download<span className="sr-only"> on the App Store</span>
            </a>
            <p className="download-note">{download.metaLine}</p>
            <p className="download-sub">{download.freeLine}</p>
            <p className="download-sub">{download.plusLine}</p>
            <p className="download-sub">{download.allowanceLine}</p>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
