import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/features/pwa/sw-register";
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
    default: "LockKaro — Lock it. Clock it.",
    template: "%s · LockKaro",
  },
  description:
    "A calm, private vault for the paperwork of your life. IDs, insurance, degrees, receipts — all in one place.",
  applicationName: "LockKaro",
  authors: [{ name: "LockKaro" }],
  keywords: [
    "document vault",
    "personal documents",
    "privacy",
    "expiry tracking",
    "portfolio",
  ],
  openGraph: {
    title: "LockKaro — Lock it. Clock it.",
    description:
      "A calm, private vault for the paperwork of your life. All in one place.",
    type: "website",
    siteName: "LockKaro",
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LockKaro — Lock it. Clock it.",
    description:
      "A calm, private vault for the paperwork of your life. All in one place.",
  },
  // Portfolio project — indexable so recruiters can find it.
  robots: { index: true, follow: true },

  // PWA — iOS in particular needs these explicit tags because it doesn't
  // read the Web App Manifest for install behavior.
  appleWebApp: {
    capable: true,
    title: "LockKaro",
    statusBarStyle: "black-translucent",
  },
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
