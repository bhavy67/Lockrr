"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[LockKaro]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs text-destructive">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        We hit an unexpected error.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Try refreshing the page."}
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
