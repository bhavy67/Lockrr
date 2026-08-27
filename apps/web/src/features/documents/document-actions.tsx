"use client";

import {
  Archive,
  ArchiveRestore,
  Check,
  Download,
  Library,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { DocumentRecord } from "@lockkaro/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollections } from "@/features/collections/hooks";
import { data } from "@/lib/data";
import { useDeleteDocument, useUpdateDocument } from "./hooks";

interface Props {
  document: DocumentRecord;
  align?: "start" | "end";
}

export function DocumentActionsMenu({ document: doc, align = "end" }: Props) {
  const update = useUpdateDocument();
  const remove = useDeleteDocument();
  const { data: collections = [] } = useCollections();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleCollection = (collectionId: string) => {
    const next = doc.collectionIds.includes(collectionId)
      ? doc.collectionIds.filter((c) => c !== collectionId)
      : [...doc.collectionIds, collectionId];
    update.mutate({ id: doc.id, patch: { collectionIds: next } });
  };

  const toggleFavorite = () =>
    update.mutate({ id: doc.id, patch: { isFavorite: !doc.isFavorite } });

  const toggleArchive = () =>
    update.mutate(
      { id: doc.id, patch: { isArchived: !doc.isArchived } },
      {
        onSuccess: () =>
          toast.success(doc.isArchived ? "Restored." : "Archived."),
      },
    );

  const download = async () => {
    try {
      // Not getDocumentUrl: that one renders inline. This one arrives as an
      // attachment named after the original file, whichever data mode is on.
      const url = await data.getDocumentDownloadUrl(doc.id);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      if (url.startsWith("blob:")) {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      toast.error("Couldn't download this document.");
    }
  };

  const confirmDelete = () => {
    remove.mutate(doc.id, {
      onSuccess: () => {
        toast.success("Document deleted.");
        setConfirmOpen(false);
      },
      onError: () => {
        toast.error("Couldn't delete this document.");
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="More actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={toggleFavorite}>
            <Star
              className={doc.isFavorite ? "fill-warning text-warning" : ""}
            />
            {doc.isFavorite ? "Remove favorite" : "Add to favorites"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={download}>
            <Download />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleArchive}>
            {doc.isArchived ? (
              <>
                <ArchiveRestore />
                Restore
              </>
            ) : (
              <>
                <Archive />
                Archive
              </>
            )}
          </DropdownMenuItem>
          {collections.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Library className="h-4 w-4" />
                Add to collection
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                <DropdownMenuLabel>Collections</DropdownMenuLabel>
                {collections.map((c) => {
                  const in_ = doc.collectionIds.includes(c.id);
                  return (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() => toggleCollection(c.id)}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: c.color }}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                      {in_ && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={() => setConfirmOpen(true)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{doc.title}</span>{" "}
              will be permanently removed from your vault. This can&apos;t be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
