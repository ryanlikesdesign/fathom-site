import type { ReactNode } from "react";

/* ================================================================
   Glyphs: hand-drawn stand-ins for the SF Symbols the app uses. SF
   Symbols can't be redistributed, so each is a simple drawing on a
   24-unit grid that reads as the same thing at 12 to 32px. Stroked
   glyphs use a 1.8 round pen; the ".fill" symbols are solid.

   GlyphSprite renders every symbol once (FathomLanding puts it at the
   top of the page); Glyph references one with <use>. Every glyph is
   decorative and takes currentColor, so its color comes from the
   element it sits in.
   ================================================================ */

const pen = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ink = { fill: "currentColor" } as const;
/** Cut-outs in a solid glyph take the ground they sit on (--ph-glyph-ground, phone.css). */
const ground = { fill: "var(--ph-glyph-ground)" } as const;
const groundPen = { ...pen, stroke: "var(--ph-glyph-ground)" } as const;

/** Every glyph, keyed by the SF Symbol it stands in for (named loosely). */
const SYMBOLS = {
  // Composer and header
  mic: (
    <>
      <rect x="8.6" y="2.5" width="6.8" height="12" rx="3.4" {...ink} />
      <path d="M5.2 11.2a6.8 6.8 0 0 0 13.6 0M12 18v3.2M8.6 21.2h6.8" {...pen} />
    </>
  ),
  "arrow-up": <path d="M12 20V4.5M5.5 11 12 4.5 18.5 11" {...pen} strokeWidth={2.2} />,
  keyboard: (
    <>
      <rect x="2.4" y="6" width="19.2" height="12" rx="2.4" {...pen} strokeWidth={1.6} />
      <path d="M6 9.6h.01M9 9.6h.01M12 9.6h.01M15 9.6h.01M18 9.6h.01M6 12.4h.01M9 12.4h.01M12 12.4h.01M15 12.4h.01M18 12.4h.01M8 15.2h8" {...pen} strokeWidth={1.6} />
    </>
  ),
  plus: <path d="M12 4.5v15M4.5 12h15" {...pen} strokeWidth={1.6} />,
  "text-bubble": (
    <>
      <path d="M4.5 5.8A1.8 1.8 0 0 1 6.3 4h11.4a1.8 1.8 0 0 1 1.8 1.8v8.4a1.8 1.8 0 0 1-1.8 1.8h-7.2L6.8 19.5V16h-.5a1.8 1.8 0 0 1-1.8-1.8z" {...pen} strokeWidth={1.6} />
      <path d="M8.4 8.6h7.2M8.4 11.6h4.6" {...pen} strokeWidth={1.6} />
    </>
  ),
  "text-bubble-fill": (
    <>
      <path d="M4.5 5.8A1.8 1.8 0 0 1 6.3 4h11.4a1.8 1.8 0 0 1 1.8 1.8v8.4a1.8 1.8 0 0 1-1.8 1.8h-7.2L6.8 19.5V16h-.5a1.8 1.8 0 0 1-1.8-1.8z" {...ink} />
      <path d="M8.4 8.6h7.2M8.4 11.6h4.6" {...groundPen} strokeWidth={1.6} />
    </>
  ),
  "cloud-fill": <path d="M7.2 18.5a4.6 4.6 0 0 1-.7-9.14 6 6 0 0 1 11.4-.98 5 5 0 0 1-.4 10.12z" {...ink} />,
  cloud: <path d="M7.2 18.5a4.6 4.6 0 0 1-.7-9.14 6 6 0 0 1 11.4-.98 5 5 0 0 1-.4 10.12z" {...pen} strokeWidth={1.6} />,
  "wifi-slash": (
    <>
      <path d="M2.8 9.2a13.5 13.5 0 0 1 18.4 0M5.9 12.5a9 9 0 0 1 12.2 0M9 15.7a4.6 4.6 0 0 1 6 0" {...pen} />
      <circle cx="12" cy="19" r="1.3" {...ink} />
      <path d="M4 3.5 20 20.5" {...pen} />
    </>
  ),
  "speaker-wave-fill": (
    <>
      <path d="M3.5 9.2h3.2L11 5.2v13.6l-4.3-4H3.5z" {...ink} />
      <path d="M14.2 9.2a4 4 0 0 1 0 5.6M16.8 6.6a7.6 7.6 0 0 1 0 10.8" {...pen} />
    </>
  ),
  "speaker-slash-fill": (
    <>
      <path d="M4.5 9.2h3.2L12 5.2v13.6l-4.3-4H4.5z" {...ink} />
      <path d="M3.5 3.5 20.5 20.5" {...pen} />
    </>
  ),
  /** FathomMenuGlyph: three rules, 19.2 / 12.4 / 6.6 on a 22 x 16 box, drawn here on the 24 grid. */
  menu: <path d="M2.4 5h19.2M2.4 12h12.4M2.4 19h6.6" {...pen} strokeWidth={2.2} />,
  "arrow-up-right": <path d="M6.5 17.5 17.5 6.5M8.5 6.5h9v9" {...pen} strokeWidth={2} />,
  "stop-circle-fill": (
    <>
      <circle cx="12" cy="12" r="10" {...ink} />
      <rect x="8.4" y="8.4" width="7.2" height="7.2" rx="1.4" {...ground} />
    </>
  ),
  "chevron-right": <path d="M9 5.5 15.5 12 9 18.5" {...pen} strokeWidth={2} />,
  /** FathomBackButton's chevron.left. */
  "chevron-left": <path d="M15 5.5 8.5 12 15 18.5" {...pen} strokeWidth={2} />,
  xmark: <path d="M6 6l12 12M18 6 6 18" {...pen} strokeWidth={2} />,
  ellipsis: (
    <>
      <circle cx="5.5" cy="12" r="1.7" {...ink} />
      <circle cx="12" cy="12" r="1.7" {...ink} />
      <circle cx="18.5" cy="12" r="1.7" {...ink} />
    </>
  ),
  // Look Now rows
  "camera-viewfinder": (
    <>
      <path d="M3 8V5.6A2.6 2.6 0 0 1 5.6 3H8M16 3h2.4A2.6 2.6 0 0 1 21 5.6V8M21 16v2.4a2.6 2.6 0 0 1-2.6 2.6H16M8 21H5.6A2.6 2.6 0 0 1 3 18.4V16" {...pen} />
      <path d="M7.4 9.6h2.1l1-1.5h3l1 1.5h2.1v6H7.4z" {...pen} strokeWidth={1.6} />
      <circle cx="12" cy="12.6" r="1.6" {...ink} />
    </>
  ),
  "text-viewfinder": (
    <path d="M3 8V5.6A2.6 2.6 0 0 1 5.6 3H8M16 3h2.4A2.6 2.6 0 0 1 21 5.6V8M21 16v2.4a2.6 2.6 0 0 1-2.6 2.6H16M8 21H5.6A2.6 2.6 0 0 1 3 18.4V16M8 9h8M8 12h8M8 15h5" {...pen} />
  ),
  "viewfinder-circle": (
    <>
      <circle cx="12" cy="12" r="9.5" {...pen} />
      <path d="M8 10.2V8h2.2M13.8 8H16v2.2M16 13.8V16h-2.2M10.2 16H8v-2.2" {...pen} strokeWidth={1.6} />
    </>
  ),
  display: (
    <>
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.8" {...ink} />
      <path d="M12 16.5v3M8.5 20h7" {...pen} />
    </>
  ),
  "hand-point-up": (
    <path d="M9.6 12.2V4.6a1.6 1.6 0 0 1 3.2 0v6.2M12.8 10.2a1.6 1.6 0 0 1 3.2 0v1.2M16 11a1.6 1.6 0 0 1 3.2 0v3.6a6.6 6.6 0 0 1-6.6 6.6h-.6a6 6 0 0 1-4.9-2.5l-2.4-3.4a1.6 1.6 0 0 1 2.6-1.9l2.3 2.6" {...pen} strokeWidth={1.6} />
  ),
  "magnifier-plus": (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" {...pen} />
      <path d="M15.3 15.3 20.5 20.5M10.5 7.8v5.4M7.8 10.5h5.4" {...pen} />
    </>
  ),
  eye: (
    <>
      <path d="M1.8 12C4.2 7.8 7.8 5.5 12 5.5s7.8 2.3 10.2 6.5c-2.4 4.2-6 6.5-10.2 6.5S4.2 16.2 1.8 12z" {...ink} />
      <circle cx="12" cy="12" r="3.4" {...ground} />
      <circle cx="12" cy="12" r="1.5" {...ink} />
    </>
  ),
  antenna: (
    <>
      <circle cx="12" cy="9.5" r="1.7" {...ink} />
      <path d="M12 11.2V21M8.4 6.2a4.8 4.8 0 0 0 0 6.6M15.6 6.2a4.8 4.8 0 0 1 0 6.6M5.4 3.6a8.8 8.8 0 0 0 0 11.8M18.6 3.6a8.8 8.8 0 0 1 0 11.8" {...pen} />
    </>
  ),
  // Session and readout transport
  pause: (
    <>
      <rect x="6.2" y="4.5" width="4" height="15" rx="1.2" {...ink} />
      <rect x="13.8" y="4.5" width="4" height="15" rx="1.2" {...ink} />
    </>
  ),
  play: <path d="M7.5 4.8v14.4c0 .8.9 1.3 1.6.9l11.2-7.2a1 1 0 0 0 0-1.8L9.1 3.9c-.7-.4-1.6.1-1.6.9z" {...ink} />,
  backward: <path d="M11.5 6.3v11.4L2.8 12zM21.2 6.3v11.4L12.5 12z" {...ink} strokeLinejoin="round" />,
  forward: <path d="M12.5 6.3v11.4l8.7-5.7zM2.8 6.3v11.4l8.7-5.7z" {...ink} strokeLinejoin="round" />,
  repeat: (
    <path d="M5.2 8.4A7.8 7.8 0 1 1 4.4 14M5.2 3.6v4.8H10" {...pen} strokeWidth={2} />
  ),
  // Places, memory, plans
  /** location.fill: Go's mode glyph (AssistantStepMode.iconName). */
  "location-fill": <path d="M20.5 3.5 3.5 10.8l7.2 2.5 2.5 7.2z" {...ink} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" />,
  /** location: the More sheet's Saved places row. */
  location: <path d="M20.5 3.5 3.5 10.8l7.2 2.5 2.5 7.2z" {...pen} />,
  /** trash: a memory's delete button (MemoryReviewList). */
  trash: (
    <path
      d="M4.6 6.6h14.8M9.4 6.6V4.9c0-.8.6-1.4 1.4-1.4h2.4c.8 0 1.4.6 1.4 1.4v1.7M6.6 6.6l.9 12.5c.1 1.1 1 1.9 2 1.9h5c1 0 1.9-.8 2-1.9l.9-12.5M10.2 10.6v6.2M13.8 10.6v6.2"
      {...pen}
      strokeWidth={1.6}
    />
  ),
  checklist: (
    <>
      <circle cx="5.8" cy="7" r="2.4" {...ink} />
      <path d="M4.7 7.1l.9.9 1.4-1.7" {...groundPen} strokeWidth={1.3} />
      <circle cx="5.8" cy="16.5" r="2.2" {...pen} strokeWidth={1.5} />
      <path d="M11 7h9.5M11 16.5h9.5" {...pen} />
    </>
  ),
  // The iOS status bar (phone chrome, not the app)
  "ios-bars": (
    <>
      <rect x="1" y="14" width="4" height="6" rx=".9" {...ink} />
      <rect x="7" y="11" width="4" height="9" rx=".9" {...ink} />
      <rect x="13" y="8" width="4" height="12" rx=".9" {...ink} />
      <rect x="19" y="4.5" width="4" height="15.5" rx=".9" {...ink} />
    </>
  ),
  "ios-wifi": (
    <>
      <path d="M2 9.4a14.4 14.4 0 0 1 20 0M5.4 13a9.6 9.6 0 0 1 13.2 0M8.8 16.5a4.8 4.8 0 0 1 6.4 0" {...pen} strokeWidth={2.4} />
      <circle cx="12" cy="19.6" r="1.6" {...ink} />
    </>
  ),
  "ios-battery": (
    <>
      <rect x="1" y="6.5" width="19" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth={1.2} opacity={0.45} />
      <rect x="2.8" y="8.3" width="15.4" height="7.4" rx="1.6" {...ink} />
      <path d="M21.4 10.3v3.4" {...pen} strokeWidth={1.6} opacity={0.45} />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type GlyphName = keyof typeof SYMBOLS;
export const GLYPH_NAMES = Object.keys(SYMBOLS) as GlyphName[];

const id = (name: GlyphName) => `ph-g-${name}`;

/** Every glyph as a <symbol>, once per page. */
export function GlyphSprite() {
  return (
    <svg className="ph-sprite" aria-hidden="true" focusable="false">
      {GLYPH_NAMES.map((name) => (
        <symbol key={name} id={id(name)} viewBox="0 0 24 24">
          {SYMBOLS[name]}
        </symbol>
      ))}
    </svg>
  );
}

export interface GlyphProps {
  name: GlyphName;
  className?: string;
}

/** One glyph, sized by its CSS (1em square by default), in currentColor. */
export function Glyph({ name, className }: GlyphProps) {
  return (
    <svg className={className ? `ph-glyph ${className}` : "ph-glyph"} viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-glyph={name}>
      <use href={`#${id(name)}`} />
    </svg>
  );
}
