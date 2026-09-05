import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
            <circle cx="18" cy="18" r="2" fill="white" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '22px', fontWeight: 500, letterSpacing: '0.04em', fontFamily: 'sans-serif' }}>
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
            fontFamily: 'serif',
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
            fontFamily: 'sans-serif',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            display: 'flex',
          }}
        >
          AI navigation for blind &amp; low-vision iPhone users · Free on the App Store
        </div>
      </div>
    ),
    { ...size }
  );
}
