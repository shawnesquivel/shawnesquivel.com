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
  title: "Build Apps with Cursor | Shawn Esquivel",
  description:
    "Learn to build production-ready apps with Cursor AI. 3+ hours of hands-on training, templates, prompt libraries, and more.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Build Apps with Cursor",
    description:
      "Go from idea to deployed app in one weekend. The hands-on Cursor course for non-coders and developers alike.",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Build Apps with Cursor — Go from idea to deployed app in one weekend",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Apps with Cursor",
    description:
      "Go from idea to deployed app in one weekend. The hands-on Cursor course for non-coders and developers alike.",
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
