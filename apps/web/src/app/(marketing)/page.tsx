import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const capabilities = [
  {
    icon: FileText,
    title: "Every document, one calm place",
    body: "IDs, invoices, warranties, degrees, insurance — kept together, easy to find later.",
  },
  {
    icon: Search,
    title: "Find it in a heartbeat",
    body: "Search by name, tag, category, or description. ⌘K opens the command palette from anywhere.",
  },
  {
    icon: CalendarClock,
    title: "Know before it expires",
    body: "Track document dates, expiries, and reminders so nothing important lapses.",
  },
  {
    icon: Tags,
    title: "Organize the way you think",
    body: "Categories, tags, and collections — group a Europe trip or a job application in one view.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your vault, your device. Data stays with you — no ads, no scraping, no surprises.",
  },
  {
    icon: Sparkles,
    title: "Built for the details",
    body: "Instant preview, keyboard shortcuts, mobile-first flows. Feels good every time you open it.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              A private home for the paperwork of your life
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Where is that important document?
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Lockerr is a calm, private vault for the documents that actually matter —
              organized the way you think and ready when you need them.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Create your vault
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/sign-in">I already have an account</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card. No email needed to try — this build stores your vault locally.
            </p>
          </div>

          <div className="pointer-events-none mx-auto mt-16 max-w-4xl">
            <div className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-elevated">
              <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                <span className="ml-3 text-[11px] font-mono text-muted-foreground">
                  vault.lockerr.app
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 p-4">
                {["Passport", "Rent Agreement", "Laptop Invoice", "Insurance"].map(
                  (t) => (
                    <div
                      key={t}
                      className="flex aspect-[4/5] flex-col justify-between rounded-lg border border-border bg-card p-3"
                    >
                      <div className="h-3 w-8 rounded-full bg-primary/60" />
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-medium text-foreground">
                          {t}
                        </div>
                        <div className="h-1 w-2/3 rounded-full bg-muted" />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-lg border border-border bg-card p-6 shadow-subtle"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
