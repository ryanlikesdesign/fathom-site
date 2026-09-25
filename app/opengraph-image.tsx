import { ImageResponse } from "next/og";
import { COPY_13 } from "@/lib/copy-13";
import { HomeCard, ogFonts } from "@/lib/og";

export const alt = COPY_13.og.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The homepage's link preview, and every subpage's (lib/pageMeta.ts points
// at it). The card itself is lib/og.tsx's HomeCard: every word is COPY_13.og.
export default async function Image() {
  const fonts = await ogFonts();
  return new ImageResponse(<HomeCard />, { ...size, fonts });
}
