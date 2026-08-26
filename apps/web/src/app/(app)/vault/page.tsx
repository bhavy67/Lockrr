import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/features/shell/page-header";
import { UploadCta } from "@/features/upload/upload-cta";
import { VaultView } from "@/features/documents/vault-view";

export const metadata: Metadata = { title: "Vault" };

interface Props {
  searchParams: Promise<{ category?: string; favorites?: string }>;
}

export default async function VaultPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Vault"
        description="Every document you've stored in your vault."
        action={
          <UploadCta>
            <Plus className="h-4 w-4" />
            Upload
          </UploadCta>
        }
      />
      <VaultView
        initialFilters={{
          categoryId: params.category ?? undefined,
          favoritesOnly: params.favorites === "1",
        }}
      />
    </div>
  );
}
