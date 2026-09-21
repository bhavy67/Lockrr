import { ImageResponse } from "next/og";

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
            "linear-gradient(135deg, #0f0b03 0%, #1c1000 55%, #3d2000 100%)",
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
              background: "#F59E0B",
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
              <circle cx={16} cy={19.5} r={1.7} fill="#F59E0B" />
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
            <span style={{ color: "#FCD34D" }}>Clock it.</span>
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
              background: "#F59E0B",
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
