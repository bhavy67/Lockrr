import { differenceInCalendarDays } from "date-fns";
import type { DocumentRecord } from "@lockkaro/types";

export type ExpiryStatus = "none" | "expired" | "soon" | "later" | "active";

export const SOON_THRESHOLD_DAYS = 30;
export const LATER_THRESHOLD_DAYS = 90;

export function expiryStatus(doc: Pick<DocumentRecord, "expiryDate">): ExpiryStatus {
  if (!doc.expiryDate) return "none";
  const days = differenceInCalendarDays(new Date(doc.expiryDate), new Date());
  if (days < 0) return "expired";
  if (days <= SOON_THRESHOLD_DAYS) return "soon";
  if (days <= LATER_THRESHOLD_DAYS) return "later";
  return "active";
}

export function daysUntilExpiry(
  doc: Pick<DocumentRecord, "expiryDate">,
): number | null {
  if (!doc.expiryDate) return null;
  return differenceInCalendarDays(new Date(doc.expiryDate), new Date());
}

export function attentionCount(docs: DocumentRecord[]): number {
  let n = 0;
  for (const d of docs) {
    if (d.isArchived) continue;
    const s = expiryStatus(d);
    if (s === "expired" || s === "soon") n++;
  }
  return n;
}
