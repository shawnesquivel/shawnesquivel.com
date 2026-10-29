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
  title: "Boggled Online — play Boggle with friends",
  description: "Find words on a shared letter grid with friends. Create a room, share the code, and race the clock from your phone.",
  openGraph: {
    title: "Boggled Online",
    description: "Play Boggle with friends from your phone. Create a room and share the code.",
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
