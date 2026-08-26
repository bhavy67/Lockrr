import type { Metadata } from "next";
import { CollectionsView } from "@/features/collections/collections-view";

export const metadata: Metadata = { title: "Collections" };

export default function CollectionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <CollectionsView />
    </div>
  );
}
