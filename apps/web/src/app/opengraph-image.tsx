import { ImageResponse } from "next/og";

/**
 * Dynamic OG image. Next.js runs this at build/request time and serves the
 * result as /opengraph-image at 1200×630. No external font is required —
 * ImageResponse falls back to the platform sans-serif, which is fine at OG
 * sizes.
 */

export const runtime = "edge";
export const alt = "Lockerr — your private document vault";
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
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#4F46E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width={40}
              height={40}
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 15.5v-3a5 5 0 1 1 10 0v3"
                stroke="#ffffff"
                strokeWidth={2.4}
                strokeLinecap="round"
                fill="none"
              />
              <rect
                x={9}
                y={14.5}
                width={14}
                height={10.5}
                rx={2.2}
                fill="#ffffff"
              />
              <circle cx={16} cy={19.5} r={1.5} fill="#4F46E5" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            Lockerr
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 900,
            }}
          >
            Where is that important document?
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
