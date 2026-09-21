"use client";

import dynamic from "next/dynamic";

// Loaded as a separate chunk so the server and client both render the
// loading fallback during hydration. next-themes reads localStorage, which
// the server can't access, so any theme-dependent render must be client-only.
export const ThemeToggle = dynamic(() => import("./theme-toggle-impl"), {
  ssr: false,
  loading: () => <div className="h-7 rounded-md bg-muted/60" />,
});
