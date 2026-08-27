"use client";

import type { PostgrestError } from "@supabase/supabase-js";
import type {
  ActivityEvent,
  ActivityKind,
  Category,
  Collection,
  DocumentFilters,
  DocumentRecord,
  DocumentText,
  Reminder,
  Tag,
  User,
} from "@lockerr/types";

import { sanitizeFileName, stripExtension } from "@/lib/utils";
import type {
  AuthResult,
  DataClient,
  SaveDocumentTextInput,
  UploadInput,
} from "./client";
import {
  DOCUMENTS_BUCKET,
  getSupabase,
  supabaseEnv,
  type LockerrSupabaseClient,
} from "./supabase/browser-client";
import type { DocumentRowWithJoins } from "./supabase/database.types";
import {
  activityKindForPatch,
  documentIdsWithAllTags,
  documentSearchFilter,
  fileKindFilter,
  orderFor,
  toActivity,
  toCategory,
  toCollection,
  toDocument,
  toDocumentPatch,
  toDocumentText,
  toReminder,
  toTag,
  toUser,
} from "./supabase/mappers";
import { supportsUploadProgress, uploadWithProgress } from "./supabase/upload";

/**
 * The Supabase implementation of `DataClient`. Same public surface as the mock
 * client — features import `data` from `@/lib/data` and never know which one
 * they got.
 *
 * There is no application server in front of Postgres. Every call here runs
 * with the signed-in user's JWT and is filtered by row level security, so the
 * `user_id` this file attaches to writes is a convenience for the policy check,
 * never the thing that enforces it.
 */

/** Signed URLs live just long enough to load a preview or start a download. */
const SIGNED_URL_TTL_SECONDS = 300;

/** Room left on the progress bar for the database write after the file lands. */
const UPLOAD_PROGRESS_CEILING = 0.9;

/** A document is never useful without its tag and collection membership. */
const DOCUMENT_SELECT =
  "*, document_tags(tag_id), collection_documents(collection_id)";

function fail(context: string, error: PostgrestError | { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

function uuid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

class SupabaseDataClient implements DataClient {
  private get sb(): LockerrSupabaseClient {
    return getSupabase();
  }

  /**
   * Reads the locally cached session rather than calling `getUser()`, which
   * would add a network round trip to every operation. A tampered-with local
   * session buys nothing: the JWT is verified by Postgres on the next request,
   * and RLS returns no rows for one that doesn't hold up.
   */
  private async requireUserId(): Promise<string> {
    const { data } = await this.sb.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new Error("Not signed in");
    return id;
  }

  private async loadProfile(userId: string): Promise<User | null> {
    const { data, error } = await this.sb
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) fail("Couldn't load your profile", error);
    return data ? toUser(data) : null;
  }

  /**
   * The activity feed is a nicety. A row that fails to write should never take
   * down the upload or edit that produced it.
   */
  private async logActivity(
    userId: string,
    kind: ActivityKind,
    documentId: string | null,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    const { error } = await this.sb
      .from("activity")
      .insert({ user_id: userId, document_id: documentId, kind, payload });
    if (error) {
      console.warn(`Couldn't record activity (${kind}): ${error.message}`);
    }
  }

  // ---- Auth ----------------------------------------------------------------

  async getSession(): Promise<User | null> {
    const { data } = await this.sb.auth.getSession();
    const authUser = data.session?.user;
    if (!authUser) return null;

    const profile = await this.loadProfile(authUser.id);
    if (profile) return profile;

    // The profile trigger runs inside the sign-up transaction, so this only
    // happens for an account created before it existed. Fall back to what the
    // token already carries rather than bouncing someone to the sign-in page.
    const metadata = authUser.user_metadata as { display_name?: string } | null;
    return {
      id: authUser.id,
      email: authUser.email ?? "",
      displayName:
        metadata?.display_name ?? (authUser.email ?? "there").split("@")[0]!,
      avatarUrl: null,
      createdAt: authUser.created_at ?? new Date().toISOString(),
    };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.sb.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      throw new Error("Incorrect email or password.");
    }
    const user = (await this.loadProfile(data.user.id)) ?? (await this.getSession());
    if (!user) throw new Error("Couldn't open your vault. Try signing in again.");
    return { user };
  }

  async signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<AuthResult> {
    const { data, error } = await this.sb.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        // Explicit rather than relying solely on the project's Site URL
        // setting in the Supabase dashboard: that's one global default,
        // wrong for every environment but whichever one it's set to. This
        // still has to be in the dashboard's Additional Redirect URLs allow
        // list — Supabase rejects a redirect target that isn't — but at
        // least it's correct automatically in every environment that is
        // allow-listed, prod and any preview deploy alike, with nothing to
        // remember to update by hand.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        throw new Error("An account with this email already exists.");
      }
      throw new Error(error.message);
    }
    if (!data.session) {
      // Email confirmation is on for this project. Nothing is broken; the
      // account just isn't usable until the link is clicked.
      throw new Error("Check your email to confirm your account, then sign in.");
    }
    const user = await this.getSession();
    if (!user) throw new Error("Couldn't open your new vault. Try signing in.");
    return { user };
  }

  async signOut(): Promise<void> {
    const { error } = await this.sb.auth.signOut();
    if (error) fail("Couldn't lock your vault", error);
  }

  // ---- Categories ----------------------------------------------------------

  async listCategories(): Promise<Category[]> {
    await this.requireUserId();
    const { data, error } = await this.sb
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) fail("Couldn't load categories", error);
    return data.map(toCategory);
  }

  async createCategory(
    input: Omit<Category, "id" | "userId">,
  ): Promise<Category> {
    const userId = await this.requireUserId();
    const { data, error } = await this.sb
      .from("categories")
      .insert({
        user_id: userId,
        name: input.name,
        slug: input.slug,
        icon: input.icon,
        color: input.color,
        is_default: input.isDefault,
        sort_order: input.sortOrder,
      })
      .select("*")
      .single();
    if (error) fail("Couldn't create that category", error);
    return toCategory(data);
  }

  // ---- Tags ----------------------------------------------------------------

  async listTags(): Promise<Tag[]> {
    await this.requireUserId();
    const { data, error } = await this.sb
      .from("tags")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) fail("Couldn't load tags", error);
    return data.map(toTag);
  }

  /**
   * Tag names are case-insensitively unique per person. Reuse an existing tag
   * rather than growing a pile of near-duplicates — and if two tabs race, the
   * unique index settles it and we return the winner.
   */
  async createTag(input: Omit<Tag, "id" | "userId">): Promise<Tag> {
    const userId = await this.requireUserId();
    const wanted = input.name.trim();

    const existing = (await this.listTags()).find(
      (t) => t.name.toLowerCase() === wanted.toLowerCase(),
    );
    if (existing) return existing;

    const { data, error } = await this.sb
      .from("tags")
      .insert({ user_id: userId, name: wanted, color: input.color })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        const raced = (await this.listTags()).find(
          (t) => t.name.toLowerCase() === wanted.toLowerCase(),
        );
        if (raced) return raced;
      }
      fail("Couldn't create that tag", error);
    }

    await this.logActivity(userId, "tag.created", null, { name: data.name });
    return toTag(data);
  }

  async deleteTag(id: string): Promise<void> {
    await this.requireUserId();
    // document_tags rows go with it, by cascade.
    const { error } = await this.sb.from("tags").delete().eq("id", id);
    if (error) fail("Couldn't delete that tag", error);
  }

  // ---- Collections ---------------------------------------------------------

  async listCollections(): Promise<Collection[]> {
    await this.requireUserId();
    const { data, error } = await this.sb
      .from("collections")
      .select("*")
      .order("name", { ascending: true });
    if (error) fail("Couldn't load collections", error);
    return data.map(toCollection);
  }

  async getCollection(id: string): Promise<Collection | null> {
    await this.requireUserId();
    const { data, error } = await this.sb
      .from("collections")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) fail("Couldn't load that collection", error);
    return data ? toCollection(data) : null;
  }

  async createCollection(
    input: Omit<Collection, "id" | "userId" | "createdAt">,
  ): Promise<Collection> {
    const userId = await this.requireUserId();
    const { data, error } = await this.sb
      .from("collections")
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description ?? null,
        icon: input.icon,
        color: input.color,
      })
      .select("*")
      .single();
    if (error) fail("Couldn't create that collection", error);
    await this.logActivity(userId, "collection.created", null, {
      name: data.name,
    });
    return toCollection(data);
  }

  async updateCollection(
    id: string,
    patch: Partial<Omit<Collection, "id" | "userId" | "createdAt">>,
  ): Promise<Collection> {
    await this.requireUserId();
    const { data, error } = await this.sb
      .from("collections")
      .update({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
        ...(patch.color !== undefined ? { color: patch.color } : {}),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail("Couldn't save that collection", error);
    return toCollection(data);
  }

  async deleteCollection(id: string): Promise<void> {
    await this.requireUserId();
    const { error } = await this.sb.from("collections").delete().eq("id", id);
    if (error) fail("Couldn't delete that collection", error);
  }

  // ---- Documents -----------------------------------------------------------

  async listDocuments(filters?: DocumentFilters): Promise<DocumentRecord[]> {
    const userId = await this.requireUserId();

    // Tag and collection membership live in join tables, and "has every one of
    // these tags" is not something PostgREST can ask for in a single filter.
    // Narrow to a set of ids first, then let the main query do the rest.
    let restrictTo: string[] | null = null;

    if (filters?.tagIds && filters.tagIds.length > 0) {
      const { data, error } = await this.sb
        .from("document_tags")
        .select("document_id, tag_id")
        .in("tag_id", filters.tagIds);
      if (error) fail("Couldn't filter by tag", error);
      restrictTo = documentIdsWithAllTags(data, filters.tagIds);
    }

    if (filters?.collectionId) {
      const { data, error } = await this.sb
        .from("collection_documents")
        .select("document_id")
        .eq("collection_id", filters.collectionId);
      if (error) fail("Couldn't filter by collection", error);
      const inCollection = data.map((r) => r.document_id);
      restrictTo =
        restrictTo === null
          ? inCollection
          : restrictTo.filter((id) => inCollection.includes(id));
    }

    if (restrictTo !== null && restrictTo.length === 0) return [];

    let query = this.sb
      .from("documents")
      .select(DOCUMENT_SELECT)
      .eq("user_id", userId)
      // Archived documents are a separate shelf, not part of the vault: they
      // only appear when explicitly asked for.
      .eq("is_archived", filters?.archived === true);

    if (restrictTo !== null) query = query.in("id", restrictTo);
    if (filters?.query?.trim()) {
      query = query.or(documentSearchFilter(filters.query));
    }
    if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters?.favoritesOnly) query = query.eq("is_favorite", true);

    if (filters?.fileKinds && filters.fileKinds.length > 0) {
      const kinds = fileKindFilter(filters.fileKinds);
      if (kinds) query = query.or(kinds);
    }

    if (filters?.expiringWithinDays !== undefined) {
      const cutoff = new Date(
        Date.now() + filters.expiringWithinDays * 24 * 60 * 60 * 1000,
      ).toISOString();
      query = query.not("expiry_date", "is", null).lte("expiry_date", cutoff);
    }

    const order = orderFor(filters?.sort);
    const { data, error } = await query.order(order.column, {
      ascending: order.ascending,
      nullsFirst: order.nullsFirst,
    });
    if (error) fail("Couldn't load your documents", error);

    return (data as unknown as DocumentRowWithJoins[]).map(toDocument);
  }

  async getDocument(id: string): Promise<DocumentRecord | null> {
    await this.requireUserId();
    const { data, error } = await this.sb
      .from("documents")
      .select(DOCUMENT_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) fail("Couldn't load that document", error);
    return data ? toDocument(data as unknown as DocumentRowWithJoins) : null;
  }

  async uploadDocument(input: UploadInput): Promise<DocumentRecord> {
    const userId = await this.requireUserId();
    const { anonKey } = supabaseEnv();

    // The first path segment is what the storage policy compares against
    // auth.uid(), so it is the boundary rather than a naming convention.
    const storagePath = `${userId}/${uuid()}-${sanitizeFileName(input.file.name)}`;

    const { data: signed, error: signError } = await this.sb.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (signError) fail("Couldn't start the upload", signError);

    const { data: sessionData } = await this.sb.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error("Not signed in");

    if (supportsUploadProgress()) {
      await uploadWithProgress({
        file: input.file,
        target: { signedUrl: signed.signedUrl, anonKey, accessToken },
        onProgress: (fraction) =>
          input.onProgress?.(Math.round(fraction * UPLOAD_PROGRESS_CEILING * 100)),
      });
    } else {
      const { error } = await this.sb.storage
        .from(DOCUMENTS_BUCKET)
        .uploadToSignedUrl(storagePath, signed.token, input.file, {
          contentType: input.file.type || "application/octet-stream",
        });
      if (error) fail("Couldn't upload that file", error);
      input.onProgress?.(Math.round(UPLOAD_PROGRESS_CEILING * 100));
    }

    const { data: row, error: insertError } = await this.sb
      .from("documents")
      .insert({
        user_id: userId,
        category_id: input.categoryId ?? null,
        title: input.title ?? stripExtension(input.file.name),
        description: input.description ?? null,
        file_name: input.file.name,
        storage_path: storagePath,
        mime_type: input.file.type || "application/octet-stream",
        size_bytes: input.file.size,
        document_date: input.documentDate ?? null,
        expiry_date: input.expiryDate ?? null,
      })
      .select(DOCUMENT_SELECT)
      .single();

    if (insertError) {
      // The bytes made it but the record didn't. Don't leave an orphan behind.
      await this.sb.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
      fail("Couldn't save that document", insertError);
    }

    const document = toDocument(row as unknown as DocumentRowWithJoins);

    if (input.tagIds && input.tagIds.length > 0) {
      await this.setDocumentTags(userId, document.id, input.tagIds);
      document.tagIds = [...input.tagIds];
    }

    input.onProgress?.(100);
    await this.logActivity(userId, "document.uploaded", document.id, {
      title: document.title,
    });
    return document;
  }

  private async setDocumentTags(
    userId: string,
    documentId: string,
    tagIds: string[],
  ): Promise<void> {
    const { error: clearError } = await this.sb
      .from("document_tags")
      .delete()
      .eq("document_id", documentId);
    if (clearError) fail("Couldn't update tags", clearError);
    if (tagIds.length === 0) return;

    const { error } = await this.sb.from("document_tags").insert(
      tagIds.map((tagId) => ({
        document_id: documentId,
        tag_id: tagId,
        user_id: userId,
      })),
    );
    if (error) fail("Couldn't update tags", error);
  }

  private async setDocumentCollections(
    userId: string,
    documentId: string,
    collectionIds: string[],
  ): Promise<void> {
    const { error: clearError } = await this.sb
      .from("collection_documents")
      .delete()
      .eq("document_id", documentId);
    if (clearError) fail("Couldn't update collections", clearError);
    if (collectionIds.length === 0) return;

    const { error } = await this.sb.from("collection_documents").insert(
      collectionIds.map((collectionId) => ({
        collection_id: collectionId,
        document_id: documentId,
        user_id: userId,
      })),
    );
    if (error) fail("Couldn't update collections", error);
  }

  async updateDocument(
    id: string,
    patch: Partial<DocumentRecord>,
  ): Promise<DocumentRecord> {
    const userId = await this.requireUserId();

    const previous = await this.getDocument(id);
    if (!previous) throw new Error("Document not found");

    const columns = toDocumentPatch(patch);
    if (Object.keys(columns).length > 0) {
      const { error } = await this.sb
        .from("documents")
        .update(columns)
        .eq("id", id);
      if (error) fail("Couldn't save that document", error);
    }

    if (patch.tagIds !== undefined) {
      await this.setDocumentTags(userId, id, patch.tagIds);
    }
    if (patch.collectionIds !== undefined) {
      await this.setDocumentCollections(userId, id, patch.collectionIds);
    }

    const updated = await this.getDocument(id);
    if (!updated) throw new Error("Document not found");

    await this.logActivity(userId, activityKindForPatch(patch, previous), id, {
      title: updated.title,
    });
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    const userId = await this.requireUserId();
    const doc = await this.getDocument(id);
    if (!doc) return;

    // Logged first, while the document still exists to point at. The row's
    // document_id is nulled by the cascade, and the title lives on in payload.
    await this.logActivity(userId, "document.deleted", id, { title: doc.title });

    const { error: storageError } = await this.sb.storage
      .from(DOCUMENTS_BUCKET)
      .remove([doc.storagePath]);
    if (storageError) fail("Couldn't delete that file", storageError);

    const { error } = await this.sb.from("documents").delete().eq("id", id);
    if (error) fail("Couldn't delete that document", error);
  }

  async getDocumentUrl(id: string): Promise<string> {
    return this.signedUrlFor(id);
  }

  /**
   * Same object, asked for as an attachment. A signed URL points at the storage
   * host, so a cross-origin `<a download>` can't set the filename on its own —
   * storage has to send the Content-Disposition header, which this asks it to.
   */
  async getDocumentDownloadUrl(id: string): Promise<string> {
    const doc = await this.getDocument(id);
    if (!doc) throw new Error("Document not found");
    return this.signedUrlFor(id, doc.fileName);
  }

  private async signedUrlFor(id: string, download?: string): Promise<string> {
    const doc = await this.getDocument(id);
    if (!doc) throw new Error("Document not found");

    const { data, error } = await this.sb.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(
        doc.storagePath,
        SIGNED_URL_TTL_SECONDS,
        download ? { download } : undefined,
      );
    if (error) fail("Couldn't open that file", error);
    return data.signedUrl;
  }

  // ---- Activity ------------------------------------------------------------

  async listActivity(limit = 50): Promise<ActivityEvent[]> {
    await this.requireUserId();
    const { data, error } = await this.sb
      .from("activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) fail("Couldn't load recent activity", error);
    return data.map(toActivity);
  }

  // ---- Reminders -----------------------------------------------------------

  async listReminders(): Promise<Reminder[]> {
    await this.requireUserId();
    const { data, error } = await this.sb
      .from("reminders")
      .select("*")
      .order("remind_at", { ascending: true });
    if (error) fail("Couldn't load reminders", error);
    return data.map(toReminder);
  }

  // ---- Extraction (Phase 7.1) ---------------------------------------------

  async getDocumentText(documentId: string): Promise<DocumentText | null> {
    await this.requireUserId();
    const { data, error } = await this.sb
      .from("document_texts")
      .select("*")
      .eq("document_id", documentId)
      .maybeSingle();
    if (error) fail("Couldn't load extracted text", error);
    return data ? toDocumentText(data) : null;
  }

  async saveDocumentText(
    input: SaveDocumentTextInput,
  ): Promise<DocumentText> {
    const userId = await this.requireUserId();
    const isFinal =
      input.status === "done" ||
      input.status === "empty" ||
      input.status === "failed";
    const { data, error } = await this.sb
      .from("document_texts")
      .upsert(
        {
          document_id: input.documentId,
          user_id: userId,
          status: input.status,
          content: input.content,
          character_count: input.content?.length ?? 0,
          extraction_method: input.extractionMethod,
          extracted_at: isFinal ? new Date().toISOString() : null,
        },
        { onConflict: "document_id" },
      )
      .select("*")
      .single();
    if (error) fail("Couldn't save extracted text", error);
    return toDocumentText(data);
  }
}

export const supabaseClient: DataClient = new SupabaseDataClient();
