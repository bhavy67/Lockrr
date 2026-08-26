import { describe, expect, it } from "vitest";
import type {
  DocumentRowWithJoins,
  DocumentTextRow,
} from "./database.types";
import {
  activityKindForPatch,
  documentIdsWithAllTags,
  documentSearchFilter,
  fileKindFilter,
  orderFor,
  toDocument,
  toDocumentPatch,
  toDocumentText,
  toIso,
} from "./mappers";

const row: DocumentRowWithJoins = {
  id: "doc-1",
  user_id: "user-1",
  category_id: "cat-1",
  title: "Passport",
  description: null,
  file_name: "passport.pdf",
  storage_path: "user-1/abc-passport.pdf",
  mime_type: "application/pdf",
  size_bytes: 1024,
  document_date: "2020-01-01T00:00:00.000Z",
  expiry_date: "2030-01-01T00:00:00.000Z",
  reminder_date: null,
  is_favorite: true,
  is_archived: false,
  metadata: {},
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-06-01T00:00:00.000Z",
  document_tags: [{ tag_id: "tag-1" }, { tag_id: "tag-2" }],
  collection_documents: [{ collection_id: "col-1" }],
};

describe("toIso", () => {
  it("normalizes the Postgres offset form to the shape the mock produces", () => {
    expect(toIso("2026-09-10T00:00:00+00:00")).toBe("2026-09-10T00:00:00.000Z");
  });

  it("leaves an already-normalized value unchanged", () => {
    expect(toIso("2026-09-10T00:00:00.000Z")).toBe("2026-09-10T00:00:00.000Z");
  });

  it("passes null through", () => {
    expect(toIso(null)).toBeNull();
  });

  it("returns unparseable input as-is rather than throwing", () => {
    expect(toIso("not a date")).toBe("not a date");
  });
});

describe("toDocument", () => {
  it("flattens join rows into id arrays", () => {
    const doc = toDocument(row);
    expect(doc.tagIds).toEqual(["tag-1", "tag-2"]);
    expect(doc.collectionIds).toEqual(["col-1"]);
  });

  it("treats absent joins as empty, not undefined", () => {
    const doc = toDocument({
      ...row,
      document_tags: null,
      collection_documents: null,
    });
    expect(doc.tagIds).toEqual([]);
    expect(doc.collectionIds).toEqual([]);
  });

  it("maps snake_case columns onto the domain record", () => {
    const doc = toDocument(row);
    expect(doc.fileName).toBe("passport.pdf");
    expect(doc.isFavorite).toBe(true);
    expect(doc.sizeBytes).toBe(1024);
    expect(doc.expiryDate).toBe("2030-01-01T00:00:00.000Z");
  });

  it("normalizes the timestamps Postgres returns", () => {
    const doc = toDocument({
      ...row,
      expiry_date: "2030-01-01T00:00:00+00:00",
      created_at: "2024-01-01T09:30:00+00:00",
    });
    // The document form compares these strings to decide whether it is dirty,
    // so they have to match what the mock client would have stored.
    expect(doc.expiryDate).toBe("2030-01-01T00:00:00.000Z");
    expect(doc.createdAt).toBe("2024-01-01T09:30:00.000Z");
  });
});

describe("toDocumentPatch", () => {
  it("keeps explicit nulls and drops absent keys", () => {
    expect(toDocumentPatch({ expiryDate: null, title: "New" })).toEqual({
      expiry_date: null,
      title: "New",
    });
  });

  it("refuses to move a document to another owner or file", () => {
    const patch = toDocumentPatch({
      id: "other",
      userId: "someone-else",
      storagePath: "someone-else/secret.pdf",
      createdAt: "2000-01-01T00:00:00.000Z",
      title: "Renamed",
    });
    expect(patch).toEqual({ title: "Renamed" });
  });

  it("is empty for an empty patch", () => {
    expect(toDocumentPatch({})).toEqual({});
  });
});

describe("activityKindForPatch", () => {
  const previous = { isFavorite: false, isArchived: false };

  it("reports a favorite toggle as itself", () => {
    expect(activityKindForPatch({ isFavorite: true }, previous)).toBe(
      "document.favorited",
    );
    expect(
      activityKindForPatch({ isFavorite: false }, { ...previous, isFavorite: true }),
    ).toBe("document.unfavorited");
  });

  it("reports an archive toggle as itself", () => {
    expect(activityKindForPatch({ isArchived: true }, previous)).toBe(
      "document.archived",
    );
    expect(
      activityKindForPatch({ isArchived: false }, { ...previous, isArchived: true }),
    ).toBe("document.restored");
  });

  it("ignores a flag that did not actually change", () => {
    expect(activityKindForPatch({ isFavorite: false }, previous)).toBe(
      "document.updated",
    );
  });

  it("falls back to a plain edit", () => {
    expect(activityKindForPatch({ title: "New" }, previous)).toBe(
      "document.updated",
    );
  });
});

describe("documentSearchFilter", () => {
  it("searches title, description and file name", () => {
    expect(documentSearchFilter("visa")).toBe(
      'title.ilike."%visa%",description.ilike."%visa%",file_name.ilike."%visa%"',
    );
  });

  it("quotes a term containing a comma so it is not read as filter syntax", () => {
    expect(documentSearchFilter("insurance, home")).toContain(
      'title.ilike."%insurance, home%"',
    );
  });

  it("escapes quotes and backslashes", () => {
    expect(documentSearchFilter('a"b\\c')).toContain(
      'title.ilike."%a\\"b\\\\c%"',
    );
  });

  it("trims surrounding whitespace", () => {
    expect(documentSearchFilter("  visa  ")).toContain('"%visa%"');
  });
});

describe("fileKindFilter", () => {
  it("matches every image type with one wildcard", () => {
    expect(fileKindFilter(["image"])).toBe("mime_type.like.image/*");
  });

  it("matches pdf exactly", () => {
    expect(fileKindFilter(["pdf"])).toBe("mime_type.eq.application/pdf");
  });

  it("ors both kinds together", () => {
    expect(fileKindFilter(["pdf", "image"])).toBe(
      "mime_type.eq.application/pdf,mime_type.like.image/*",
    );
  });

  it("is null when nothing is selected", () => {
    expect(fileKindFilter([])).toBeNull();
  });
});

describe("orderFor", () => {
  it("puts the newest first by default", () => {
    expect(orderFor(undefined)).toEqual({
      column: "created_at",
      ascending: false,
      nullsFirst: false,
    });
  });

  it("sorts by soonest expiry, with undated documents last", () => {
    expect(orderFor("expiry_date")).toEqual({
      column: "expiry_date",
      ascending: true,
      nullsFirst: false,
    });
  });

  it("sorts names A to Z", () => {
    expect(orderFor("name").ascending).toBe(true);
  });
});

describe("documentIdsWithAllTags", () => {
  const rows = [
    { document_id: "a", tag_id: "t1" },
    { document_id: "a", tag_id: "t2" },
    { document_id: "b", tag_id: "t1" },
  ];

  it("keeps only documents carrying every tag", () => {
    expect(documentIdsWithAllTags(rows, ["t1", "t2"])).toEqual(["a"]);
  });

  it("keeps both when one tag is asked for", () => {
    expect(documentIdsWithAllTags(rows, ["t1"]).sort()).toEqual(["a", "b"]);
  });

  it("ignores rows for tags nobody asked about", () => {
    expect(
      documentIdsWithAllTags([...rows, { document_id: "c", tag_id: "t9" }], ["t1"]).sort(),
    ).toEqual(["a", "b"]);
  });

  it("is empty when no document carries the whole set", () => {
    expect(documentIdsWithAllTags(rows, ["t1", "t2", "t3"])).toEqual([]);
  });
});

describe("toDocumentText", () => {
  const baseRow: DocumentTextRow = {
    document_id: "doc-1",
    user_id: "user-1",
    status: "done",
    content: "Passport valid until 2035",
    character_count: 26,
    extraction_method: "pdf-embedded",
    extracted_at: "2026-08-27T00:00:00+00:00",
    created_at: "2026-08-27T00:00:00+00:00",
    updated_at: "2026-08-27T00:00:00+00:00",
  };

  it("maps snake_case columns to camelCase domain", () => {
    expect(toDocumentText(baseRow)).toEqual({
      documentId: "doc-1",
      status: "done",
      content: "Passport valid until 2035",
      characterCount: 26,
      extractionMethod: "pdf-embedded",
      extractedAt: "2026-08-27T00:00:00.000Z",
    });
  });

  it("normalizes extracted_at through toIso", () => {
    const mapped = toDocumentText({
      ...baseRow,
      extracted_at: "2026-08-27T00:00:00+00:00",
    });
    // Two different timezone forms of the same instant become identical strings.
    expect(mapped.extractedAt).toBe(
      toDocumentText({
        ...baseRow,
        extracted_at: "2026-08-27T00:00:00.000Z",
      }).extractedAt,
    );
  });

  it("propagates null content + method on failure rows", () => {
    const mapped = toDocumentText({
      ...baseRow,
      status: "failed",
      content: null,
      extraction_method: null,
      extracted_at: null,
    });
    expect(mapped.content).toBeNull();
    expect(mapped.extractionMethod).toBeNull();
    expect(mapped.extractedAt).toBeNull();
    expect(mapped.status).toBe("failed");
  });
});
