import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fredoka } from "next/font/google";
import "./boggled.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Word Brawl — swipe words, beat your friends",
  description: "A fast word-hunt party game for phones. Swipe words on a shared letter grid, battle friends with a link, or take on Dr. Hoot in Quick Start.",
  openGraph: {
    title: "Word Brawl",
    description: "Swipe words, beat your friends. Create a room, share the link, and race the clock from your phone.",
  },
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
