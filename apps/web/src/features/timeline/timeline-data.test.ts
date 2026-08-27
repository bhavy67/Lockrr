import { describe, expect, it } from "vitest";
import type { ActivityEvent, DocumentRecord } from "@lockkaro/types";
import { buildTimeline, groupByMonth } from "./timeline-data";

function activity(
  overrides: Partial<ActivityEvent> = {},
): ActivityEvent {
  return {
    id: `a-${Math.random()}`,
    userId: "u",
    documentId: null,
    kind: "document.uploaded",
    payload: { title: "Passport" },
    createdAt: "2025-01-15T10:00:00.000Z",
    ...overrides,
  };
}

function doc(overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    id: "d-1",
    userId: "u",
    categoryId: null,
    title: "Passport",
    description: null,
    fileName: "passport.pdf",
    storagePath: "p",
    mimeType: "application/pdf",
    sizeBytes: 100,
    documentDate: null,
    expiryDate: null,
    reminderDate: null,
    isFavorite: false,
    isArchived: false,
    tagIds: [],
    collectionIds: [],
    metadata: {},
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-01-15T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildTimeline", () => {
  it("returns events in reverse chronological order", () => {
    const a = activity({ createdAt: "2025-02-01T10:00:00.000Z" });
    const b = activity({ createdAt: "2025-03-01T10:00:00.000Z" });
    const events = buildTimeline([a, b], []);
    expect(events[0]?.at).toBe("2025-03-01T10:00:00.000Z");
    expect(events[1]?.at).toBe("2025-02-01T10:00:00.000Z");
  });

  it("adds document_date and expiry_date events per document", () => {
    const events = buildTimeline([], [
      doc({
        documentDate: "2024-06-01T00:00:00.000Z",
        expiryDate: "2029-06-01T00:00:00.000Z",
      }),
    ]);
    const kinds = events.map((e) => e.kind).sort();
    expect(kinds).toEqual(["document_date", "expiry_date"]);
  });

  it("skips unknown activity kinds", () => {
    const bogus = activity({ kind: "not.a.kind" as ActivityEvent["kind"] });
    expect(buildTimeline([bogus], [])).toEqual([]);
  });

  it("includes reminder event when reminderDate is set", () => {
    const events = buildTimeline([], [
      doc({ reminderDate: "2025-12-01T00:00:00.000Z" }),
    ]);
    expect(events[0]?.kind).toBe("reminder");
  });
});

describe("groupByMonth", () => {
  it("groups events into month buckets in insertion order", () => {
    const events = buildTimeline(
      [
        activity({ createdAt: "2025-03-15T10:00:00.000Z" }),
        activity({ createdAt: "2025-03-01T10:00:00.000Z" }),
        activity({ createdAt: "2025-02-01T10:00:00.000Z" }),
      ],
      [],
    );
    const groups = groupByMonth(events);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.events).toHaveLength(2);
    expect(groups[1]?.events).toHaveLength(1);
  });

  it("month label is bare when in current year", () => {
    const now = new Date();
    const events = buildTimeline(
      [activity({ createdAt: now.toISOString() })],
      [],
    );
    const groups = groupByMonth(events);
    expect(groups[0]?.label).not.toMatch(/\d{4}/);
  });
});
