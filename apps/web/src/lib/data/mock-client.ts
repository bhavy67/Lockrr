"use client";

import type {
  ActivityEvent,
  ActivityKind,
  Category,
  Collection,
  DocumentFilters,
  DocumentRecord,
  DocumentSort,
  DocumentText,
  Reminder,
  Tag,
} from "@lockkaro/types";

import { sanitizeFileName, sleep, stripExtension } from "@/lib/utils";
import type { DataClient, SaveDocumentTextInput, UploadInput } from "./client";
import { deleteFile, getFile, putFile } from "./mock-storage";

// localStorage key prefix preserved intentionally — changing it would silently
// erase existing data for anyone who has used the app before.
const KEYS = {
  deviceId: "lk.deviceId",
  categories: (uid: string) => `lockerr.categories.${uid}`,
  tags: (uid: string) => `lockerr.tags.${uid}`,
  collections: (uid: string) => `lockerr.collections.${uid}`,
  documents: (uid: string) => `lockerr.documents.${uid}`,
  activity: (uid: string) => `lockerr.activity.${uid}`,
  documentTexts: (uid: string) => `lockerr.document_texts.${uid}`,
} as const;

// -------- storage helpers (SSR-safe: no-op on server) --------
function ls(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}
function read<T>(key: string, fallback: T): T {
  const s = ls();
  if (!s) return fallback;
  const raw = s.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): void {
  ls()?.setItem(key, JSON.stringify(value));
}

// -------- utilities --------
function uuid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_CATEGORIES: Array<
  Pick<Category, "name" | "slug" | "icon" | "color" | "sortOrder">
> = [
  { name: "Identity", slug: "identity", icon: "id-card", color: "#6366F1", sortOrder: 1 },
  { name: "Property", slug: "property", icon: "key-round", color: "#B45309", sortOrder: 2 },
  { name: "Vehicle", slug: "vehicle", icon: "car", color: "#0D9488", sortOrder: 3 },
  { name: "Finance", slug: "finance", icon: "wallet", color: "#059669", sortOrder: 4 },
  { name: "Insurance", slug: "insurance", icon: "shield", color: "#0EA5E9", sortOrder: 5 },
  { name: "Healthcare", slug: "healthcare", icon: "heart-pulse", color: "#DC2626", sortOrder: 6 },
  { name: "Education", slug: "education", icon: "graduation-cap", color: "#7C3AED", sortOrder: 7 },
  { name: "Work", slug: "work", icon: "briefcase", color: "#0F766E", sortOrder: 8 },
  { name: "Travel", slug: "travel", icon: "plane", color: "#F59E0B", sortOrder: 9 },
  { name: "Home", slug: "home", icon: "house", color: "#EA580C", sortOrder: 10 },
  { name: "Electronics", slug: "electronics", icon: "cpu", color: "#3B82F6", sortOrder: 11 },
  { name: "Receipts", slug: "receipts", icon: "receipt", color: "#64748B", sortOrder: 12 },
  { name: "Other", slug: "other", icon: "file", color: "#71717A", sortOrder: 99 },
];

function seedCategoriesFor(userId: string): Category[] {
  return DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    id: uuid(),
    userId,
    isDefault: true,
  }));
}

/**
 * Returns the stable device ID, auto-generating one on first call.
 * Also seeds default data the very first time a device accesses the vault.
 */
function getDeviceId(): string {
  const s = ls();
  if (!s) return "server";

  let id = s.getItem(KEYS.deviceId);
  if (!id) {
    id = uuid();
    s.setItem(KEYS.deviceId, id);
    // First-ever visit: seed default categories and empty collections.
    write(KEYS.categories(id), seedCategoriesFor(id));
    write(KEYS.tags(id), []);
    write(KEYS.collections(id), []);
    write(KEYS.documents(id), []);
    write(KEYS.activity(id), []);
  } else if (!s.getItem(KEYS.categories(id))) {
    // Device ID exists but data was cleared — re-seed.
    write(KEYS.categories(id), seedCategoriesFor(id));
    write(KEYS.tags(id), []);
    write(KEYS.collections(id), []);
    write(KEYS.documents(id), []);
    write(KEYS.activity(id), []);
  }

  return id;
}

// -------- activity helper --------
function logActivity(
  userId: string,
  kind: ActivityKind,
  documentId: string | null,
  payload: Record<string, unknown> = {},
): void {
  const list = read<ActivityEvent[]>(KEYS.activity(userId), []);
  list.unshift({
    id: uuid(),
    userId,
    documentId,
    kind,
    payload,
    createdAt: new Date().toISOString(),
  });
  write(KEYS.activity(userId), list.slice(0, 200));
}

// -------- filter helpers --------
function matchesFilters(
  doc: DocumentRecord,
  filters: DocumentFilters | undefined,
): boolean {
  if (!filters) return !doc.isArchived;
  if (filters.archived === undefined && doc.isArchived) return false;
  if (filters.archived === true && !doc.isArchived) return false;
  if (filters.archived === false && doc.isArchived) return false;

  if (filters.query) {
    const q = filters.query.toLowerCase();
    const hay = [doc.title, doc.description ?? "", doc.fileName]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (filters.categoryId && doc.categoryId !== filters.categoryId) return false;
  if (filters.favoritesOnly && !doc.isFavorite) return false;
  if (filters.tagIds && filters.tagIds.length > 0) {
    const has = filters.tagIds.every((t) => doc.tagIds.includes(t));
    if (!has) return false;
  }
  if (filters.collectionId) {
    if (!doc.collectionIds.includes(filters.collectionId)) return false;
  }
  if (filters.fileKinds && filters.fileKinds.length > 0) {
    const isImage = doc.mimeType.startsWith("image/");
    const isPdf = doc.mimeType === "application/pdf";
    const matches = filters.fileKinds.some(
      (k) => (k === "image" && isImage) || (k === "pdf" && isPdf),
    );
    if (!matches) return false;
  }
  if (filters.expiringWithinDays !== undefined) {
    if (!doc.expiryDate) return false;
    const days =
      (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days > filters.expiringWithinDays) return false;
  }
  return true;
}

function compareDocs(sort: DocumentSort | undefined) {
  return (a: DocumentRecord, b: DocumentRecord): number => {
    switch (sort) {
      case "name":
        return a.title.localeCompare(b.title);
      case "modified":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "document_date": {
        const av = a.documentDate ? new Date(a.documentDate).getTime() : 0;
        const bv = b.documentDate ? new Date(b.documentDate).getTime() : 0;
        return bv - av;
      }
      case "expiry_date": {
        const av = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const bv = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return av - bv;
      }
      case "recent":
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  };
}

// ========================================================================
// Mock DataClient — fully client-side, no auth required
// ========================================================================
class MockDataClient implements DataClient {
  // ---- Categories ----
  async listCategories(): Promise<Category[]> {
    const uid = getDeviceId();
    return read<Category[]>(KEYS.categories(uid), []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  async createCategory(
    input: Omit<Category, "id" | "userId">,
  ): Promise<Category> {
    const uid = getDeviceId();
    const cats = read<Category[]>(KEYS.categories(uid), []);
    const created: Category = { ...input, id: uuid(), userId: uid };
    cats.push(created);
    write(KEYS.categories(uid), cats);
    return created;
  }

  // ---- Tags ----
  async listTags(): Promise<Tag[]> {
    const uid = getDeviceId();
    return read<Tag[]>(KEYS.tags(uid), []);
  }

  async createTag(input: Omit<Tag, "id" | "userId">): Promise<Tag> {
    const uid = getDeviceId();
    const tags = read<Tag[]>(KEYS.tags(uid), []);
    const existing = tags.find(
      (t) => t.name.toLowerCase() === input.name.toLowerCase(),
    );
    if (existing) return existing;
    const created: Tag = { ...input, id: uuid(), userId: uid };
    tags.push(created);
    write(KEYS.tags(uid), tags);
    logActivity(uid, "tag.created", null, { name: created.name });
    return created;
  }

  async deleteTag(id: string): Promise<void> {
    const uid = getDeviceId();
    const tags = read<Tag[]>(KEYS.tags(uid), []);
    write(
      KEYS.tags(uid),
      tags.filter((t) => t.id !== id),
    );
    const docs = read<DocumentRecord[]>(KEYS.documents(uid), []);
    let touched = false;
    for (const d of docs) {
      if (d.tagIds.includes(id)) {
        d.tagIds = d.tagIds.filter((t) => t !== id);
        touched = true;
      }
    }
    if (touched) write(KEYS.documents(uid), docs);
  }

  // ---- Collections ----
  async listCollections(): Promise<Collection[]> {
    const uid = getDeviceId();
    return read<Collection[]>(KEYS.collections(uid), []).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async getCollection(id: string): Promise<Collection | null> {
    const uid = getDeviceId();
    const list = read<Collection[]>(KEYS.collections(uid), []);
    return list.find((c) => c.id === id) ?? null;
  }

  async createCollection(
    input: Omit<Collection, "id" | "userId" | "createdAt">,
  ): Promise<Collection> {
    const uid = getDeviceId();
    const list = read<Collection[]>(KEYS.collections(uid), []);
    const created: Collection = {
      ...input,
      id: uuid(),
      userId: uid,
      createdAt: new Date().toISOString(),
    };
    list.push(created);
    write(KEYS.collections(uid), list);
    logActivity(uid, "collection.created", null, { name: created.name });
    return created;
  }

  async updateCollection(
    id: string,
    patch: Partial<Omit<Collection, "id" | "userId" | "createdAt">>,
  ): Promise<Collection> {
    const uid = getDeviceId();
    const list = read<Collection[]>(KEYS.collections(uid), []);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Collection not found");
    const next: Collection = { ...list[idx]!, ...patch };
    list[idx] = next;
    write(KEYS.collections(uid), list);
    return next;
  }

  async deleteCollection(id: string): Promise<void> {
    const uid = getDeviceId();
    const list = read<Collection[]>(KEYS.collections(uid), []);
    write(
      KEYS.collections(uid),
      list.filter((c) => c.id !== id),
    );
    const docs = read<DocumentRecord[]>(KEYS.documents(uid), []);
    let touched = false;
    for (const d of docs) {
      if (d.collectionIds.includes(id)) {
        d.collectionIds = d.collectionIds.filter((c) => c !== id);
        touched = true;
      }
    }
    if (touched) write(KEYS.documents(uid), docs);
  }

  // ---- Documents ----
  async listDocuments(filters?: DocumentFilters): Promise<DocumentRecord[]> {
    const uid = getDeviceId();
    const docs = read<DocumentRecord[]>(KEYS.documents(uid), []);
    return docs
      .filter((d) => matchesFilters(d, filters))
      .sort(compareDocs(filters?.sort));
  }

  async getDocument(id: string): Promise<DocumentRecord | null> {
    const uid = getDeviceId();
    const docs = read<DocumentRecord[]>(KEYS.documents(uid), []);
    return docs.find((d) => d.id === id) ?? null;
  }

  async uploadDocument(input: UploadInput): Promise<DocumentRecord> {
    const uid = getDeviceId();

    const total = input.file.size;
    if (input.onProgress) {
      for (let i = 1; i <= 10; i++) {
        await sleep(60 + Math.random() * 40);
        input.onProgress(Math.round((i / 10) * 90));
      }
    }
    const storagePath = `${uid}/${uuid()}-${sanitizeFileName(input.file.name)}`;
    await putFile(storagePath, input.file);

    const now = new Date().toISOString();
    const record: DocumentRecord = {
      id: uuid(),
      userId: uid,
      categoryId: input.categoryId ?? null,
      title: input.title ?? stripExtension(input.file.name),
      description: input.description ?? null,
      fileName: input.file.name,
      storagePath,
      mimeType: input.file.type || "application/octet-stream",
      sizeBytes: total,
      documentDate: input.documentDate ?? null,
      expiryDate: input.expiryDate ?? null,
      reminderDate: null,
      isFavorite: false,
      isArchived: false,
      tagIds: input.tagIds ?? [],
      collectionIds: [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    const docs = read<DocumentRecord[]>(KEYS.documents(uid), []);
    docs.push(record);
    write(KEYS.documents(uid), docs);

    if (input.onProgress) input.onProgress(100);
    logActivity(uid, "document.uploaded", record.id, { title: record.title });
    return record;
  }

  async updateDocument(
    id: string,
    patch: Partial<DocumentRecord>,
  ): Promise<DocumentRecord> {
    const uid = getDeviceId();
    const docs = read<DocumentRecord[]>(KEYS.documents(uid), []);
    const idx = docs.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Document not found");
    const prev = docs[idx]!;
    const next: DocumentRecord = {
      ...prev,
      ...patch,
      id: prev.id,
      userId: prev.userId,
      storagePath: prev.storagePath,
      updatedAt: new Date().toISOString(),
    };
    docs[idx] = next;
    write(KEYS.documents(uid), docs);

    if (patch.isFavorite !== undefined && patch.isFavorite !== prev.isFavorite) {
      logActivity(
        uid,
        patch.isFavorite ? "document.favorited" : "document.unfavorited",
        id,
        { title: next.title },
      );
    } else if (
      patch.isArchived !== undefined &&
      patch.isArchived !== prev.isArchived
    ) {
      logActivity(
        uid,
        patch.isArchived ? "document.archived" : "document.restored",
        id,
        { title: next.title },
      );
    } else {
      logActivity(uid, "document.updated", id, { title: next.title });
    }
    return next;
  }

  async deleteDocument(id: string): Promise<void> {
    const uid = getDeviceId();
    const docs = read<DocumentRecord[]>(KEYS.documents(uid), []);
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    await deleteFile(doc.storagePath);
    write(
      KEYS.documents(uid),
      docs.filter((d) => d.id !== id),
    );
    const texts = read<Record<string, DocumentText>>(
      KEYS.documentTexts(uid),
      {},
    );
    if (texts[id]) {
      delete texts[id];
      write(KEYS.documentTexts(uid), texts);
    }
    logActivity(uid, "document.deleted", id, { title: doc.title });
  }

  async getDocumentUrl(id: string): Promise<string> {
    const doc = await this.getDocument(id);
    if (!doc) throw new Error("Document not found");
    const blob = await getFile(doc.storagePath);
    if (!blob) throw new Error("File missing from local storage");
    return URL.createObjectURL(blob);
  }

  /**
   * A blob URL is same-origin, so the `download` attribute already names the
   * file. Nothing extra to do here — the distinction only matters for a real
   * backend serving from another origin.
   */
  async getDocumentDownloadUrl(id: string): Promise<string> {
    return this.getDocumentUrl(id);
  }

  async listActivity(limit = 50): Promise<ActivityEvent[]> {
    const uid = getDeviceId();
    return read<ActivityEvent[]>(KEYS.activity(uid), []).slice(0, limit);
  }

  async listReminders(): Promise<Reminder[]> {
    return [];
  }

  // ---- Extraction (Phase 7.1) ----

  async getDocumentText(documentId: string): Promise<DocumentText | null> {
    const uid = getDeviceId();
    const map = read<Record<string, DocumentText>>(
      KEYS.documentTexts(uid),
      {},
    );
    return map[documentId] ?? null;
  }

  async saveDocumentText(
    input: SaveDocumentTextInput,
  ): Promise<DocumentText> {
    const uid = getDeviceId();
    const map = read<Record<string, DocumentText>>(
      KEYS.documentTexts(uid),
      {},
    );
    const now = new Date().toISOString();
    const isFinal =
      input.status === "done" ||
      input.status === "empty" ||
      input.status === "failed";
    const record: DocumentText = {
      documentId: input.documentId,
      status: input.status,
      content: input.content,
      characterCount: input.content?.length ?? 0,
      extractionMethod: input.extractionMethod,
      extractedAt: isFinal ? now : (map[input.documentId]?.extractedAt ?? null),
    };
    map[input.documentId] = record;
    write(KEYS.documentTexts(uid), map);
    return record;
  }
}

export const mockClient: DataClient = new MockDataClient();
