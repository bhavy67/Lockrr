-- ---------------------------------------------------------------------------
-- document_texts: extracted textual content of documents (Phase 7.1)
--
-- Every document optionally has one row here. Populated client-side after
-- upload by PDF.js (for PDFs with embedded text) or Tesseract.js (for images).
-- The row appears before extraction runs (status='processing') so the UI can
-- show a spinner without racing the write.
--
-- content_tsv is generated + GIN-indexed and is what Phase 7.4 will use for
-- semantic + full-text search. Unused today, but cheap to populate now and
-- expensive to add later once the table has data.
--
-- The row lives in a separate table (rather than columns on documents) for
-- two reasons: (1) the content column can be large and would slow down
-- queries that don't need it, (2) it lets us backfill/re-extract without
-- touching document row versions or triggering updated_at.
-- ---------------------------------------------------------------------------

create table document_texts (
  document_id uuid primary key references documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'not_extracted'
    check (status in ('not_extracted', 'processing', 'done', 'empty', 'failed')),
  content text,
  character_count integer not null default 0,
  extraction_method text
    check (extraction_method in ('pdf-embedded', 'ocr-image', 'ocr-pdf')),
  extracted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_tsv tsvector generated always as (
    to_tsvector('english', coalesce(content, ''))
  ) stored
);

create index document_texts_user_idx on document_texts (user_id);
create index document_texts_content_tsv_idx on document_texts using gin (content_tsv);

create trigger document_texts_touch_updated_at
  before update on document_texts
  for each row execute function touch_updated_at();

alter table document_texts enable row level security;

create policy "document_texts select" on document_texts
  for select using (user_id = (select auth.uid()));
create policy "document_texts insert" on document_texts
  for insert with check (user_id = (select auth.uid()));
create policy "document_texts update" on document_texts
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "document_texts delete" on document_texts
  for delete using (user_id = (select auth.uid()));

revoke all on document_texts from anon;
