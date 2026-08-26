# CLAUDE.md — Lockerr

> This file is loaded automatically at the start of every Claude Code session in this repo.
> Read it once, then continue. It captures the decisions and traps that aren't obvious from the code alone.

---

## What Lockerr is

A private, personal document vault. Users upload, organize, preview, search, and track important paperwork (IDs, invoices, warranties, insurance, certificates). Portfolio-quality frontend project — **not a CRUD demo, not an admin dashboard**.

The core loop: **upload → understand → organize → search → preview → track → retrieve.**

## Quality bar (non-negotiable)

- Frontend-first. Backend is intentionally thin.
- Mobile responsiveness is first-class, not a later polish.
- Every major feature has loading / empty / error / success states.
- A11y baseline: keyboard nav, visible focus, screen reader labels, `prefers-reduced-motion`, no color-only status.
- Optimize for **product quality**, not feature count. If you're tempted to bolt on a feature that isn't in the current phase, don't.

## Current status

| Phase | State  | Summary                                                                                                       |
|:-----:|:------:|:--------------------------------------------------------------------------------------------------------------|
| 0     | ✅     | Monorepo, Next.js 15 + TS strict, Tailwind, design tokens, providers                                          |
| 1     | ✅     | Mock auth, responsive shell (sidebar / mobile bottom nav / tablet sheet), theme                               |
| 2     | ✅     | Vault MVP: upload dialog v2, grid/list, image + PDF preview, favorite/archive/delete/download, categorize    |
| 3     | ✅     | Tags, collections, categories browse, filter popover + bottom sheet, sort, ⌘K palette, keyboard shortcuts    |
| 4     | ✅     | Visual timeline, reminders tabs (Soon/Later/Expired/All), expiring nav badge, dashboard insights             |
| 5     | ✅     | Motion pass (Framer Motion stagger + spring pop), a11y pass, Vitest suite (26 tests), Playwright smoke      |
| **6** | **⏳** | **Real Supabase backend** — see "Phase 6 — what to build next" below                                          |
| 7     | ⏳     | Optional intelligence (OCR, semantic search, Ask Lockerr) behind a provider abstraction                       |

---

## Quick start

Requires Node ≥ 20 and pnpm 11 (via corepack).

```bash
pnpm install          # once
pnpm dev              # http://localhost:3000
pnpm test             # vitest (unit)
pnpm e2e:install      # one-time: install Playwright chromium
pnpm e2e              # playwright (uses port 3100)
pnpm typecheck        # tsc across all workspaces
```

No env vars required for local dev. The mock data layer runs by default.

---

## Architecture

```
lockerr/
├── apps/web/                      Next.js 15 App Router. Everything user-facing.
│   └── src/
│       ├── app/
│       │   ├── (marketing)/       Public landing + auth
│       │   └── (app)/             Auth-guarded shell (dashboard, vault, timeline, etc.)
│       ├── features/              Feature-oriented modules (auth, documents, upload,
│       │                          collections, tags, timeline, reminders, dashboard,
│       │                          command-palette, shell, preview, categories)
│       ├── components/
│       │   ├── ui/                shadcn-style primitives — reuse, do not duplicate
│       │   └── brand/             Logo, wordmark
│       └── lib/
│           ├── data/              DataClient interface + mock impl (see contract below)
│           ├── hooks/             use-debounced, use-reduced-motion
│           ├── query-keys.ts
│           └── utils.ts
├── packages/
│   ├── types/                     @lockerr/types — shared domain types
│   ├── validation/                @lockerr/validation — shared Zod schemas
│   └── config/                    @lockerr/config — tsconfig.base.json
└── supabase/                      Reserved for Phase 6 migrations + seed
```

### Why no separate Fastify server (yet)

The spec allows one. Supabase + Next.js Route Handlers cover the MVP surface without duplication. Fastify only becomes worth its weight when Phase 7 lands (OCR, embeddings, background jobs). Do **not** scaffold `apps/api` before it's needed.

---

## Data layer contract (critical — do not violate)

All data access goes through **`@/lib/data`** — that resolves to `apps/web/src/lib/data/index.ts` which exports `data: DataClient`. The interface lives in `apps/web/src/lib/data/client.ts`.

- **Features import `data` from `@/lib/data`. Full stop.**
- Features never import Supabase or the mock client directly.
- If a feature needs a new operation, add it to the `DataClient` interface first, implement it in the mock client, then use it.
- `NEXT_PUBLIC_DATA_MODE=mock` (default) uses `mock-client.ts`. `=supabase` will use the Supabase implementation (Phase 6).

This is the single most important architectural rule. Break it and Phase 6 becomes a rewrite instead of a swap.

### Mock client behavior (for testing)

- Accounts + records in `localStorage` (key prefix `lockerr.*`).
- File blobs in IndexedDB (`lockerr-files` DB, `files` store).
- SHA-256 password hash — **not cryptographically secure**, demo only.
- Categories seeded on signup (see `DEFAULT_CATEGORIES` in `mock-client.ts`).

To reset in the browser: DevTools → Application → Clear site data.

---

## Feature-oriented structure

Features own their own components, hooks, and stores. Cross-feature imports are fine when it's a leaf (e.g., `TagPicker`, `DocumentIcon`), but do not create a feature that reaches deep into another feature's internals. Prefer lifting a shared piece into `components/ui/` or `lib/`.

Zustand stores for UI state (`useUploadDialog`, `useCommandPalette`). TanStack Query for server state (`useDocuments`, `useCollections`, `useTags`, `useCategories`, `useActivity`). Do not mix.

Query keys live in `apps/web/src/lib/query-keys.ts` — always use the `qk` helper, never inline strings, so invalidations stay in sync.

---

## Design system

Tokens in `apps/web/src/app/globals.css` (CSS variables), consumed by Tailwind in `tailwind.config.ts`.

- Palette: zinc neutral + indigo `--primary` accent. Full light/dark.
- Type: Inter (UI), JetBrains Mono (metadata) via `next/font`.
- Radius: `--radius: 0.625rem` — single scale, no per-component drift.
- Shadows: `shadow-subtle` / `shadow-elevated` only. Do not stack shadows.
- Motion: short (150–250ms). Framer Motion respects `prefers-reduced-motion` natively.

Primitives (Button, Input, Textarea, Select, Dialog, Sheet, Popover, DropdownMenu, Tabs, Command, Skeleton, EmptyState, Badge, Card, Progress, Tooltip, Avatar, Separator, Checkbox) live in `components/ui/`. **Compose these, don't ad-hoc.**

---

## Keyboard model

- `⌘K` / `Ctrl+K` — command palette (always available, even in inputs)
- `U` — upload dialog
- `/` — focus vault search
- `?` — palette
- `Shift+Q` — lock vault
- `G` then `D`/`V`/`C`/`L`/`T`/`R` — dashboard / vault / categories / collections / timeline / reminders

Ignored while typing in inputs (except `⌘K`). Wired in `features/command-palette/use-shortcuts.ts`.

---

## Testing

- **Vitest** (`apps/web/vitest.config.ts`, happy-dom env). Unit tests only. Live next to source: `foo.ts` + `foo.test.ts`. Currently covers `utils`, `expiry`, `timeline-data`. Add tests for any new pure helper.
- **Playwright** (`apps/web/playwright.config.ts`). E2E lives in `apps/web/e2e/`. Boots its own dev server on port 3100 so it won't clash with `pnpm dev` on 3000. Each test gets an isolated browser context; mock data is scoped to that context.

Do **not** write tests for React components unless there's real logic to cover. UI look-and-feel is verified by hand + Playwright smoke.

---

## Gotchas (real ones we hit)

### 1. pnpm 11 refuses to run install scripts by default

`sharp`, `unrs-resolver`, and `esbuild` have postinstall build steps. pnpm 11's supply-chain policy blocks them unless explicitly approved.

Fix already in `pnpm-workspace.yaml`:
```yaml
allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
onlyBuiltDependencies:
  - esbuild
  - sharp
  - unrs-resolver
```

If a **new** native package is added and install fails with `ERR_PNPM_IGNORED_BUILDS`, add it to both lists and re-run `pnpm install`.

### 2. `verify-deps-before-run` disabled

`.npmrc` sets `verify-deps-before-run=false`. Without this, pnpm re-runs `pnpm install` before every `dev`/`build` and can trip the same allowBuilds error. Leave it disabled.

### 3. Port conflicts

- `pnpm dev` — port **3000**
- `pnpm e2e` / Playwright dev server — port **3100** (configurable via `PLAYWRIGHT_PORT`)

If you get `EADDRINUSE`, kill the offender: `lsof -ti:3000 | xargs kill -9`.

### 4. Radix `Slot` children

`<Button asChild>` requires exactly one React element child. If you get "React.Children.only expected to receive a single React element child", check what's inside `asChild`.

### 5. Sonner toast styling

Toasts are styled via `classNames` in `providers.tsx` — do not add another Toaster instance elsewhere.

### 6. PDF preview via `<object>`

We deliberately use the browser's native PDF viewer via `<object>` (not `react-pdf`) to keep the bundle small. If Phase 7 needs OCR / annotation / page thumbnails, switch to PDF.js at that point.

### 7. `stripExtension` lives twice

In `mock-client.ts` (server-ish) and `upload-dialog.tsx` (UI). If Phase 6 needs it on the real backend, extract to `packages/validation` or `lib/utils`.

---

## Phase 6 — what to build next

**Real Supabase**, gated behind `NEXT_PUBLIC_DATA_MODE=supabase`. Keep the mock client working — don't delete it.

### Plan

1. **Supabase project setup**
   - Provision project (dashboard). Get URL + anon key + service role key.
   - Add to `.env.local` (don't commit). Extend `.env.example` with the new vars.

2. **Database migrations** in `supabase/migrations/`
   - `profiles`, `categories`, `documents`, `tags`, `document_tags`, `collections`, `collection_documents`, `reminders`, `activity`.
   - Every table has `user_id uuid references auth.users(id) on delete cascade`.
   - RLS **on** for every table. Policy: `user_id = auth.uid()` for select/insert/update/delete.
   - Add a trigger to seed default categories on `auth.users` insert (or do it client-side on first login — pick one).
   - Add `search_tsv tsvector` column on documents + GIN index (unused today, ready for FTS in Phase 7).

3. **Storage**
   - Private bucket `documents`. Path convention: `${user_id}/${uuid}-${sanitized_filename}`.
   - RLS on storage.objects: user can only touch their own path prefix.
   - Downloads via short-lived signed URLs (client requests, server issues).

4. **Supabase data client** at `apps/web/src/lib/data/supabase-client.ts`
   - Implements the `DataClient` interface. Same public surface as mock.
   - `getSession()` uses `supabase.auth.getSession()`.
   - `uploadDocument` uploads via `supabase.storage.from('documents').upload(...)` with progress via the `onUploadProgress` option, then inserts the row.
   - `getDocumentUrl` returns a signed URL (expiry ~5 min).

5. **Switch resolver** in `apps/web/src/lib/data/index.ts` — actually pick between mock and Supabase based on `NEXT_PUBLIC_DATA_MODE`. Today it always returns the mock even when set to supabase (see the file).

6. **Auth**
   - Swap the mock signup/signin for `supabase.auth.signUp` / `signInWithPassword`.
   - Middleware in `apps/web/src/middleware.ts` (new file) to refresh sessions server-side.
   - Route Handlers use `createServerClient` with cookies for authorized DB calls.

7. **Migrations tooling**
   - Use Supabase CLI (`supabase start` for local Postgres stack via Docker, or hit the cloud project directly).
   - `supabase db push` from `supabase/` directory.

8. **Update README** — swap "local-only mock" claims for real security posture. Update `.env.example`.

### Things to preserve during the swap

- The upload dialog v2 flow — do not regress it.
- The `DataClient` interface — extend if needed, but every existing method stays.
- Query keys — do not change shape or invalidations will silently break.
- The mock client — keep it as a first-run experience and for E2E tests (Playwright doesn't need a real backend).

### Explicit non-goals for Phase 6

- Do not introduce Fastify. Route Handlers + Supabase are enough.
- Do not implement custom crypto. Signed URLs + RLS are the security model.
- Do not scaffold OCR / embeddings — that's Phase 7.

---

## Voice for user-facing copy

Calm, private, personal. Short sentences. No emojis. Never "AI-generated-sounding" (avoid "Discover", "Unleash", "Elevate", "Journey"). Look at existing empty-state text for tone.

Examples:
- "Your vault is empty." · "Upload your first important document."
- "Nothing expiring in the next 60 days."
- "Lock vault (sign out)" — not "Log out"
- "A quiet record of your vault."

---

## Related documentation

- Root **README.md** — public-facing project overview, screenshots, roadmap
- `apps/web/.env.example` — env var contract
- `apps/web/e2e/smoke.spec.ts` — reference for how to author new E2E tests
- Spec conversation lives in git history (`git log`) — first commit references the original brief
