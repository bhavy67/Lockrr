import { renderLockPng } from "../_pwa/render-icon";

export const runtime = "edge";

export function GET() {
  return renderLockPng({ size: 512, maskable: true });
}
