import type { Metadata } from "next";
import { Suspense } from "react";
import { DocumentDetailRoute } from "@/features/documents/document-detail-view";

export const metadata: Metadata = { title: "Document" };

export default function DocumentPage() {
  return (
    <Suspense>
      <DocumentDetailRoute />
    </Suspense>
  );
}
