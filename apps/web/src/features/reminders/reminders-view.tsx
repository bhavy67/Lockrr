"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DocumentRecord } from "@lockkaro/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentIcon } from "@/features/documents/document-icon";
import {
  expiryStatus,
  LATER_THRESHOLD_DAYS,
  SOON_THRESHOLD_DAYS,
} from "@/features/documents/expiry";
import { useCategories, useDocuments } from "@/features/documents/hooks";
import { formatBytes } from "@/lib/utils";

type Bucket = "soon" | "later" | "expired" | "all";

interface CountsByBucket {
  soon: number;
  later: number;
  expired: number;
  all: number;
}

export function RemindersView() {
  const { data: docs, isLoading } = useDocuments({ archived: false });
  const { data: categories = [] } = useCategories();
  const [tab, setTab] = useState<Bucket>("soon");

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const withExpiry = useMemo(
    () => (docs ?? []).filter((d) => d.expiryDate),
    [docs],
  );

  const buckets = useMemo(() => {
    const soon: DocumentRecord[] = [];
    const later: DocumentRecord[] = [];
    const expired: DocumentRecord[] = [];
    for (const d of withExpiry) {
      const s = expiryStatus(d);
      if (s === "soon") soon.push(d);
      else if (s === "later") later.push(d);
      else if (s === "expired") expired.push(d);
    }
    soon.sort(dateAsc);
    later.sort(dateAsc);
    expired.sort(dateDesc);
    return {
      soon,
      later,
      expired,
      all: [...expired, ...soon, ...later].sort(dateAsc),
    };
  }, [withExpiry]);

  const counts: CountsByBucket = {
    soon: buckets.soon.length,
    later: buckets.later.length,
    expired: buckets.expired.length,
    all: withExpiry.length,
  };

  if (isLoading) {
    return <RemindersSkeleton />;
  }

  if (withExpiry.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nothing has an expiry set."
        description="Add an expiry date to a document (passport, insurance, warranty…) to start tracking it here."
      />
    );
  }

  const list = buckets[tab];

  return (
    <div className="space-y-6">
      <SummaryStrip counts={counts} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Bucket)}>
        <TabsList>
          <TabsTrigger value="soon">
            Soon
            {counts.soon > 0 && (
              <span className="ml-1.5 rounded-sm bg-warning/15 px-1 text-[10px] text-warning">
                {counts.soon}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="later">Later</TabsTrigger>
          <TabsTrigger value="expired">
            Expired
            {counts.expired > 0 && (
              <span className="ml-1.5 rounded-sm bg-destructive/15 px-1 text-[10px] text-destructive">
                {counts.expired}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {list.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={
                tab === "soon"
                  ? "Nothing expiring soon."
                  : tab === "expired"
                    ? "No expired documents."
                    : tab === "later"
                      ? "Nothing in the 30–90 day window."
                      : "No documents with expiries."
              }
              description={
                tab === "soon"
                  ? "You're up to date for the next 30 days."
                  : tab === "expired"
                    ? "Well kept. Everything's still valid."
                    : "Come back later — this fills in as your dates approach."
              }
            />
          ) : (
            <ol className="space-y-2">
              {list.map((d) => (
                <li key={d.id}>
                  <ReminderRow
                    document={d}
                    categoryName={
                      d.categoryId ? categoryMap.get(d.categoryId)?.name : undefined
                    }
                  />
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryStrip({ counts }: { counts: CountsByBucket }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <Metric label="Expired" value={counts.expired} tint="destructive" />
      <Metric
        label={`Soon (≤${SOON_THRESHOLD_DAYS}d)`}
        value={counts.soon}
        tint="warning"
      />
      <Metric
        label={`Later (≤${LATER_THRESHOLD_DAYS}d)`}
        value={counts.later}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint?: "warning" | "destructive";
}) {
  const dotClass =
    tint === "warning"
      ? "bg-warning"
      : tint === "destructive"
        ? "bg-destructive"
        : "bg-muted-foreground/40";
  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-subtle">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden />
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ReminderRow({
  document: doc,
  categoryName,
}: {
  document: DocumentRecord;
  categoryName?: string;
}) {
  const status = expiryStatus(doc);
  const days = differenceInCalendarDays(new Date(doc.expiryDate!), new Date());

  const rightText =
    status === "expired"
      ? `Expired ${Math.abs(days)}d ago`
      : days === 0
        ? "Today"
        : `${days}d left`;

  const rightTint =
    status === "expired"
      ? "text-destructive"
      : status === "soon"
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <Link
      href={`/vault/${doc.id}`}
      className="focus-ring flex items-center gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <DocumentIcon mimeType={doc.mimeType} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {doc.title}
          </p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {categoryName && <>{categoryName} · </>}
          {format(new Date(doc.expiryDate!), "MMM d, yyyy")}
          {" · "}
          {formatBytes(doc.sizeBytes)}
        </p>
      </div>
      <div className={`shrink-0 whitespace-nowrap text-sm font-semibold ${rightTint}`}>
        {rightText}
      </div>
    </Link>
  );
}

function RemindersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <Skeleton className="h-9 w-64" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

function dateAsc(a: DocumentRecord, b: DocumentRecord) {
  return (
    new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()
  );
}
function dateDesc(a: DocumentRecord, b: DocumentRecord) {
  return (
    new Date(b.expiryDate!).getTime() - new Date(a.expiryDate!).getTime()
  );
}
