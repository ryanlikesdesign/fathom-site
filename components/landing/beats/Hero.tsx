import { COPY } from "@/lib/landing-content";
import { APP_STORE_URL } from "@/lib/promo";
import { Phone } from "../Phone";
import { HomeScreen } from "../screens/HomeScreen";

/**
 * The hero keeps its sonar ripples and glow (styled in fathom-landing.css)
 * and gains the real Home screen in the desktop phone. `.beat` on the
 * section gives the phone a scroll timeline so it settles as you begin to
 * scroll; the copy is static — the first thing on the page should never be
 * waiting on an animation.
 */
export function Hero() {
  const c = COPY.hero;
  return (
    <section className="hero beat" id="top" aria-labelledby="hero-h">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-ripples" aria-hidden="true">
        <span className="ripple r1" />
        <span className="ripple r2" />
        <span className="ripple r3" />
        <span className="ripple r4" />
      </div>
      <div className="hero-inner">
        <p className="eyebrow hero-eyebrow">{c.eyebrow}</p>
        <h1 className="hero-title" id="hero-h">
          <span className="line-a">{c.title[0]}</span>
          <span className="line-b">{c.title[1]}</span>
          <span className="line-c">{c.title[2]}</span>
        </h1>
        <p className="hero-lede">{c.lede}</p>
        <div className="hero-actions">
          <a href={APP_STORE_URL} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            {c.primary}
          </a>
          <a href="#walk-in" className="btn btn-ghost">
            <span>{c.secondary}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>
        </div>
      </div>
      <div className="hero-phone settle" aria-hidden="true">
        <Phone activeTab="Home" label="Fathom home screen">
          <HomeScreen />
        </Phone>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true">
        <span className="scroll-word">Scroll to explore</span>
        <span className="scroll-line" />
      </div>
    </section>
  );
}
