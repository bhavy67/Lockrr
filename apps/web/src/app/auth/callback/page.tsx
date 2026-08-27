"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { isSupabaseMode } from "@/lib/data";
import { getSupabase } from "@/lib/data/supabase/browser-client";

/**
 * Where a Supabase confirmation / magic-link email sends the browser back to.
 *
 * Supabase's own auth server (GoTrue) handles the token itself — this page's
 * only job is to wait for the browser client to notice the session that
 * landed in the URL (a `#access_token=...` fragment on success, GoTrue's
 * default) and then move on. Nothing here talks to `@/lib/data`'s DataClient
 * for this — establishing a session from a URL fragment isn't a `DataClient`
 * operation, and doesn't exist in the mock client's model at all, the same
 * reason middleware.ts also reaches for the Supabase client directly.
 *
 * A failed verification (expired or already-used link, or — the case that
 * shipped broken — the project's Site URL not matching where this app
 * actually runs) doesn't throw; GoTrue reports it as `error`/
 * `error_description` on this same redirect, so that's checked first.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [state, setState] = useState<"working" | "error">("working");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseMode) {
      setState("error");
      setMessage("Email links aren't used in the local demo mode.");
      return;
    }

    const params = new URLSearchParams(
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.search,
    );
    const errorDescription = params.get("error_description");
    if (errorDescription) {
      setState("error");
      setMessage(errorDescription.replace(/\+/g, " "));
      return;
    }

    let done = false;
    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch {
      setState("error");
      setMessage("Couldn't reach the vault. Try signing in directly.");
      return;
    }

    // detectSessionInUrl (on by default) parses the fragment and establishes
    // the session asynchronously; onAuthStateChange fires once that
    // resolves. getSession() below covers the case where it already
    // resolved before this listener attached.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !done) {
        done = true;
        router.replace("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !done) {
        done = true;
        router.replace("/dashboard");
      }
    });

    const timeout = setTimeout(() => {
      if (!done) {
        setState("error");
        setMessage("That link didn't confirm a session. Try signing in instead.");
      }
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (state === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
        <LogoMark size={28} />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            That link didn&apos;t work.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {message ?? "It may have expired or already been used."}
          </p>
        </div>
        <Button asChild>
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <LogoMark className="animate-pulse" size={28} />
        <p className="text-xs">Confirming your account…</p>
      </div>
    </div>
  );
}
