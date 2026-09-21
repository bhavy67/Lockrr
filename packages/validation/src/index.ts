import { z } from "zod";

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per file

export const documentUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    documentDate: z.string().datetime().nullable().optional(),
    expiryDate: z.string().datetime().nullable().optional(),
    reminderDate: z.string().datetime().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    collectionIds: z.array(z.string().uuid()).optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .strict();

export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;

export const fileMetaSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  type: z.string().min(1),
});

export function isAcceptedMimeType(t: string): boolean {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(t);
}
