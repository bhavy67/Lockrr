import type {
  ActivityEvent,
  Category,
  Collection,
  DocumentFilters,
  DocumentRecord,
  Reminder,
  Tag,
  User,
} from "@lockerr/types";

export interface AuthResult {
  user: User;
}

export interface UploadInput {
  file: File;
  title?: string;
  description?: string | null;
  categoryId?: string | null;
  documentDate?: string | null;
  expiryDate?: string | null;
  tagIds?: string[];
  onProgress?: (pct: number) => void;
}

export interface DataClient {
  // ---- Auth ----
  getSession(): Promise<User | null>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<AuthResult>;
  signOut(): Promise<void>;

  // ---- Categories ----
  listCategories(): Promise<Category[]>;
  createCategory(input: Omit<Category, "id" | "userId">): Promise<Category>;

  // ---- Tags ----
  listTags(): Promise<Tag[]>;
  createTag(input: Omit<Tag, "id" | "userId">): Promise<Tag>;
  deleteTag(id: string): Promise<void>;

  // ---- Collections ----
  listCollections(): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | null>;
  createCollection(
    input: Omit<Collection, "id" | "userId" | "createdAt">,
  ): Promise<Collection>;
  updateCollection(
    id: string,
    patch: Partial<Omit<Collection, "id" | "userId" | "createdAt">>,
  ): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;

  // ---- Documents ----
  listDocuments(filters?: DocumentFilters): Promise<DocumentRecord[]>;
  getDocument(id: string): Promise<DocumentRecord | null>;
  uploadDocument(input: UploadInput): Promise<DocumentRecord>;
  updateDocument(
    id: string,
    patch: Partial<DocumentRecord>,
  ): Promise<DocumentRecord>;
  deleteDocument(id: string): Promise<void>;
  getDocumentUrl(id: string): Promise<string>;

  // ---- Activity ----
  listActivity(limit?: number): Promise<ActivityEvent[]>;

  // ---- Reminders (stub for now, real in Phase 4) ----
  listReminders(): Promise<Reminder[]>;
}
