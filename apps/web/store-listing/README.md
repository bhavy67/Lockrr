# Google Play listing — LockKaro

Everything to paste or upload in Play Console. Screenshots come from the
emulator (1080×2160, demo vault restored from a backup ZIP); retake them when
the UI changes.

## Assets

| Console field | File |
|---|---|
| App icon (512×512) | `icon-512.png` |
| Feature graphic (1024×500) | `feature-graphic-1024x500.png` |
| Phone screenshots (2–8) | `screenshots/02-dashboard.png` … `08-settings.png`, in this order: 03-vault, 04-document, 05-reminders, 02-dashboard, 06-timeline, 07-collections, 08-settings, 01-welcome |

## Store listing text

**App name** (30 max)
```
LockKaro – Document Vault
```

**Short description** (80 max)
```
Keep IDs, insurance and receipts private on your phone, with expiry reminders.
```

**Full description** (4000 max)
```
LockKaro is a calm, private place for the paperwork of your life — passports, driving licenses, insurance policies, degrees, rent agreements, warranties and receipts.

Everything stays on your phone. There is no account, no server and no tracking. The developer never sees your documents.

LOCK IT
• Add PDFs and images in seconds and give them a title, category and tags
• Preview PDFs and images right in the app
• Find anything fast with search, tags and filters
• Read the text in a PDF or photo, right on your phone
• Organize with categories and your own collections
• Optional app lock with your fingerprint or screen lock
• Hidden from the recent-apps screen while the lock is on

CLOCK IT
• Add an expiry date and see what's coming up at a glance
• Reminders 30 days, 7 days and on the day something expires
• A timeline of every important date in your vault

YOURS
• Works offline
• Export your whole vault as a ZIP backup, restore it on a new phone
• Not copied to the cloud behind your back — your files stay where you put them

No ads. No sign-up. Just your documents, where you can find them.
```

**Category:** Productivity · **Tags:** document organizer, file manager, productivity

## Policy answers

| Section | Answer |
|---|---|
| Privacy policy URL | `https://lockkaro.bhavyladani.in/privacy` (deploy first — it must load) |
| App access | All functionality available without special access (no login) |
| Ads | No ads |
| Content rating | Questionnaire category "Utility, productivity, communication or other" → answer No to everything → rated Everyone / PEGI 3 |
| Target audience | 18 and over (keeps the app out of the Families program) |
| News app / Government app / Financial features / Health | No / No / No financial features / No health features |
| Data safety → "Does your app collect or share any of the required user data types?" | **No** — documents and details never leave the device |
| Data safety → encryption in transit / deletion requests | Not shown once you answer No above |

Why "No" is accurate: nothing is sent to the developer or a third party. The
only network use is downloading text-recognition data from `cdn.jsdelivr.net`
the first time an image is read — a download, not a data upload — and the
privacy policy discloses it.

## Release

1. **Testing → Closed testing** (personal accounts created after Nov 2023 need
   12+ testers opted in for 14 continuous days before production — check the
   Dashboard; it tells you if this applies to your account).
2. Create a release, upload `android/app/build/outputs/bundle/release/app-release.aab`.
3. Release name `1.0.0 (1)`. Release notes: `First release.`
4. Accept **Play App Signing** when asked (Google holds the app signing key;
   your keystore is the upload key).
5. Every later upload: bump `versionCode` (+1) and `versionName` in
   `android/app/build.gradle`, and the version in Settings → About.
