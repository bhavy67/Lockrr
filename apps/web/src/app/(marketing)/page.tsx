"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, FolderOpen, Search, ShieldCheck } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FolderOpen,
    title: "Everything in one place",
    body: "IDs, insurance, degrees, receipts, warranties — kept together and easy to find.",
  },
  {
    icon: CalendarClock,
    title: "Track what matters",
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

export default function WelcomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Returning users skip the welcome screen
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
      <header className="flex h-14 items-center px-6">
        <Wordmark />
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
          <div className="mx-auto max-w-xl">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <LogoMark size={32} className="text-primary" />
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Your personal
              <br />
              <span className="text-primary">document vault.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
              A calm, private place for the paperwork of your life. Everything
              stays in your browser — no account, no server, no surprises.
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={openVault} className="gap-2">
                Open my vault
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Your files never leave your device.
            </p>
          </div>
        </section>

        {/* Feature grid */}
        <section className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-subtle"
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
