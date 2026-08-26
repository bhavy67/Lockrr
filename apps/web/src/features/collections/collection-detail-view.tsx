"use client";

import { ArrowLeft, FileWarning, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { VaultView } from "@/features/documents/vault-view";
import { CollectionFormDialog } from "./collection-form-dialog";
import { useCollection, useDeleteCollection } from "./hooks";

interface Props {
  collectionId: string;
}

export function CollectionDetailView({ collectionId }: Props) {
  const router = useRouter();
  const { data: collection, isLoading } = useCollection(collectionId);
  const remove = useDeleteCollection();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!collection) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Collection not found."
        description="It may have been deleted or the link is incorrect."
        action={
          <Button asChild variant="outline">
            <Link href="/collections">Back to collections</Link>
          </Button>
        }
      />
    );
  }

  const handleDelete = () => {
    remove.mutate(collection.id, {
      onSuccess: () => {
        toast.success("Collection deleted.");
        router.replace("/collections");
      },
    });
  };

  return (
    <>
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="mt-1 h-3 w-3 shrink-0 rounded-sm"
            style={{ background: collection.color }}
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {collection.description}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
              Manage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 />
              Delete collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <VaultView
        initialFilters={{ collectionId }}
        emptyTitle="No documents in this collection yet."
        emptyDescription="Add documents from your vault to gather them here."
      />

      <CollectionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this collection?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                {collection.name}
              </span>{" "}
              will be removed. The documents inside stay in your vault.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
