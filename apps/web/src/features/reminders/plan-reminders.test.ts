import { describe, expect, it } from "vitest";
import type { DocumentRecord } from "@lockkaro/types";
import { MAX_REMINDERS, planReminders } from "./plan-reminders";

const doc = (o: Partial<DocumentRecord>): DocumentRecord =>
  ({ id: "d", title: "Passport", expiryDate: null, isArchived: false, ...o }) as DocumentRecord;

const now = new Date(2026, 0, 1, 12); // 1 Jan 2026, noon local
const expires = (y: number, m: number, d: number) => new Date(y, m - 1, d).toISOString();

describe("planReminders", () => {
  it("plans 30 days, 7 days and the day itself, at 9 am, soonest first", () => {
    const r = planReminders([doc({ expiryDate: expires(2026, 6, 30) })], now);
    expect(r.map((x) => x.at)).toEqual([
      new Date(2026, 4, 31, 9),
      new Date(2026, 5, 23, 9),
      new Date(2026, 5, 30, 9),
    ]);
    expect(r.map((x) => x.body)).toEqual([
      "Expires in 30 days — 30 Jun 2026.",
      "Expires in a week — 30 Jun 2026.",
      "Expires today — 30 Jun 2026.",
    ]);
    expect(r[0]).toMatchObject({ id: 1, title: "Passport", documentId: "d" });
  });

  it("drops reminders already in the past", () => {
    // Expires in 10 days: the 30-day one has passed.
    const r = planReminders([doc({ expiryDate: expires(2026, 1, 11) })], now);
    expect(r.map((x) => x.body.split(" —")[0])).toEqual(["Expires in a week", "Expires today"]);
  });

  it("drops today's 9 am once it has passed", () => {
    expect(planReminders([doc({ expiryDate: expires(2026, 1, 1) })], now)).toEqual([]);
  });

  it("skips archived documents and ones without an expiry", () => {
    const r = planReminders(
      [doc({ expiryDate: expires(2026, 6, 1), isArchived: true }), doc({ expiryDate: null })],
      now,
    );
    expect(r).toEqual([]);
  });

  it("orders across documents and caps the total with unique ids", () => {
    const docs = Array.from({ length: 40 }, (_, i) =>
      doc({ id: `d${i}`, expiryDate: expires(2027, 1, 1 + (i % 28)) }),
    );
    const r = planReminders(docs, now);
    expect(r).toHaveLength(MAX_REMINDERS);
    expect(new Set(r.map((x) => x.id)).size).toBe(MAX_REMINDERS);
    for (let i = 1; i < r.length; i++) expect(r[i]!.at >= r[i - 1]!.at).toBe(true);
  });
});
