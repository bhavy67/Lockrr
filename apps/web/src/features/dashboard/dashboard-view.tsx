"use client";

import { differenceInCalendarDays, formatDistanceToNow, startOfMonth } from "date-fns";
import {
  Archive,
  CalendarClock,
  Database,
  FileText,
  Plus,
  Star,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/use-session";
import { useUploadDialog } from "@/features/upload/upload-dialog-store";
import { DocumentRow } from "@/features/documents/document-row";
import { ExpiryBadge } from "@/features/documents/expiry-badge";
import { expiryStatus } from "@/features/documents/expiry";
import {
  useActivity,
  useCategories,
  useDocuments,
} from "@/features/documents/hooks";
import { formatBytes } from "@/lib/utils";
import { CategoryBreakdown } from "./category-breakdown";
import { StatCard } from "./stat-card";

export function DashboardView() {
  const { data: user } = useSession();
  const { data: allDocs, isLoading } = useDocuments();
  const { data: categories = [] } = useCategories();
  const { data: activity } = useActivity(8);
  const openUpload = useUploadDialog((s) => s.open);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const stats = useMemo(() => {
    const docs = allDocs ?? [];
    let expiring = 0;
    let expired = 0;
    let favorites = 0;
    let bytes = 0;
    let thisMonth = 0;
    const monthStart = startOfMonth(new Date()).getTime();
    for (const d of docs) {
      bytes += d.sizeBytes;
      if (d.isFavorite) favorites++;
      const s = expiryStatus(d);
      if (s === "expired") expired++;
      if (s === "soon") expiring++;
      if (new Date(d.createdAt).getTime() >= monthStart) thisMonth++;
    }
    return {
      total: docs.length,
      expiring,
      expired,
      favorites,
      bytes,
      thisMonth,
    };
  }, [allDocs]);

  const recent = useMemo(() => (allDocs ?? []).slice(0, 5), [allDocs]);
  const expiringSoon = useMemo(
    () =>
      (allDocs ?? [])
        .filter(
          (d) =>
            d.expiryDate &&
            differenceInCalendarDays(new Date(d.expiryDate), Date.now()) <= 60,
        )
        .sort(
          (a, b) =>
            new Date(a.expiryDate!).getTime() -
            new Date(b.expiryDate!).getTime(),
        )
        .slice(0, 5),
    [allDocs],
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Working late";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {user?.displayName ?? "Welcome"}.
          </h1>
        </div>
        <Button onClick={() => openUpload()}>
          <Plus className="h-4 w-4" />
          Upload document
        </Button>
      </header>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Documents"
            value={stats.total}
            hint={
              stats.thisMonth > 0
                ? `${stats.thisMonth} added this month`
                : "Nothing added this month"
            }
          />
          <StatCard
            icon={Database}
            label="Storage used"
            value={formatBytes(stats.bytes)}
            hint={`across ${stats.total} document${stats.total === 1 ? "" : "s"}`}
          />
          <StatCard
            icon={CalendarClock}
            label={stats.expired > 0 ? "Needs attention" : "Expiring soon"}
            value={stats.expired + stats.expiring}
            tint={
              stats.expired > 0
                ? "destructive"
                : stats.expiring > 0
                  ? "warning"
                  : "primary"
            }
            hint={
              stats.expired > 0
                ? `${stats.expired} expired · ${stats.expiring} due soon`
                : "in the next 30 days"
            }
          />
          <StatCard
            icon={Star}
            label="Favorites"
            value={stats.favorites}
            tint="success"
            hint="pinned for quick access"
          />
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Recently added
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vault">View all</Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={UploadCloud}
              title="Your vault is empty."
              description="Upload your first important document to see it here."
              action={
                <Button onClick={() => openUpload()}>Upload document</Button>
              }
            />
          ) : (
            <div className="space-y-1 rounded-lg border border-border bg-card p-1">
              {recent.map((d) => (
                <DocumentRow
                  key={d.id}
                  document={d}
                  category={d.categoryId ? categoryMap.get(d.categoryId) : undefined}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="min-w-0 space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Watch dates
            </h2>
            {expiringSoon.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-surface/50 p-5 text-center text-xs text-muted-foreground">
                Nothing expiring in the next 60 days.
              </div>
            ) : (
              <ul className="space-y-2">
                {expiringSoon.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/vault/${d.id}`}
                      className="focus-ring flex items-center gap-3 rounded-md border border-border bg-card p-2.5 hover:border-primary/30"
                    >
                      <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {d.title}
                        </p>
                        <div className="mt-1">
                          <ExpiryBadge document={d} compact />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              By category
            </h2>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : (
              <CategoryBreakdown
                categories={categories}
                documents={allDocs ?? []}
              />
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Recent activity
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/timeline">Timeline</Link>
              </Button>
            </div>
            {!activity || activity.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-surface/50 p-5 text-center text-xs text-muted-foreground">
                Actions will appear here as you use Lockerr.
              </div>
            ) : (
              <ul className="space-y-2 text-xs">
                {activity.slice(0, 6).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 border-b border-border/50 pb-2 last:border-b-0"
                  >
                    <span className="min-w-0 text-muted-foreground">
                      {describeActivity(a.kind)}{" "}
                      {typeof a.payload.title === "string" && (
                        <span className="font-medium text-foreground">
                          {a.payload.title}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(a.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function describeActivity(kind: string): string {
  switch (kind) {
    case "document.uploaded":
      return "Uploaded";
    case "document.updated":
      return "Updated";
    case "document.deleted":
      return "Deleted";
    case "document.favorited":
      return "Favorited";
    case "document.unfavorited":
      return "Unfavorited";
    case "document.archived":
      return "Archived";
    case "document.restored":
      return "Restored";
    case "collection.created":
      return "Created collection";
    case "tag.created":
      return "Created tag";
    default:
      return kind;
  }
}
