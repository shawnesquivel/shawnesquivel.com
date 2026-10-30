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
    "boggle online with friends",
    "word game with friends",
    "multiplayer word game",
    "online word party game",
    "boggle party",
    "netflix boggle party alternative",
    "word search game",
    "free word game no download",
    "daily word puzzle",
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
    title: "Word Brawl: play a Boggle-style word game with friends",
    description: "Free, no download. Share a link, swipe words on your phone, and beat your friends. Daily Puzzle and Survival too.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Word Brawl: play a Boggle-style word game with friends",
    description: "Free, no download. Share a link, swipe words on your phone, and beat your friends.",
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
