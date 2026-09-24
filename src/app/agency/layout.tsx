import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Footer from "@/components/agency/Footer";
import Nav from "@/components/agency/Nav";
import { SITE } from "@/lib/agency/site";
import "./agency.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} | DevRel as a subscription`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  icons: { icon: "/agency/icon.svg" },
  openGraph: {
    title: `${SITE.name} | DevRel as a subscription`,
    description: SITE.description,
    url: "/agency",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | DevRel as a subscription`,
    description: SITE.description,
    creator: "@shawnbuilds",
  },
};

export default function AgencyLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`agency ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} flex min-h-screen flex-col antialiased`}
    >
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
