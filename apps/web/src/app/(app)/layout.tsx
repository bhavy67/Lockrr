import type { ReactNode } from "react";
import { SkipLink } from "@/components/skip-link";
import { AuthGuard } from "@/features/auth/auth-guard";
import { CommandPalette } from "@/features/command-palette/command-palette";
import { ShortcutsMount } from "@/features/command-palette/shortcuts-mount";
import { MobileBottomNav, MobileTopBar } from "@/features/shell/mobile-nav";
import { Sidebar } from "@/features/shell/sidebar";
import { UploadDialog } from "@/features/upload/upload-dialog";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SkipLink />
      <div className="flex min-h-svh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />
          <main id="main" className="flex-1 pb-24 md:pb-0" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
      <UploadDialog />
      <CommandPalette />
      <ShortcutsMount />
    </AuthGuard>
  );
}
