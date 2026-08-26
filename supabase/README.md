# Supabase

Everything the `supabase` data mode needs: schema, policies, and the storage
bucket. The app still runs entirely without this — `NEXT_PUBLIC_DATA_MODE=mock`
is the default and needs no backend at all.

## Layout

```
supabase/
├── config.toml     Local stack settings (supabase start)
└── migrations/
    ├── 20260826000001_init.sql      Tables, indexes, RLS policies
    ├── 20260826000002_new_user.sql  Profile + default categories on sign-up
    └── 20260826000003_storage.sql   Private bucket + object policies
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

## The security model

There is no trusted server in front of Postgres. The browser holds the anon
key and talks to the database directly, so **row level security is the entire
boundary**:

- Every table has RLS enabled and one policy shape: `user_id = auth.uid()`.
- The `documents` storage bucket is private. Object policies compare the first
  path segment of `${user_id}/${uuid}-${filename}` against `auth.uid()`.
- Files are read through signed URLs that expire in five minutes. No object is
  ever publicly addressable.

If you add a table, add its policies in the same migration. A table with RLS
enabled and no policies is invisible; a table without RLS is readable by every
account.
