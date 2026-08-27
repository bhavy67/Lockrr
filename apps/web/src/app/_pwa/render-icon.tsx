import { ImageResponse } from "next/og";

/**
 * Shared PNG renderer for the PWA icons.
 *
 * `maskable` follows the Android adaptive-icon convention: the icon must
 * survive being cropped to any shape, so we pad the artwork inward and drop
 * the tile's rounded corners. Chrome / Play Store will crop it however the
 * launcher wants.
 *
 * Everything is inline SVG — no fonts, no external assets. `next/og` runs on
 * the edge and can't load anything from `public/` at request time.
 */
export function renderLockPng({
  size,
  maskable = false,
}: {
  size: number;
  maskable?: boolean;
}): ImageResponse {
  // Maskable icons keep a 20% safe zone on every side. Regular icons fill the
  // whole tile because the browser doesn't crop them further.
  const inset = maskable ? size * 0.2 : 0;
  const artSize = size - inset * 2;
  const radius = maskable ? 0 : size * 0.22;

  // Lock geometry proportions match /icon.svg exactly, just scaled up.
  const shackleStroke = artSize * 0.083;
  const bodyPad = artSize * 0.281;
  const bodyTop = artSize * 0.4375;
  const bodyRadius = artSize * 0.075;
  const keyholeRadius = artSize * 0.053;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "#4F46E5",
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={artSize}
          height={artSize}
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
    ),
    { width: size, height: size },
  );
}
