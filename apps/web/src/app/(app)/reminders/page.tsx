import type { Metadata } from "next";
import { PageHeader } from "@/features/shell/page-header";
import { VaultView } from "@/features/documents/vault-view";

export const metadata: Metadata = { title: "Expiring" };

export default function RemindersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Expiring"
        description="Documents with expiry dates in the next 60 days."
      />
      <VaultView
        initialFilters={{ expiringWithinDays: 60 }}
        emptyTitle="Nothing expiring soon."
        emptyDescription="Add an expiry date to your documents to see them here."
      />
    </div>
  );
}
