"use client";

import { format, formatDistanceToNow, isFuture } from "date-fns";
import {
  Archive,
  ArchiveRestore,
  BellRing,
  CalendarClock,
  CalendarDays,
  Clock,
  FileText,
  Library,
  Pencil,
  Star,
  StarOff,
  Tag,
  Trash2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useActivity, useDocuments } from "@/features/documents/hooks";
import { useUploadDialog } from "@/features/upload/upload-dialog-store";
import { cn } from "@/lib/utils";
import {
  buildTimeline,
  groupByMonth,
  type TimelineEvent,
  type TimelineEventKind,
} from "./timeline-data";

interface EventStyle {
  icon: LucideIcon;
  verb: string;
  tint: string;
}

const EVENT_STYLES: Record<TimelineEventKind, EventStyle> = {
  uploaded: {
    icon: UploadCloud,
    verb: "Uploaded",
    tint: "text-primary bg-primary/10 border-primary/20",
  },
  updated: {
    icon: Pencil,
    verb: "Updated",
    tint: "text-muted-foreground bg-muted border-border",
  },
  favorited: {
    icon: Star,
    verb: "Favorited",
    tint: "text-warning bg-warning/10 border-warning/20",
  },
  unfavorited: {
    icon: StarOff,
    verb: "Removed favorite from",
    tint: "text-muted-foreground bg-muted border-border",
  },
  archived: {
    icon: Archive,
    verb: "Archived",
    tint: "text-muted-foreground bg-muted border-border",
  },
  restored: {
    icon: ArchiveRestore,
    verb: "Restored",
    tint: "text-success bg-success/10 border-success/20",
  },
  deleted: {
    icon: Trash2,
    verb: "Deleted",
    tint: "text-destructive bg-destructive/10 border-destructive/20",
  },
  "collection.created": {
    icon: Library,
    verb: "Created collection",
    tint: "text-primary bg-primary/10 border-primary/20",
  },
  "tag.created": {
    icon: Tag,
    verb: "Created tag",
    tint: "text-primary bg-primary/10 border-primary/20",
  },
  document_date: {
    icon: CalendarDays,
    verb: "Dated",
    tint: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  },
  expiry_date: {
    icon: CalendarClock,
    verb: "Expires",
    tint: "text-warning bg-warning/10 border-warning/20",
  },
  reminder: {
    icon: BellRing,
    verb: "Reminder",
    tint: "text-primary bg-primary/10 border-primary/20",
  },
};

export function TimelineView() {
  const { data: activity, isLoading: activityLoading } = useActivity(200);
  const { data: docs, isLoading: docsLoading } = useDocuments({
    archived: undefined,
  });
  const openUpload = useUploadDialog((s) => s.open);

  const groups = useMemo(() => {
    if (!activity || !docs) return [];
    return groupByMonth(buildTimeline(activity, docs));
  }, [activity, docs]);

  const totalEvents = useMemo(
    () => groups.reduce((sum, g) => sum + g.events.length, 0),
    [groups],
  );

  if (activityLoading || docsLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-14" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (totalEvents === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Nothing to look back on yet."
        description="Upload documents and add dates to see your vault take shape here over time."
        action={<Button onClick={() => openUpload()}>Upload document</Button>}
      />
    );
  }

  return (
    <div className="relative space-y-10">
      {groups.map((group) => (
        <section key={group.key}>
          <div className="sticky top-14 z-10 -mx-4 mb-3 flex items-center gap-3 bg-background/90 px-4 py-1.5 backdrop-blur md:top-0 md:-mx-6 md:px-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </h2>
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-mono text-muted-foreground">
              {group.events.length}
            </span>
          </div>
          <ol className="relative space-y-2 pl-4">
            <span
              className="absolute left-[9px] top-2 bottom-2 w-px bg-border"
              aria-hidden
            />
            {group.events.map((e) => (
              <li key={e.id} className="relative">
                <TimelineRow event={e} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const style = EVENT_STYLES[event.kind];
  const Icon = style.icon;
  const at = new Date(event.at);
  const future = isFuture(at);
  const relative = formatDistanceToNow(at, { addSuffix: true });
  const absolute = format(at, "MMM d, yyyy");

  const inner = (
    <div className="flex items-start gap-3 rounded-md border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-surface">
      <span
        className={cn(
          "-ml-[26px] mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ring-4 ring-background",
          style.tint,
        )}
        aria-hidden
      >
        <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          <span className="text-muted-foreground">{style.verb} </span>
          <span className="font-medium text-foreground">
            {event.documentTitle ?? event.title}
          </span>
          {event.meta && event.kind === "document_date" && (
            <span className="ml-2 text-xs text-muted-foreground">
              · original document date
            </span>
          )}
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span title={at.toISOString()}>{absolute}</span>
          <span className="text-border">·</span>
          <span>{future ? `in ${relative.replace("in ", "")}` : relative}</span>
        </p>
      </div>
      {event.kind === "expiry_date" && (
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );

  if (event.documentId && event.kind !== "deleted") {
    return (
      <Link
        href={`/vault/${event.documentId}`}
        className="focus-ring block rounded-md"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
