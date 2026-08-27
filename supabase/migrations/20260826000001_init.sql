-- ---------------------------------------------------------------------------
-- LockKaro — core schema
--
-- Every table is scoped by user_id and carries row level security. There is no
-- shared data in this product: a row belongs to exactly one person, and the
-- policies below are the only thing standing between accounts. Nothing here
-- assumes a trusted server — the browser talks to Postgres with the anon key.
-- ---------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- profiles
-- --------------------------------------------------------------------------
create table public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  display_name text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- categories
-- --------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  slug        text not null,
  icon        text not null default 'file',
  color       text not null default '#71717A',
  is_default  boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);

create index categories_user_id_idx on public.categories (user_id, sort_order);

-- --------------------------------------------------------------------------
-- tags
-- --------------------------------------------------------------------------
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  color      text not null default '#6366F1',
  created_at timestamptz not null default now()
);

-- Tag names are case-insensitively unique per user: the client reuses an
-- existing tag rather than creating "Passport" alongside "passport".
create unique index tags_user_name_key on public.tags (user_id, lower(name));

-- --------------------------------------------------------------------------
-- collections
-- --------------------------------------------------------------------------
create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  icon        text not null default 'library',
  color       text not null default '#6366F1',
  created_at  timestamptz not null default now()
);

create index collections_user_id_idx on public.collections (user_id, name);

-- --------------------------------------------------------------------------
-- documents
-- --------------------------------------------------------------------------
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  category_id   uuid references public.categories (id) on delete set null,
  title         text not null,
  description   text,
  file_name     text not null,
  storage_path  text not null unique,
  mime_type     text not null,
  size_bytes    bigint not null default 0,
  document_date timestamptz,
  expiry_date   timestamptz,
  reminder_date timestamptz,
  is_favorite   boolean not null default false,
  is_archived   boolean not null default false,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Unused by the app today. Full text search lands in Phase 7; the column and
  -- its index exist now so that turning it on is not a migration on live data.
  search_tsv    tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(file_name, '')
    )
  ) stored
);

create index documents_user_created_idx on public.documents (user_id, created_at desc);
create index documents_user_expiry_idx   on public.documents (user_id, expiry_date)
  where expiry_date is not null;
create index documents_category_idx      on public.documents (category_id);
create index documents_search_idx        on public.documents using gin (search_tsv);

-- --------------------------------------------------------------------------
-- document_tags / collection_documents
--
-- Both join tables carry user_id. It is redundant against the parent rows, but
-- it lets the RLS policy be a plain column check instead of a subquery on
-- every read — the join tables are read on every vault query.
-- --------------------------------------------------------------------------
create table public.document_tags (
  document_id uuid not null references public.documents (id) on delete cascade,
  tag_id      uuid not null references public.tags (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (document_id, tag_id)
);

create index document_tags_tag_idx on public.document_tags (tag_id);

create table public.collection_documents (
  collection_id uuid not null references public.collections (id) on delete cascade,
  document_id   uuid not null references public.documents (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (collection_id, document_id)
);

create index collection_documents_document_idx on public.collection_documents (document_id);

-- --------------------------------------------------------------------------
-- reminders
-- --------------------------------------------------------------------------
create table public.reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  remind_at   timestamptz not null,
  message     text,
  status      text not null default 'pending'
                check (status in ('pending', 'sent', 'dismissed')),
  created_at  timestamptz not null default now()
);

create index reminders_user_remind_idx on public.reminders (user_id, remind_at);

-- --------------------------------------------------------------------------
-- activity
-- --------------------------------------------------------------------------
create table public.activity (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  kind        text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index activity_user_created_idx on public.activity (user_id, created_at desc);

-- --------------------------------------------------------------------------
-- updated_at
-- --------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_touch_updated_at
  before update on public.documents
  for each row execute function public.touch_updated_at();

-- --------------------------------------------------------------------------
-- Grants
--
-- Row level security decides which rows you may touch. It does not grant the
-- privilege to touch the table at all — that is a separate thing, and without
-- it every query comes back "permission denied for table ...".
--
-- Migrations run as `postgres`, whose own default privileges on a fresh
-- database hand out nothing but TRUNCATE, REFERENCES and TRIGGER — so
-- `authenticated` needs these grants written out explicitly or every request
-- fails before RLS is ever consulted.
--
-- A hosted Supabase project's default privileges are broader than that: they
-- extend the same full CRUD to `anon` too, on every table regardless of who
-- creates it — verified against a real project, not just the local CLI
-- stack, which does not reproduce this. That grant is harmless on its own
-- (every policy below is scoped `to authenticated`, so anon matches none of
-- them), but leaving it in place means anon's exclusion depends on nobody
-- ever adding a policy without an explicit `to authenticated`.
-- `20260826000005_revoke_anon.sql` removes it, so the boundary is structural
-- rather than incidental.
-- --------------------------------------------------------------------------
grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on
  public.profiles,
  public.categories,
  public.tags,
  public.collections,
  public.documents,
  public.document_tags,
  public.collection_documents,
  public.reminders
to authenticated, service_role;

-- Activity is an append-only record of what happened. You can write an entry
-- and you can clear your history, but you cannot rewrite one after the fact,
-- so there is no update grant and no update policy to go with it.
grant select, insert, delete on public.activity to authenticated, service_role;

-- --------------------------------------------------------------------------
-- Row level security
--
-- One shape for every table: you can see and change your rows, and no others.
-- --------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.tags                 enable row level security;
alter table public.collections          enable row level security;
alter table public.documents            enable row level security;
alter table public.document_tags        enable row level security;
alter table public.collection_documents enable row level security;
alter table public.reminders            enable row level security;
alter table public.activity             enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (user_id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (user_id = auth.uid());

create policy "categories_select_own" on public.categories
  for select to authenticated using (user_id = auth.uid());
create policy "categories_insert_own" on public.categories
  for insert to authenticated with check (user_id = auth.uid());
create policy "categories_update_own" on public.categories
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories_delete_own" on public.categories
  for delete to authenticated using (user_id = auth.uid());

create policy "tags_select_own" on public.tags
  for select to authenticated using (user_id = auth.uid());
create policy "tags_insert_own" on public.tags
  for insert to authenticated with check (user_id = auth.uid());
create policy "tags_update_own" on public.tags
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tags_delete_own" on public.tags
  for delete to authenticated using (user_id = auth.uid());

create policy "collections_select_own" on public.collections
  for select to authenticated using (user_id = auth.uid());
create policy "collections_insert_own" on public.collections
  for insert to authenticated with check (user_id = auth.uid());
create policy "collections_update_own" on public.collections
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "collections_delete_own" on public.collections
  for delete to authenticated using (user_id = auth.uid());

create policy "documents_select_own" on public.documents
  for select to authenticated using (user_id = auth.uid());
create policy "documents_insert_own" on public.documents
  for insert to authenticated with check (user_id = auth.uid());
create policy "documents_update_own" on public.documents
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "documents_delete_own" on public.documents
  for delete to authenticated using (user_id = auth.uid());

create policy "document_tags_select_own" on public.document_tags
  for select to authenticated using (user_id = auth.uid());
create policy "document_tags_insert_own" on public.document_tags
  for insert to authenticated with check (user_id = auth.uid());
create policy "document_tags_update_own" on public.document_tags
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "document_tags_delete_own" on public.document_tags
  for delete to authenticated using (user_id = auth.uid());

create policy "collection_documents_select_own" on public.collection_documents
  for select to authenticated using (user_id = auth.uid());
create policy "collection_documents_insert_own" on public.collection_documents
  for insert to authenticated with check (user_id = auth.uid());
create policy "collection_documents_update_own" on public.collection_documents
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "collection_documents_delete_own" on public.collection_documents
  for delete to authenticated using (user_id = auth.uid());

create policy "reminders_select_own" on public.reminders
  for select to authenticated using (user_id = auth.uid());
create policy "reminders_insert_own" on public.reminders
  for insert to authenticated with check (user_id = auth.uid());
create policy "reminders_update_own" on public.reminders
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reminders_delete_own" on public.reminders
  for delete to authenticated using (user_id = auth.uid());

create policy "activity_select_own" on public.activity
  for select to authenticated using (user_id = auth.uid());
create policy "activity_insert_own" on public.activity
  for insert to authenticated with check (user_id = auth.uid());
create policy "activity_delete_own" on public.activity
  for delete to authenticated using (user_id = auth.uid());
