import { format, isThisYear } from "date-fns";
import type { ActivityEvent, DocumentRecord } from "@lockerr/types";

export type TimelineEventKind =
  | "uploaded"
  | "updated"
  | "favorited"
  | "unfavorited"
  | "archived"
  | "restored"
  | "deleted"
  | "collection.created"
  | "tag.created"
  | "document_date"
  | "expiry_date"
  | "reminder";

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  at: string;
  title: string;
  documentId?: string | null;
  documentTitle?: string;
  meta?: string;
}

const ACTIVITY_MAP: Record<string, TimelineEventKind | null> = {
  "document.uploaded": "uploaded",
  "document.updated": "updated",
  "document.favorited": "favorited",
  "document.unfavorited": "unfavorited",
  "document.archived": "archived",
  "document.restored": "restored",
  "document.deleted": "deleted",
  "collection.created": "collection.created",
  "tag.created": "tag.created",
};

/**
 * Merge activity log + document date/expiry into a single timeline stream.
 * We dedupe uploads-with-created (an upload event already implies the doc was added).
 */
export function buildTimeline(
  activity: ActivityEvent[],
  documents: DocumentRecord[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const a of activity) {
    const kind = ACTIVITY_MAP[a.kind];
    if (!kind) continue;
    const title =
      typeof a.payload.title === "string" ? a.payload.title : undefined;
    const name =
      typeof a.payload.name === "string" ? a.payload.name : undefined;
    events.push({
      id: `activity-${a.id}`,
      kind,
      at: a.createdAt,
      title: title ?? name ?? kind,
      documentId: a.documentId,
      documentTitle: title,
    });
  }

  for (const d of documents) {
    if (d.documentDate) {
      events.push({
        id: `${d.id}-docdate`,
        kind: "document_date",
        at: d.documentDate,
        title: d.title,
        documentId: d.id,
        documentTitle: d.title,
        meta: "Document date",
      });
    }
    if (d.expiryDate) {
      events.push({
        id: `${d.id}-expiry`,
        kind: "expiry_date",
        at: d.expiryDate,
        title: d.title,
        documentId: d.id,
        documentTitle: d.title,
        meta: "Expires",
      });
    }
    if (d.reminderDate) {
      events.push({
        id: `${d.id}-reminder`,
        kind: "reminder",
        at: d.reminderDate,
        title: d.title,
        documentId: d.id,
        documentTitle: d.title,
        meta: "Reminder",
      });
    }
  }

  return events.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export type TimelineGroup = {
  key: string;
  label: string;
  events: TimelineEvent[];
};

export function groupByMonth(events: TimelineEvent[]): TimelineGroup[] {
  const map = new Map<string, TimelineGroup>();
  for (const e of events) {
    const d = new Date(e.at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = isThisYear(d) ? format(d, "MMMM") : format(d, "MMMM yyyy");
    let g = map.get(key);
    if (!g) {
      g = { key, label, events: [] };
      map.set(key, g);
    }
    g.events.push(e);
  }
  return Array.from(map.values());
}
