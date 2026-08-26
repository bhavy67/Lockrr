import type {
  ActivityEvent,
  ActivityKind,
  Category,
  Collection,
  DocumentFileKind,
  DocumentRecord,
  DocumentSort,
  Reminder,
  Tag,
  User,
} from "@lockerr/types";

import type {
  ActivityRow,
  CategoryRow,
  CollectionRow,
  DocumentRow,
  DocumentRowWithJoins,
  ProfileRow,
  ReminderRow,
  TagRow,
} from "./database.types";

/**
 * Row → domain mappers, and the small pieces of query building that are worth
 * testing on their own. Everything here is pure: no client, no network.
 */

export function toUser(row: ProfileRow): User {
  return {
    id: row.user_id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    color: row.color,
    isDefault: row.is_default,
    sortOrder: row.sort_order,
  };
}

export function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
  };
}

export function toCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
  };
}

export function toDocument(row: DocumentRowWithJoins): DocumentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    fileName: row.file_name,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    documentDate: row.document_date,
    expiryDate: row.expiry_date,
    reminderDate: row.reminder_date,
    isFavorite: row.is_favorite,
    isArchived: row.is_archived,
    tagIds: (row.document_tags ?? []).map((t) => t.tag_id),
    collectionIds: (row.collection_documents ?? []).map((c) => c.collection_id),
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    remindAt: row.remind_at,
    message: row.message,
    status: row.status,
  };
}

export function toActivity(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    kind: row.kind as ActivityKind,
    payload: row.payload ?? {},
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Domain → column patch
// ---------------------------------------------------------------------------

/**
 * Columns a document patch is allowed to touch. `id`, `userId`, `storagePath`
 * and the timestamps are deliberately not here: a patch can rename a document
 * but never re-point it at someone else's file.
 */
export function toDocumentPatch(
  patch: Partial<DocumentRecord>,
): Partial<DocumentRow> {
  const out: Partial<DocumentRow> = {};
  if (patch.title !== undefined) out.title = patch.title;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.categoryId !== undefined) out.category_id = patch.categoryId;
  if (patch.documentDate !== undefined) out.document_date = patch.documentDate;
  if (patch.expiryDate !== undefined) out.expiry_date = patch.expiryDate;
  if (patch.reminderDate !== undefined) out.reminder_date = patch.reminderDate;
  if (patch.isFavorite !== undefined) out.is_favorite = patch.isFavorite;
  if (patch.isArchived !== undefined) out.is_archived = patch.isArchived;
  if (patch.metadata !== undefined) out.metadata = patch.metadata;
  return out;
}

/**
 * Which activity entry an update earns. Mirrors the mock client so the feed
 * reads the same in both data modes: a favorite or archive toggle is reported
 * as itself, anything else is a plain edit.
 */
export function activityKindForPatch(
  patch: Partial<DocumentRecord>,
  previous: Pick<DocumentRecord, "isFavorite" | "isArchived">,
): ActivityKind {
  if (patch.isFavorite !== undefined && patch.isFavorite !== previous.isFavorite) {
    return patch.isFavorite ? "document.favorited" : "document.unfavorited";
  }
  if (patch.isArchived !== undefined && patch.isArchived !== previous.isArchived) {
    return patch.isArchived ? "document.archived" : "document.restored";
  }
  return "document.updated";
}

// ---------------------------------------------------------------------------
// Query building
// ---------------------------------------------------------------------------

/**
 * PostgREST's `or=` grammar is comma-separated and paren-delimited, so a search
 * for "insurance, home" would otherwise be read as filter syntax. Double
 * quoting the value makes it opaque; only `"` and `\` need escaping inside.
 *
 * `%` and `_` are left alone. They are LIKE wildcards, and PostgREST gives us
 * no ESCAPE clause to neutralize them — a query containing one matches more
 * broadly than a literal substring search would. That is a rare input and a
 * harmless outcome.
 */
export function documentSearchFilter(query: string): string {
  const term = query.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const pattern = `"%${term}%"`;
  return [
    `title.ilike.${pattern}`,
    `description.ilike.${pattern}`,
    `file_name.ilike.${pattern}`,
  ].join(",");
}

/**
 * `image` covers every image/* type; `pdf` is exactly one. PostgREST's `like`
 * uses `*` where SQL uses `%`.
 */
export function fileKindFilter(kinds: DocumentFileKind[]): string | null {
  const clauses = kinds.map((k) =>
    k === "pdf" ? "mime_type.eq.application/pdf" : "mime_type.like.image/*",
  );
  return clauses.length > 0 ? Array.from(new Set(clauses)).join(",") : null;
}

export interface OrderSpec {
  column: string;
  ascending: boolean;
  nullsFirst: boolean;
}

/**
 * Sort order per `DocumentSort`. Nulls always sort last: a document with no
 * expiry date is not "expiring first", and one with no document date is not
 * the most recent.
 */
export function orderFor(sort: DocumentSort | undefined): OrderSpec {
  switch (sort) {
    case "name":
      return { column: "title", ascending: true, nullsFirst: false };
    case "modified":
      return { column: "updated_at", ascending: false, nullsFirst: false };
    case "document_date":
      return { column: "document_date", ascending: false, nullsFirst: false };
    case "expiry_date":
      return { column: "expiry_date", ascending: true, nullsFirst: false };
    case "recent":
    default:
      return { column: "created_at", ascending: false, nullsFirst: false };
  }
}

/**
 * Documents carrying *every* one of the given tags. PostgREST can ask for rows
 * matching any tag, not all of them, so the intersection is counted here.
 */
export function documentIdsWithAllTags(
  rows: Array<{ document_id: string; tag_id: string }>,
  tagIds: string[],
): string[] {
  const wanted = new Set(tagIds);
  const seen = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!wanted.has(row.tag_id)) continue;
    const tags = seen.get(row.document_id) ?? new Set<string>();
    tags.add(row.tag_id);
    seen.set(row.document_id, tags);
  }
  const out: string[] = [];
  for (const [documentId, tags] of seen) {
    if (tags.size === wanted.size) out.push(documentId);
  }
  return out;
}
