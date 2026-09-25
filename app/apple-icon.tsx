import { ImageResponse } from "next/og";
import { APP_ICON } from "@/design-system/generated/logo-paths";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// The home-screen icon iOS asks for when someone adds the site. The SVG
// favicon cannot serve it (Safari wants a raster here), so this draws the
// app's own icon from the design system (design-system/generated/
// logo-paths.ts): the bone mark on fathom-900, the geometry of
// fathom-app-icon.svg scaled from 1024 to 180, as iOS scales the app's
// icon. iOS rounds the corners itself.
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: APP_ICON.background }}>
        <svg width={size.width} height={size.height} viewBox={APP_ICON.viewBox}>
          <path d={APP_ICON.d} fill={APP_ICON.foreground} fillRule={APP_ICON.fillRule} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
