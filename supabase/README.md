# Supabase

Everything the `supabase` data mode needs: schema, policies, and the storage
bucket. The app still runs entirely without this — `NEXT_PUBLIC_DATA_MODE=mock`
is the default and needs no backend at all.

## Layout

```
supabase/
├── config.toml     Local stack settings (supabase start)
└── migrations/
    ├── 20260826000001_init.sql        Tables, indexes, RLS policies, grants
    ├── 20260826000002_new_user.sql    Profile + default categories on sign-up
    ├── 20260826000003_storage.sql     Private bucket + object policies
    ├── 20260826000004_harden_functions.sql  search_path pinning, EXECUTE revoke
    ├── 20260826000005_revoke_anon.sql       Explicit anon lockout (see below)
    └── 20260826000006_rls_performance.sql   auth.uid() initplan wrapping, FK indexes
```

## Local Postgres

Requires Docker and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase start          # boots Postgres, Auth, Storage, Studio
supabase db reset       # re-applies every migration from scratch
```

`supabase start` prints an API URL and anon key. Put them in
`apps/web/.env.local` along with `NEXT_PUBLIC_DATA_MODE=supabase`, then
`pnpm dev`.

## A hosted project

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Read the URL and anon key off the project's API settings page.

Email confirmations are off in `config.toml` so that sign-up lands you in the
vault immediately. That is a local convenience — turn them on for anything
real.

A fresh hosted project's built-in mailer has a strict send-rate limit
(a handful of emails per hour on the free tier), which real sign-up traffic
never notices but rapid manual/automated testing does — you'll see
`over_email_send_rate_limit` on the second or third sign-up in quick
succession. That's the mailer's rate limit, not a bug in this schema.

## The security model

There is no trusted server in front of Postgres. The browser holds the anon
key and talks to the database directly, so **row level security is the entire
boundary**:

- Every table has RLS enabled and one policy shape:
  `user_id = (select auth.uid())` — wrapped in a `select` so Postgres
  evaluates it once per query instead of once per row (see
  `20260826000006_rls_performance.sql`).
- `anon` has no table grants at all (`20260826000005_revoke_anon.sql`).
  A hosted project's default privileges hand `anon` full CRUD on every
  `public` table otherwise — broader than the local CLI stack reproduces —
  so this is verified against a real project, not assumed.
- The `documents` storage bucket is private. Object policies compare the first
  path segment of `${user_id}/${uuid}-${filename}` against `auth.uid()`.
- Files are read through signed URLs that expire in five minutes. No object is
  ever publicly addressable.
- `handle_new_user()` and `touch_updated_at()` both pin `search_path = ''`,
  and `handle_new_user()`'s direct EXECUTE grant is revoked — it only ever
  needs to run as a trigger (`20260826000004_harden_functions.sql`).

If you add a table, add its policies in the same migration, wrap `auth.uid()`
the same way, and remember `anon` gets nothing. A table with RLS enabled and
no policies is invisible; a table without RLS is readable by every account.
After any schema change, `get_advisors` (Supabase's own linter) is worth a
run — it caught three of the six migrations' worth of hardening in this repo.
