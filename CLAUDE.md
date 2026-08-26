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
| 5     | ✅     | Motion pass (Framer Motion stagger + spring pop), a11y pass, Vitest suite, Playwright smoke                   |
| 6     | ✅     | Real Supabase backend behind `NEXT_PUBLIC_DATA_MODE=supabase` — schema, RLS, storage, auth, middleware       |
| **7** | **⏳** | **Optional intelligence** (OCR, semantic search, Ask Lockerr) behind a provider abstraction                   |

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

No env vars required for local dev. The mock data layer runs by default. To run
against a real backend instead, see `supabase/README.md`.

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
│           ├── data/              DataClient interface + mock and Supabase impls
│           │                     (see contract below)
│           ├── hooks/             use-debounced, use-reduced-motion
│           ├── query-keys.ts
│           └── utils.ts
├── packages/
│   ├── types/                     @lockerr/types — shared domain types
│   ├── validation/                @lockerr/validation — shared Zod schemas
│   └── config/                    @lockerr/config — tsconfig.base.json
└── supabase/                      Migrations, RLS policies, storage bucket
```

### Why no separate Fastify server (yet)

The spec allows one. Supabase covers the whole MVP surface on its own — Phase 6 shipped without a single Route Handler, because RLS makes the browser's anon key safe to use directly. Fastify only becomes worth its weight when Phase 7 lands (OCR, embeddings, background jobs). Do **not** scaffold `apps/api` before it's needed.

---

## Data layer contract (critical — do not violate)

All data access goes through **`@/lib/data`** — that resolves to `apps/web/src/lib/data/index.ts` which exports `data: DataClient`. The interface lives in `apps/web/src/lib/data/client.ts`.

- **Features import `data` from `@/lib/data`. Full stop.**
- Features never import Supabase or the mock client directly.
- If a feature needs a new operation, add it to the `DataClient` interface first, then implement it in **both** clients, then use it. Neither implementation is optional: the mock is what E2E runs against and what someone sees on first run.
- `NEXT_PUBLIC_DATA_MODE=mock` (default) uses `mock-client.ts`. `=supabase` uses `supabase-client.ts`.

This is the single most important architectural rule. It is what made Phase 6 a second implementation rather than a rewrite — no feature file changed.

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

- **Vitest** (`apps/web/vitest.config.ts`, happy-dom env). Unit tests only. Live next to source: `foo.ts` + `foo.test.ts`. Covers `utils`, `expiry`, `timeline-data`, and the Supabase row mappers. Add tests for any new pure helper.
- **Playwright** (`apps/web/playwright.config.ts`). E2E lives in `apps/web/e2e/`. Boots its own dev server on port 3100 so it won't clash with `pnpm dev` on 3000. Each test gets an isolated browser context; mock data is scoped to that context. E2E always runs in mock mode — keep it that way, it needs no backend and no cleanup.

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

### 7. Supabase upload progress needs XHR

`storage.upload()` goes through fetch, which reports nothing until the request
finishes — a large scan would sit at 0% and then jump to done, regressing the
upload dialog. `lib/data/supabase/upload.ts` asks storage for a signed upload
URL and PUTs to it over `XMLHttpRequest` instead, which does emit progress.
If `storage-js` ever grows a real `onUploadProgress`, that file is the only
thing to delete.

### 8. Hand-written database types must be type *aliases*

`lib/data/supabase/database.types.ts` is written by hand to match the
migrations. The row shapes are `type X = {...}`, not `interface X {...}`, on
purpose: PostgREST's generics require `Record<string, unknown>`, and only type
aliases get the implicit index signature that satisfies it. Turn one into an
interface and every query silently degrades to `never` with a wall of
confusing errors.

---

## Phase 6 — what shipped

Real Supabase, gated behind `NEXT_PUBLIC_DATA_MODE=supabase`. The mock client
is untouched and still the default.

- **Migrations** in `supabase/migrations/` — nine tables, each with `user_id`
  and four RLS policies (`user_id = auth.uid()`). A trigger on `auth.users`
  seeds the profile and the eleven default categories in the same transaction
  as the account. `search_tsv` + GIN index exist but nothing reads them yet.
- **Storage** — private `documents` bucket. Object policies compare the first
  segment of `${user_id}/${uuid}-${name}` against `auth.uid()`, so the path
  prefix is the boundary. Reads go through five-minute signed URLs.
- **`supabase-client.ts`** — the second `DataClient`. Row mapping and the
  fiddly query building live in `supabase/mappers.ts`, which is pure and unit
  tested.
- **`middleware.ts`** — refreshes tokens and guards app routes. **No-op in
  mock mode**: the mock session lives in localStorage, which middleware cannot
  see, so redirecting there would lock people out of their own vault.
- **`getDocumentDownloadUrl`** — added to `DataClient`. `getDocumentUrl`
  renders inline; this one arrives as an attachment. They have to be separate
  because a signed URL is cross-origin, where `<a download>` cannot name the
  file and only the server can.

### Things worth knowing before changing it

- `DEFAULT_CATEGORIES` in `mock-client.ts` and the category list in
  `20260826000002_new_user.sql` are the same data in two places. Change one,
  change the other — the two modes are meant to be indistinguishable.
- `database.types.ts` is hand-written. If you add a migration, update it in the
  same commit; nothing at runtime will tell you it drifted. Regenerate with
  `supabase gen types typescript --local`.
- "Documents with *all* of these tags" is not expressible in one PostgREST
  filter. `listDocuments` narrows to a set of ids first — see
  `documentIdsWithAllTags`.
- Search goes through `documentSearchFilter`, which double-quotes the term.
  PostgREST's `or=` grammar is comma-separated, so an unquoted search for
  "insurance, home" would be read as filter syntax.
- The activity feed is a nicety. A failed activity insert warns and moves on;
  it must never take down the upload or edit that produced it.

### Not done in Phase 6

- No Route Handlers. Signed URLs are issued client-side by the RLS-scoped anon
  key, which is exactly as safe and one hop shorter. Add handlers when
  something genuinely needs the service role key.
- `listReminders` reads the real table, but nothing writes to it yet. Reminders
  are still derived from document expiry dates in the UI.
- Both data clients are in the bundle in either mode. The resolver picks at
  runtime, so this can't be tree-shaken. It costs ~40 KB in mock mode.

---

## Phase 7 — what to build next

Optional intelligence, all behind a provider abstraction, all opt-in:

- OCR on upload (Tesseract), text into `documents.search_tsv` — the column and
  its GIN index are already there.
- Semantic search (pgvector) and "Ask Lockerr".
- This is the point where `apps/api` (Fastify) starts earning its weight —
  background jobs, embeddings, scheduled reminder delivery. Not before.

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
- `supabase/README.md` — running the backend locally or hosted, and the security model
- `apps/web/.env.example` — env var contract
- `apps/web/e2e/smoke.spec.ts` — reference for how to author new E2E tests
- Spec conversation lives in git history (`git log`) — first commit references the original brief
