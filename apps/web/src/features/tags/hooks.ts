"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tag } from "@lockerr/types";
import { data } from "@/lib/data";
import { qk } from "@/lib/query-keys";

export function useTags() {
  return useQuery<Tag[]>({
    queryKey: qk.tags,
    queryFn: () => data.listTags(),
    staleTime: Infinity,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Tag, "id" | "userId">) => data.createTag(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tags });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.deleteTag(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tags });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
