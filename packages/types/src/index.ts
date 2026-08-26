export type UUID = string;
export type ISODate = string;

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  createdAt: ISODate;
}

export type CategorySlug =
  | "identity"
  | "education"
  | "work"
  | "finance"
  | "insurance"
  | "healthcare"
  | "travel"
  | "home"
  | "electronics"
  | "receipts"
  | "other";

export interface Category {
  id: UUID;
  userId: UUID;
  name: string;
  slug: string;
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface Tag {
  id: UUID;
  userId: UUID;
  name: string;
  color: string;
}

export interface Collection {
  id: UUID;
  userId: UUID;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  createdAt: ISODate;
}

export type DocumentMimeType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | (string & {});

export interface DocumentRecord {
  id: UUID;
  userId: UUID;
  categoryId: UUID | null;
  title: string;
  description: string | null;
  fileName: string;
  storagePath: string;
  mimeType: DocumentMimeType;
  sizeBytes: number;
  documentDate: ISODate | null;
  expiryDate: ISODate | null;
  reminderDate: ISODate | null;
  isFavorite: boolean;
  isArchived: boolean;
  tagIds: UUID[];
  collectionIds: UUID[];
  metadata: Record<string, unknown>;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Reminder {
  id: UUID;
  userId: UUID;
  documentId: UUID;
  remindAt: ISODate;
  message: string | null;
  status: "pending" | "sent" | "dismissed";
}

export type ActivityKind =
  | "document.uploaded"
  | "document.updated"
  | "document.deleted"
  | "document.favorited"
  | "document.unfavorited"
  | "document.archived"
  | "document.restored"
  | "document.downloaded"
  | "collection.created"
  | "tag.created";

export interface ActivityEvent {
  id: UUID;
  userId: UUID;
  documentId: UUID | null;
  kind: ActivityKind;
  payload: Record<string, unknown>;
  createdAt: ISODate;
}

export type DocumentSort =
  | "recent"
  | "modified"
  | "name"
  | "document_date"
  | "expiry_date";

export type DocumentView = "grid" | "list";

export type DocumentFileKind = "pdf" | "image";

export interface DocumentFilters {
  query?: string;
  categoryId?: UUID | null;
  tagIds?: UUID[];
  collectionId?: UUID | null;
  fileKinds?: DocumentFileKind[];
  favoritesOnly?: boolean;
  archived?: boolean;
  expiringWithinDays?: number;
  sort?: DocumentSort;
}

// ---- Extraction (Phase 7.1) ----

export type ExtractionStatus =
  | "not_extracted"
  | "processing"
  | "done"
  | "empty"
  | "failed";

export type ExtractionMethod = "pdf-embedded" | "ocr-image" | "ocr-pdf";

/**
 * The textual content of a document, extracted client-side by PDF.js or
 * Tesseract. One row per document. `content` is null unless status is "done".
 */
export interface DocumentText {
  documentId: UUID;
  status: ExtractionStatus;
  content: string | null;
  characterCount: number;
  extractionMethod: ExtractionMethod | null;
  extractedAt: ISODate | null;
}
