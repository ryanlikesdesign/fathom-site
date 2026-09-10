import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// The home-screen icon iOS asks for when someone adds the site. The SVG
// favicon cannot serve it (Safari wants a raster here), so this is the same
// sonar mark as components/BrandMark.tsx, drawn in bone on the site's dark
// ground. iOS rounds the corners itself.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e1013',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="7" fill="#e8e4db" />
          <circle cx="60" cy="60" r="18" stroke="#e8e4db" strokeWidth="4" opacity="0.85" />
          <circle cx="60" cy="60" r="30" stroke="#e8e4db" strokeWidth="3.2" opacity="0.55" />
          <circle cx="60" cy="60" r="42" stroke="#e8e4db" strokeWidth="2.6" opacity="0.3" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
