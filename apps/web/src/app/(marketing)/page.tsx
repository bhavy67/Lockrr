"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  FolderOpen,
  Image,
  Lock,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/features/shell/theme-toggle";

const features = [
  {
    icon: FolderOpen,
    title: "Everything in one place",
    body: "IDs, insurance, degrees, receipts, warranties — kept together and easy to find.",
  },
  {
    icon: CalendarClock,
    title: "Track what expires",
    body: "Set expiry dates on any document. Get a clear view of what's coming up for renewal.",
  },
  {
    icon: Search,
    title: "Find it instantly",
    body: "Search by name, tag, or category. Use ⌘K from anywhere in the vault.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your files live in your browser — nothing is uploaded, nothing is shared.",
  },
];

const mockDocs = [
  {
    icon: FileText,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    title: "Passport",
    tag: "Identity",
    expiry: "Expires soon",
    expiryColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    star: false,
  },
  {
    icon: Image,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    title: "Degree Certificate",
    tag: "Education",
    expiry: null,
    expiryColor: "",
    star: true,
  },
  {
    icon: FileText,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    title: "Car Insurance",
    tag: "Insurance",
    expiry: null,
    expiryColor: "",
    star: false,
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("lk.onboarded")) {
      router.replace("/vault");
    } else {
      setChecked(true);
    }
  }, [router]);

  const openVault = () => {
    localStorage.setItem("lk.onboarded", "true");
    router.push("/vault");
  };

  if (!checked) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LogoMark className="animate-pulse text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between px-6">
        <Wordmark />
        <ThemeToggle />
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:py-24">
          {/* Warm radial glow */}
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden
          >
            <div className="absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          </div>

          <div className="mx-auto w-full max-w-2xl">
            {/* Trust pill */}
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Lock className="h-3 w-3" />
              No account needed — data never leaves your device
            </div>

            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your personal
              <br />
              <span className="text-primary">document vault.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              A calm, private place for the paperwork of your life. Everything
              stays in your browser — no account, no server, no surprises.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Button size="lg" onClick={openVault} className="gap-2 px-8">
                Open my vault
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Free forever. Your files never leave your device.
              </p>
            </div>
          </div>

          {/* Vault preview mockup */}
          <div className="mx-auto mt-14 w-full max-w-lg sm:mt-16">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
              {/* Mockup chrome */}
              <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <div className="ml-3 flex-1 rounded-md bg-background/60 px-3 py-1 text-center text-[10px] text-muted-foreground/60">
                  Your vault
                </div>
              </div>
              {/* Mockup content */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {mockDocs.map((doc) => (
                    <div
                      key={doc.title}
                      className="overflow-hidden rounded-xl border border-border bg-background"
                    >
                      {/* Thumbnail */}
                      <div
                        className={`flex aspect-[4/3] items-center justify-center ${doc.bg}`}
                      >
                        <doc.icon className={`h-6 w-6 ${doc.color}`} />
                      </div>
                      {/* Card body */}
                      <div className="p-2">
                        <div className="flex items-start justify-between gap-1">
                          <p className="truncate text-[10px] font-medium text-foreground">
                            {doc.title}
                          </p>
                          {doc.star && (
                            <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                          {doc.tag}
                        </p>
                        {doc.expiry && (
                          <span
                            className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[8px] font-medium ${doc.expiryColor}`}
                          >
                            {doc.expiry}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
            <p className="mb-8 text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Built for the paperwork of real life
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-subtle transition-colors hover:border-primary/30 hover:bg-card"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/60 bg-background px-4 py-14 text-center">
          <div className="mx-auto max-w-sm">
            <h2 className="text-xl font-semibold text-foreground">
              Ready to get organised?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Takes five seconds. No sign-up.
            </p>
            <Button
              size="lg"
              onClick={openVault}
              className="mt-6 gap-2 px-8"
            >
              Open my vault
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 px-6 py-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LockKaro. Your documents, your control.
        </p>
      </footer>
    </div>
  );
}
