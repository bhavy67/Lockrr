import type { DocumentFilters } from "@lockkaro/types";

export const qk = {
  session: ["session"] as const,
  categories: ["categories"] as const,
  tags: ["tags"] as const,
  collections: ["collections"] as const,
  documents: (filters?: DocumentFilters) =>
    ["documents", filters ?? {}] as const,
  document: (id: string) => ["document", id] as const,
  documentUrl: (id: string) => ["document-url", id] as const,
  documentText: (id: string) => ["document-text", id] as const,
  activity: (limit?: number) => ["activity", limit ?? 20] as const,
};
