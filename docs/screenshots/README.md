# Screenshots

Place captures here to make them appear in the root `README.md`. The README
already references these paths — no need to add markdown, just drop the files
in with the exact filenames listed below.

## Files to capture

| Filename          | Screen                     | Size (recommended) |
| :---------------- | :------------------------- | :----------------- |
| `landing.png`     | Marketing landing (`/`)    | 1440 × 900         |
| `dashboard.png`   | `/dashboard`               | 1440 × 900         |
| `vault-grid.png`  | `/vault` (grid view)       | 1440 × 900         |
| `document.png`    | `/vault/[id]`, Content tab | 1440 × 900         |
| `timeline.png`    | `/timeline`                | 1440 × 900         |
| `reminders.png`   | `/reminders`               | 1440 × 900         |
| `palette.png`     | Any page with ⌘K open      | 1440 × 900         |
| `mobile.png`      | Any page in mobile viewport| 390 × 844          |

## Capture setup (Chrome)

For crisp desktop shots on high-DPI displays:

1. Open **DevTools → 3-dot menu → More tools → Rendering**.
2. Set **Emulate CSS media feature** to whichever theme you want (light or
   dark — pick one for consistency across all shots).
3. Set **Device pixel ratio** to `2` so retina-density shots don't render
   fuzzy when displayed on non-retina monitors.

For mobile shots:

1. **Cmd + Shift + M** to open the device toolbar.
2. Pick **iPhone 14** (390 × 844).
3. Capture with the Cmd+Shift+P → "Capture full size screenshot" command,
   or use macOS's own **Cmd + Shift + 4** on the visible area.

## Content advice

Real data reads better than empty screens. Before capturing:

- Upload 6–10 documents with varied categories, tags, and expiry dates.
  A mix works best: passport (long expiry), driver's license (medium),
  insurance (soon), plus a couple of expired items for the reminders shot.
- Add 2–3 collections. "Home Documents" and "Europe Trip" are believable.
- Tag a few documents so tag chips show up on rows.
- Trigger extraction on at least one image so the Content tab shows OCR
  output for the document screenshot.

Do **not** ship real personal data in the shots — the vault shows filenames.

## Formats

PNG is fine for everything. JPEG is fine if you need to hit GitHub's
per-image size limit (~10 MB). WebP works but has slightly worse
compatibility for external previews.
