import { beatIn, channelsAt, type Scene } from "./types";

/* ================================================================
   The scene engine: plays a Scene on one screen root.

   It writes three things on the root and nothing else:
     - data-beat: the current beat's id;
     - data-<channel>: each channel's value at that beat;
     - data-scene: "rest" | "ready" | "play" | "reset" (see below);
   and it toggles data-on on every [data-show] element inside the root
   whose beat list names the current beat. The CSS draws the rest: each
   beat change is a transition keyed on those attributes.

   When it plays: only while ALL of these hold
     - motion is allowed: no prefers-reduced-motion, and no
       html[data-motion="reduce"] (the header's Pause motion);
     - the screen is active: the root has .is-active. On desktop
       LandingScroll moves it between the sticky screens; phones and the
       hero render theirs active;
     - on desktop, a step holds the center: the sticky phone's host
       (.scrolly-sticky .phone-screen) carries data-live, which
       LandingScroll sets while a step holds the middle of the window. The
       first screen is rendered active for no-JS readers, and without this
       it would start while the reader is still in the section above;
     - the screen is in view: at least 35% of it, by the engine's own
       IntersectionObserver (LandingScroll's .is-off uses a 40% margin
       and only pauses CSS animations; a scene waits until it is seen);
     - the tab is visible.

   What each change does:
     - motion off: jump to the resting frame, no timers ("rest").
       No IntersectionObserver at all (an old engine) counts as motion
       off: the page reads finished, as LandingScroll's own fallback does;
     - on show (active and in view): jump to the opening frame with
       transitions off ("reset"), then play from it ("play");
     - deactivated while on screen (desktop, the reader scrolled to the
       next step): stop the timers and keep the frame while the screen
       fades out; activation later replays from the opening frame;
     - out of view: stop, and wait on the opening frame ("ready"), so a
       phone that scrolls back in starts from its first beat;
     - tab hidden: pause the timer; visible again: finish the beat.
   The last beat holds ("play" stays, the timer is gone) until something
   above replays it.
   ================================================================ */

export interface SceneEnvironment {
  /** True when motion is allowed right now. */
  motionAllowed(): boolean;
  /** Calls back when that answer may have changed. Returns an unsubscribe. */
  onMotionChange(cb: () => void): () => void;
  now(): number;
}

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/** The browser's answer: the OS setting and the Pause motion attribute. */
export function browserEnvironment(): SceneEnvironment {
  const mql = typeof window.matchMedia === "function" ? window.matchMedia(REDUCE_QUERY) : null;
  const root = document.documentElement;
  return {
    motionAllowed: () => !mql?.matches && root.getAttribute("data-motion") !== "reduce",
    onMotionChange(cb) {
      mql?.addEventListener?.("change", cb);
      const mo = new MutationObserver(cb);
      mo.observe(root, { attributes: true, attributeFilter: ["data-motion"] });
      return () => {
        mql?.removeEventListener?.("change", cb);
        mo.disconnect();
      };
    },
    now: () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
  };
}

/** Share of the screen that must be on screen before a scene starts. */
export const IN_VIEW_RATIO = 0.35;

/** The desktop sticky phone's host: its screens play only while it carries data-live. */
export const STICKY_HOST = ".scrolly-sticky .phone-screen";

type Mode = "rest" | "ready" | "play" | "stopped";

/**
 * Plays `scene` on `el` until the returned cleanup runs. A scene of one
 * beat has nothing to play and is left as rendered.
 */
export function runScene(el: HTMLElement, scene: Scene, env: SceneEnvironment = browserEnvironment()): () => void {
  const { beats } = scene;
  const last = beats.length - 1;
  if (last < 1) return () => {};

  const hasIO = typeof IntersectionObserver !== "undefined";
  const host = el.closest<HTMLElement>(STICKY_HOST);
  let mode: Mode = "rest";
  let index = last;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let due = 0;
  let left = -1; // ms left on a beat paused by a hidden tab; -1 when not paused
  let inView = false;

  function clearTimer() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  /** Draws beat i. `instant` commits it with every transition and animation off. */
  function draw(i: number, instant: boolean) {
    index = i;
    const id = beats[i].id;
    if (instant) el.setAttribute("data-scene", "reset");
    el.setAttribute("data-beat", id);
    for (const [k, v] of Object.entries(channelsAt(scene, i))) el.setAttribute(`data-${k}`, v);
    el.querySelectorAll<HTMLElement>("[data-show]").forEach((node) => {
      node.toggleAttribute("data-on", beatIn(node.getAttribute("data-show") ?? "", id));
    });
    // Reading layout commits the reset frame before transitions come back on.
    if (instant) void el.offsetWidth;
  }

  function setMode(next: Mode) {
    mode = next;
    el.setAttribute("data-scene", next === "stopped" ? "play" : next);
  }

  function schedule(ms: number) {
    clearTimer();
    left = -1;
    due = env.now() + ms;
    timer = setTimeout(advance, ms);
  }

  function advance() {
    timer = undefined;
    const i = index + 1;
    draw(i, false);
    if (i < last) schedule(beats[i].ms);
  }

  function rest() {
    clearTimer();
    left = -1;
    draw(last, true);
    setMode("rest");
  }

  function arm() {
    clearTimer();
    left = -1;
    draw(0, true);
    setMode("ready");
  }

  function play() {
    clearTimer();
    draw(0, true);
    setMode("play");
    if (document.hidden) left = beats[0].ms;
    else schedule(beats[0].ms);
  }

  function evaluate() {
    if (!hasIO || !env.motionAllowed()) {
      if (mode !== "rest" || index !== last) rest();
      return;
    }
    const active = el.classList.contains("is-active");
    const centered = !host || host.hasAttribute("data-live");
    const live = active && inView && centered;
    if (live) {
      if (mode !== "play") play();
      return;
    }
    if (mode === "rest") return arm();
    if (mode === "play" || mode === "stopped") {
      clearTimer();
      left = -1;
      if (!inView) arm();
      else setMode("stopped"); // desktop: it is fading out; keep the frame
    }
  }

  function onVisibility() {
    if (mode !== "play") return;
    if (document.hidden) {
      if (timer !== undefined) {
        left = Math.max(0, due - env.now());
        clearTimer();
      }
    } else if (left >= 0) {
      schedule(left);
    }
  }

  const io = hasIO
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.intersectionRatio >= IN_VIEW_RATIO) inView = true;
            else if (!e.isIntersecting) inView = false;
          }
          evaluate();
        },
        { threshold: [0, IN_VIEW_RATIO] },
      )
    : null;
  io?.observe(el);

  const classes = new MutationObserver(evaluate);
  classes.observe(el, { attributes: true, attributeFilter: ["class"] });
  if (host) classes.observe(host, { attributes: true, attributeFilter: ["data-live"] });
  const stopMotion = env.onMotionChange(evaluate);
  document.addEventListener("visibilitychange", onVisibility);

  evaluate();

  return () => {
    clearTimer();
    io?.disconnect();
    classes.disconnect();
    stopMotion();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
