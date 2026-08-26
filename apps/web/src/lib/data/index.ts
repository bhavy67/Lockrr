import type { DataClient } from "./client";
import { mockClient } from "./mock-client";

const mode = process.env.NEXT_PUBLIC_DATA_MODE ?? "mock";

export const data: DataClient = mode === "supabase" ? mockClient : mockClient;
// Note: supabase implementation added in Phase 6 — keep the interface stable.

export type { DataClient } from "./client";
