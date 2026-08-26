import type {
  ActivityEvent,
  Category,
  Collection,
  DocumentFilters,
  DocumentRecord,
  DocumentText,
  ExtractionMethod,
  ExtractionStatus,
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
  /** A URL for viewing the file inline — image and PDF previews use this. */
  getDocumentUrl(id: string): Promise<string>;
  /**
   * A URL that saves the file under its original name.
   *
   * Separate from `getDocumentUrl` because the two need different responses:
   * a preview must render inline, a download must arrive as an attachment.
   * With a real backend the file is served from another origin, where the
   * `download` attribute on a link is ignored and only the server can name it.
   */
  getDocumentDownloadUrl(id: string): Promise<string>;

  // ---- Activity ----
  listActivity(limit?: number): Promise<ActivityEvent[]>;

  // ---- Reminders ----
  listReminders(): Promise<Reminder[]>;

  // ---- Extraction (Phase 7.1) ----
  getDocumentText(documentId: string): Promise<DocumentText | null>;
  saveDocumentText(input: SaveDocumentTextInput): Promise<DocumentText>;
}

export interface SaveDocumentTextInput {
  documentId: string;
  status: ExtractionStatus;
  content: string | null;
  extractionMethod: ExtractionMethod | null;
}
