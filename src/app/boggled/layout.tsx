import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fredoka } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/boggled/site";
import "./boggled.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "boggle online",
    "boggle online with friends",
    "free boggle online",
    "boggle online with friends free",
    "multiplayer boggle",
    "boggle party",
    "netflix boggle party alternative",
    "boggle puzzle today",
    "daily boggle",
    "boggle online for classroom",
    "boggle for kids",
    "boggle app",
  ],
  alternates: { canonical: "/" },
  manifest: "/boggled/manifest.webmanifest",
  icons: { icon: "/boggled/icon", apple: "/boggled/apple-icon" },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: "Play Boggle online with friends, free",
    description: "No signup, no download. Share a link and play real-time Boggle on your phones. Daily Boggle puzzle and Survival too.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Play Boggle online with friends, free",
    description: "No signup, no download. Share a link and play real-time Boggle on your phones.",
  },
  category: "games",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2b1680",
};

export default function BoggledLayout({ children }: { children: ReactNode }) {
  return <div className={`boggled ${fredoka.variable}`}>{children}</div>;
}
