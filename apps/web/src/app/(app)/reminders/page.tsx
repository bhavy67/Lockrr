import type { Metadata } from "next";
import { PageHeader } from "@/features/shell/page-header";
import { RemindersView } from "@/features/reminders/reminders-view";

export const metadata: Metadata = { title: "Expiring" };

export default function RemindersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Expiring documents"
        description="Track what's about to lapse, what already has, and what's on your horizon."
      />
      <RemindersView />
    </div>
  );
}
