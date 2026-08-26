"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DocumentRecord } from "@lockerr/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TagPicker } from "@/features/tags/tag-picker";
import { useCategories, useUpdateDocument } from "./hooks";

interface Props {
  document: DocumentRecord;
  onSaved?: () => void;
}

export function DocumentDetailsForm({ document: doc, onSaved }: Props) {
  const { data: categories = [] } = useCategories();
  const update = useUpdateDocument();

  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(doc.categoryId);
  const [tagIds, setTagIds] = useState<string[]>(doc.tagIds);
  const [documentDate, setDocumentDate] = useState(
    doc.documentDate ? doc.documentDate.slice(0, 10) : "",
  );
  const [expiryDate, setExpiryDate] = useState(
    doc.expiryDate ? doc.expiryDate.slice(0, 10) : "",
  );

  useEffect(() => {
    setTitle(doc.title);
    setDescription(doc.description ?? "");
    setCategoryId(doc.categoryId);
    setTagIds(doc.tagIds);
    setDocumentDate(doc.documentDate ? doc.documentDate.slice(0, 10) : "");
    setExpiryDate(doc.expiryDate ? doc.expiryDate.slice(0, 10) : "");
  }, [
    doc.id,
    doc.title,
    doc.description,
    doc.categoryId,
    doc.tagIds,
    doc.documentDate,
    doc.expiryDate,
  ]);

  const dirty =
    title !== doc.title ||
    (description ?? "") !== (doc.description ?? "") ||
    categoryId !== doc.categoryId ||
    tagIds.join(",") !== doc.tagIds.join(",") ||
    (documentDate ? new Date(documentDate).toISOString() : null) !==
      doc.documentDate ||
    (expiryDate ? new Date(expiryDate).toISOString() : null) !== doc.expiryDate;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Give this document a title.");
      return;
    }
    await update.mutateAsync({
      id: doc.id,
      patch: {
        title: title.trim(),
        description: description.trim() || null,
        categoryId,
        tagIds,
        documentDate: documentDate ? new Date(documentDate).toISOString() : null,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      },
    });
    toast.success("Saved.");
    onSaved?.();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Notes for future you…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Select
          value={categoryId ?? "none"}
          onValueChange={(v) => setCategoryId(v === "none" ? null : v)}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Uncategorized</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagPicker value={tagIds} onChange={setTagIds} triggerLabel="Add tag" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="documentDate">Document date</Label>
          <Input
            id="documentDate"
            type="date"
            max={format(new Date(), "yyyy-MM-dd")}
            value={documentDate}
            onChange={(e) => setDocumentDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiryDate">Expires on</Label>
          <Input
            id="expiryDate"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={!dirty || update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
