/**
 * Shape of the LockKaro database, as the PostgREST client sees it.
 *
 * Hand-written to match `supabase/migrations/`. Regenerate with:
 *
 *   supabase gen types typescript --local > \
 *     apps/web/src/lib/data/supabase/database.types.ts
 *
 * If you add a migration, update this file in the same commit — nothing at
 * runtime will tell you it drifted.
 */

export type ProfileRow = {
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export type TagRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export type CollectionRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  created_at: string;
}

export type DocumentRow = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  document_date: string | null;
  expiry_date: string | null;
  reminder_date: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type DocumentTagRow = {
  document_id: string;
  tag_id: string;
  user_id: string;
  created_at: string;
}

export type CollectionDocumentRow = {
  collection_id: string;
  document_id: string;
  user_id: string;
  created_at: string;
}

export type ReminderRow = {
  id: string;
  user_id: string;
  document_id: string;
  remind_at: string;
  message: string | null;
  status: "pending" | "sent" | "dismissed";
  created_at: string;
}

export type ActivityRow = {
  id: string;
  user_id: string;
  document_id: string | null;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
}

/**
 * A document selected together with its join rows. This is what
 * `DOCUMENT_SELECT` in supabase-client.ts returns.
 */
export type DocumentRowWithJoins = DocumentRow & {
  document_tags: Array<{ tag_id: string }> | null;
  collection_documents: Array<{ collection_id: string }> | null;
};

export type DocumentTextRow = {
  document_id: string;
  user_id: string;
  status: "not_extracted" | "processing" | "done" | "empty" | "failed";
  content: string | null;
  character_count: number;
  extraction_method: "pdf-embedded" | "ocr-image" | "ocr-pdf" | null;
  extracted_at: string | null;
  created_at: string;
  updated_at: string;
};

type Table<Row, Insert, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

/**
 * Insert payload: the columns you must supply, plus anything else you choose
 * to. Everything omitted is filled in by a column default or a trigger.
 */
type Insertable<Row, Required extends keyof Row> = Pick<Row, Required> &
  Partial<Omit<Row, Required>>;

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        Insertable<ProfileRow, "user_id" | "email" | "display_name">
      >;
      categories: Table<
        CategoryRow,
        Insertable<CategoryRow, "user_id" | "name" | "slug">
      >;
      tags: Table<TagRow, Insertable<TagRow, "user_id" | "name">>;
      collections: Table<
        CollectionRow,
        Insertable<CollectionRow, "user_id" | "name">
      >;
      documents: Table<
        DocumentRow,
        Insertable<
          DocumentRow,
          "user_id" | "title" | "file_name" | "storage_path" | "mime_type"
        >
      >;
      document_tags: Table<
        DocumentTagRow,
        Insertable<DocumentTagRow, "document_id" | "tag_id" | "user_id">
      >;
      collection_documents: Table<
        CollectionDocumentRow,
        Insertable<
          CollectionDocumentRow,
          "collection_id" | "document_id" | "user_id"
        >
      >;
      reminders: Table<
        ReminderRow,
        Insertable<ReminderRow, "user_id" | "document_id" | "remind_at">
      >;
      activity: Table<ActivityRow, Insertable<ActivityRow, "user_id" | "kind">>;
      document_texts: Table<
        DocumentTextRow,
        Insertable<DocumentTextRow, "document_id" | "user_id" | "status">
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
