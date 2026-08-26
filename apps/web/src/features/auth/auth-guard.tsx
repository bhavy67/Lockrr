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

  if (isLoading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LogoMark className="animate-pulse" size={28} />
          <p className="text-xs">Opening your vault…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
