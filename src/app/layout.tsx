import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shawnesquivel.com"),
  title: "Shawn Esquivel",
  description:
    "Member of Technical Staff at Composio.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Shawn Esquivel",
    description:
      "Member of Technical Staff at Composio.",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Shawn Esquivel",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shawn Esquivel",
    description:
      "Member of Technical Staff at Composio.",
    images: ["/thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
