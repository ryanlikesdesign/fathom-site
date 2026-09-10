'use client';

import { useEffect } from 'react';
import { useWide } from '@/lib/useWide';

// The homepage's scroll island. FathomLanding renders static markup on the
// server; this effect attaches every scroll behavior to it and renders
// nothing itself:
//   - the progress rail, scaled from the feature story's own scroll range
//   - sticky-phone step switching (desktop only, IntersectionObserver)
//   - the hero going inert once the cover has ridden over its CTAs
//   - pausing animations on phones that are far off screen
//   - fading each step's copy in once on phones (view timelines carry the
//     inline phones themselves; see fathom-landing.css)
// Reads and writes are batched per frame: one rAF reads, then writes, so
// nothing forces layout on every scroll tick.
// The phones are client islands that mount on their own side of 861px
// (StickyPhone, MobilePhone), after the server HTML has hydrated, so the
// effect is keyed to that same answer: it re-queries the screens and
// re-attaches every observer whenever the set in the DOM changes.

const LEAVE_MS = 320; // matches .screen.is-leaving's 300ms transition

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function LandingScroll() {
  const wide = useWide();

  useEffect(() => {
    // Hydration pass: both phone sets are in the server markup and the CSS
    // breakpoint shows one; the answer is one render away and re-runs this
    // effect once the other set has unmounted.
    if (wide === null) return;
    const root = document.querySelector<HTMLElement>('.fathom-root');
    if (!root) return;
    // Every scroll-gated hidden state in the CSS (the 28% step dim on
    // desktop, the copy fade on phones) is keyed to this attribute, so a
    // no-JS load, an engine without IntersectionObserver, and a page that
    // never reaches this effect all read the finished page at full strength.
    if ('IntersectionObserver' in window) {
      document.documentElement.toggleAttribute('data-motion-ready', true);
    }

    const scrolly = root.querySelector<HTMLElement>('.scrolly');
    const fill = root.querySelector<HTMLElement>('.progress-fill');
    const status = root.querySelector<HTMLElement>('[data-step-status]');
    const hero = root.querySelector<HTMLElement>('.hero');
    const heroActions = root.querySelector<HTMLElement>('.hero-actions');
    const cover = root.querySelector<HTMLElement>('.hero-cover');
    const chassis = root.querySelector<HTMLElement>('.scrolly-sticky .phone');
    const host = root.querySelector<HTMLElement>('.scrolly-sticky .phone-screen');
    const steps = Array.from(root.querySelectorAll<HTMLElement>('.scrolly .step'));
    const order = steps.map((s) => s.dataset.step ?? '');
    const screens: Record<string, HTMLElement> = {};
    host?.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
      const key = el.dataset.screen;
      if (key) screens[key] = el;
    });

    // Same query as the pinned-hero block in fathom-landing.css.
    const pinned = matchMedia('(min-width:1024px) and (min-height:720px)');
    const hasIO = 'IntersectionObserver' in window; // jsdom has none

    // ── Progress + inert hero: one rAF per scroll, reads before writes ──
    let scrollyTop = 0;
    let scrollyH = 0;
    function measure() {
      if (!scrolly) return;
      const r = scrolly.getBoundingClientRect();
      scrollyTop = r.top + window.scrollY;
      scrollyH = r.height;
    }

    let pending = false;
    function frame() {
      pending = false;
      const y = window.scrollY;
      const range = scrollyH - window.innerHeight;
      const pct = range > 0 ? clamp((y - scrollyTop) / range, 0, 1) : y >= scrollyTop ? 1 : 0;
      let covered = false;
      if (hero && heroActions && cover && pinned.matches) {
        covered = cover.getBoundingClientRect().top <= heroActions.getBoundingClientRect().bottom;
      }
      // Writes.
      if (fill) fill.style.transform = 'scaleX(' + pct + ')';
      updateHeroInert(covered);
    }
    // Once the cover plane has passed the CTAs they are painted over but still
    // in the tab order; inert takes them out until the reader scrolls back up.
    // Setting inert on an ancestor of the focused element blurs it to <body>,
    // which is exactly what happened when a keyboard reader tabbed to a hero
    // CTA and then paged down: the focus ring vanished and Shift+Tab no
    // longer came back. So the wanted state is remembered and only applied
    // once focus has left the hero on its own (focusout, confirmed a frame
    // later).
    let wantsHeroInert = false;
    function applyHeroInert(covered: boolean) {
      if (!hero) return;
      if (hero.hasAttribute('inert') !== covered) hero.toggleAttribute('inert', covered);
    }
    function updateHeroInert(covered: boolean) {
      if (!hero) return;
      wantsHeroInert = covered;
      if (covered && hero.contains(document.activeElement)) return; // defer: never blur an active control
      applyHeroInert(covered);
    }
    function onHeroFocusOut(e: FocusEvent) {
      const goingTo = e.relatedTarget as Node | null;
      if (goingTo && hero?.contains(goingTo)) return; // still inside the hero
      // relatedTarget is null when focus goes nowhere (a click on the page);
      // re-check after the frame so a focus that landed elsewhere is settled.
      requestAnimationFrame(() => {
        if (!hero?.contains(document.activeElement)) applyHeroInert(wantsHeroInert);
      });
    }
    hero?.addEventListener('focusout', onHeroFocusOut);
    function onScroll() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(frame);
    }
    function onResize() {
      measure();
      onScroll();
    }

    // ── Steps: the sticky phone follows whichever step holds the center ──
    let activeKey: string | null = null;
    let leaveTimer = 0;
    function activate(key: string) {
      if (!key || key === activeKey || !screens[key]) return;
      const from = activeKey;
      activeKey = key;
      if (host) host.dataset.dir = order.indexOf(key) >= order.indexOf(from ?? key) ? 'down' : 'up';
      Object.keys(screens).forEach((k) => {
        screens[k].classList.toggle('is-active', k === key);
        screens[k].classList.remove('is-leaving');
      });
      const leaving = from ? screens[from] : null;
      if (leaving) {
        leaving.classList.add('is-leaving');
        window.clearTimeout(leaveTimer);
        leaveTimer = window.setTimeout(() => leaving.classList.remove('is-leaving'), LEAVE_MS);
      }
      // Re-trigger the chassis settle even when it is mid-animation.
      if (chassis) {
        chassis.classList.remove('is-switching');
        void chassis.offsetWidth;
        chassis.classList.add('is-switching');
      }
      if (status) {
        const idx = order.indexOf(key);
        const eyebrow = steps[idx]?.querySelector('.eyebrow')?.textContent?.trim() ?? key;
        status.textContent = `Step ${idx + 1} of ${steps.length}, ${eyebrow}`;
      }
    }

    let stepIO: IntersectionObserver | null = null;
    function connectStepObserver() {
      if (stepIO || !hasIO) return;
      // A zero-height root at the viewport's vertical center: a step
      // intersects it exactly while it holds the middle of the screen.
      stepIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const step = e.target as HTMLElement;
            const key = step.dataset.step;
            if (key) activate(key);
            steps.forEach((s) => s.classList.toggle('is-visible', s === step));
          }
        },
        { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
      );
      steps.forEach((s) => stepIO?.observe(s));
    }
    function disconnectStepObserver() {
      stepIO?.disconnect();
      stepIO = null;
    }
    // ── Step copy (phones only): fades in once, 15% into view ──
    // The hidden state exists only once html[data-motion-ready] is set (top
    // of this effect), so no observer means no hidden copy.
    const copies = Array.from(root.querySelectorAll<HTMLElement>('.scrolly .step-copy'));
    let copyIO: IntersectionObserver | null = null;
    function connectCopyObserver() {
      if (copyIO || !hasIO) return;
      copyIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            e.target.classList.add('is-in');
            copyIO?.unobserve(e.target);
          }
        },
        { threshold: 0.15 },
      );
      copies.forEach((c) => { if (!c.classList.contains('is-in')) copyIO?.observe(c); });
    }
    function disconnectCopyObserver() {
      copyIO?.disconnect();
      copyIO = null;
    }
    // Below 861px the steps carry their own inline phones; nothing switches,
    // and the copy observer takes over. Crossing the line re-runs the whole
    // effect (it is keyed to `wide`), so this is decided once per run.
    function sync() {
      if (wide) {
        connectStepObserver();
        disconnectCopyObserver();
      } else {
        disconnectStepObserver();
        connectCopyObserver();
      }
    }

    // ── Off-screen pause: the orbs and rings only run while near view ──
    let offIO: IntersectionObserver | null = null;
    if (hasIO) {
      offIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) (e.target as HTMLElement).classList.toggle('is-off', !e.isIntersecting);
        },
        { rootMargin: '40% 0px' },
      );
      root.querySelectorAll<HTMLElement>('.hero, .scrolly-sticky, .step-phone').forEach((el) => offIO?.observe(el));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    measure();
    frame();
    sync();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      hero?.removeEventListener('focusout', onHeroFocusOut);
      window.clearTimeout(leaveTimer);
      disconnectStepObserver();
      disconnectCopyObserver();
      document.documentElement.removeAttribute('data-motion-ready');
      offIO?.disconnect();
    };
  }, [wide]);

  return null;
}
