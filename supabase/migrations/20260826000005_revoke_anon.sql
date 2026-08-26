-- ---------------------------------------------------------------------------
-- Revoke anon's table grants
--
-- Hosted Supabase projects grant anon and authenticated full CRUD on every
-- public table by default (ALTER DEFAULT PRIVILEGES set up at project
-- provisioning) — a broader baseline than a from-scratch Postgres install
-- gives you, and easy to miss because a fresh migration's own GRANT
-- statements never mention anon at all.
--
-- Today that grant is harmless: every RLS policy here is scoped
-- `to authenticated`, so anon matches none of them and every anon read comes
-- back empty, every anon write gets rejected by RLS. But that safety is
-- currently accidental — it depends on nobody ever adding a policy without
-- an explicit `to authenticated`. Revoking the grant makes anon's exclusion
-- structural instead of incidental: signing up and signing in go through the
-- auth service, not PostgREST, so an anonymous caller has no business
-- reaching any of these tables regardless of what policies exist later.
-- ---------------------------------------------------------------------------
revoke all on
  public.profiles,
  public.categories,
  public.tags,
  public.collections,
  public.documents,
  public.document_tags,
  public.collection_documents,
  public.reminders,
  public.activity
from anon;
