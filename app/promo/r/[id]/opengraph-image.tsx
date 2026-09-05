import { ImageResponse } from "next/og";
import { findBySlug } from "@/lib/promoDb";

export const alt = "A free trial of Fathom";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A preview card is never worth failing over — fall back to generic wording.
  let offer = "a free trial";
  try {
    const found = await findBySlug(id);
    if (found) offer = found.durationLabel;
  } catch (err) {
    console.error("[promo] og image lookup failed:", err);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0c0b09",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "-220px",
            right: "-140px",
            width: "820px",
            height: "820px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,180,0.20) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" />
            <circle cx="18" cy="18" r="2" fill="white" />
          </svg>
          <span
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "26px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              fontFamily: "sans-serif",
            }}
          >
            fathom
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: "999px",
              border: "1px solid rgba(110,168,200,0.5)",
              color: "#6ea8c8",
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              marginBottom: "28px",
            }}
          >
            Free trial inside
          </div>

          <div
            style={{
              fontSize: "84px",
              fontWeight: 600,
              color: "#f7f4ee",
              lineHeight: 1.03,
              letterSpacing: "-0.03em",
              fontFamily: "serif",
              marginBottom: "24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>
              You&apos;ve got{" "}
              <span style={{ color: "#6ea8c8" }}>{offer}</span>
            </span>
            <span>of Fathom.</span>
          </div>

          <div
            style={{
              fontSize: "28px",
              color: "rgba(247,244,238,0.6)",
              fontFamily: "sans-serif",
              fontWeight: 400,
              display: "flex",
            }}
          >
            AI navigation for blind &amp; low-vision iPhone users · Tap to redeem
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
