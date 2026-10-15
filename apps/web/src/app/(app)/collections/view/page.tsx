import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionDetailRoute } from "@/features/collections/collection-detail-view";

export const metadata: Metadata = { title: "Collection" };

export default function CollectionPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Suspense>
        <CollectionDetailRoute />
      </Suspense>
    </div>
  );
}
