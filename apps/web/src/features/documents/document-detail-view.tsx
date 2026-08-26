"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileWarning,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes } from "@/lib/utils";
import { DocumentActionsMenu } from "./document-actions";
import { DocumentDetailsForm } from "./document-details-form";
import { documentKind } from "./document-icon";
import { ExpiryBadge } from "./expiry-badge";
import { useCategories, useDocument, useDocumentUrl, useUpdateDocument } from "./hooks";
import { ImagePreview } from "@/features/preview/image-preview";
import { PdfPreview } from "@/features/preview/pdf-preview";

interface Props {
  documentId: string;
}

export function DocumentDetailView({ documentId }: Props) {
  const router = useRouter();
  const { data: doc, isLoading } = useDocument(documentId);
  const { data: url } = useDocumentUrl(documentId);
  const { data: categories = [] } = useCategories();
  const update = useUpdateDocument();

  const category = useMemo(
    () => (doc?.categoryId ? categories.find((c) => c.id === doc.categoryId) : undefined),
    [categories, doc?.categoryId],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-[70vh] w-full" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={FileWarning}
          title="Document not found."
          description="It may have been deleted, or the link is incorrect."
          action={
            <Button asChild variant="outline">
              <Link href="/vault">Back to vault</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const kind = documentKind(doc.mimeType);

  const toggleFavorite = () =>
    update.mutate({ id: doc.id, patch: { isFavorite: !doc.isFavorite } });

  const download = async () => {
    if (!url) return;
    const a = window.document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    window.document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Download started.");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              doc.isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            onClick={toggleFavorite}
          >
            <Star
              className={doc.isFavorite ? "fill-warning text-warning" : ""}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Download"
            onClick={download}
          >
            <Download />
          </Button>
          {url && (
            <Button variant="ghost" size="icon-sm" asChild aria-label="Open in new tab">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink />
              </a>
            </Button>
          )}
          <DocumentActionsMenu document={doc} align="end" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Preview */}
        <div className="h-[65vh] min-h-[420px] overflow-hidden rounded-lg border border-border bg-card lg:h-[75vh]">
          {!url ? (
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : kind === "image" ? (
            <ImagePreview url={url} alt={doc.title} />
          ) : kind === "pdf" ? (
            <PdfPreview url={url} fileName={doc.fileName} />
          ) : (
            <EmptyState
              icon={FileWarning}
              title="Preview isn't available."
              description="You can still download this file to view it."
              action={<Button onClick={download}>Download</Button>}
            />
          )}
        </div>

        {/* Metadata */}
        <aside className="min-w-0 space-y-4">
          <div>
            <h1 className="break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {doc.title}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {doc.fileName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {category && (
              <Badge variant="outline">
                <span
                  className="mr-1.5 h-2 w-2 rounded-full"
                  style={{ background: category.color }}
                  aria-hidden
                />
                {category.name}
              </Badge>
            )}
            {doc.expiryDate && <ExpiryBadge document={doc} />}
            <Badge variant="secondary">{formatBytes(doc.sizeBytes)}</Badge>
          </div>

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <DocumentDetailsForm document={doc} />
            </TabsContent>
            <TabsContent value="info">
              <dl className="grid grid-cols-1 gap-3 text-sm">
                <Row label="File type" value={doc.mimeType} />
                <Row label="Size" value={formatBytes(doc.sizeBytes)} />
                <Row
                  label="Added"
                  value={`${format(new Date(doc.createdAt), "PPP")} (${formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })})`}
                />
                <Row
                  label="Last modified"
                  value={formatDistanceToNow(new Date(doc.updatedAt), {
                    addSuffix: true,
                  })}
                />
                {doc.documentDate && (
                  <Row
                    label="Document date"
                    value={format(new Date(doc.documentDate), "PPP")}
                  />
                )}
                {doc.expiryDate && (
                  <Row
                    label="Expires"
                    value={format(new Date(doc.expiryDate), "PPP")}
                  />
                )}
              </dl>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
