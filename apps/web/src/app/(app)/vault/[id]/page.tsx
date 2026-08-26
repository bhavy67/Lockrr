import type { Metadata } from "next";
import { DocumentDetailView } from "@/features/documents/document-detail-view";

export const metadata: Metadata = { title: "Document" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: Props) {
  const { id } = await params;
  return <DocumentDetailView documentId={id} />;
}
