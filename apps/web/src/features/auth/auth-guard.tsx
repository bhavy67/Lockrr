"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";
import { useSession } from "./use-session";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/sign-in");
    }
  }, [isLoading, user, router]);

  // Two very different states:
  //  - isLoading: we don't yet know who this is → verifying session
  //  - !isLoading && !user: we know there's nobody → sending them out
  // Same visual shell, different copy, different affordance (pulse vs. static).
  if (isLoading) {
    return <TransitionScreen text="Opening your vault…" pulsing />;
  }
  if (!user) {
    return <TransitionScreen text="Locking your vault." />;
  }

  return <>{children}</>;
}

function TransitionScreen({
  text,
  pulsing = false,
}: {
  text: string;
  pulsing?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <LogoMark className={pulsing ? "animate-pulse" : undefined} size={28} />
        <p className="text-xs">{text}</p>
      </div>
    </div>
  );
}
