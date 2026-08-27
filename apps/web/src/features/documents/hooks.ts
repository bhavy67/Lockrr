"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  Category,
  DocumentFilters,
  DocumentRecord,
} from "@lockkaro/types";
import { data } from "@/lib/data";
import { qk } from "@/lib/query-keys";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: qk.categories,
    queryFn: () => data.listCategories(),
    staleTime: Infinity,
  });
}

export function useDocuments(filters?: DocumentFilters) {
  return useQuery<DocumentRecord[]>({
    queryKey: qk.documents(filters),
    queryFn: () => data.listDocuments(filters),
  });
}

export function useDocument(id: string | undefined | null) {
  return useQuery<DocumentRecord | null>({
    queryKey: qk.document(id ?? ""),
    queryFn: () => (id ? data.getDocument(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useDocumentUrl(id: string | undefined | null) {
  return useQuery<string | null>({
    queryKey: qk.documentUrl(id ?? ""),
    queryFn: async () => (id ? data.getDocumentUrl(id) : null),
    enabled: !!id,
    // blob URLs live only for the current session — no need to cache long
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; patch: Partial<DocumentRecord> }) =>
      data.updateDocument(input.id, input.patch),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.setQueryData(qk.document(doc.id), doc);
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.deleteDocument(id),
    onSuccess: (_v, id) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.removeQueries({ queryKey: qk.document(id) });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useActivity(limit = 10) {
  return useQuery({
    queryKey: qk.activity(limit),
    queryFn: () => data.listActivity(limit),
  });
}
