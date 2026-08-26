import type { Metadata } from "next";
import { CategoriesView } from "@/features/categories/categories-view";
import { PageHeader } from "@/features/shell/page-header";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Categories"
        description="Browse your vault by category."
      />
      <CategoriesView />
    </div>
  );
}
