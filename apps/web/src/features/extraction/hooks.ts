"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { DocumentText } from "@lockerr/types";
import { data } from "@/lib/data";
import { qk } from "@/lib/query-keys";
import { bindQueryInvalidator, useExtractionQueue } from "./queue";

export function useDocumentText(id: string | null | undefined) {
  return useQuery<DocumentText | null>({
    queryKey: qk.documentText(id ?? ""),
    queryFn: () => (id ? data.getDocumentText(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * Small effect: teach the extraction queue how to invalidate our TanStack
 * Query cache. Mount once at the app root.
 */
export function useBindExtractionInvalidator() {
  const qc = useQueryClient();
  useEffect(() => {
    return bindQueryInvalidator((documentId) => {
      void qc.invalidateQueries({ queryKey: qk.documentText(documentId) });
    });
  }, [qc]);
}

/** Convenience selector: is *this* document currently being extracted? */
export function useIsExtracting(documentId: string | undefined | null): boolean {
  return useExtractionQueue((s) =>
    documentId ? s.activeIds.has(documentId) : false,
  );
}

export function useExtractionProgress(documentId: string | undefined | null) {
  return useExtractionQueue((s) =>
    documentId ? s.progress[documentId] : undefined,
  );
}
