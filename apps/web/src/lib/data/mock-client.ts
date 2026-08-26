"use client";

import type {
  ActivityEvent,
  ActivityKind,
  Category,
  Collection,
  DocumentFilters,
  DocumentRecord,
  DocumentSort,
  Reminder,
  Tag,
  User,
} from "@lockerr/types";

import { sanitizeFileName, sleep, stripExtension } from "@/lib/utils";
import type { AuthResult, DataClient, UploadInput } from "./client";
import { deleteFile, getFile, putFile } from "./mock-storage";

const KEYS = {
  session: "lockerr.session",
  users: "lockerr.users",
  categories: (uid: string) => `lockerr.categories.${uid}`,
  tags: (uid: string) => `lockerr.tags.${uid}`,
  collections: (uid: string) => `lockerr.collections.${uid}`,
  documents: (uid: string) => `lockerr.documents.${uid}`,
  activity: (uid: string) => `lockerr.activity.${uid}`,
} as const;

type StoredUser = User & { passwordHash: string };

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

// Not cryptographically secure — this is a demo mock only.
async function hash(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const DEFAULT_CATEGORIES: Array<
  Pick<Category, "name" | "slug" | "icon" | "color" | "sortOrder">
> = [
  { name: "Identity", slug: "identity", icon: "id-card", color: "#6366F1", sortOrder: 1 },
  { name: "Finance", slug: "finance", icon: "wallet", color: "#059669", sortOrder: 2 },
  { name: "Insurance", slug: "insurance", icon: "shield", color: "#0EA5E9", sortOrder: 3 },
  { name: "Healthcare", slug: "healthcare", icon: "heart-pulse", color: "#DC2626", sortOrder: 4 },
  { name: "Education", slug: "education", icon: "graduation-cap", color: "#7C3AED", sortOrder: 5 },
  { name: "Work", slug: "work", icon: "briefcase", color: "#0F766E", sortOrder: 6 },
  { name: "Travel", slug: "travel", icon: "plane", color: "#F59E0B", sortOrder: 7 },
  { name: "Home", slug: "home", icon: "house", color: "#EA580C", sortOrder: 8 },
  { name: "Electronics", slug: "electronics", icon: "cpu", color: "#3B82F6", sortOrder: 9 },
  { name: "Receipts", slug: "receipts", icon: "receipt", color: "#64748B", sortOrder: 10 },
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

// -------- Auth ----
async function getStoredUsers(): Promise<StoredUser[]> {
  return read<StoredUser[]>(KEYS.users, []);
}

async function getCurrentSessionUserId(): Promise<string | null> {
  const s = ls();
  if (!s) return null;
  return s.getItem(KEYS.session);
}

async function setSession(userId: string | null) {
  const s = ls();
  if (!s) return;
  if (userId) s.setItem(KEYS.session, userId);
  else s.removeItem(KEYS.session);
}

async function currentUserOrThrow(): Promise<User> {
  const uid = await getCurrentSessionUserId();
  if (!uid) throw new Error("Not signed in");
  const users = await getStoredUsers();
  const user = users.find((u) => u.id === uid);
  if (!user) {
    await setSession(null);
    throw new Error("Session expired");
  }
  const { passwordHash: _ph, ...safe } = user;
  return safe;
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
// Mock DataClient
// ========================================================================
class MockDataClient implements DataClient {
  async getSession(): Promise<User | null> {
    const uid = await getCurrentSessionUserId();
    if (!uid) return null;
    const users = await getStoredUsers();
    const u = users.find((x) => x.id === uid);
    if (!u) return null;
    const { passwordHash: _ph, ...safe } = u;
    return safe;
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    await sleep(300);
    const users = await getStoredUsers();
    const passwordHash = await hash(password);
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user || user.passwordHash !== passwordHash) {
      throw new Error("Incorrect email or password.");
    }
    await setSession(user.id);
    const { passwordHash: _ph, ...safe } = user;
    return { user: safe };
  }

  async signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<AuthResult> {
    await sleep(400);
    const users = await getStoredUsers();
    if (
      users.some((u) => u.email.toLowerCase() === email.toLowerCase())
    ) {
      throw new Error("An account with this email already exists.");
    }
    const passwordHash = await hash(password);
    const user: StoredUser = {
      id: uuid(),
      email,
      displayName,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      passwordHash,
    };
    users.push(user);
    write(KEYS.users, users);
    write(KEYS.categories(user.id), seedCategoriesFor(user.id));
    write(KEYS.tags(user.id), []);
    write(KEYS.collections(user.id), []);
    write(KEYS.documents(user.id), []);
    write(KEYS.activity(user.id), []);
    await setSession(user.id);
    const { passwordHash: _ph, ...safe } = user;
    return { user: safe };
  }

  async signOut(): Promise<void> {
    await setSession(null);
  }

  // ---- Categories ----
  async listCategories(): Promise<Category[]> {
    const user = await currentUserOrThrow();
    return read<Category[]>(KEYS.categories(user.id), []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  async createCategory(
    input: Omit<Category, "id" | "userId">,
  ): Promise<Category> {
    const user = await currentUserOrThrow();
    const cats = read<Category[]>(KEYS.categories(user.id), []);
    const created: Category = { ...input, id: uuid(), userId: user.id };
    cats.push(created);
    write(KEYS.categories(user.id), cats);
    return created;
  }

  // ---- Tags ----
  async listTags(): Promise<Tag[]> {
    const user = await currentUserOrThrow();
    return read<Tag[]>(KEYS.tags(user.id), []);
  }

  async createTag(input: Omit<Tag, "id" | "userId">): Promise<Tag> {
    const user = await currentUserOrThrow();
    const tags = read<Tag[]>(KEYS.tags(user.id), []);
    const existing = tags.find(
      (t) => t.name.toLowerCase() === input.name.toLowerCase(),
    );
    if (existing) return existing;
    const created: Tag = { ...input, id: uuid(), userId: user.id };
    tags.push(created);
    write(KEYS.tags(user.id), tags);
    logActivity(user.id, "tag.created", null, { name: created.name });
    return created;
  }

  async deleteTag(id: string): Promise<void> {
    const user = await currentUserOrThrow();
    const tags = read<Tag[]>(KEYS.tags(user.id), []);
    write(
      KEYS.tags(user.id),
      tags.filter((t) => t.id !== id),
    );
    const docs = read<DocumentRecord[]>(KEYS.documents(user.id), []);
    let touched = false;
    for (const d of docs) {
      if (d.tagIds.includes(id)) {
        d.tagIds = d.tagIds.filter((t) => t !== id);
        touched = true;
      }
    }
    if (touched) write(KEYS.documents(user.id), docs);
  }

  // ---- Collections ----
  async listCollections(): Promise<Collection[]> {
    const user = await currentUserOrThrow();
    return read<Collection[]>(KEYS.collections(user.id), []).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async getCollection(id: string): Promise<Collection | null> {
    const user = await currentUserOrThrow();
    const list = read<Collection[]>(KEYS.collections(user.id), []);
    return list.find((c) => c.id === id) ?? null;
  }

  async createCollection(
    input: Omit<Collection, "id" | "userId" | "createdAt">,
  ): Promise<Collection> {
    const user = await currentUserOrThrow();
    const list = read<Collection[]>(KEYS.collections(user.id), []);
    const created: Collection = {
      ...input,
      id: uuid(),
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    list.push(created);
    write(KEYS.collections(user.id), list);
    logActivity(user.id, "collection.created", null, { name: created.name });
    return created;
  }

  async updateCollection(
    id: string,
    patch: Partial<Omit<Collection, "id" | "userId" | "createdAt">>,
  ): Promise<Collection> {
    const user = await currentUserOrThrow();
    const list = read<Collection[]>(KEYS.collections(user.id), []);
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Collection not found");
    const next: Collection = { ...list[idx]!, ...patch };
    list[idx] = next;
    write(KEYS.collections(user.id), list);
    return next;
  }

  async deleteCollection(id: string): Promise<void> {
    const user = await currentUserOrThrow();
    const list = read<Collection[]>(KEYS.collections(user.id), []);
    write(
      KEYS.collections(user.id),
      list.filter((c) => c.id !== id),
    );
    const docs = read<DocumentRecord[]>(KEYS.documents(user.id), []);
    let touched = false;
    for (const d of docs) {
      if (d.collectionIds.includes(id)) {
        d.collectionIds = d.collectionIds.filter((c) => c !== id);
        touched = true;
      }
    }
    if (touched) write(KEYS.documents(user.id), docs);
  }

  // ---- Documents ----
  async listDocuments(
    filters?: DocumentFilters,
  ): Promise<DocumentRecord[]> {
    const user = await currentUserOrThrow();
    const docs = read<DocumentRecord[]>(KEYS.documents(user.id), []);
    return docs
      .filter((d) => matchesFilters(d, filters))
      .sort(compareDocs(filters?.sort));
  }

  async getDocument(id: string): Promise<DocumentRecord | null> {
    const user = await currentUserOrThrow();
    const docs = read<DocumentRecord[]>(KEYS.documents(user.id), []);
    return docs.find((d) => d.id === id) ?? null;
  }

  async uploadDocument(input: UploadInput): Promise<DocumentRecord> {
    const user = await currentUserOrThrow();

    const total = input.file.size;
    // Simulated progress: chunk into ~10 ticks
    if (input.onProgress) {
      for (let i = 1; i <= 10; i++) {
        await sleep(60 + Math.random() * 40);
        input.onProgress(Math.round((i / 10) * 90));
      }
    }
    const storagePath = `${user.id}/${uuid()}-${sanitizeFileName(input.file.name)}`;
    await putFile(storagePath, input.file);

    const now = new Date().toISOString();
    const record: DocumentRecord = {
      id: uuid(),
      userId: user.id,
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

    const docs = read<DocumentRecord[]>(KEYS.documents(user.id), []);
    docs.push(record);
    write(KEYS.documents(user.id), docs);

    if (input.onProgress) input.onProgress(100);
    logActivity(user.id, "document.uploaded", record.id, {
      title: record.title,
    });
    return record;
  }

  async updateDocument(
    id: string,
    patch: Partial<DocumentRecord>,
  ): Promise<DocumentRecord> {
    const user = await currentUserOrThrow();
    const docs = read<DocumentRecord[]>(KEYS.documents(user.id), []);
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
    write(KEYS.documents(user.id), docs);

    if (patch.isFavorite !== undefined && patch.isFavorite !== prev.isFavorite) {
      logActivity(
        user.id,
        patch.isFavorite ? "document.favorited" : "document.unfavorited",
        id,
        { title: next.title },
      );
    } else if (
      patch.isArchived !== undefined &&
      patch.isArchived !== prev.isArchived
    ) {
      logActivity(
        user.id,
        patch.isArchived ? "document.archived" : "document.restored",
        id,
        { title: next.title },
      );
    } else {
      logActivity(user.id, "document.updated", id, { title: next.title });
    }
    return next;
  }

  async deleteDocument(id: string): Promise<void> {
    const user = await currentUserOrThrow();
    const docs = read<DocumentRecord[]>(KEYS.documents(user.id), []);
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    await deleteFile(doc.storagePath);
    write(
      KEYS.documents(user.id),
      docs.filter((d) => d.id !== id),
    );
    logActivity(user.id, "document.deleted", id, { title: doc.title });
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
    const user = await currentUserOrThrow();
    return read<ActivityEvent[]>(KEYS.activity(user.id), []).slice(0, limit);
  }

  async listReminders(): Promise<Reminder[]> {
    return [];
  }
}

export const mockClient: DataClient = new MockDataClient();
