# Deploying Lockerr

This walks through getting Lockerr live at a public URL — Supabase (database
+ auth + storage) plus Vercel (Next.js hosting), which is the fastest free
path. Both services have free tiers generous enough for a portfolio demo.

You will end up with:

- `https://<something>.vercel.app` — the app
- A hosted Supabase project with your schema applied
- Working sign-up, upload, extract-text — end to end, no local server

Estimated time: **~30 minutes** if you already have accounts, ~45 with signups.

---

## Prerequisites

- A **GitHub** account, and this repo pushed to it
- A **Supabase** account (<https://supabase.com>) — free tier is fine
- A **Vercel** account (<https://vercel.com>) — free tier is fine
- The **Supabase CLI** installed locally (`brew install supabase/tap/supabase`
  or see <https://supabase.com/docs/guides/cli>). Only used to apply
  migrations; not needed after.

---

## Step 1 — Hosted Supabase project

1. Go to <https://supabase.com/dashboard/new> and create a project.
   - Pick a **strong database password** (you won't need to type it again, but
     write it down somewhere safe).
   - **Region**: pick the one closest to you.
   - Wait ~2 minutes for provisioning.

2. Grab the two values you'll need. In the project dashboard:
   - **Settings → API → Project URL** — this is `NEXT_PUBLIC_SUPABASE_URL`.
   - **Settings → API → anon public** — this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

   Both of these are safe to expose to the browser. The service role key on
   the same page is **not** — never put it in an `NEXT_PUBLIC_` variable, and
   never commit it.

3. Apply the migrations from your local machine:

   ```bash
   cd supabase
   supabase link --project-ref <your-project-ref>
   # (The CLI will ask for your database password; that's the one from step 1.)
   supabase db push
   ```

   `<your-project-ref>` is the string in the project URL:
   `https://<project-ref>.supabase.co`. You can also find it under Settings →
   General.

   You should see all seven migrations apply in order (init → new_user →
   storage → harden_functions → revoke_anon → rls_performance → document_texts).

4. Confirm the schema landed. In the Supabase dashboard:
   - **Table editor** → you should see `profiles`, `categories`, `documents`,
     `document_texts`, `tags`, `collections`, `document_tags`,
     `collection_documents`, `reminders`, `activity`.
   - **Storage** → you should see a private bucket named `documents`.
   - **Authentication → Providers → Email** → make sure Email is enabled.
     Optional: turn **Confirm email** off so sign-up drops users straight
     into the vault. (You can leave it on for a stricter demo — you'll just
     need to click a confirmation email.)

5. Optional but recommended: bump the file upload limit for the `documents`
   bucket to at least **25 MB** in **Storage → Policies → documents → Bucket
   settings** if it's not already there. The app's client-side validation caps
   at 25 MB; matching the bucket avoids confusing errors.

See `supabase/README.md` for more depth on the schema and security model.

---

## Step 2 — Deploy to Vercel

1. **Push everything to GitHub** if you haven't already.

2. Go to <https://vercel.com/new> and click **Import** on your `Lockrr` repo.

3. In the import screen:
   - **Framework preset**: Next.js (should be auto-detected).
   - **Root directory**: `apps/web` — Vercel needs to know this because
     `next.config.mjs` lives one level deep inside the monorepo.
   - **Build & Output settings**: leave defaults. Vercel's build for Next.js
     handles the pnpm workspace fine as long as the root directory is set.

4. Add environment variables (Vercel calls this the **Environment Variables**
   step of the import screen, or **Settings → Environment Variables**
   afterwards). Set these for **Production** (and Preview if you want):

   | Variable                            | Value                                            |
   | :---------------------------------- | :----------------------------------------------- |
   | `NEXT_PUBLIC_DATA_MODE`             | `supabase`                                       |
   | `NEXT_PUBLIC_SUPABASE_URL`          | Your Supabase project URL from step 1            |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Your Supabase anon public key from step 1        |
   | `NEXT_PUBLIC_SITE_URL`              | Leave blank for the first deploy; fill in after  |

   Do **not** set `SUPABASE_SERVICE_ROLE_KEY` — nothing in the app uses it and
   putting it in Vercel would be a needless attack surface.

5. Click **Deploy**. First build takes ~2–3 minutes. Watch for these steps in
   the build log:
   - `pnpm install` — should complete without prompting for `pnpm approve-builds`
     because we've listed all native builds in `pnpm-workspace.yaml`.
   - `pnpm --filter @lockerr/web build` — the actual Next.js build.
   - Deployment.

6. Once deployment succeeds, Vercel gives you the URL. **Come back to your env
   vars and set `NEXT_PUBLIC_SITE_URL` to that URL**, then redeploy so the
   Open Graph image and canonical URLs render with the right origin.

7. Add your Vercel URL to Supabase's allowed auth redirect URLs:
   - Supabase dashboard → **Authentication → URL Configuration**
   - **Site URL**: `https://<your-app>.vercel.app`
   - **Redirect URLs** — add the same URL. Without this, sign-in works but
     email-based flows (password reset, magic link) can't complete.

---

## Step 3 — Smoke test the live app

- Open the live URL. Landing page renders.
- Click **Create your vault**, sign up. If email confirmation is off, you
  land straight in the dashboard.
- Upload a PDF. Watch the Content tab pulse indigo then flip to green as
  Tesseract extracts text.
- Sign out, then back in. Data persists (that's Supabase working).
- Open the site in an incognito window and see if the OG image looks right
  by pasting the URL into <https://www.opengraph.xyz/> or
  <https://twitter.com/intent/tweet?url=YOUR_URL>.

If anything breaks, see **Troubleshooting** below.

---

## Step 4 — Capture screenshots for the README

Now that you have a live URL with real data, take the screenshots referenced
in the root README. Suggested captures — the README table has the exact paths:

| Screenshot         | Notes                                                     |
| :----------------- | :-------------------------------------------------------- |
| `landing.png`      | The `/` marketing page. 1440×900, top of viewport.        |
| `dashboard.png`    | `/dashboard` with 5–10 documents, some expiring soon.     |
| `vault-grid.png`   | `/vault` in grid view. Fill with varied doc types.        |
| `document.png`     | A document detail page. Content tab open, real text.      |
| `timeline.png`     | `/timeline` with events across at least two months.       |
| `reminders.png`    | `/reminders`, showing expired + soon docs.                |
| `palette.png`      | Any page with ⌘K open, showing search results.            |
| `mobile.png`       | 390×844 (iPhone 14). Chrome DevTools device toolbar.      |

Save them into `docs/screenshots/` and commit. They render inline in the README.

Suggested capture setup (Chrome):
- **Window size**: DevTools → 3-dot menu → More tools → Rendering → set
  device pixel ratio to 2 for crisper output on high-DPI displays.
- **Empty tabs area**: hide the developer console (Cmd+Shift+I to toggle).
- **Real data**: don't ship the `test@example.com` credentials in the shot.

---

## Troubleshooting

### `pnpm approve-builds` prompt in Vercel build log

We've allow-listed `esbuild`, `sharp`, `tesseract.js`, and `unrs-resolver` in
`pnpm-workspace.yaml`. If Vercel adds a new native package (uncommon but
possible after a Next.js upgrade) and its build fails with
`ERR_PNPM_IGNORED_BUILDS`, add it to both `allowBuilds:` and
`onlyBuiltDependencies:` in that file and redeploy.

### Sign-up succeeds locally but not on Vercel

Check that Supabase **Authentication → URL Configuration → Site URL** is set
to your Vercel URL. If it still points to `http://localhost:3000`, the client
gets a redirect it can't resolve.

### Upload progress bar jumps to 100% instantly

That's the mock client — check `NEXT_PUBLIC_DATA_MODE` on Vercel. In supabase
mode you should see real per-file progress from Supabase Storage.

### `over_email_send_rate_limit` on repeated sign-ups

Supabase's built-in mailer caps free-tier sends at a handful per hour. Wait,
or configure a real SMTP provider in Supabase → Project Settings → Auth →
SMTP Settings.

### OG image shows an outdated cached version

Twitter, Slack, and iMessage cache OG images hard. Test with a URL that has
a query string tail (`?v=2`) or use <https://www.opengraph.xyz/> for a
cache-bypassing preview.

### Bundle warnings about "big strings" during build

Cosmetic. Webpack cache serialization warnings — no impact on the built app.

---

## Custom domain (optional)

- **Vercel** → **Settings → Domains** → add your domain. Vercel gives you
  CNAME / A records to add at your DNS provider. Verification usually takes
  a few minutes.
- Update `NEXT_PUBLIC_SITE_URL` on Vercel and Supabase's **Site URL** to the
  new domain, then redeploy.

That's it. You're live.
