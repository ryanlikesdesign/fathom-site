import { ImageResponse } from 'next/og';

export const alt =
  'Fathom. Walk in. Know the room. Do what you came for. AI companion for blind and low-vision iPhone users.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The card sets the same two faces as the site: Source Serif 4 for the
// headline, Inter for the rest. next/font is not available in an image
// route, so the TTFs are fetched at request time from Google Fonts' CSS API
// (a plain fetch, no browser UA, is what makes it answer with TTF rather than
// WOFF2, which the renderer cannot read) and cached for the process. The
// image is never worth a failed request: if a font cannot be fetched the card
// renders in the renderer's fallback face instead.
const HEADLINE = 'Walk in. Know the room. Do what you came for.';
const SUB = 'AI companion for blind & low-vision iPhone users · Free on the App Store fathom';

async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`,
    )
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`no TTF for ${family} ${weight}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font fetch ${res.status} for ${family} ${weight}`);
  return res.arrayBuffer();
}

type Font = { name: string; data: ArrayBuffer; weight: 500 | 600; style: 'normal' };
let fontsPromise: Promise<Font[] | undefined> | null = null;
function fonts(): Promise<Font[] | undefined> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      loadGoogleFont('Source Serif 4', 600, HEADLINE),
      loadGoogleFont('Inter', 500, SUB),
    ])
      .then(([serif, sans]): Font[] => [
        { name: 'Source Serif 4', data: serif, weight: 600, style: 'normal' },
        { name: 'Inter', data: sans, weight: 500, style: 'normal' },
      ])
      .catch((err: unknown) => {
        console.error('[og] font load failed, using fallback faces:', err);
        fontsPromise = null;
        return undefined;
      });
  }
  return fontsPromise;
}

export default async function Image() {
  const loaded = await fonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '72px 80px',
          background: '#0c0b09',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            left: '-100px',
            width: '900px',
            height: '900px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,180,0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Concentric rings */}
        <div style={{ position: 'absolute', top: '40px', right: '-60px', display: 'flex' }}>
          {[320, 220, 130].map((size, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${-size / 2}px`,
                right: `${-size / 2}px`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                border: `1px solid rgba(255,255,255,${0.06 + i * 0.04})`,
                display: 'flex',
              }}
            />
          ))}
        </div>

        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" />
            <circle cx="18" cy="18" r="2" fill="#ede8de" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '22px', fontWeight: 500, letterSpacing: '0.04em', fontFamily: 'Inter' }}>
            fathom
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 600,
            color: '#f7f4ee',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            fontFamily: 'Source Serif 4',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>Walk in. Know the room.</span>
          <span style={{ color: '#6ea8c8' }}>Do what you came for.</span>
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(247,244,238,0.55)',
            fontFamily: 'Inter',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            display: 'flex',
          }}
        >
          AI companion for blind &amp; low-vision iPhone users · Free on the App Store
        </div>
      </div>
    ),
    { ...size, fonts: loaded }
  );
}
