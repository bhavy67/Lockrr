import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/logo";

// If you add a network call, a storage location, a permission or any
// analytics, update this page in the same change. Google Play's data safety
// form is filled in from it.

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How LockKaro handles your documents: they stay on your device.",
};

const UPDATED = "15 October 2026";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center px-6">
        <Link href="/" aria-label="LockKaro home">
          <Wordmark />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-16 pt-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Privacy policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>

        <p className="mt-6 text-base leading-relaxed">
          LockKaro has no account, no server and no analytics. Your documents and everything you
          write about them stay on your device. The developer never receives them and has no way
          to see them.
        </p>

        <Section title="What LockKaro stores">
          <p>
            The files you add, and the details you give them — titles, categories, tags,
            collections, dates — plus any text LockKaro reads from them so you can search.
          </p>
          <ul>
            <li>
              <strong>In the Android app</strong>, all of it lives in the app&apos;s private
              storage on your phone. It is excluded from Android&apos;s automatic cloud backup,
              so it is not copied to Google Drive.
            </li>
            <li>
              <strong>On the website</strong>, it lives in your browser&apos;s storage for this
              site.
            </li>
          </ul>
        </Section>

        <Section title="What leaves your device">
          <p>Nothing you store. LockKaro works offline. There is one download:</p>
          <ul>
            <li>
              The first time you read text from an image, LockKaro downloads its English
              text-recognition data (a few megabytes) from <code>cdn.jsdelivr.net</code>. Your
              image is read on your device and is never sent anywhere. Like any download, the CDN
              receives the usual technical request details, such as your IP address.
            </li>
          </ul>
          <p>
            The website itself is served by Vercel, which keeps standard server logs. The Android
            app is served from your phone, not from the web.
          </p>
        </Section>

        <Section title="Permissions the Android app uses">
          <ul>
            <li>
              <strong>Notifications</strong> — only if you turn on expiry reminders. They are
              scheduled on your phone.
            </li>
            <li>
              <strong>Fingerprint or screen lock</strong> — only if you turn on App lock. Android
              checks it; LockKaro never sees your fingerprint or PIN.
            </li>
            <li>
              <strong>Internet</strong> — only for the text-recognition download above.
            </li>
          </ul>
          <p>
            LockKaro does not use your camera, location, contacts or microphone. It only opens
            files you pick yourself.
          </p>
        </Section>

        <Section title="Backups and sharing">
          <p>
            When you export a backup or share a document, LockKaro hands the file to you or to the
            app you choose. From then on it is in your hands.
          </p>
        </Section>

        <Section title="Deleting your data">
          <p>
            Uninstall the app, or clear this site&apos;s data in your browser. Nothing is kept
            anywhere else, so there is nothing else to delete.
          </p>
        </Section>

        <Section title="Children">
          <p>LockKaro is not directed at children under 13.</p>
        </Section>

        <Section title="Changes and contact">
          <p>
            If this policy changes, the date above will change with it. Questions go to the
            developer contact email on LockKaro&apos;s Google Play listing.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 space-y-3 text-sm leading-relaxed text-foreground/90 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
