import type { Metadata } from "next";
import { PageHeader } from "@/features/shell/page-header";
import { TimelineView } from "@/features/timeline/timeline-view";

export const metadata: Metadata = { title: "Timeline" };

export default function TimelinePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Timeline"
        description="A quiet record of your vault — uploads, updates, and important dates in one place."
      />
      <TimelineView />
    </div>
  );
}
