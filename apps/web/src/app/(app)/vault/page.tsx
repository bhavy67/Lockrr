import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/features/shell/page-header";
import { UploadCta } from "@/features/upload/upload-cta";
import { VaultRoute } from "@/features/documents/vault-view";

export const metadata: Metadata = { title: "Vault" };

export default function VaultPage() {
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
      <Suspense>
        <VaultRoute />
      </Suspense>
    </div>
  );
}
