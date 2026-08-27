"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Collection } from "@lockkaro/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateCollection, useUpdateCollection } from "./hooks";

const COLLECTION_COLORS = [
  "#6366F1",
  "#059669",
  "#0EA5E9",
  "#DC2626",
  "#F59E0B",
  "#7C3AED",
  "#EA580C",
  "#0F766E",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  collection?: Collection;
  onCreated?: (c: Collection) => void;
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  collection,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLLECTION_COLORS[0]!);

  const create = useCreateCollection();
  const update = useUpdateCollection();
  const isEditing = !!collection;

  useEffect(() => {
    if (open) {
      setName(collection?.name ?? "");
      setDescription(collection?.description ?? "");
      setColor(collection?.color ?? COLLECTION_COLORS[0]!);
    }
  }, [open, collection]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give this collection a name.");
      return;
    }

    if (isEditing) {
      await update.mutateAsync({
        id: collection.id,
        patch: {
          name: name.trim(),
          description: description.trim() || null,
          color,
        },
      });
      toast.success("Collection updated.");
    } else {
      const created = await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        color,
        icon: "library",
      });
      toast.success("Collection created.");
      onCreated?.(created);
    }
    onOpenChange(false);
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Rename collection" : "New collection"}
          </DialogTitle>
          <DialogDescription>
            Group documents that belong together — a trip, a job application, a
            tax year.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              autoFocus
              placeholder="Europe Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="collection-description">Description</Label>
            <Textarea
              id="collection-description"
              rows={2}
              placeholder="Optional. What&apos;s in this collection?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLLECTION_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Pick color ${c}`}
                  aria-pressed={color === c}
                  className={cn(
                    "focus-ring h-6 w-6 rounded-full border-2 transition-transform",
                    color === c
                      ? "scale-110 border-foreground"
                      : "border-transparent",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEditing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
