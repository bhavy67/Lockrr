import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import type { DocumentRecord } from "@lockkaro/types";
import {
  attentionCount,
  daysUntilExpiry,
  expiryStatus,
  LATER_THRESHOLD_DAYS,
  SOON_THRESHOLD_DAYS,
} from "./expiry";

function doc(overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    id: "id",
    userId: "u",
    categoryId: null,
    title: "t",
    description: null,
    fileName: "f.pdf",
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
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const iso = (d: Date) => d.toISOString();

describe("expiryStatus", () => {
  it("returns none when no expiry", () => {
    expect(expiryStatus({ expiryDate: null })).toBe("none");
  });

  it("returns expired when the date is in the past", () => {
    expect(expiryStatus({ expiryDate: iso(addDays(new Date(), -1)) })).toBe(
      "expired",
    );
  });

  it("returns soon at the soon boundary and inside it", () => {
    expect(expiryStatus({ expiryDate: iso(addDays(new Date(), 1)) })).toBe(
      "soon",
    );
    expect(
      expiryStatus({
        expiryDate: iso(addDays(new Date(), SOON_THRESHOLD_DAYS)),
      }),
    ).toBe("soon");
  });

  it("returns later between soon and later thresholds", () => {
    expect(
      expiryStatus({
        expiryDate: iso(addDays(new Date(), SOON_THRESHOLD_DAYS + 1)),
      }),
    ).toBe("later");
    expect(
      expiryStatus({
        expiryDate: iso(addDays(new Date(), LATER_THRESHOLD_DAYS)),
      }),
    ).toBe("later");
  });

  it("returns active far in the future", () => {
    expect(
      expiryStatus({
        expiryDate: iso(addDays(new Date(), LATER_THRESHOLD_DAYS + 30)),
      }),
    ).toBe("active");
  });
});

describe("daysUntilExpiry", () => {
  it("null when no expiry", () => {
    expect(daysUntilExpiry({ expiryDate: null })).toBeNull();
  });
  it("returns integer number of days", () => {
    const in5 = daysUntilExpiry({
      expiryDate: iso(addDays(new Date(), 5)),
    });
    expect(in5).toBeGreaterThanOrEqual(4);
    expect(in5).toBeLessThanOrEqual(5);
  });
});

describe("attentionCount", () => {
  it("counts expired + soon, ignoring archived + non-expiry docs", () => {
    const docs = [
      doc({ id: "a", expiryDate: iso(addDays(new Date(), -3)) }),
      doc({ id: "b", expiryDate: iso(addDays(new Date(), 5)) }),
      doc({ id: "c", expiryDate: iso(addDays(new Date(), 60)) }), // later, ignored
      doc({ id: "d", expiryDate: null }),
      doc({
        id: "e",
        expiryDate: iso(addDays(new Date(), 5)),
        isArchived: true,
      }),
    ];
    expect(attentionCount(docs)).toBe(2);
  });
});
