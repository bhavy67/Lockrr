"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Collection } from "@lockerr/types";
import { data } from "@/lib/data";
import { qk } from "@/lib/query-keys";

export function useCollections() {
  return useQuery<Collection[]>({
    queryKey: qk.collections,
    queryFn: () => data.listCollections(),
  });
}

export function useCollection(id: string | undefined | null) {
  return useQuery<Collection | null>({
    queryKey: ["collection", id ?? ""] as const,
    queryFn: () => (id ? data.getCollection(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Collection, "id" | "userId" | "createdAt">) =>
      data.createCollection(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.collections });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useUpdateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      patch: Partial<Omit<Collection, "id" | "userId" | "createdAt">>;
    }) => data.updateCollection(input.id, input.patch),
    onSuccess: (col) => {
      qc.invalidateQueries({ queryKey: qk.collections });
      qc.setQueryData(["collection", col.id], col);
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.deleteCollection(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.collections });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
