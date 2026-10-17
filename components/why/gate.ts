/* ================================================================
   The /why motion gate: one decision, two copies.

   computeMode() is the decision, as a pure function of the environment.
   WHY_GATE_SCRIPT is the same decision as a self-contained script string,
   run during HTML parse (before first paint) so the first frame already
   has the right layout. test/why/gate.test.ts runs both against every
   combination of inputs and requires them to agree.

   Media features are tested positively ("no-preference", "none"): an
   engine that does not know a query answers false, and false lands on
   the finished static page, never on motion.

   Zoom is deliberately not a mode here. What pins, and for how long:
     stage   the hero's text block (150svh) and the four pairs (96svh),
             the two pins Ryan granted: 246svh of scroll in which the text
             holds still while the art beside it plays; and the pivot's
             section (its stage is 220svh: the line pins once built). The
             five machines' eras never pin: each machine lands as its era
             comes up the screen.
     pocket  one frame, a band pinned with its text: the hero's sentences
             (110svh), only on a portrait screen the frame fits on whole
             (WhyDirector fitFrames; a zoomed desktop, wider than tall,
             never pins it). The machines', the pairs' and the hands'
             bands sit in flow right above their text and step as each
             item comes up the screen (keyed pockets: nothing pins); the
             ceiling's and the summit's play their one move as they rise
             and never pin; the people's band pins alone over its runway
             (15svh; the hero's, when its frame does not pin, 60svh) while
             the text after it waits below it; and the pivot's band and
             line (176svh).
   Every pin is a fixed runway that ends with the page scrolling on, so no
   zoom can trap a reader in one: scrolling always reaches the end of it.
   Pinch zoom (visualViewport.scale over 1.01) freezes the art on what it
   shows (the director), and the pins stay pinned by CSS, so nothing moves
   under a magnified reader; flipping layouts under a magnified viewport
   would. System magnifiers (iOS Zoom, macOS Zoom, Windows Magnifier)
   leave visualViewport.scale at 1, so they see the pins as they are:
   text that holds still for the runways above. The site spec's decision
   log records that cost and why it is accepted.

   Modes:
     stage   1024 x 720 CSS px and up at default text size: one sticky art
             pane beside the text column.
     pocket  smaller windows at default text size (phones, tablets, narrow
             or zoomed desktops) that are at least 320 x 520: the art
             reforms in bands between blocks of text (why.css), never
             under them.
     static  everything else: reduced motion, Pause motion, more
             contrast, forced colors, no IntersectionObserver or rAF (or
             no script), text zoom (root font over 20px), and windows
             under 320 wide or 520 tall (landscape phones, heavy zoom).
   ================================================================ */

export const MODE_ATTR = "data-why";

/** stage: sticky art beside the text. pocket: the art reforms between blocks of text. static: the finished page. */
export type WhyMode = "stage" | "pocket" | "static";

/** The media queries the gate reads. The director listens for changes on each. */
export const GATE_QUERIES = {
  motion: "(prefers-reduced-motion: no-preference)",
  contrast: "(prefers-contrast: no-preference)",
  forced: "(forced-colors: none)",
  big: "(min-width: 1024px) and (min-height: 720px)",
  fit: "(min-width: 320px) and (min-height: 520px)",
} as const;

/** Root font size above this (text zoom) releases all motion: the finished page. */
export const MAX_STAGE_ROOT_PX = 20;

export type GateEnv = {
  /** IntersectionObserver exists. */
  io: boolean;
  /** requestAnimationFrame exists. */
  raf: boolean;
  /** (prefers-reduced-motion: no-preference) matches. */
  motion: boolean;
  /** html[data-motion] is not "reduce" (the header's Pause motion control). */
  unpaused: boolean;
  /** (prefers-contrast: no-preference) matches. */
  contrast: boolean;
  /** (forced-colors: none) matches. */
  unforced: boolean;
  /** (min-width: 1024px) and (min-height: 720px) matches. */
  big: boolean;
  /** (min-width: 320px) and (min-height: 520px) matches. */
  fit: boolean;
  /** Root font size in px; NaN when the engine does not report one. */
  rootPx: number;
};

export function computeMode(env: GateEnv): WhyMode {
  const motionOK = env.io && env.raf && env.motion && env.unpaused && env.contrast && env.unforced;
  // NaN (an engine that reports no size) counts as the default size.
  if (!motionOK || env.rootPx > MAX_STAGE_ROOT_PX) return "static";
  if (env.big) return "stage";
  return env.fit ? "pocket" : "static";
}

type GateWindow = Pick<Window, "document" | "matchMedia" | "getComputedStyle">;

export function readEnv(w: GateWindow): GateEnv {
  const html = w.document.documentElement;
  const m = (q: string) => {
    try {
      return typeof w.matchMedia === "function" && w.matchMedia(q).matches;
    } catch {
      return false;
    }
  };
  let rootPx = NaN;
  try {
    rootPx = parseFloat(w.getComputedStyle(html).fontSize);
  } catch {
    /* no computed style: treat as the default size */
  }
  return {
    io: "IntersectionObserver" in w,
    raf: "requestAnimationFrame" in w,
    motion: m(GATE_QUERIES.motion),
    unpaused: html.getAttribute("data-motion") !== "reduce",
    contrast: m(GATE_QUERIES.contrast),
    unforced: m(GATE_QUERIES.forced),
    big: m(GATE_QUERIES.big),
    fit: m(GATE_QUERIES.fit),
    rootPx,
  };
}

/** Writes the mode to <html>; static removes the attribute. */
export function applyMode(html: Element, mode: WhyMode) {
  if (mode === "static") html.removeAttribute(MODE_ATTR);
  else if (html.getAttribute(MODE_ATTR) !== mode) html.setAttribute(MODE_ATTR, mode);
}

const q = (s: string) => JSON.stringify(s);

/**
 * The pre-paint copy of computeMode + readEnv + applyMode. Self-contained:
 * everything goes through `w`, so `new Function('window', WHY_GATE_SCRIPT)`
 * can run it against a fake window. Any failure leaves the page static.
 */
export const WHY_GATE_SCRIPT =
  "(function(w){try{" +
  "var d=w.document.documentElement;" +
  "var m=function(s){return typeof w.matchMedia==='function'&&w.matchMedia(s).matches};" +
  "var ok='IntersectionObserver' in w&&'requestAnimationFrame' in w" +
  `&&m(${q(GATE_QUERIES.motion)})` +
  "&&d.getAttribute('data-motion')!=='reduce'" +
  `&&m(${q(GATE_QUERIES.contrast)})` +
  `&&m(${q(GATE_QUERIES.forced)});` +
  "var f=NaN;try{f=parseFloat(w.getComputedStyle(d).fontSize)}catch(e){}" +
  `var mode=!ok||f>${MAX_STAGE_ROOT_PX}?'':m(${q(GATE_QUERIES.big)})?'stage':m(${q(GATE_QUERIES.fit)})?'pocket':'';` +
  `if(mode)d.setAttribute(${q(MODE_ATTR)},mode);else d.removeAttribute(${q(MODE_ATTR)})` +
  `}catch(e){try{w.document.documentElement.removeAttribute(${q(MODE_ATTR)})}catch(_){}}})(window)`;
