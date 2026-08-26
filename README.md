# Lockerr

**A private, personal document vault.**
Where is that important document? Right here, calmly organized and ready when you need it.

Lockerr is a frontend-first portfolio project that stores, organizes, previews, and tracks the paperwork of your life — IDs, invoices, warranties, degrees, insurance, receipts. It is designed to feel like a real consumer product rather than a CRUD demo.

---

## Status

The current build ships **Phases 0–5**:

- ✅ Monorepo foundation, design system, tokens, dark mode
- ✅ Auth (mock, local-only): sign up / sign in / sign out with session persistence
- ✅ Fully responsive shell — desktop sidebar, mobile bottom nav, tablet collapsible sheet
- ✅ Vault MVP — drag-and-drop upload (multi-file, per-file progress), grid & list views, image + PDF preview with zoom/pan, rename / favorite / archive / delete / download, categorization on upload and edit
- ✅ Dashboard — storage used, uploaded-this-month, needs-attention, favorites; recently added; category breakdown; recent activity linking into timeline
- ✅ Empty / loading / error states across every page
- ✅ **Phase 3** — tags (create-on-the-fly, filter, chips on rows), collections (create/rename/delete, detail view, add-to-collection sub-menu), categories browse page with document counts, filter popover on desktop + bottom sheet on mobile, sort dropdown, debounced search
- ✅ Global **command palette** (⌘K / Ctrl+K): search documents, jump to any collection, upload, view favorites/expiring, navigate sections, lock vault
- ✅ Keyboard shortcuts: `⌘K` palette · `U` upload · `/` focus vault search · `G` then `D/V/C/L/R/T` to navigate
- ✅ **Phase 4** — visual **timeline** grouped by month (uploads, updates, favorites, document dates, expiries, reminders) with sticky headers; **reminders** with Soon / Later / Expired / All tabs, days-remaining prominence, and a summary strip; live count badge on the Expiring nav item
- ✅ **Phase 5 — Polish** — motion pass (Framer Motion stagger on the document grid, animated expand for upload metadata, favorite-star spring pop), a11y pass (skip-link, `aria-live` upload status, sidebar landmarks, always-visible actions on touch), **Vitest** suite (26 tests) covering utils/expiry/timeline helpers, **Playwright** smoke tests for signup + keyboard shortcut flow

**Roadmap (not yet built):** custom categories, real Supabase integration, OCR / semantic search / AI features. See [Roadmap](#roadmap).

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
| Data layer   | Pluggable interface — mock (local) today, Supabase later               |
| Storage      | IndexedDB for file blobs, localStorage for records (mock mode)         |
| Package mgr  | pnpm workspaces                                                        |
| Testing (planned) | Vitest · Playwright                                               |

### Why the data layer is pluggable

Everything reads/writes through `apps/web/src/lib/data/client.ts` (a `DataClient` interface). Today it is backed by a mock (localStorage + IndexedDB). Swapping to Supabase in a later phase means adding one implementation of the same interface — no feature code changes.

### Why no separate Fastify server (yet)

The spec allows for a Fastify API. For the MVP surface (auth + CRUD on documents), Supabase + Next.js Route Handlers already provide the same capabilities without duplication. Fastify becomes worth its weight when background work appears — OCR, embeddings, scheduled reminders — and will be added under `apps/api` at that point.

---

## Project structure

```
lockerr/
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
└── supabase/                         (Reserved for Phase 6+ migrations & seed)
```

---

## Screenshots

Place captures in `docs/screenshots/` and reference them here.

| View          | Path                                  |
| ------------- | ------------------------------------- |
| Landing       | `docs/screenshots/landing.png`        |
| Dashboard     | `docs/screenshots/dashboard.png`      |
| Vault (grid)  | `docs/screenshots/vault-grid.png`     |
| Document      | `docs/screenshots/document.png`       |
| Timeline      | `docs/screenshots/timeline.png`       |
| Reminders     | `docs/screenshots/reminders.png`      |
| Command palette | `docs/screenshots/palette.png`      |
| Mobile        | `docs/screenshots/mobile.png`         |

Suggested capture size: **1440×900** for desktop views, **390×844** (iPhone 14) for mobile.

---

## Local development

**Requirements:** Node.js ≥ 20, pnpm 11 (via corepack: `corepack enable && corepack prepare pnpm@latest --activate`).

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. Create an account on the sign-up page — accounts and files are stored **locally on your device** in this build (localStorage for records, IndexedDB for file blobs).

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

Copy `.env.example` (in `apps/web/`) if you want to explicitly set the data mode. The defaults are fine — no env is required for local development.

```bash
NEXT_PUBLIC_DATA_MODE=mock     # or "supabase" once real integration lands
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

This build stores everything locally on the user's device. No data leaves the browser. The mock auth is **not** cryptographically secure and should not be used to protect real credentials — it exists so the UI can be developed end-to-end without a backend.

When the Supabase implementation lands (Phase 6+), security controls will include:

- Supabase Auth for identity, sessions verified server-side
- Row-Level Security policies on every table (`user_id = auth.uid()`)
- Private storage bucket; downloads via short-lived signed URLs
- File type + size validation on both client and server
- Safe file name sanitization + server-generated storage paths (never client-supplied)
- Secure response headers (already configured in `next.config.mjs`)

Explicit non-goals for the current build: custom cryptography, "zero-knowledge" claims, or anything that would require security guarantees this project can't prove.

---

## Roadmap

- [x] **Phase 3 — Organize & find**: tags, collections, filters, sorting, command palette (⌘K), keyboard shortcuts
- [x] **Phase 4 — Track**: timeline, expired/soon/later reminders, expiry badge in nav, dashboard insights
- [x] **Phase 5 — Polish**: motion pass, a11y improvements, Vitest suite (26 tests), Playwright smoke tests, screenshots scaffold
- [ ] **Phase 6 — Real backend**: Supabase Postgres + Storage + Auth, RLS policies, migrations
- [ ] **Phase 7 — Optional intelligence**: OCR (Tesseract), classification, semantic search (pgvector), Ask Lockerr — all behind a provider abstraction, all opt-in

Each phase is designed to leave the app in a shippable, working state.

---

## Screenshots

_To be added after Phase 3._

---

## License

Portfolio project — not licensed for redistribution.
