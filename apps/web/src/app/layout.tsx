import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Set NEXT_PUBLIC_SITE_URL in production so social scrapers resolve OG image + canonical URLs.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lockerr — your private document vault",
    template: "%s · Lockerr",
  },
  description:
    "A calm, private vault for the documents that matter. Store, organize, and find your important papers in one place.",
  applicationName: "Lockerr",
  authors: [{ name: "Lockerr" }],
  keywords: ["document vault", "personal documents", "privacy", "portfolio"],
  openGraph: {
    title: "Lockerr — your private document vault",
    description:
      "A calm, private vault for the documents that matter. Portfolio project by @bhavy67.",
    type: "website",
    siteName: "Lockerr",
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lockerr — your private document vault",
    description:
      "A calm, private vault for the documents that matter. Portfolio project.",
  },
  // Portfolio project — indexable so recruiters can find it.
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-svh bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
