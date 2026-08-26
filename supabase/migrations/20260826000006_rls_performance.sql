-- ---------------------------------------------------------------------------
-- RLS performance: stop re-evaluating auth.uid() per row
--
-- Postgres can't tell that auth.uid() returns the same value for every row in
-- a query — as written, `user_id = auth.uid()` calls it once per row scanned.
-- Wrapping it as `(select auth.uid())` gives the planner an initplan it can
-- evaluate once per query instead. Same result, no behavior change: this is
-- purely how the check gets evaluated, not what it checks. Flagged by the
-- Supabase performance linter on every single policy below.
--
-- Also adds the four foreign-key indexes the linter flagged as missing.
-- Every one of these columns already appears first in some other index
-- (e.g. document_tags_tag_idx is keyed on tag_id, not user_id), so the FK
-- itself was the only unindexed access path — cascading deletes and any
-- direct filter on these columns were doing a sequential scan.
-- ---------------------------------------------------------------------------

create index activity_document_id_idx on public.activity (document_id);
create index collection_documents_user_id_idx on public.collection_documents (user_id);
create index document_tags_user_id_idx on public.document_tags (user_id);
create index reminders_document_id_idx on public.reminders (document_id);

drop policy "profiles_select_own" on public.profiles;
drop policy "profiles_insert_own" on public.profiles;
drop policy "profiles_update_own" on public.profiles;
drop policy "profiles_delete_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy "categories_select_own" on public.categories;
drop policy "categories_insert_own" on public.categories;
drop policy "categories_update_own" on public.categories;
drop policy "categories_delete_own" on public.categories;
create policy "categories_select_own" on public.categories
  for select to authenticated using (user_id = (select auth.uid()));
create policy "categories_insert_own" on public.categories
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "categories_update_own" on public.categories
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "categories_delete_own" on public.categories
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy "tags_select_own" on public.tags;
drop policy "tags_insert_own" on public.tags;
drop policy "tags_update_own" on public.tags;
drop policy "tags_delete_own" on public.tags;
create policy "tags_select_own" on public.tags
  for select to authenticated using (user_id = (select auth.uid()));
create policy "tags_insert_own" on public.tags
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "tags_update_own" on public.tags
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tags_delete_own" on public.tags
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy "collections_select_own" on public.collections;
drop policy "collections_insert_own" on public.collections;
drop policy "collections_update_own" on public.collections;
drop policy "collections_delete_own" on public.collections;
create policy "collections_select_own" on public.collections
  for select to authenticated using (user_id = (select auth.uid()));
create policy "collections_insert_own" on public.collections
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "collections_update_own" on public.collections
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "collections_delete_own" on public.collections
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy "documents_select_own" on public.documents;
drop policy "documents_insert_own" on public.documents;
drop policy "documents_update_own" on public.documents;
drop policy "documents_delete_own" on public.documents;
create policy "documents_select_own" on public.documents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "documents_insert_own" on public.documents
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "documents_update_own" on public.documents
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "documents_delete_own" on public.documents
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy "document_tags_select_own" on public.document_tags;
drop policy "document_tags_insert_own" on public.document_tags;
drop policy "document_tags_update_own" on public.document_tags;
drop policy "document_tags_delete_own" on public.document_tags;
create policy "document_tags_select_own" on public.document_tags
  for select to authenticated using (user_id = (select auth.uid()));
create policy "document_tags_insert_own" on public.document_tags
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "document_tags_update_own" on public.document_tags
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "document_tags_delete_own" on public.document_tags
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy "collection_documents_select_own" on public.collection_documents;
drop policy "collection_documents_insert_own" on public.collection_documents;
drop policy "collection_documents_update_own" on public.collection_documents;
drop policy "collection_documents_delete_own" on public.collection_documents;
create policy "collection_documents_select_own" on public.collection_documents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "collection_documents_insert_own" on public.collection_documents
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "collection_documents_update_own" on public.collection_documents
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "collection_documents_delete_own" on public.collection_documents
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy "reminders_select_own" on public.reminders;
drop policy "reminders_insert_own" on public.reminders;
drop policy "reminders_update_own" on public.reminders;
drop policy "reminders_delete_own" on public.reminders;
create policy "reminders_select_own" on public.reminders
  for select to authenticated using (user_id = (select auth.uid()));
create policy "reminders_insert_own" on public.reminders
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reminders_update_own" on public.reminders
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "reminders_delete_own" on public.reminders
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy "activity_select_own" on public.activity;
drop policy "activity_insert_own" on public.activity;
drop policy "activity_delete_own" on public.activity;
create policy "activity_select_own" on public.activity
  for select to authenticated using (user_id = (select auth.uid()));
create policy "activity_insert_own" on public.activity
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "activity_delete_own" on public.activity
  for delete to authenticated using (user_id = (select auth.uid()));
