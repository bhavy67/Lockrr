import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  GraduationCap,
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
    body: "IDs, insurance, degrees, receipts, warranties — kept together, easy to find later.",
  },
  {
    icon: Search,
    title: "Find it in a heartbeat",
    body: "Search by name, tag, category, or description. ⌘K opens the command palette from anywhere.",
  },
  {
    icon: CalendarClock,
    title: "Clock every renewal",
    body: "Insurance, warranties, driving license, passport — track expiry dates so nothing important lapses.",
  },
  {
    icon: Tags,
    title: "Organize the way you think",
    body: "Categories, tags, and collections — group a job application or your home documents in one view.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your vault, your device. Nothing is scraped, nothing is sold, nothing leaves the browser.",
  },
  {
    icon: Sparkles,
    title: "Built for the details",
    body: "Instant preview, keyboard shortcuts, mobile-first flows. Feels good every time you open it.",
  },
];

/**
 * Four stylized document card previews for the landing mockup. Each one hints
 * at what's inside the document without being literal — a portrait bubble for
 * an ID, a shield for insurance, paragraph lines + a signature scribble for
 * an agreement, a graduation cap + seal for a certificate. This is
 * illustration, not a screenshot of the real product.
 */
type MockDoc = {
  category: string;
  // Hex, so we can pull from the same palette the seeded categories use in
  // the real app without adding entries to tailwind.config.
  categoryColor: string;
  title: string;
  meta: string;
  // Optional Tailwind class for a top-right status dot. Present only when
  // the document has a live status worth signalling at a glance
  // (warning for expiring, success for active).
  dot?: string;
  render: () => React.ReactNode;
};

const mockDocs: MockDoc[] = [
  {
    category: "Identity",
    categoryColor: "#6366F1",
    title: "Passport",
    meta: "Expires 2029",
    dot: "bg-warning",
    render: () => (
      <div className="flex items-center gap-2">
        {/* portrait bubble */}
        <div className="h-7 w-7 shrink-0 rounded-full bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.55)_0%,rgba(99,102,241,0.15)_60%,transparent_100%)]" />
        <div className="flex-1 space-y-1">
          <div className="h-[3px] w-full rounded-full bg-foreground/50" />
          <div className="h-[3px] w-3/4 rounded-full bg-muted-foreground/40" />
          <div className="h-[3px] w-2/3 rounded-full bg-muted-foreground/40" />
        </div>
      </div>
    ),
  },
  {
    category: "Insurance",
    categoryColor: "#0EA5E9",
    title: "Health Insurance",
    meta: "Active",
    dot: "bg-success",
    render: () => (
      <div className="flex flex-col items-center gap-2">
        <ShieldCheck
          className="h-7 w-7 text-[#0EA5E9]"
          strokeWidth={1.75}
        />
        <div className="flex w-full items-center gap-1">
          <span className="font-mono text-[7px] text-muted-foreground">
            POL/
          </span>
          <div className="h-[3px] flex-1 rounded-full bg-muted-foreground/40" />
        </div>
      </div>
    ),
  },
  {
    category: "Property",
    categoryColor: "#B45309",
    title: "Rent Agreement",
    meta: "Signed",
    render: () => (
      <div className="space-y-[3px]">
        <div className="h-[3px] w-full rounded-full bg-muted-foreground/40" />
        <div className="h-[3px] w-11/12 rounded-full bg-muted-foreground/30" />
        <div className="h-[3px] w-full rounded-full bg-muted-foreground/30" />
        <div className="h-[3px] w-4/5 rounded-full bg-muted-foreground/30" />
        {/* signature scribble */}
        <svg
          viewBox="0 0 60 12"
          className="mt-1 h-3 w-full text-[#B45309]"
          fill="none"
          aria-hidden
        >
          <path
            d="M2 8 Q 8 1, 14 6 T 26 6 Q 34 -1, 42 7 T 58 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
  },
  {
    category: "Education",
    categoryColor: "#7C3AED",
    title: "B.Tech Degree",
    meta: "2022",
    render: () => (
      <div className="relative flex flex-col items-center gap-1.5">
        <GraduationCap
          className="h-7 w-7 text-[#7C3AED]"
          strokeWidth={1.75}
        />
        <div className="h-[3px] w-3/4 rounded-full bg-foreground/40" />
        <div className="h-[3px] w-1/2 rounded-full bg-muted-foreground/40" />
        {/* wax-seal dot */}
        <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[#7C3AED]/30 ring-2 ring-[#7C3AED]/50" />
      </div>
    ),
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
              One vault, every document.
            </span>
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              <span className="block">Lock it.</span>
              <span className="block text-primary">Clock it.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              A calm, private vault for the paperwork of your life. IDs,
              insurance, degrees, receipts — all in one place and ready
              when you need them.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Create your vault
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
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
                  vault.lockkaro.app
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                {mockDocs.map((doc) => (
                  <div
                    key={doc.title}
                    className="flex aspect-[4/5] flex-col justify-between rounded-lg border border-border bg-card p-3 shadow-subtle"
                  >
                    {/* Header: category chip + optional status dot */}
                    <div className="flex items-start justify-between">
                      <span
                        className="rounded-sm px-1.5 py-0.5 text-[8px] font-medium leading-none"
                        style={{
                          backgroundColor: `${doc.categoryColor}1A`,
                          color: doc.categoryColor,
                        }}
                      >
                        {doc.category}
                      </span>
                      {doc.dot && (
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 rounded-full ${doc.dot}`}
                        />
                      )}
                    </div>

                    {/* Middle: distinct visual per doc type */}
                    <div className="my-2 flex flex-1 items-center justify-center px-1">
                      {doc.render()}
                    </div>

                    {/* Footer: title + meta */}
                    <div>
                      <div className="truncate text-[11px] font-medium text-foreground">
                        {doc.title}
                      </div>
                      <div className="mt-0.5 text-[9px] text-muted-foreground">
                        {doc.meta}
                      </div>
                    </div>
                  </div>
                ))}
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
