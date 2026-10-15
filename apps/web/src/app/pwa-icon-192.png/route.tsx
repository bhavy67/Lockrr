import { renderLockPng } from "../_pwa/render-icon";

export const dynamic = "force-static";

export function GET() {
  return renderLockPng({ size: 192 });
}
