# LockKaro

**Lock it. Clock it.**
A calm, private vault for the paperwork of your life — IDs, insurance, degrees, receipts, all in one place and ready when you need them.

LockKaro is a frontend-first portfolio project that stores, organizes, previews, and tracks the paperwork you actually need. Two verbs earn their spot in the product: **Lock** for a private local-or-Supabase vault, **Clock** for expiry tracking, reminders, and a full timeline of everything that happens in it. Designed to feel like a real consumer product rather than a CRUD demo.

---

## Status

The current build ships **Phases 0–6**:

- ✅ Monorepo foundation, design system, tokens, dark mode
- ✅ Auth: sign up / sign in / sign out with session persistence — browser-local by default, Supabase Auth in `supabase` mode
- ✅ Fully responsive shell — desktop sidebar, mobile bottom nav, tablet collapsible sheet
- ✅ Vault MVP — drag-and-drop upload (multi-file, per-file progress), grid & list views, image + PDF preview with zoom/pan, rename / favorite / archive / delete / download, categorization on upload and edit
- ✅ Dashboard — storage used, uploaded-this-month, needs-attention, favorites; recently added; category breakdown; recent activity linking into timeline
- ✅ Empty / loading / error states across every page
- ✅ **Phase 3** — tags (create-on-the-fly, filter, chips on rows), collections (create/rename/delete, detail view, add-to-collection sub-menu), categories browse page with document counts, filter popover on desktop + bottom sheet on mobile, sort dropdown, debounced search
- ✅ Global **command palette** (⌘K / Ctrl+K): search documents, jump to any collection, upload, view favorites/expiring, navigate sections, lock vault
- ✅ Keyboard shortcuts: `⌘K` palette · `U` upload · `/` focus vault search · `G` then `D/V/C/L/R/T` to navigate
- ✅ **Phase 4** — visual **timeline** grouped by month (uploads, updates, favorites, document dates, expiries, reminders) with sticky headers; **reminders** with Soon / Later / Expired / All tabs, days-remaining prominence, and a summary strip; live count badge on the Expiring nav item
- ✅ **Phase 5 — Polish** — motion pass (Framer Motion stagger on the document grid, animated expand for upload metadata, favorite-star spring pop), a11y pass (skip-link, `aria-live` upload status, sidebar landmarks, always-visible actions on touch), **Vitest** suite (67 tests) covering utils/expiry/timeline/mapper helpers, **Playwright** smoke tests for signup + keyboard shortcut flow
- ✅ **Phase 6 — Real backend** — Supabase Postgres, Auth and Storage behind `NEXT_PUBLIC_DATA_MODE=supabase`; migrations with row level security on every table, a private bucket reachable only through short-lived signed URLs, real per-file upload progress. The browser-local mock stays the default and the first-run experience.
- ✅ **Phase 7.1 — Text extraction** — Every document uploaded gets its text extracted **client-side**: PDF.js reads embedded text layers, Tesseract.js OCRs images, all off the main thread. Nothing is sent to a server. A new **Content** tab on document detail shows the extracted text with copy + re-extract actions. Storage lives in a new `document_texts` table with a GIN-indexed `tsvector` column, ready for Postgres full-text search whenever we want it.

**Roadmap (not yet built):** custom categories, bulk actions, richer sample data seeding, live deployment + screenshots. Cloud AI features (Ask LockKaro, semantic embeddings, auto-classification) are explicitly out of scope — the project stays private-by-default with no third-party APIs.

---

## Tech stack

| Concern      | Choice                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| App          | Next.js 15 (App Router) · React 19 · TypeScript strict                 |
| Styling      | Tailwind CSS · CSS variables · shadcn-style primitives                 |
| UI           | Radix Primitives · lucide-react · sonner · Framer Motion               |
| Forms / validation | React Hook Form · Zod                                            |
| Client state | Zustand                                                                |
| Server state | TanStack Query                                                         |
| Data layer   | Pluggable interface — browser-local mock or Supabase, one env var apart |
| Storage      | IndexedDB + localStorage (mock) · Postgres + private bucket (Supabase) |
| Package mgr  | pnpm workspaces                                                        |
| Testing      | Vitest · Playwright                                                    |

### Why the data layer is pluggable

Everything reads and writes through `apps/web/src/lib/data/client.ts` (a `DataClient` interface). Two implementations satisfy it: a mock backed by localStorage + IndexedDB, and a Supabase one. `NEXT_PUBLIC_DATA_MODE` picks between them in `lib/data/index.ts`, and no feature code knows which it got — Phase 6 added a second implementation and changed nothing above the data layer.

### Why no separate Fastify server (yet)

The spec allows for a Fastify API. For the MVP surface (auth + CRUD on documents), Supabase + Next.js Route Handlers already provide the same capabilities without duplication. Fastify becomes worth its weight when background work appears — OCR, embeddings, scheduled reminders — and will be added under `apps/api` at that point.

---

## Project structure

```
lockkaro/
├── apps/
│   └── web/                          Next.js 15 app (primary product)
│       └── src/
│           ├── app/
│           │   ├── (marketing)/      Public landing, sign-in, sign-up
│           │   └── (app)/            Auth-guarded app: dashboard, vault, etc.
│           ├── features/             Feature-oriented modules
│           │   ├── auth/
│           │   ├── dashboard/
│           │   ├── documents/
│           │   ├── preview/
│           │   ├── shell/            Sidebar, mobile nav, user menu
│           │   └── upload/
│           ├── components/
│           │   ├── ui/               Design-system primitives
│           │   └── brand/            Logo, wordmark
│           └── lib/
│               ├── data/             DataClient interface + mock impl
│               ├── query-keys.ts
│               └── utils.ts
├── packages/
│   ├── types/                        Shared domain types
│   ├── validation/                   Shared Zod schemas
│   └── config/                       tsconfig.base.json etc.
└── supabase/                         Migrations, RLS policies, storage bucket
```

---

## Screenshots

![Landing](docs/screenshots/landing.png)
![Dashboard](docs/screenshots/dashboard.png)
![Vault](docs/screenshots/vault-grid.png)
![Document detail](docs/screenshots/document.png)
![Timeline](docs/screenshots/timeline.png)
![Reminders](docs/screenshots/reminders.png)
![Command palette](docs/screenshots/palette.png)
![Mobile](docs/screenshots/mobile.png)

Screenshots that don't exist yet won't render — they'll show as broken image
placeholders on GitHub. See [`docs/screenshots/README.md`](docs/screenshots/README.md)
for capture setup and sizing, or [`DEPLOYMENT.md`](DEPLOYMENT.md) if you're
running through the live-deploy checklist.

---

## Local development

**Requirements:** Node.js ≥ 20, pnpm 11 (via corepack: `corepack enable && corepack prepare pnpm@latest --activate`).

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. Create an account on the sign-up page — by default, accounts and files are stored **locally on your device** (localStorage for records, IndexedDB for file blobs). Nothing leaves the browser and no backend is required.

### Running against Supabase

Optional. The app is fully usable without it.

1. Create a Supabase project, or run one locally with `supabase start`.
2. Apply the migrations: `supabase db push` (or `supabase db reset` locally).
3. Put the project URL and anon key in `apps/web/.env.local`, with
   `NEXT_PUBLIC_DATA_MODE=supabase`.
4. `pnpm dev`.

See [`supabase/README.md`](supabase/README.md) for the details, including the
security model.

### Deploy to production

See [`DEPLOYMENT.md`](DEPLOYMENT.md) — end-to-end Vercel + Supabase walkthrough
that gets you a live URL in about 30 minutes.

### Scripts

```bash
pnpm dev           # start Next.js dev server on :3000
pnpm build         # production build
pnpm start         # start production server
pnpm typecheck     # tsc across all packages
pnpm lint          # ESLint on the web app
```

### Testing

```bash
# Unit tests — pure helpers (utils, expiry, timeline). Fast, no browser.
pnpm --filter @lockerr/web test
pnpm --filter @lockerr/web test:watch

# End-to-end (Playwright + Chromium). One-time browser install:
pnpm --filter @lockerr/web e2e:install
pnpm --filter @lockerr/web e2e
```

E2E tests boot their own Next server on port 3100, sign a new user up (mock auth, no cleanup needed — each test gets an isolated browser context), and verify a couple of core flows. Extend `apps/web/e2e/*.spec.ts` as new critical paths land.

### Environment variables

Copy `.env.example` (in `apps/web/`) to `.env.local`. The defaults are fine — no env is required for local development in mock mode.

```bash
NEXT_PUBLIC_DATA_MODE=mock            # or "supabase"

# Required only in supabase mode. Both are safe in the browser bundle: row
# level security means the anon key can only reach the signed-in user's rows.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Bypasses row level security. Server-side only, never committed.
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Design system

Tokens live in `apps/web/src/app/globals.css` and are consumed via Tailwind theme extensions in `tailwind.config.ts`.

- **Type**: Inter (UI), JetBrains Mono (metadata) — loaded via `next/font`
- **Accent**: indigo (`--primary`)
- **Neutral**: zinc, with distinct `--background` / `--surface` / `--card` layers
- **Radius**: `--radius: 0.625rem` — single scale, no per-component drift
- **Motion**: short (150–200ms), disabled under `prefers-reduced-motion`

Primitives (Button, Input, Dialog, Sheet, DropdownMenu, Tabs, Select, Skeleton, EmptyState, Card, Badge, Progress, Tooltip, Avatar, Separator) live in `apps/web/src/components/ui/`. Feature components compose these — no arbitrary styling scattered around.

---

## Accessibility

Baked in from day one:

- Semantic HTML, ARIA where Radix doesn't provide it
- Visible focus rings on every interactive element (`.focus-ring` utility)
- Full keyboard navigation
- Touch targets ≥ 44px on mobile controls
- `prefers-reduced-motion` respected globally
- No color-only status indicators (icons + text accompany colored badges)

---

## Responsive design

Not a shrunk desktop — a genuinely different layout per breakpoint:

| Breakpoint | Navigation                                       | Vault view                |
| ---------- | ------------------------------------------------ | ------------------------- |
| Mobile     | Compact top bar + bottom nav with elevated FAB   | 2-col grid                |
| Tablet     | Same as mobile until `md`, then sidebar          | 3-col grid                |
| Desktop    | Sidebar with user menu + upload CTA              | 4–5-col grid or list view |

Menus, filters, and confirmations use appropriate primitives per surface (Dialog on desktop, Sheet on mobile).

---

## Security & privacy notes

The posture depends on which data mode you run.

**Mock mode (the default).** Everything stays on the device and no data leaves
the browser. The password hash is a plain SHA-256 — it is **not**
cryptographically secure and must not be used to protect real credentials. It
exists so the UI can be developed end to end without a backend.

**Supabase mode.** There is no application server in front of Postgres: the
browser talks to it directly with the anon key, so row level security *is* the
boundary, not a second line of defence behind one.

- Supabase Auth for identity. Tokens are refreshed in middleware and verified
  by Postgres on every request.
- RLS enabled on all nine tables, each with the same policy shape:
  `user_id = (select auth.uid())` for select, insert, update and delete. `anon`
  has no table grants at all — verified against a real hosted project, whose
  default privileges hand `anon` full CRUD otherwise.
- Private storage bucket. Object policies compare the first segment of
  `${user_id}/${uuid}-${filename}` against `auth.uid()`, so the path prefix is
  the boundary rather than a convention.
- Files are read through signed URLs that expire in five minutes. No object is
  publicly addressable.
- Storage paths are generated, never client-supplied, and file names are
  sanitized so they cannot introduce a path separator.
- File type and size limits are enforced by the client and again by the bucket
  (25 MB; PDF and common image types only).
- Secure response headers, configured in `next.config.mjs`.

Explicit non-goals in either mode: custom cryptography, "zero-knowledge"
claims, or anything that would require security guarantees this project can't
prove.

---

## Roadmap

- [x] **Phase 3 — Organize & find**: tags, collections, filters, sorting, command palette (⌘K), keyboard shortcuts
- [x] **Phase 4 — Track**: timeline, expired/soon/later reminders, expiry badge in nav, dashboard insights
- [x] **Phase 5 — Polish**: motion pass, a11y improvements, Vitest suite, Playwright smoke tests, screenshots scaffold
- [x] **Phase 6 — Real backend**: Supabase Postgres + Storage + Auth, RLS policies, migrations
- [x] **Phase 7.1 — Text extraction**: client-side PDF.js + Tesseract.js, `document_texts` table, Content tab

**Cloud AI is intentionally out of scope.** Suggested metadata, semantic search,
and RAG Q&A were on the original plan but relied on a paid LLM provider. The
project stays private-by-default: everything happens either in the user's
browser or in the user's own Supabase project — no third-party model APIs.

Open threads worth doing next (all free of any external service):

- [ ] Deploy to Vercel + a hosted Supabase project, capture the screenshots referenced above
- [ ] User-created categories (icon + color picker)
- [ ] Bulk actions in the vault (multi-select archive / delete / move to collection)
- [ ] "Load sample data" button for demos and first-run

Each phase is designed to leave the app in a shippable, working state.

---

## License

Portfolio project — not licensed for redistribution.
