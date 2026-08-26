"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export type LockerrSupabaseClient = SupabaseClient<Database>;

export const DOCUMENTS_BUCKET = "documents";

/**
 * Both values are safe in the browser bundle. The anon key carries no
 * authority of its own — every table has row level security, so it can only
 * reach rows belonging to whoever is signed in.
 *
 * Referenced statically so Next.js inlines them at build time.
 */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY, or run with NEXT_PUBLIC_DATA_MODE=mock.",
    );
  }
  return { url, anonKey };
}

let client: LockerrSupabaseClient | null = null;

/**
 * One client per tab. `createBrowserClient` keeps the session in cookies, so
 * middleware can refresh it and server code can read it.
 */
export function getSupabase(): LockerrSupabaseClient {
  if (!client) {
    const { url, anonKey } = supabaseEnv();
    client = createBrowserClient<Database>(url, anonKey);
  }
  return client;
}
