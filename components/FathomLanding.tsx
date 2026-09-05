'use client';

import { useEffect, useRef } from 'react';
import './fathom-landing.css';
import { COPY, POINTING, SNAPSHOT_OPTIONS } from '@/lib/landing-content';

const APP_STORE_URL = 'https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183';

// ── iOS Status Bar SVG (shared across all screens) ───────────────
function IosStatus({ time = '9:41' }: { time?: string }) {
  return (
    <div className="ios-status">
      <span className="ios-time">{time}</span>
      <span className="ios-island" />
      <span className="ios-right">
        <svg className="ios-ic-bars" viewBox="0 0 17 11" aria-hidden="true">
          <rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor"/>
          <rect x="4.67" y="5" width="3" height="6" rx="0.6" fill="currentColor"/>
          <rect x="9.33" y="3" width="3" height="8" rx="0.6" fill="currentColor"/>
          <rect x="14" y="0" width="3" height="11" rx="0.6" fill="currentColor"/>
        </svg>
        <svg className="ios-ic-wifi" viewBox="0 0 16 11" aria-hidden="true">
          <path d="M8 2.2c2.3 0 4.5.87 6.15 2.44a.6.6 0 0 0 .85-.04l.85-.93a.6.6 0 0 0-.04-.86A11.35 11.35 0 0 0 8 0 11.35 11.35 0 0 0 .19 2.81a.6.6 0 0 0-.04.86l.85.93a.6.6 0 0 0 .85.04A8.88 8.88 0 0 1 8 2.2z" fill="currentColor"/>
          <path d="M8 5.1c1.56 0 3.05.58 4.18 1.63a.6.6 0 0 0 .86-.03l.84-.93a.6.6 0 0 0-.04-.85A8.42 8.42 0 0 0 8 2.9a8.42 8.42 0 0 0-5.84 2.02.6.6 0 0 0-.04.85l.84.93a.6.6 0 0 0 .86.03A6.22 6.22 0 0 1 8 5.1z" fill="currentColor"/>
          <path d="M8 8c.83 0 1.62.3 2.22.83a.6.6 0 0 0 .87-.05l.86-.95a.6.6 0 0 0-.05-.84A5.5 5.5 0 0 0 8 5.8a5.5 5.5 0 0 0-3.9 1.18.6.6 0 0 0-.05.84l.86.95a.6.6 0 0 0 .87.05A3.36 3.36 0 0 1 8 8z" fill="currentColor"/>
          <circle cx="8" cy="10" r="1.1" fill="currentColor"/>
        </svg>
        <svg className="ios-ic-batt" viewBox="0 0 26 12" aria-hidden="true">
          <rect x="0.5" y="0.5" width="23" height="11" rx="2.5" fill="none" stroke="currentColor" opacity="0.45"/>
          <rect x="2" y="2" width="20" height="8" rx="1.3" fill="currentColor"/>
          <rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.45"/>
        </svg>
      </span>
    </div>
  );
}

// ── Voice Orb SVGs ───────────────────────────────────────────────
function VoiceOrbIdle({ className = '' }: { className?: string }) {
  return (
    <div className={`vo vo-idle ${className}`} role="img" aria-label="Fathom, ready">
      <svg className="vo-svg" viewBox="0 0 82 82" aria-hidden="true">
        <circle className="ring-outer" cx="41" cy="41" r="30" stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.3"/>
        <circle cx="41" cy="41" r="21" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.55"/>
        <circle cx="41" cy="41" r="12" stroke="currentColor" strokeWidth="2.2" fill="none" opacity="0.85"/>
        <circle cx="41" cy="41" r="4" fill="currentColor"/>
      </svg>
    </div>
  );
}

function VoiceOrbListen({ className = '' }: { className?: string }) {
  return (
    <div className={`vo vo-listen ${className}`} role="img" aria-label="Fathom, listening">
      <svg className="vo-svg" viewBox="0 0 82 82" aria-hidden="true">
        <circle className="ring-a" cx="41" cy="41" r="12" stroke="currentColor" strokeWidth="2.6" fill="none"/>
        <circle className="ring-b" cx="41" cy="41" r="12" stroke="currentColor" strokeWidth="2.6" fill="none"/>
        <circle className="ring-c" cx="41" cy="41" r="12" stroke="currentColor" strokeWidth="2.6" fill="none"/>
        <circle cx="41" cy="41" r="10" stroke="currentColor" strokeWidth="2.2" fill="none"/>
        <circle cx="41" cy="41" r="5" fill="currentColor"/>
      </svg>
    </div>
  );
}

// ── Shared Tab Bar ───────────────────────────────────────────────
function TabBar({ active = 'home' }: { active?: string }) {
  return (
    <div className="ios-tabbar">
      <span className={`tab${active === 'home' ? ' tab-active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg>
        <small>Home</small>
      </span>
      <span className={`tab${active === 'assistant' ? ' tab-active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>
        <small>Assistant</small>
      </span>
      <span className={`tab${active === 'history' ? ' tab-active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>
        <small>History</small>
      </span>
      <span className={`tab${active === 'settings' ? ' tab-active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></svg>
        <small>Settings</small>
      </span>
    </div>
  );
}

// ── Mobile Phone Mockup (shown inline per step on mobile) ────────
function MobilePhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="step-phone" aria-hidden="true">
      <div className="phone">
        <div className="phone-screen">
          {children}
        </div>
        <div className="phone-reflect" />
      </div>
    </div>
  );
}

// ── Home screen content (reused: scrolly sticky phone + hero phone) ────────
function HomeScreen({ active = false, menu = false }: { active?: boolean; menu?: boolean }) {
  return (
    <div className={`screen screen-home${menu ? ' screen-snapshot' : ''}${active ? ' is-active' : ''}`} data-screen={menu ? 'snapshot' : 'home'}>
      <IosStatus time="7:03" />
      <div className="screen-pad">
        <div className="home-topbar">
          <span className="pill-ai"><span className="pill-ai-dot" />AI Enabled</span>
          <span className="link-navy">Lookout</span>
        </div>
        <div className="home-brand">
          <svg className="home-mark" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="2.6" fill="currentColor"/>
            <circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65"/>
            <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".35"/>
          </svg>
          <span className="home-word">fathom</span>
        </div>
        <p className="home-tag">Your AI-powered guide to the world around you</p>
        <div className="snap-anchor">
          <span className="home-snapshot">
            <span className="snap-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.2"/></svg>
            </span>
            <span className="snap-text">
              <span className="snap-title">Snapshot</span>
              <span className="snap-sub">Quick scan of your surroundings</span>
            </span>
            <span className="snap-chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
          </span>
          {menu && (
            <div className="snap-menu" aria-hidden="true">
              {SNAPSHOT_OPTIONS.map((o) => (
                <div className="snap-menu-row" key={o}><span>{o}</span></div>
              ))}
            </div>
          )}
        </div>
        <div className="home-list">
          <div className="home-row">
            <span className="row-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/></svg></span>
            <span className="row-text"><span className="row-title">Lookout</span><span className="row-sub">Continuous awareness</span></span>
            <span className="row-chev" aria-hidden="true">&rsaquo;</span>
          </div>
          <div className="home-row">
            <span className="row-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4 4 11l7 2 2 7z" opacity=".95"/></svg></span>
            <span className="row-text"><span className="row-title">Go</span><span className="row-sub">Navigate to a destination</span></span>
            <span className="row-chev" aria-hidden="true">&rsaquo;</span>
          </div>
          <div className="home-row">
            <span className="row-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="7" r="2.4"/><path d="M5 13h2"/><circle cx="6" cy="17" r="2.4"/><path d="M5.1 7.4 5.9 8.2 7.3 6.4"/><path d="M11 7h10"/><path d="M11 17h10"/></svg></span>
            <span className="row-text"><span className="row-title">Task</span><span className="row-sub">Step-by-step guidance</span></span>
            <span className="row-chev" aria-hidden="true">&rsaquo;</span>
          </div>
        </div>
      </div>
      <TabBar active="home" />
    </div>
  );
}

// ── Point-to-ask screen (1.2.0): Lookout, hands-free pointing ────
function PointScreen({ active = false }: { active?: boolean }) {
  return (
    <div className={`screen screen-lookout screen-point${active ? ' is-active' : ''}`} data-screen="point">
      <IosStatus />
      <div className="screen-pad">
        <div className="lk-nav">
          <span className="lk-back"><span className="chev-left">&lsaquo;</span> Home</span>
          <span className="pill-ai"><span className="pill-ai-dot" />AI Enabled</span>
          <span className="mode-more"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></span>
        </div>
        <p className="lk-eyebrow">LOOKOUT</p>
        <div className="pt-stage">
          <div className="pt-hand"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 58V38a5 5 0 0 1 10 0"/><path d="M32 38V16a4 4 0 0 1 8 0v20"/><path d="M40 30a4 4 0 0 1 8 0v8"/><path d="M48 34a4 4 0 0 1 8 0v10c0 8-6 14-14 14H30"/><path d="M22 44H14"/></svg></div>
          <p className="pt-cue">{POINTING.firstCue}</p>
          <div className="pt-answer">
            {COPY.justPoint.beats.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
      <div className="mode-actions">
        <span className="mode-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span>
        <span className="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.2"/></svg></span>
        <span className="mode-end">End</span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export function FathomLanding() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll progress
    function onScroll() {
      const h = document.documentElement;
      const scrolled = h.scrollTop || document.body.scrollTop;
      const max = (h.scrollHeight - h.clientHeight) || 1;
      const pct = Math.max(0, Math.min(1, scrolled / max));
      if (progressRef.current) progressRef.current.style.width = (pct * 100).toFixed(2) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Scrolly: step activation + screen switching
    const steps = Array.from(document.querySelectorAll('.scrolly .step'));
    const screens: Record<string, HTMLElement> = {};
    document.querySelectorAll('.scrolly-sticky .phone-screen .screen').forEach((el) => {
      const key = el.getAttribute('data-screen');
      if (key) screens[key] = el as HTMLElement;
    });

    let activeKey: string | null = null;
    function activate(key: string) {
      if (!key || key === activeKey) return;
      activeKey = key;
      Object.keys(screens).forEach((k) => {
        screens[k].classList.toggle('is-active', k === key);
      });
    }

    let ticking = false;
    function pickActive() {
      const vh = window.innerHeight;
      const targetY = vh / 2;
      let best: Element | null = null;
      let bestDist = Infinity;
      for (const step of steps) {
        const r = step.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const mid = r.top + r.height / 2;
        const d = Math.abs(mid - targetY);
        if (d < bestDist) { bestDist = d; best = step; }
      }
      if (best) {
        const key = best.getAttribute('data-step');
        if (key) activate(key);
        steps.forEach((s) => s.classList.toggle('is-visible', s === best));
      }
    }

    function onScrollScrolly() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { pickActive(); ticking = false; });
    }
    window.addEventListener('scroll', onScrollScrolly, { passive: true });
    window.addEventListener('resize', onScrollScrolly);
    pickActive();

    // Reveal on scroll
    let revealObs: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      revealObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            revealObs?.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach((el) => revealObs!.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScrollScrolly);
      window.removeEventListener('resize', onScrollScrolly);
      revealObs?.disconnect();
    };
  }, []);

  return (
    <div className="fathom-root">
      <div className="progress-rail" aria-hidden="true">
        <div className="progress-fill" ref={progressRef} />
      </div>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero" id="top">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-ripples" aria-hidden="true">
          <span className="ripple r1" /><span className="ripple r2" /><span className="ripple r3" /><span className="ripple r4" />
        </div>
        <div className="hero-inner">
          <p className="eyebrow hero-eyebrow">Now on the App Store</p>
          <h1 className="hero-title">
            <span className="line-a">Navigate any</span>
            <span className="line-b">building.</span>
            <span className="line-c">Your first time in.</span>
          </h1>
          <p className="hero-lede">
            Fathom is an AI companion for blind and low-vision people. It tells you
            what&apos;s ahead, walks you to where you&apos;re going, and helps you do what
            you came for. On your iPhone. No maps, no beacons, no setup.
          </p>
          <div className="hero-actions">
            <a href={APP_STORE_URL} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
              Download on the App Store
            </a>
            <a href="#problem" className="btn btn-ghost">
              <span>See what it does</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </a>
          </div>
        </div>
        <div className="hero-phone" aria-hidden="true">
          <div className="phone">
            <div className="phone-screen">
              <HomeScreen active />
              <div className="phone-reflect" />
            </div>
          </div>
        </div>
        <div className="hero-scroll-cue" aria-hidden="true">
          <span className="scroll-word">Scroll to explore</span>
          <span className="scroll-line" />
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────── */}
      <section className="problem" id="problem" aria-labelledby="problem-title">
        <div className="problem-inner">
          <p className="eyebrow reveal">The gap</p>
          <h2 id="problem-title" className="h-display reveal">Indoor navigation<br/><span className="muted">is still unsolved.</span></h2>
          <div className="problem-body">
            <p className="reveal">
              GPS stops working the moment you step inside. Existing tools lean on
              pre-built maps most buildings don&apos;t have, or on sighted guides who
              aren&apos;t always around. Every unfamiliar building becomes a barrier &mdash;
              and that&apos;s before you even try to get anything done once you&apos;re in.
            </p>
            <p className="reveal accent">
              Fathom walks you in, walks you through, and helps with the task at the
              end. Anywhere. Your first time in.
            </p>
          </div>
        </div>
      </section>

      {/* ── Scrolly Features ──────────────────────────────── */}
      <section className="scrolly" id="features" aria-label="Features">
        <div className="scrolly-sticky">
          <div className="phone" aria-hidden="true">
            <div className="phone-screen">

              {/* Screen: Home */}
              <HomeScreen active />

              {/* Screen: Snapshot options */}
              <HomeScreen menu />

              {/* Screen: Point to ask */}
              <PointScreen />

              {/* Screen: Assistant */}
              <div className="screen screen-assistant" data-screen="assistant">
                <IosStatus time="7:03" />
                <div className="screen-pad as-pad">
                  <p className="as-eyebrow">NEW SESSION</p>
                  <h3 className="as-title">What can I help with?</h3>
                  <p className="as-sub">Tell me what you&apos;d like to do and I&apos;ll figure out the best way to help.</p>
                  <div className="as-crab" aria-hidden="true"><VoiceOrbIdle className="as-voice-orb" /></div>
                  <div className="as-divider"><span>RECENT</span></div>
                  <p className="as-none">No sessions yet</p>
                </div>
                <div className="as-composer">
                  <div className="as-chips">
                    <span className="as-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h12M4 12h12M4 18h12"/></svg>Activities</span>
                    <span className="as-chip as-chip-filled"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span>
                  </div>
                  <div className="as-input">Describe your goal&hellip;</div>
                </div>
                <TabBar active="assistant" />
              </div>

              {/* Screen: Assistant Activities */}
              <div className="screen screen-assistant screen-assistant-activities" data-screen="assistant-activities">
                <IosStatus time="7:03" />
                <div className="screen-pad as-pad">
                  <p className="as-eyebrow">NEW SESSION</p>
                  <h3 className="as-title">What can I help with?</h3>
                  <p className="as-sub">Tell me what you&apos;d like to do and I&apos;ll figure out the best way to help.</p>
                  <div className="as-crab" aria-hidden="true"><VoiceOrbIdle className="as-voice-orb" /></div>
                  <div className="as-divider"><span>RECENT</span></div>
                  <p className="as-none">No sessions yet</p>
                </div>
                <div className="as-composer as-composer-menu">
                  <div className="as-menu" aria-hidden="true">
                    {[
                      { icon: <><circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/></>, label: 'Find something' },
                      { icon: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>, label: 'Orient yourself' },
                      { icon: <><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></>, label: 'Go somewhere' },
                      { icon: <><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><path d="M10 6h11M10 12h11M10 18h11"/></>, label: 'Work on a task' },
                      { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>, label: 'Read something' },
                      { icon: <><path d="M9 11V6a3 3 0 0 1 6 0v5"/><path d="M5 11h14l-1 10H6z"/></>, label: 'Use a kiosk or device' },
                    ].map((item) => (
                      <div className="as-menu-row" key={item.label}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="as-chips">
                    <span className="as-chip as-chip-highlight"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h12M4 12h12M4 18h12"/></svg>Activities</span>
                    <span className="as-chip as-chip-filled"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span>
                  </div>
                  <div className="as-input">Describe your goal&hellip;</div>
                </div>
                <span className="tap-ind tap-ind-activities" aria-hidden="true"><span className="tap-ring"/><span className="tap-ring"/></span>
                <TabBar active="assistant" />
              </div>

              {/* Screen: Assistant Ask */}
              <div className="screen screen-assistant screen-assistant-ask" data-screen="assistant-ask">
                <IosStatus time="7:03" />
                <div className="screen-pad as-pad">
                  <p className="as-eyebrow">LISTENING</p>
                  <h3 className="as-title">Go ahead, I&apos;m&nbsp;listening.</h3>
                  <p className="as-sub">Say what you&apos;d like to do &mdash; I&apos;ll work out the steps.</p>
                  <div className="as-crab" aria-hidden="true"><VoiceOrbListen className="as-voice-orb as-voice-orb-active" /></div>
                  <div className="as-transcript">
                    <span className="as-transcript-inner">&ldquo;Organize my mail.&rdquo;</span>
                  </div>
                </div>
                <div className="as-composer">
                  <div className="as-chips">
                    <span className="as-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h12M4 12h12M4 18h12"/></svg>Activities</span>
                    <span className="as-chip as-chip-filled as-chip-highlight"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span>
                  </div>
                  <div className="as-input">Describe your goal&hellip;</div>
                </div>
                <span className="tap-ind tap-ind-ask" aria-hidden="true"><span className="tap-ring"/><span className="tap-ring"/></span>
                <TabBar active="assistant" />
              </div>

              {/* Screen: Assistant Plan */}
              <div className="screen screen-assistant screen-assistant-plan" data-screen="assistant-plan">
                <IosStatus time="7:03" />
                <div className="as-plan-dim" aria-hidden="true" />
                <div className="as-sheet">
                  <div className="as-sheet-grab" aria-hidden="true" />
                  <p className="as-eyebrow as-eyebrow-blue">YOUR PLAN</p>
                  <h3 className="as-title as-title-sheet">Organize my mail</h3>
                  <div className="as-sheet-divider" />
                  <ol className="as-plan-list">
                    {[
                      { n: 1, icon: <><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></>, text: 'Navigate to the kitchen where the mail is located.', mode: 'Go' },
                      { n: 2, icon: <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></>, text: 'Scan the surface to identify the pile of mail.', mode: 'Snapshot' },
                      { n: 3, icon: <><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><path d="M10 6h11M10 12h11M10 18h11"/></>, text: 'Pick up the mail from the surface.', mode: 'Task' },
                      { n: 4, icon: <><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><path d="M10 6h11M10 12h11M10 18h11"/></>, text: 'Place the mail into a designated sorting tray or folder.', mode: 'Task' },
                    ].map((step) => (
                      <li key={step.n}>
                        <span className="as-plan-n">{step.n}</span>
                        <span className="as-plan-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{step.icon}</svg></span>
                        <span className="as-plan-body">
                          <span className="as-plan-text">{step.text}</span>
                          <span className="as-plan-sub">{step.mode}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="as-plan-actions">
                    <span className="as-plan-accept">Accept Plan</span>
                    <div className="as-plan-row">
                      <span className="as-plan-alt">Edit</span>
                      <span className="as-plan-alt">Dismiss</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screen: Assistant Active */}
              <div className="screen screen-assistant screen-assistant-active" data-screen="assistant-active">
                <IosStatus time="7:03" />
                <div className="screen-pad as-active-pad">
                  <div className="as-active-bar">
                    <span className="as-active-end"><span className="as-active-x">&times;</span> End</span>
                    <div className="as-active-center">
                      <p className="as-eyebrow as-eyebrow-blue">ACTIVE SESSION</p>
                      <p className="as-active-title">Organize my mail</p>
                    </div>
                    <span className="as-active-done">&check; Done</span>
                  </div>
                  <div className="as-active-dots" aria-hidden="true">
                    <span className="as-dot as-dot-on" /><span className="as-dot" /><span className="as-dot" /><span className="as-dot" />
                  </div>
                  <div className="as-step-card">
                    <div className="as-step-head">
                      <span className="as-step-eyebrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>
                        STEP 1 OF 4
                      </span>
                      <span className="as-step-go">Go</span>
                    </div>
                    <p className="as-step-text">Navigate to the kitchen where the mail is located.</p>
                    <div className="as-step-footer">
                      <span className="as-step-analyzing"><span className="as-spin" aria-hidden="true" />Analyzing&hellip;</span>
                      <span className="as-step-complete">Mark<br/>Complete</span>
                    </div>
                    <div className="as-step-arrows">
                      <span className="as-step-arrow">&lsaquo;</span>
                      <span className="as-step-arrow">&rsaquo;</span>
                    </div>
                  </div>
                </div>
                <div className="as-active-footer">
                  <span className="as-active-ask">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>
                    Ask Fathom
                  </span>
                  <span className="as-active-plus">+</span>
                </div>
              </div>

              {/* Screen: Lookout */}
              <div className="screen screen-lookout" data-screen="lookout">
                <IosStatus />
                <div className="screen-pad">
                  <div className="lk-nav">
                    <span className="lk-back"><span className="chev-left">&lsaquo;</span> Home</span>
                    <span className="pill-ai"><span className="pill-ai-dot" />AI Enabled</span>
                  <span className="mode-more"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></span></div>
                  <p className="lk-eyebrow">LOOKOUT</p>
                  <div className="lk-stage">
                    <VoiceOrbListen className="lk-voice-orb" />
                    <p className="lk-listening">Listening...</p>
                  </div>
                </div>
                <div className="mode-actions"><span className="mode-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span><span className="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.2"/></svg></span><span className="mode-end">End</span></div>
              </div>

              {/* Screen: Go */}
              <div className="screen screen-go" data-screen="go">
                <IosStatus />
                <div className="screen-pad">
                  <div className="go-topbar">
                    <span className="pill-ai"><span className="pill-ai-dot" />AI Enabled</span>
                    <span className="link-navy">Go</span>
                  <span className="mode-more"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></span></div>
                  <h3 className="go-dest">Kitchen</h3>
                  <p className="go-sub">Shake when you&apos;ve arrived</p>
                  <div className="go-center">
                    <VoiceOrbListen className="go-voice-orb" />
                    <p className="go-heading">Heading to Kitchen&hellip;</p>
                  </div>
                </div>
                <div className="mode-actions"><span className="mode-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span><span className="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.2"/></svg></span><span className="mode-end">End</span></div>
              </div>

              {/* Screen: Live Task */}
              <div className="screen screen-live" data-screen="live">
                <IosStatus />
                <div className="screen-pad live-pad">
                  <div className="live-topbar">
                    <span className="pill-dot"><span className="pill-dot-dot" />Connected</span>
                    <span className="pill-task">BETA</span>
                  <span className="mode-more"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></span></div>
                  <div className="live-stage">
                    <h3 className="live-title">Folding my laundry</h3>
                    <div className="live-mic"><VoiceOrbListen className="live-voice-orb" /></div>
                    <p className="live-listen">Listening...</p>
                  </div>
                </div>
                <div className="mode-actions"><span className="mode-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span><span className="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.2"/></svg></span><span className="mode-end">End</span></div>
              </div>

            </div>
            <div className="phone-reflect" aria-hidden="true" />
          </div>
        </div>

        {/* Scrolly Steps */}
        <div className="scrolly-steps">
          <div className="step is-visible" data-step="home">
            <MobilePhone><HomeScreen active /></MobilePhone>
            <p className="eyebrow">Home</p>
            <h2>Five modes.<br/><span className="muted">One calm surface.</span></h2>
            <p className="step-body">Fathom opens on a single screen with everything a step away. Snapshot for a quick look. Lookout for ongoing awareness. Go for navigating to a place. Task for step-by-step help with what you&apos;re doing. And the Assistant, one tab over, for when you&apos;d rather say the goal and let Fathom choose.</p>
            <p className="step-body">Each mode is designed to do one thing well &mdash; so you never have to think about which button to press, just what you need right now.</p>
          </div>
          <div className="step" data-step="lookout">
            <MobilePhone><div className="screen screen-lookout" style={{opacity:1,transform:'none'}}><IosStatus/><div className="screen-pad"><div className="lk-nav"><span className="lk-back"><span className="chev-left">&lsaquo;</span> Home</span><span className="pill-ai"><span className="pill-ai-dot"/>AI Enabled</span><span className="mode-more"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></span></div><p className="lk-eyebrow">LOOKOUT</p><div className="lk-stage"><VoiceOrbListen className="lk-voice-orb"/><p className="lk-listening">Listening...</p></div></div>
                <div className="mode-actions"><span className="mode-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span><span className="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.2"/></svg></span><span className="mode-end">End</span></div></div></MobilePhone>
            <p className="eyebrow">Lookout</p>
            <h2>Silence<br/><span className="muted">means safety.</span></h2>
            <p className="step-body">Lookout is your always-on safety companion. It watches continuously but only speaks when something matters &mdash; a step down ahead, a glass door, a person on a collision course. When Fathom is quiet, you know the path is clear.</p>
            <p className="step-body">An Awareness setting sets how much you hear: Hazards Only, Balanced or Full Awareness. Haptic alerts fire in under 100 ms when something&apos;s close.</p>
            <p className="step-whisper">On-device object detection, several times a second. Works without a network.</p>
          </div>
          <div className="step" data-step="point">
            <MobilePhone><PointScreen active /></MobilePhone>
            <p className="eyebrow">Point to ask</p>
            <h2>Point at anything.<br/><span className="muted">Fathom names it.</span></h2>
            <p className="step-body">Hold your arm out and point for about a second. You feel a tap, hear the earcon, and get the answer in three parts: the thing in a few words, any words on it read exactly, then where it is and what&apos;s around it. Sweep your finger to something else to hear about that too.</p>
            <blockquote className="step-example">{COPY.justPoint.beats.map((b) => <p key={b}>{b}</p>)}</blockquote>
            <p className="step-body">LiDAR measures the distance to what you&apos;re pointing at, so Fathom describes what is there rather than what it expects. Hands-free in Lookout and Go; from the Snapshot menu anywhere.</p>
            <p className="step-whisper">New in 1.2.0. Free.</p>
          </div>
          <div className="step" data-step="snapshot">
            <MobilePhone><HomeScreen active menu /></MobilePhone>
            <p className="eyebrow">Snapshot</p>
            <h2>One look.<br/><span className="muted">Five ways to ask.</span></h2>
            <p className="step-body">Snapshot describes what&apos;s in front of you. Open its menu and it can also read text, identify an object, answer a question about what&apos;s in view, tell you what you&apos;re pointing at, or read a digital screen: the display type first, then its layout, then what it says.</p>
            <p className="step-whisper">All five are free.</p>
          </div>
          <div className="step" data-step="go">
            <MobilePhone><div className="screen screen-go" style={{opacity:1,transform:'none'}}><IosStatus/><div className="screen-pad"><div className="go-topbar"><span className="pill-ai"><span className="pill-ai-dot"/>AI Enabled</span><span className="link-navy">Go</span><span className="mode-more"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></span></div><h3 className="go-dest">Kitchen</h3><p className="go-sub">Shake when you&apos;ve arrived</p><div className="go-center"><VoiceOrbListen className="go-voice-orb"/><p className="go-heading">Heading to Kitchen&hellip;</p></div></div><div className="mode-actions"><span className="mode-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span><span className="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.2"/></svg></span><span className="mode-end">End</span></div></div></MobilePhone>
            <p className="eyebrow">Go</p>
            <h2>Turn-by-turn<br/><span className="muted">indoor navigation.</span></h2>
            <p className="step-body">Say where you&apos;re headed &mdash; &ldquo;the kitchen,&rdquo; &ldquo;Room 412,&rdquo; &ldquo;the pharmacy&rdquo; &mdash; and Fathom gets you there. It reads room numbers and signs as you pass them, calls turns before you need them, and tells you when you&apos;ve arrived, down to where the door handle is.</p>
            <p className="step-body">Directions use a clock-face system: &ldquo;door at 2 o&apos;clock, about eight meters.&rdquo; Obstacle alerts pulse faster as you approach, so the space has a shape you can feel in your hand.</p>
            <p className="step-whisper">On-device depth sensing and AI vision, together.</p>
          </div>
          <div className="step" data-step="live">
            <MobilePhone><div className="screen screen-live" style={{opacity:1,transform:'none'}}><IosStatus/><div className="screen-pad live-pad"><div className="live-topbar"><span className="pill-dot"><span className="pill-dot-dot"/>Connected</span><span className="pill-task">BETA</span><span className="mode-more"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></span></div><div className="live-stage"><h3 className="live-title">Folding my laundry</h3><div className="live-mic"><VoiceOrbListen className="live-voice-orb"/></div><p className="live-listen">Listening...</p></div></div><div className="mode-actions"><span className="mode-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span><span className="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.2"/></svg></span><span className="mode-end">End</span></div></div></MobilePhone>
            <p className="eyebrow">Task</p>
            <h2>A real-time companion<br/><span className="muted">for the task at hand.</span></h2>
            <p className="step-body">Task guides you one step at a time: folding laundry, finding the milk, sorting paperwork, working through a kiosk. Live Task makes it a conversation. Hold to talk, and Fathom answers from what&apos;s actually in front of you, at the speed of your hands.</p>
            <p className="step-whisper">Live Task streams audio and video both ways. It&apos;s in beta.</p>
          </div>
          <div className="step" data-step="assistant">
            <MobilePhone><div className="screen screen-assistant" style={{opacity:1,transform:'none'}}><IosStatus time="7:03"/><div className="screen-pad as-pad"><p className="as-eyebrow">NEW SESSION</p><h3 className="as-title">What can I help with?</h3><p className="as-sub">Tell me what you&apos;d like to do and I&apos;ll figure out the best way to help.</p><div className="as-crab" aria-hidden="true"><VoiceOrbIdle className="as-voice-orb"/></div><div className="as-divider"><span>RECENT</span></div><p className="as-none">No sessions yet</p></div><div className="as-composer"><div className="as-chips"><span className="as-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h12M4 12h12M4 18h12"/></svg>Activities</span><span className="as-chip as-chip-filled"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></svg>Ask Fathom</span></div><div className="as-input">Describe your goal&hellip;</div></div><TabBar active="assistant"/></div></MobilePhone>
            <p className="eyebrow">Assistant</p>
            <h2>Describe a goal.<br/><span className="muted">Fathom handles the rest.</span></h2>
            <p className="step-body">Tell the Assistant what you want to do &mdash; &ldquo;get me to my 3 o&apos;clock on the fourth floor&rdquo; &mdash; and it figures out the path. Lookout walks you in. Go takes you to the elevator, then the suite. Task checks you in at the desk.</p>
            <p className="step-body">You never think about modes. The Assistant understands intent, breaks it into steps, and orchestrates everything Fathom can do.</p>
          </div>
          <div className="step" data-step="assistant-activities">
            <p className="eyebrow">Activities</p>
            <h2>Not sure where<br/><span className="muted">to start?</span></h2>
            <p className="step-body">Tap <strong>Activities</strong> for a short menu of the things Fathom does well &mdash; find something, orient yourself, go somewhere, work on a task, read something, use a kiosk.</p>
            <p className="step-body">It&apos;s a guide rail, not a wall. Pick an activity and Fathom tailors the rest of the flow around it.</p>
          </div>
          <div className="step" data-step="assistant-ask">
            <p className="eyebrow">Ask Fathom</p>
            <h2>Or just say it<br/><span className="muted">in your own words.</span></h2>
            <p className="step-body">Hit <strong>Ask Fathom</strong> and talk. &ldquo;Organize my mail.&rdquo; &ldquo;Find the oat milk.&rdquo; &ldquo;Check me in at the pharmacy desk.&rdquo; Fathom listens, parses intent, and starts building a plan.</p>
            <p className="step-whisper">On-device speech. No wake word required.</p>
          </div>
          <div className="step" data-step="assistant-plan">
            <MobilePhone><div className="screen screen-assistant screen-assistant-plan" style={{opacity:1,transform:'none'}}><IosStatus time="7:03"/><div className="as-plan-dim"/><div className="as-sheet"><div className="as-sheet-grab"/><p className="as-eyebrow as-eyebrow-blue">YOUR PLAN</p><h3 className="as-title as-title-sheet">Organize my mail</h3><div className="as-sheet-divider"/><ol className="as-plan-list"><li><span className="as-plan-n">1</span><span className="as-plan-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg></span><span className="as-plan-body"><span className="as-plan-text">Navigate to the kitchen.</span><span className="as-plan-sub">Go</span></span></li><li><span className="as-plan-n">2</span><span className="as-plan-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/></svg></span><span className="as-plan-body"><span className="as-plan-text">Scan the surface.</span><span className="as-plan-sub">Snapshot</span></span></li><li><span className="as-plan-n">3</span><span className="as-plan-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><path d="M10 6h11M10 12h11"/></svg></span><span className="as-plan-body"><span className="as-plan-text">Pick up and sort the mail.</span><span className="as-plan-sub">Task</span></span></li></ol><div className="as-plan-actions"><span className="as-plan-accept">Accept Plan</span></div></div></div></MobilePhone>
            <p className="eyebrow">The plan</p>
            <h2>A plan you can<br/><span className="muted">see before you start.</span></h2>
            <p className="step-body">Fathom thinks for a moment, then shows its work: a short ordered list of steps, each labeled with the mode that will handle it &mdash; Go, Snapshot, Task.</p>
            <p className="step-body">Accept it as-is, edit a step, or dismiss and try again. Nothing happens until you say go.</p>
          </div>
          <div className="step" data-step="assistant-active">
            <p className="eyebrow">Active session</p>
            <h2>One step at a time,<br/><span className="muted">hands free.</span></h2>
            <p className="step-body">Once you accept, Fathom runs the plan step by step. Each screen is focused on one thing &mdash; walk here, look at this, do that &mdash; and Ask Fathom stays within reach if the world changes.</p>
            <p className="step-whisper">End the session any time. Mark steps complete by voice or tap.</p>
          </div>
        </div>
      </section>

      {/* ── Everywhere ────────────────────────────────────── */}
      <section className="everywhere" id="how" aria-labelledby="everywhere-title">
        <div className="everywhere-inner">
          <p className="eyebrow reveal">Day one</p>
          <h2 id="everywhere-title" className="h-display reveal">No maps.<br/>No beacons.<br/><span className="muted">No setup.</span></h2>
          <div className="everywhere-body">
            <p className="reveal">Most indoor navigation tools ask buildings to install infrastructure or upload floor plans. Fathom doesn&apos;t. It uses the camera, AI, and sensors already in your iPhone. Walk in, it works.</p>
            <p className="reveal">Lose internet? On-device object detection and depth sensing keep running. Obstacle alerts never stop. Safety doesn&apos;t depend on a network connection.</p>
          </div>
        </div>
      </section>

      {/* ── Spectrum ──────────────────────────────────────── */}
      <section className="spectrum" aria-labelledby="spectrum-title">
        <div className="spectrum-inner">
          <p className="eyebrow reveal">Designed for the full spectrum</p>
          <h2 id="spectrum-title" className="h-display reveal">Built for how you<br/><span className="muted">actually use it.</span></h2>
          <div className="spectrum-grid">
            <article className="spec-card reveal">
              <div className="spec-icon spec-icon-sound" aria-hidden="true"><span className="wave w1"/><span className="wave w2"/><span className="wave w3"/></div>
              <h3>Distinct sounds</h3>
              <p>Every state change has its own earcon, so you know what happened without being told.</p>
            </article>
            <article className="spec-card reveal">
              <div className="spec-icon spec-icon-haptic" aria-hidden="true"><span className="haptic-dot"/><span className="haptic-ring"/><span className="haptic-ring haptic-ring-2"/></div>
              <h3>Haptic patterns</h3>
              <p>Every interaction has its own shape in your hand. You learn the vocabulary in a week.</p>
            </article>
            <article className="spec-card reveal">
              <div className="spec-icon spec-icon-spatial" aria-hidden="true"><span className="sp-dot"/><span className="sp-l"/><span className="sp-r"/></div>
              <h3>Directional sound</h3>
              <p>Sound comes from the side something is on. Left or right, before a word is spoken.</p>
            </article>
            <article className="spec-card reveal">
              <div className="spec-icon spec-icon-low" aria-hidden="true"><span className="lv-bar"/><span className="lv-bar lv-bar-2"/><span className="lv-bar lv-bar-3"/></div>
              <h3>Low-vision first</h3>
              <p>High contrast, large targets, works without VoiceOver when you have the light for it.</p>
            </article>
          </div>
          <p className="spectrum-footer reveal">VoiceOver is a first-class citizen, not a retrofit. Low vision isn&apos;t a lesser version of blindness &mdash; the experience is complete either way.</p>
        </div>
      </section>

      {/* ── Download ──────────────────────────────────────── */}
      <section className="signup" id="download" aria-labelledby="download-title">
        <div className="signup-inner">
          <div className="signup-left">
            <p className="eyebrow">Available now</p>
            <h2 id="download-title" className="h-display">Download Fathom free.</h2>
            <p className="signup-lede">Fathom is on the App Store. Free to download, no account needed. Install and go.</p>
            <ul className="signup-points" role="list">
              <li><span className="tick" aria-hidden="true" />Free download</li>
              <li><span className="tick" aria-hidden="true" />Works with VoiceOver</li>
              <li><span className="tick" aria-hidden="true" />iPhone, iOS 17 or later</li>
            </ul>
            <div className="press-line">
              <p><strong>Press or media?</strong> Drop us a line at <a href="mailto:support@fathomvision.app">support@fathomvision.app</a> &mdash; press kit on request.</p>
            </div>
          </div>

          <div className="download-card">
            <a href={APP_STORE_URL} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
              Download on the App Store
            </a>
            <p className="download-note">Free &middot; iPhone &middot; iOS&nbsp;17+</p>
            <p className="download-sub">Lookout, Snapshot, pointing and every safety alert are free forever.</p>
            <p className="download-sub">Go, Task, Live Task and Assistant are Fathom Plus: $12.99 a month after a seven-day free trial.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
