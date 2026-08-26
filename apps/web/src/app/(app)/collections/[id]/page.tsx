import type { Metadata } from "next";
import { CollectionDetailView } from "@/features/collections/collection-detail-view";

export const metadata: Metadata = { title: "Collection" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CollectionPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <CollectionDetailView collectionId={id} />
    </div>
  );
}
