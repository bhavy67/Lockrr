import type { DataClient } from "./client";
import { mockClient } from "./mock-client";
import { supabaseClient } from "./supabase-client";

/**
 * The one place the app decides where its data lives.
 *
 * `mock` (the default) keeps everything in the browser: records in
 * localStorage, files in IndexedDB, no account and no network. It is the
 * first-run experience and what the E2E suite runs against.
 *
 * `supabase` talks to a real project. See supabase/README.md.
 *
 * Features import `data` from `@/lib/data` and nothing else. Nothing outside
 * this folder should know which implementation it got.
 */
const mode = process.env.NEXT_PUBLIC_DATA_MODE ?? "mock";

export const data: DataClient = mode === "supabase" ? supabaseClient : mockClient;

export type { DataClient } from "./client";
