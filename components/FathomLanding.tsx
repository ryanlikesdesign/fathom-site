import './fathom-landing.css';
import { LandingScroll } from './LandingScroll';
import { StickyPhone } from './StickyPhone';
import { MobilePhone } from './MobilePhone';
import { AppleMark } from '@/components/AppleMark';
import { COPY, POINTING, SHORTCUT_WORD, SNAPSHOT_OPTIONS } from '@/lib/landing-content';

// Hero, download and step copy render from the fixture, so the tests in
// test/landing-content.test.ts pin what the page says, not a copy of it.

const APP_STORE_URL = 'https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183';

// ── iOS Status Bar SVG (shared across all screens) ───────────────
function IosStatus({ time = '9:41' }: { time?: string }) {
  return (
    <div className="ios-status">
      <span className="ios-time">{time}</span>
      <span className="ios-island" />
      <span className="ios-right">
        <svg className="ios-ic-bars" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true"><use href="#i-bars"/></svg>
        <svg className="ios-ic-wifi" viewBox="0 0 16 11" fill="currentColor" aria-hidden="true"><use href="#i-wifi"/></svg>
        <svg className="ios-ic-batt" viewBox="0 0 26 12" fill="currentColor" aria-hidden="true"><use href="#i-batt"/></svg>
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
        <circle className="ring-a" cx="41" cy="41" r="40" stroke="currentColor" strokeWidth="2.6" fill="none"/>
        <circle className="ring-b" cx="41" cy="41" r="40" stroke="currentColor" strokeWidth="2.6" fill="none"/>
        <circle className="ring-c" cx="41" cy="41" r="40" stroke="currentColor" strokeWidth="2.6" fill="none"/>
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
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 10.5V20a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1v-9.5z" fill="currentColor"/></svg>
        <small>Home</small>
      </span>
      <span className={`tab${active === 'assistant' ? ' tab-active' : ''}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8zM18 14l.9 2.6 2.6.9-2.6.9L18 21l-.9-2.6-2.6-.9 2.6-.9z" fill="currentColor" stroke="none"/></svg>
        <small>Assistant</small>
      </span>
      <span className={`tab${active === 'history' ? ' tab-active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>
        <small>History</small>
      </span>
      <span className={`tab${active === 'settings' ? ' tab-active' : ''}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" fill="currentColor"/><circle cx="12" cy="12" r="3" fill="var(--s-surface)"/></svg>
        <small>Settings</small>
      </span>
    </div>
  );
}

// The two phone sets (the desktop sticky stack, one inline phone per step on
// phones) live in StickyPhone.tsx and MobilePhone.tsx: client islands that
// each render only on their own side of 861px, so no width carries both.

// ── Active-mode shell pieces (ActiveModeShell.swift) ─────────────
// The strip every active mode shares: a centered MODE capsule (green antenna
// = the session is live), the session title beneath it, and the "More
// actions" ⋯ pinned top-right. There is no back link; End is the way out.
function ModeStrip({ mode, title }: { mode: string; title?: string }) {
  return (
    <div className="ms">
      <span className="mode-more"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><use href="#i-more"/></svg></span>
      <span className="ms-pill">
        {mode}
        <svg className="ms-ant" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 20V10"/><path d="M8.5 7.5a5 5 0 0 1 7 0"/><path d="M5.5 4.5a9 9 0 0 1 13 0"/><circle cx="12" cy="10" r="1.2" fill="currentColor"/></svg>
      </span>
      {title && <span className="ms-title">{title}</span>}
    </div>
  );
}

// The footer every active mode shares: "Ask Fathom" primary (ambient orb as
// its leading icon), a Snapshot icon (Lookout/Point/Go only), then one "End"
// tile on its own session bar. Nothing else exists in the app.
function ModeActions({ snapshot = false }: { snapshot?: boolean }) {
  return (
    <>
      <div className="mode-actions">
        <span className="mode-primary"><span className="mode-orb" aria-hidden="true" />Ask Fathom</span>
        {snapshot && <span className="mode-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-cam"/></svg></span>}
      </div>
      <div className="session-bar">
        <span className="mode-end"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>End</span>
      </div>
    </>
  );
}

// ── Snapshot menu glyphs (HomeView.swift:268-274 pairs each intent with an
//    SF Symbol; these are the outline equivalents, keyed by the app's titles) ──
const SNAP_ICON_PATH: Record<(typeof SNAPSHOT_OPTIONS)[number], string> = {
  'Read text': 'M4 5h13M4 10h13M4 15h9',
  'Identify object': 'M4 7h3l2-2h6l2 2h3v12H4z M12 13a3 3 0 100-6 3 3 0 000 6z',
  "Ask about what's in view": 'M9 9a3 3 0 115.2 2c-1 .8-1.7 1.4-1.7 2.6 M12 17h.01',
  'What am I pointing at': 'M14 3l6 6-8 2-2 8-6-6z',
  'Read a screen': 'M4 5h15v10H4z M9 19h5',
};

// ── Home screen content (reused: scrolly sticky phone + hero phone) ────────
function HomeScreen({ active = false, menu = false }: { active?: boolean; menu?: boolean }) {
  return (
    <div className={`screen screen-home${menu ? ' screen-snapshot' : ''}${active ? ' is-active' : ''}`} data-screen={menu ? 'snapshot' : 'home'}>
      <IosStatus />
      <div className="screen-pad">
        <div className="home-topbar">
          <span className="pill-ai"><svg className="pill-ai-antenna" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 20V10"/><path d="M8.5 7.5a5 5 0 0 1 7 0"/><path d="M5.5 4.5a9 9 0 0 1 13 0"/><circle cx="12" cy="10" r="1.2" fill="currentColor"/></svg>AI Enabled</span>
          <span className="link-navy">Lookout</span>
        </div>
        {/* Brand row with the Tips (lightbulb) and Feedback (text.bubble)
            buttons at the trailing edge, HomeView.swift:233-249. */}
        <div className="home-header-row">
          <div className="home-brand">
            <svg className="home-mark" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="2.6" fill="currentColor"/>
              <circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".65"/>
              <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".35"/>
            </svg>
            <span className="home-word">fathom</span>
          </div>
          <div className="home-icons">
            <span className="home-iconbtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M8.5 15a6 6 0 1 1 7 0c-.8.6-1.2 1.3-1.3 2h-4.4c-.1-.7-.5-1.4-1.3-2z"/></svg></span>
            <span className="home-iconbtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-4 3.5z"/><path d="M8 9h8M8 12h5"/></svg></span>
          </div>
        </div>
        <p className="home-tag">Your AI-powered guide to the world around you</p>
        <div className="snap-anchor">
          <span className="home-snapshot">
            <span className="snap-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-cam"/></svg>
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
                <div className="snap-menu-row" key={o}><span>{o}</span><svg className="snap-menu-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SNAP_ICON_PATH[o]}/></svg></div>
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
            {/* Default Task backend, HomeView.swift:378-386. The BETA badge exists
                only with the live backend, and that state also swaps the subtitle,
                so a badge beside "Step-by-step guidance" is a screen the app never
                shows. */}
            <span className="row-text"><span className="row-title">Task</span><span className="row-sub">Step-by-step guidance</span></span>
            <span className="row-chev" aria-hidden="true">&rsaquo;</span>
          </div>
        </div>
        {/* The app's permanent AI transparency footer, HomeView.swift:398-427. */}
        <div className="home-disclaimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
          <p>Fathom uses AI. It can make mistakes.<br/>Always use your other mobility tools.</p>
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
        <ModeStrip mode="LOOKOUT" title="Balanced" />
        <div className="pt-stage">
          <VoiceOrbListen className="lk-voice-orb" />
          <p className="lk-listening">{POINTING.firstCue}</p>
        </div>
      </div>
      <ModeActions snapshot />
    </div>
  );
}

// ── Lookout screen (LookoutActiveView.swift) ─────────────────────
function LookoutScreen({ active = false }: { active?: boolean }) {
  return (
    <div className={`screen screen-lookout${active ? ' is-active' : ''}`} data-screen="lookout">
      <IosStatus />
      <div className="screen-pad">
        <ModeStrip mode="LOOKOUT" title="Balanced" />
        <div className="lk-stage">
          <VoiceOrbListen className="lk-voice-orb" />
          <p className="lk-listening">Listening&hellip;</p>
        </div>
      </div>
      <ModeActions snapshot />
    </div>
  );
}

// ── Go screen (GoActiveView.swift) ───────────────────────────────
function GoScreen({ active = false }: { active?: boolean }) {
  return (
    <div className={`screen screen-go${active ? ' is-active' : ''}`} data-screen="go">
      <IosStatus />
      <div className="screen-pad">
        <ModeStrip mode="GO" title="Kitchen" />
        <div className="go-center">
          <VoiceOrbListen className="go-voice-orb" />
          <p className="go-heading">Heading to Kitchen&hellip;</p>
          <p className="go-sub">Shake when you&apos;ve arrived</p>
        </div>
      </div>
      <ModeActions snapshot />
    </div>
  );
}

// ── Live Task screen (LiveTaskActiveView.swift) ──────────────────
function LiveScreen({ active = false }: { active?: boolean }) {
  return (
    <div className={`screen screen-live${active ? ' is-active' : ''}`} data-screen="live">
      <IosStatus />
      <div className="screen-pad live-pad">
        <ModeStrip mode="LIVE TASK" title="Folding my laundry" />
        <div className="live-stage">
          <span className="live-step">Step 2</span>
          <div className="live-mic"><VoiceOrbListen className="live-voice-orb" /></div>
          <p className="live-listen">Listening&hellip;</p>
        </div>
      </div>
      <ModeActions />
    </div>
  );
}

// ── Assistant composer chips (shared by the two idle-state screens) ──
function AssistantChips({ highlight }: { highlight?: 'activities' | 'ask' }) {
  return (
    <div className="as-chips">
      <span className={`as-chip${highlight === 'activities' ? ' as-chip-highlight' : ''}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 6h12M4 12h12M4 18h12"/></svg>Activities</span>
      <span className={`as-chip as-chip-filled${highlight === 'ask' ? ' as-chip-highlight' : ''}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-mic"/></svg>Ask Fathom</span>
    </div>
  );
}

// ── Assistant idle header (AssistantView.swift: New Session) ─────
function AssistantIdlePad() {
  return (
    <div className="screen-pad as-pad">
      <p className="as-eyebrow">NEW SESSION</p>
      <h3 className="as-title">What can I help with?</h3>
      <p className="as-sub">Tell me what you&apos;d like to do and I&apos;ll figure out the best way to help.</p>
      <span className="as-pulse" aria-hidden="true"><span className="as-pulse-ring" /><span className="as-pulse-ring" /></span>
      <div className="as-divider"><span>RECENT</span></div>
      <p className="as-none">No sessions yet</p>
    </div>
  );
}

// ── Assistant screen: idle New Session ───────────────────────────
function AssistantScreen({ active = false }: { active?: boolean }) {
  return (
    <div className={`screen screen-assistant${active ? ' is-active' : ''}`} data-screen="assistant">
      <IosStatus />
      <AssistantIdlePad />
      <div className="as-composer">
        <AssistantChips />
        <div className="as-input">Describe your goal&hellip;</div>
      </div>
      <TabBar active="assistant" />
    </div>
  );
}

// ── Assistant screen: Activities menu open ───────────────────────
const ACTIVITIES = [
  { icon: <><circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/></>, label: 'Find something' },
  { icon: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" fill="currentColor"/><circle cx="12" cy="12" r="2.6" fill="var(--s-surface)"/></>, label: 'Orient yourself' },
  { icon: <><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></>, label: 'Go somewhere' },
  { icon: <><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><path d="M10 6h11M10 12h11M10 18h11"/></>, label: 'Work on a task' },
  { icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>, label: 'Read something' },
  { icon: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M13 11v8a2 2 0 0 1-4 0v-3"/><path d="M9 16l-1.5-1.5"/></>, label: 'Use a kiosk or device' },
];

function AssistantActivitiesScreen({ active = false }: { active?: boolean }) {
  return (
    <div className={`screen screen-assistant screen-assistant-activities${active ? ' is-active' : ''}`} data-screen="assistant-activities">
      <IosStatus />
      <AssistantIdlePad />
      <div className="as-composer as-composer-menu">
        <div className="as-menu" aria-hidden="true">
          {ACTIVITIES.map((item) => (
            <div className="as-menu-row" key={item.label}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <AssistantChips highlight="activities" />
        <div className="as-input">Describe your goal&hellip;</div>
      </div>
      <span className="tap-ind tap-ind-activities" aria-hidden="true"><span className="tap-ring"/><span className="tap-ring"/></span>
      <TabBar active="assistant" />
    </div>
  );
}

// ── Assistant screen: Ask Fathom, listening. AssistantView.swift's
//    voiceListeningBar: 40pt mic indicator, live transcription, Cancel. The
//    header above it is unchanged; nothing else appears while listening. ──
function AssistantAskScreen({ active = false }: { active?: boolean }) {
  return (
    <div className={`screen screen-assistant screen-assistant-ask${active ? ' is-active' : ''}`} data-screen="assistant-ask">
      <IosStatus />
      <AssistantIdlePad />
      <div className="as-listenbar">
        <span className="as-listen-mic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href="#i-mic"/></svg></span>
        <span className="as-listen-text">Organize my mail</span>
        <span className="as-listen-cancel">Cancel</span>
      </div>
      <TabBar active="assistant" />
    </div>
  );
}

// ── Assistant screen: the plan sheet ─────────────────────────────
// One entry per step; `sub` is the mode that will run it.
const PLAN = [
  { text: 'Navigate to the kitchen where the mail is located.', sub: 'Go', icon: <><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></> },
  { text: 'Scan the surface to identify the pile of mail.', sub: 'Snapshot', icon: <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></> },
  { text: 'Pick up the mail from the surface.', sub: 'Task', icon: <><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><path d="M10 6h11M10 12h11M10 18h11"/></> },
  { text: 'Place the mail into a designated sorting tray or folder.', sub: 'Task', icon: <><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><path d="M10 6h11M10 12h11M10 18h11"/></> },
];

function PlanScreen({ active = false }: { active?: boolean }) {
  return (
    <div className={`screen screen-assistant screen-assistant-plan${active ? ' is-active' : ''}`} data-screen="assistant-plan">
      <IosStatus />
      <div className="as-plan-dim" aria-hidden="true" />
      <div className="as-sheet">
        <div className="as-sheet-grab" aria-hidden="true" />
        <p className="as-eyebrow as-eyebrow-blue">YOUR PLAN</p>
        <h3 className="as-title as-title-sheet">Organize my mail</h3>
        <div className="as-sheet-divider" />
        <ol className="as-plan-list">
          {PLAN.map((step, i) => (
            <li key={step.text}>
              <span className="as-plan-n">{i + 1}</span>
              <span className="as-plan-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{step.icon}</svg></span>
              <span className="as-plan-body">
                <span className="as-plan-text">{step.text}</span>
                <span className="as-plan-sub">{step.sub}</span>
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
  );
}

// ── Assistant screen: Active session. AssistantActiveSessionView.swift: the
//    shared ActiveModeShell (Ask Fathom + End, ⋯ menu), step number in the shell
//    title, 120pt orb, step text, executor status, one "Next Step" button. ──
function AssistantActiveScreen({ active = false }: { active?: boolean }) {
  return (
    <div className={`screen screen-assistant screen-assistant-active${active ? ' is-active' : ''}`} data-screen="assistant-active">
      <IosStatus />
      <div className="screen-pad as-active-pad">
        <ModeStrip mode="ASSISTANT" title={`Step 1 of ${PLAN.length}`} />
        <div className="as-active-stage">
          <VoiceOrbIdle className="as-active-orb" />
          <p className="as-step-text">{PLAN[0].text}</p>
          <span className="as-step-analyzing"><span className="as-spin" aria-hidden="true" />Analyzing...</span>
          <span className="as-next-step">Next Step</span>
        </div>
      </div>
      <ModeActions />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
// A server component: the markup is static, and every scroll behavior
// (progress rail, step switching, inert hero, off-screen pause) lives in the
// LandingScroll island so the page ships no React state of its own.
export function FathomLanding() {
  return (
    <div className="fathom-root">
      <LandingScroll />
      {/* Icon sprite: one copy of each shared glyph; screens reference them with
          <use>. Symbols carry no fill/stroke, the referencing <svg> sets them. */}
      <svg className="icon-sprite" aria-hidden="true">
        <symbol id="i-mic" viewBox="0 0 24 24"><rect x="10" y="3" width="4" height="11" rx="2"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v3"/></symbol>
        <symbol id="i-cam" viewBox="0 0 24 24"><path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.2"/></symbol>
        <symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></symbol>
        <symbol id="i-bars" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.6"/><rect x="4.67" y="5" width="3" height="6" rx="0.6"/><rect x="9.33" y="3" width="3" height="8" rx="0.6"/><rect x="14" y="0" width="3" height="11" rx="0.6"/></symbol>
        <symbol id="i-wifi" viewBox="0 0 16 11"><path d="M8 2.2c2.3 0 4.5.87 6.15 2.44a.6.6 0 0 0 .85-.04l.85-.93a.6.6 0 0 0-.04-.86A11.35 11.35 0 0 0 8 0 11.35 11.35 0 0 0 .19 2.81a.6.6 0 0 0-.04.86l.85.93a.6.6 0 0 0 .85.04A8.88 8.88 0 0 1 8 2.2z"/><path d="M8 5.1c1.56 0 3.05.58 4.18 1.63a.6.6 0 0 0 .86-.03l.84-.93a.6.6 0 0 0-.04-.85A8.42 8.42 0 0 0 8 2.9a8.42 8.42 0 0 0-5.84 2.02.6.6 0 0 0-.04.85l.84.93a.6.6 0 0 0 .86.03A6.22 6.22 0 0 1 8 5.1z"/><path d="M8 8c.83 0 1.62.3 2.22.83a.6.6 0 0 0 .87-.05l.86-.95a.6.6 0 0 0-.05-.84A5.5 5.5 0 0 0 8 5.8a5.5 5.5 0 0 0-3.9 1.18.6.6 0 0 0-.05.84l.86.95a.6.6 0 0 0 .87.05A3.36 3.36 0 0 1 8 8z"/><circle cx="8" cy="10" r="1.1"/></symbol>
        {/* The battery outline is the one glyph drawn as a stroke, so it keeps
            its own fill/stroke pair; the cell and tip inherit the referencing
            svg's fill like every other symbol. */}
        <symbol id="i-batt" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="23" height="11" rx="2.5" fill="none" stroke="currentColor" opacity="0.45"/><rect x="2" y="2" width="20" height="8" rx="1.3"/><rect x="24" y="4" width="2" height="4" rx="1" opacity="0.45"/></symbol>
      </svg>
      <div className="progress-rail" aria-hidden="true">
        <div className="progress-fill" />
      </div>
      {/* VoiceOver's copy of the sticky-phone switch: LandingScroll writes
          "Step n of 11, <eyebrow>" here as each step takes the center. */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-step-status />

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="hero-stage">
      <section className="hero" id="top">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-ripples" aria-hidden="true">
          <span className="ripple r1" /><span className="ripple r2" /><span className="ripple r3" /><span className="ripple r4" />
        </div>
        <div className="hero-inner">
          <p className="eyebrow hero-eyebrow">{COPY.hero.eyebrow}</p>
          <h1 className="hero-title">
            <span className="line-a"><span className="line-part">{COPY.hero.title[0]}</span> <span className="line-part">{COPY.hero.title[1]}</span></span>
            <span className="line-b line-accent">{COPY.hero.title[2]}</span>
          </h1>
          <p className="hero-lede">{COPY.hero.lede}</p>
          <div className="hero-actions">
            <a href={APP_STORE_URL} className="btn btn-primary" rel="noopener noreferrer">
              <AppleMark />Download<span className="sr-only"> on the App Store</span>
            </a>
            <a href="#features" className="btn btn-ghost">{COPY.hero.secondary}</a>
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
      </div>

      {/* Everything from here rides up over the pinned hero. */}
      <div className="hero-cover">

      {/* ── Problem ───────────────────────────────────────── */}
      <section className="problem" id="problem" aria-labelledby="problem-title">
        <div className="problem-inner">
          <p className="eyebrow reveal">The gap</p>
          <h2 id="problem-title" className="h-display reveal">Indoors, you&apos;re<br/><span className="muted">on your own.</span></h2>
          <div className="problem-body">
            <p className="reveal">
              GPS ends at the door. Inside, nothing tells you which way the counter
              is, what the sign says, whether that seat is taken, how the kiosk
              works, or where to sign. So you ask, or guess, or bring someone. Every
              unfamiliar place costs you some independence before you&apos;ve done a
              thing.
            </p>
            <p className="problem-accent reveal accent">Fathom answers those, your first time in.</p>
          </div>
        </div>
      </section>

      {/* ── Scrolly Features ──────────────────────────────── */}
      <section className="scrolly" id="features" aria-label="Features">
        <StickyPhone>
          {/* Screen: Home */}
          <HomeScreen active />

          {/* Screen: Snapshot options */}
          <HomeScreen menu />

          {/* Screen: Point to ask */}
          <PointScreen />

          {/* Screen: Assistant */}
          <AssistantScreen />

          {/* Screen: Assistant Activities */}
          <AssistantActivitiesScreen />

          {/* Screen: Assistant Ask */}
          <AssistantAskScreen />

          {/* Screen: Assistant Plan */}
          <PlanScreen />

          {/* Screen: Assistant Active */}
          <AssistantActiveScreen />

          {/* Screen: Lookout */}
          <LookoutScreen />

          {/* Screen: Go */}
          <GoScreen />

          {/* Screen: Live Task */}
          <LiveScreen />
        </StickyPhone>

        {/* Scrolly Steps */}
        <div className="scrolly-steps">
          <div className="step is-visible" data-step="home">
            <MobilePhone><HomeScreen active /></MobilePhone>
            {/* The visible eyebrow is decorative for readers: each h2 already
                carries it as an sr-only prefix, so without this every step
                announced its name twice (three times with the live region). */}
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">Home</p>
              <h2><span className="sr-only">Home: </span>Five modes.<br/><span className="muted">One calm surface.</span></h2>
              <p className="step-body">Fathom opens on a single screen with everything a step away. Snapshot for a quick look. Lookout for ongoing awareness. Go for navigating to a place. Task for step-by-step help with what you&apos;re doing. And the Assistant, one tab over, for when you&apos;d rather say the goal and let Fathom choose.</p>
            </div>
          </div>
          <div className="step" data-step="lookout">
            <MobilePhone><LookoutScreen active /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">{COPY.walkIn.eyebrow}</p>
              <h2><span className="sr-only">{COPY.walkIn.eyebrow}: </span>Speaks up<br/><span className="muted">when it matters.</span></h2>
              <p className="step-body">Lookout watches the room as you move and speaks when something matters: a doorway, a step down, a person coming toward you, something&apos;s close on your left. You pick how much it says. Hazards Only, Balanced or Full Awareness.</p>
              <p className="step-body">It is a second set of eyes, not a guarantee. Keep your cane or your dog. Fathom is there for what they can&apos;t tell you.</p>
              <p className="step-whisper">{COPY.walkIn.whisper}</p>
            </div>
          </div>
          <div className="step" data-step="point">
            <MobilePhone><PointScreen active /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">Point to ask</p>
              <h2><span className="sr-only">Point to ask: </span>Point at anything.<br/><span className="muted">Fathom names it.</span></h2>
              <p className="step-body">Hold your arm out and point for about a second. You feel a tap, hear the earcon, and get the answer in three parts: the thing in a few words, any words on it read exactly, then where it is and what&apos;s around it. Sweep your finger to something else to hear about that too.</p>
              <blockquote className="step-example">{COPY.justPoint.beats.map((b) => <p key={b}>{b}</p>)}</blockquote>
              <p className="step-body">{COPY.justPoint.body}</p>
              <p className="step-whisper">New in 1.2.0. Works hands-free, without a network.</p>
            </div>
          </div>
          <div className="step" data-step="snapshot">
            <MobilePhone><HomeScreen active menu /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">Snapshot</p>
              <h2><span className="sr-only">Snapshot: </span>One look.<br/><span className="muted">Five ways to ask.</span></h2>
              <p className="step-body">Snapshot describes what&apos;s in front of you. Open its menu and it can also read text, identify an object, answer a question about what&apos;s in view, tell you what you&apos;re pointing at, or read a digital screen: the display type first, then its layout, then what it says.</p>
              <p className="step-whisper">All five, included with Snapshot.</p>
            </div>
          </div>
          <div className="step" data-step="go">
            <MobilePhone><GoScreen active /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">{COPY.findIt.eyebrow}</p>
              <h2><span className="sr-only">{COPY.findIt.eyebrow}: </span>Turn-by-turn<br/><span className="muted">indoor navigation.</span></h2>
              <p className="step-body">Say where you&apos;re headed: &ldquo;the kitchen,&rdquo; &ldquo;Room 412,&rdquo; &ldquo;the pharmacy.&rdquo; Fathom gets you there. It reads room numbers and signs as you pass them, calls turns before you need them, and tells you when you&apos;ve arrived, down to where the door handle is.</p>
              <p className="step-body">Directions use a clock-face system: &ldquo;door at 2 o&apos;clock, about 25 feet.&rdquo; Obstacle alerts pulse faster as you approach, so the space has a shape you can feel in your hand.</p>
              <p className="step-whisper">{COPY.findIt.whisper}</p>
            </div>
          </div>
          <div className="step" data-step="live">
            <MobilePhone><LiveScreen active /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">{COPY.doIt.eyebrow}</p>
              <h2><span className="sr-only">{COPY.doIt.eyebrow}: </span>A real-time companion<br/><span className="muted">for the task at hand.</span></h2>
              <p className="step-body">Task guides you one step at a time: folding laundry, finding the milk, sorting paperwork, working through a kiosk. Live Task makes it a conversation. Hold to talk, and Fathom answers from what&apos;s actually in front of you, at the speed of your hands.</p>
              <p className="step-whisper">{COPY.doIt.whisper}</p>
            </div>
          </div>
          <div className="step" data-step="assistant">
            <MobilePhone><AssistantScreen active /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">{COPY.planIt.eyebrow}</p>
              <h2><span className="sr-only">{COPY.planIt.eyebrow}: </span>Describe a goal.<br/><span className="muted">Fathom handles the rest.</span></h2>
              <p className="step-body">Tell the Assistant what you want to do. &ldquo;Check me in for my appointment on the fourth floor.&rdquo; It figures out the path. Lookout walks you in. Go takes you to the elevator, then the suite. Task checks you in at the desk.</p>
              <p className="step-body">You don&apos;t pick modes. Say the goal, and the Assistant hands each step to the right one.</p>
            </div>
          </div>
          <div className="step" data-step="assistant-activities">
            <MobilePhone><AssistantActivitiesScreen active /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">Activities</p>
              <h2><span className="sr-only">Activities: </span>Not sure where<br/><span className="muted">to start?</span></h2>
              <p className="step-body">Tap <strong>Activities</strong> for a short menu of the things Fathom does well: find something, orient yourself, go somewhere, work on a task, read something, use a kiosk or device.</p>
              <p className="step-body">Pick one and Fathom asks what it needs for that job, then builds the plan.</p>
            </div>
          </div>
          <div className="step" data-step="assistant-ask">
            <MobilePhone><AssistantAskScreen active /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">Ask Fathom</p>
              <h2><span className="sr-only">Ask Fathom: </span>Or just say it<br/><span className="muted">in your own words.</span></h2>
              <p className="step-body">Tap <strong>Ask Fathom</strong> and talk. &ldquo;Organize my mail.&rdquo; &ldquo;Find the oat milk.&rdquo; &ldquo;Check me in at the pharmacy desk.&rdquo; Fathom listens, then builds a plan.</p>
              <p className="step-whisper">Your voice becomes text on your phone. Only the text is sent. No wake word.</p>
            </div>
          </div>
          <div className="step" data-step="assistant-plan">
            <MobilePhone><PlanScreen active /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">The plan</p>
              <h2><span className="sr-only">The plan: </span>A plan you can<br/><span className="muted">see before you start.</span></h2>
              <p className="step-body">Fathom thinks for a moment, then shows its work: a short ordered list of steps, each labeled with the mode that will handle it. Go, Snapshot, Task.</p>
              <p className="step-body">Accept it as-is, edit a step, or dismiss and try again. Nothing starts until you accept.</p>
            </div>
          </div>
          <div className="step" data-step="assistant-active">
            <MobilePhone><AssistantActiveScreen active /></MobilePhone>
            <div className="step-copy">
              <p className="eyebrow" aria-hidden="true">Active session</p>
              <h2><span className="sr-only">Active session: </span>One step at a time,<br/><span className="muted">hands free.</span></h2>
              <p className="step-body">Once you accept, Fathom runs the plan step by step. Each screen is focused on one thing: walk here, look at this, do that. Ask Fathom stays within reach if the world changes.</p>
              {/* The plan's whisper lives on the step where the plan runs. */}
              <p className="step-whisper">{COPY.planIt.whisper}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Everywhere ────────────────────────────────────── */}
      <section className="everywhere" id="how" aria-labelledby="everywhere-title">
        <div className="everywhere-inner">
          <p className="eyebrow reveal" aria-hidden="true">Day one</p>
          <h2 id="everywhere-title" className="h-display reveal"><span className="sr-only">Day one: </span>A pair of eyes<br/><span className="muted">looking out for you.</span></h2>
          <div className="everywhere-body">
            <p className="reveal">Fathom watches the room so you can get on with being in it. It tells you who&apos;s coming toward you, reads the sign you can&apos;t see, finds the counter, and stays with you through the form or the kiosk. Nothing installed in the building, nothing to configure. Open the app and it&apos;s already working.</p>
            <p className="reveal">In a basement, in an elevator, with no signal at all, the part that looks out for you keeps running: on-device detection, LiDAR on Pro models, and every safety alert. Your safety never waits on a network.</p>
          </div>
        </div>
      </section>

      {/* ── Spectrum ──────────────────────────────────────── */}
      <section className="spectrum" aria-labelledby="spectrum-title">
        <div className="spectrum-inner">
          <p className="eyebrow reveal" aria-hidden="true">Day to day</p>
          <h2 id="spectrum-title" className="h-display reveal"><span className="sr-only">Day to day: </span>Cues, questions,<br/><span className="muted">and shortcuts.</span></h2>
          <div className="spectrum-grid">
            <article className="spec-card reveal">
              <div className="spec-icon spec-icon-haptic" aria-hidden="true"><span className="haptic-dot"/><span className="haptic-ring"/><span className="haptic-ring haptic-ring-2"/></div>
              <h3>Cues you feel</h3>
              <p>A tap for a hazard, a pulse that quickens as a wall gets close, a pattern of its own when you&apos;ve arrived. Sound comes from the side it&apos;s on.</p>
            </article>
            <article className="spec-card reveal">
              <div className="spec-icon spec-icon-sound" aria-hidden="true"><span className="wave w1"/><span className="wave w2"/><span className="wave w3"/></div>
              <h3>Quick answers</h3>
              <p>Ask Fathom in any mode: what does that sign say, is this seat taken, which way is the counter. One question, one answer, from what the camera sees right now.</p>
            </article>
            <article className="spec-card reveal">
              <div className="spec-icon spec-icon-action" aria-hidden="true"><span className="ab-phone"><span className="ab-btn"/></span></div>
              <h3>Siri and the Action button</h3>
              <p>{SHORTCUT_WORD} shortcuts. Say &ldquo;Read this with Fathom&rdquo; to Siri, or set the Action button to Snapshot and scan without opening the app.</p>
            </article>
            <article className="spec-card reveal">
              <div className="spec-icon spec-icon-low" aria-hidden="true"><span className="lv-bar"/><span className="lv-bar lv-bar-2"/><span className="lv-bar lv-bar-3"/></div>
              <h3>It knows you</h3>
              <p>Tell Fathom once how you see, what you walk with, and your guide dog&apos;s name, and every answer accounts for it. Say &ldquo;forget that&rdquo; and it&apos;s gone. It all stays on your phone.</p>
            </article>
          </div>
          <p className="spectrum-footer reveal">Built for VoiceOver from the first screen. If you have some sight, the contrast is high, the targets are large, and it works without VoiceOver when you have the light for it.</p>
        </div>
      </section>

      {/* ── Download ──────────────────────────────────────── */}
      <section className="signup" id="download" aria-labelledby="download-title">
        <div className="signup-inner">
          <div className="signup-left">
            <p className="eyebrow reveal">{COPY.download.eyebrow}</p>
            <h2 id="download-title" className="h-display reveal">{COPY.download.title}</h2>
            <p className="signup-lede reveal">{COPY.download.lede}</p>
            <ul className="signup-points reveal" role="list">
              <li><span className="tick" aria-hidden="true" />Works with VoiceOver</li>
              <li><span className="tick" aria-hidden="true" />Works without VoiceOver too, in good light</li>
            </ul>
            <div className="press-line reveal">
              <p><strong>Press or media?</strong> Email <a href="mailto:support@fathomvision.app">support@fathomvision.app</a> for the press kit.</p>
            </div>
          </div>

          <div className="download-card reveal">
            <a href={APP_STORE_URL} className="btn btn-primary" rel="noopener noreferrer">
              <AppleMark />Download<span className="sr-only"> on the App Store</span>
            </a>
            <p className="download-note">{COPY.download.meta}</p>
            <p className="download-sub">{COPY.freeAndPlus.free}</p>
            <p className="download-sub">{COPY.freeAndPlus.plus}</p>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
