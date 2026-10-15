import { format } from "date-fns";
import type { DocumentRecord } from "@lockkaro/types";

export interface PlannedReminder {
  id: number;
  at: Date;
  title: string;
  body: string;
  documentId: string;
}

/** Days before expiry to notify, and what to say. */
const OFFSETS: Array<[days: number, lead: string]> = [
  [30, "Expires in 30 days"],
  [7, "Expires in a week"],
  [0, "Expires today"],
];

/** Android caps pending alarms per app at 500; keep well under it. */
export const MAX_REMINDERS = 60;

/**
 * Every future expiry reminder for these documents, soonest first, at 9 am
 * local time. Pure — scheduling with the OS lives in `notifications.ts`.
 */
export function planReminders(docs: DocumentRecord[], now = new Date()): PlannedReminder[] {
  const out: Omit<PlannedReminder, "id">[] = [];
  for (const doc of docs) {
    if (doc.isArchived || !doc.expiryDate) continue;
    const expiry = new Date(doc.expiryDate);
    for (const [days, lead] of OFFSETS) {
      const at = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate() - days, 9);
      if (at <= now) continue;
      out.push({
        at,
        title: doc.title,
        body: `${lead} — ${format(expiry, "d MMM yyyy")}.`,
        documentId: doc.id,
      });
    }
  }
  return out
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_REMINDERS)
    .map((r, i) => ({ ...r, id: i + 1 }));
}
