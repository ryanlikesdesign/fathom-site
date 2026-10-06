'use client';

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { ensurePostHogReady } from '@/lib/posthog';
import { COPY_13 } from '@/lib/copy-13';
import {
  FILM_CAPTIONS,
  FILM_CAPTIONS_FULL,
  FILM_POSTER,
  FILM_REQUEST,
  FILM_SOURCES,
  FILM_TRANSCRIPT_ID,
  type FilmRequest,
} from '@/lib/film';

// The homepage film. A native <video> under a poster-sized play button:
//   server   the server render and a no-JS load: the browser's own controls,
//            so the film plays without this island.
//   idle     the poster with fathom's orb as the play button. The video
//            behind it is hidden from assistive tech: the button is the
//            only way in, and it says how long the film is.
//   playing  the button leaves; the browser's controls take over (they are
//            what VoiceOver, keyboards and Switch Control already know).
//   ended    the poster and the button come back, as "Watch again".
//   error    the film could not load or play: a message, "Try again", and
//            the transcript, which carries every word of the film.
// Focus moves only for the reader who just acted here: onto the video when
// it starts from the button (or from the hero's "Watch the film"), and onto
// "Watch again" or "Try again" only when focus was inside the player, so a
// reader following along in the transcript is never pulled away.
// Nothing plays unasked. preload="none" keeps the page to the poster until
// someone asks; phones get the 720p file, wider windows the 1080p one.

type Phase = 'server' | 'idle' | 'playing' | 'ended' | 'error';

const { film } = COPY_13;

function track(event: 'film_played' | 'film_completed', props: Record<string, unknown> = {}) {
  void ensurePostHogReady().then((ph) => ph?.capture(event, props));
}

const motionReduced = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.getAttribute('data-motion') === 'reduce';

export function FilmPlayer() {
  const [phase, setPhase] = useState<Phase>('server');
  const [inView, setInView] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  const plays = useRef(0);
  // One-shot: set when the reader starts the film from a control here (or
  // the hero link), consumed when focus moves onto the video.
  const fromControl = useRef(false);
  // The play() that unlocks the video inside the hero link's click fires a
  // 'play' event of its own; that one is not a viewing.
  const priming = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the enhanced player exists only after hydration; the server render is the no-JS one
    setPhase('idle');
  }, []);

  // The orb's sonar rings run only while the poster is on screen.
  useEffect(() => {
    const el = frame.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** Starts playback; a refusal or a failure lands on a state with a way forward. */
  const start = useCallback((v: HTMLVideoElement) => {
    fromControl.current = true;
    setPhase('playing');
    if (v.ended) v.currentTime = 0;
    const attempt = v.play();
    attempt?.catch((err: unknown) => {
      const name = err instanceof DOMException ? err.name : '';
      // AbortError: a pause or a new load overtook it, nothing is wrong.
      if (name === 'AbortError') return;
      // NotAllowedError: the browser wants a tap on the player itself.
      setPhase(name === 'NotAllowedError' ? 'idle' : 'error');
    });
  }, []);

  const play = useCallback(() => {
    const v = video.current;
    if (v) start(v);
  }, [start]);

  const retry = useCallback(() => {
    const v = video.current;
    if (!v) return;
    v.load();
    start(v);
  }, [start]);

  const openTranscript = useCallback(() => {
    const details = document.getElementById(FILM_TRANSCRIPT_ID) as HTMLDetailsElement | null;
    if (!details) return;
    details.open = true;
    details.querySelector('summary')?.focus();
  }, []);

  // "Watch the film" in the hero: scroll here, then play once the player has
  // arrived on screen.
  useEffect(() => {
    if (phase === 'server') return;
    const onRequest = (e: Event) => {
      const v = video.current;
      const el = frame.current;
      if (!v || !el) return;
      (e as FilmRequest).detail.handled = true;
      const waiting = phase === 'idle' || phase === 'ended';
      if (waiting) {
        // Unlock now, inside the click: Safari lets a video play later from
        // script only once a gesture has started it. Pausing at once stops
        // it before a sound, and the file starts buffering during the scroll.
        priming.current = true;
        v.play()?.catch(() => {});
        v.pause();
      }
      el.scrollIntoView({ behavior: motionReduced() ? 'auto' : 'smooth', block: 'center' });
      if (!waiting) return;
      // Play on arrival, never on the way: a phone's smooth scroll can take
      // longer than any fixed wait, and sound before the picture is on screen
      // would be a film playing somewhere off the page.
      let done = false;
      let io: IntersectionObserver | null = null;
      let timer = 0;
      const onScrollEnd = () => settle();
      const finish = () => {
        done = true;
        io?.disconnect();
        window.clearTimeout(timer);
        window.removeEventListener('scrollend', onScrollEnd);
      };
      const onScreen = () => {
        const r = el.getBoundingClientRect();
        const seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        return seen >= Math.min(r.height, window.innerHeight) * 0.6;
      };
      const go = () => {
        if (done) return;
        finish();
        start(v);
      };
      // The scroll is over: play if it landed on the film; if the reader
      // scrolled somewhere else instead, leave the poster waiting.
      const settle = () => {
        if (done) return;
        if (onScreen()) go();
        else finish();
      };
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver(([entry]) => {
          if (entry.intersectionRatio >= 0.6) go();
        }, { threshold: [0.6] });
        io.observe(el);
      }
      window.addEventListener('scrollend', onScrollEnd);
      // Engines without scrollend or IntersectionObserver: check once the
      // longest smooth scroll is surely over.
      timer = window.setTimeout(settle, 3000);
    };
    window.addEventListener(FILM_REQUEST, onRequest);
    return () => window.removeEventListener(FILM_REQUEST, onRequest);
  }, [phase, start]);

  const onPlay = useCallback(() => {
    if (priming.current) {
      priming.current = false;
      return;
    }
    plays.current += 1;
    // Native controls can start it too (the no-JS render, a replay from the bar).
    setPhase((p) => (p === 'server' ? p : 'playing'));
    if (plays.current === 1) track('film_played');
  }, []);

  const onEnded = useCallback(() => {
    track('film_completed');
    setPhase((p) => (p === 'server' ? p : 'ended'));
  }, []);

  const onError = useCallback(() => {
    setPhase((p) => (p === 'server' ? p : 'error'));
  }, []);

  // React hands a <source>'s error to the <video>'s onError as well, as if it
  // bubbled. A source whose media query doesn't match fires one on every
  // load, so on a phone the 1080p file's would land here: only the video's
  // own errors count. The last source reports every source failing.
  const onVideoError = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      if (e.target === e.currentTarget) onError();
    },
    [onError],
  );

  useEffect(() => {
    const v = video.current;
    const el = frame.current;
    if (!v || !el) return;
    // Focus inside the player (or dropped to <body> when the control it was
    // on went away) is the reader's; anywhere else, they are elsewhere.
    const focusHere = () => el.contains(document.activeElement) || document.activeElement === document.body;
    if (phase === 'playing' && fromControl.current) {
      fromControl.current = false;
      v.focus({ preventScroll: true });
    }
    if (phase === 'ended') {
      // Back to the poster: the last frame is the centered end card, which
      // the button would sit on. load() resets to the poster, and with
      // preload="none" fetches nothing until the next play.
      const hadFocus = focusHere();
      v.load();
      if (hadFocus) playButton.current?.focus();
    }
    if (phase === 'error' && focusHere()) retryButton.current?.focus();
  }, [phase]);

  const covered = phase === 'idle' || phase === 'ended' || phase === 'error';

  return (
    <div ref={frame} className="film-frame" data-phase={phase} data-inview={inView || undefined}>
      <video
        ref={video}
        className="film-video"
        width={1920}
        height={1080}
        poster={FILM_POSTER}
        preload="none"
        playsInline
        controls={phase === 'server' || phase === 'playing'}
        aria-label={film.videoLabel}
        aria-hidden={covered || undefined}
        // Covered, it is out of the tab order; playing, it is one tab stop
        // (Safari does not make <video controls> focusable on its own).
        tabIndex={covered ? -1 : 0}
        onPlay={onPlay}
        onEnded={onEnded}
        onError={onVideoError}
      >
        {FILM_SOURCES.map((s, i) => (
          <source
            key={s.src}
            src={s.src}
            type="video/mp4"
            media={'media' in s ? s.media : undefined}
            // Every source failing fires its error on the last <source>.
            onError={i === FILM_SOURCES.length - 1 ? onError : undefined}
          />
        ))}
        <track kind="captions" src={FILM_CAPTIONS} srcLang="en" label={film.captionsNarration} default />
        <track kind="captions" src={FILM_CAPTIONS_FULL} srcLang="en" label={film.captionsFull} />
      </video>

      {phase === 'idle' || phase === 'ended' ? (
        <button ref={playButton} type="button" className="film-play" onClick={play}>
          <span className="film-orb" aria-hidden="true">
            <span className="film-ring film-ring-1" />
            <span className="film-ring film-ring-2" />
            <svg viewBox="0 0 24 24" className="film-glyph">
              <path d="M8.5 5.6v12.8a.9.9 0 0 0 1.38.76l10-6.4a.9.9 0 0 0 0-1.52l-10-6.4a.9.9 0 0 0-1.38.76z" fill="currentColor" />
            </svg>
          </span>
          <span className="film-play-text">
            <span className="film-play-label">{phase === 'ended' ? film.replay : film.play}</span>
            <span className="film-play-meta">
              <span aria-hidden="true">{film.duration} ·</span>
              <span className="sr-only">, {film.durationSr},</span> {film.features}
            </span>
          </span>
        </button>
      ) : null}

      {/* Always in the DOM, so the message is announced when it arrives. */}
      <div className={phase === 'error' ? 'film-error' : 'sr-only'}>
        <p role="status">{phase === 'error' ? film.error : ''}</p>
        {phase === 'error' ? (
          <div className="film-error-actions">
            <button ref={retryButton} type="button" className="btn btn-ghost" onClick={retry}>
              {film.retry}
            </button>
            <button type="button" className="btn btn-ghost" onClick={openTranscript}>
              {film.transcriptSummary}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
