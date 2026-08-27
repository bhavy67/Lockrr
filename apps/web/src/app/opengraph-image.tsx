import { ImageResponse } from "next/og";

/**
 * Dynamic OG image. Next.js runs this at build/request time and serves the
 * result as /opengraph-image at 1200×630. No external font is required —
 * ImageResponse falls back to the platform sans-serif, which is fine at OG
 * sizes.
 *
 * Design: dark gradient stage with the brand mark top-left, tagline
 * ("Lock it. Clock it.") as the hero, and a bilingual subhead. The two
 * lines of the tagline stack vertically to preserve the beat pattern.
 */

export const runtime = "edge";
export const alt = "LockKaro — Lock it. Clock it.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(135deg, #0a0a0b 0%, #1a1a2e 60%, #2b2570 100%)",
          fontFamily: "sans-serif",
          color: "white",
        }}
      >
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 17,
              background: "#4F46E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width={44}
              height={44}
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 15v-3a5 5 0 1 1 10 0v3"
                stroke="#ffffff"
                strokeWidth={2.6}
                strokeLinecap="round"
                fill="none"
              />
              <rect
                x={9}
                y={14}
                width={14}
                height={11}
                rx={2.4}
                fill="#ffffff"
              />
              <circle cx={16} cy={19.5} r={1.7} fill="#4F46E5" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 40,
              letterSpacing: -0.5,
              display: "flex",
            }}
          >
            <span style={{ fontWeight: 500 }}>Lock</span>
            <span style={{ fontWeight: 800 }}>Karo</span>
          </div>
        </div>

        {/* Tagline as hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 132,
              fontWeight: 800,
              lineHeight: 0.98,
              letterSpacing: -3,
            }}
          >
            <span>Lock it.</span>
            <span style={{ color: "#A5B4FC" }}>Clock it.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.72)",
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            A calm, private vault for the paperwork of your life.
            IDs, insurance, degrees, receipts — all in one place.
          </div>
        </div>

        {/* Footer badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#22C55E",
            }}
          />
          <div
            style={{
              fontSize: 22,
              color: "rgba(255, 255, 255, 0.6)",
              fontFamily: "monospace",
            }}
          >
            frontend-first · private-by-default · portfolio project
          </div>
        </div>
      </div>
    ),
    size,
  );
}
