"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/portfolio", label: "portfolio" },
  { href: "/contact", label: "contact" },
  { href: "/dune", label: "play /dune" },
];

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-xl px-8 py-16 md:px-12 md:py-24">
        <header className="mb-12">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight hover:opacity-70"
          >
            Shawn Esquivel
          </Link>
          <nav className="mt-6 flex gap-5 text-sm">
            {TABS.map(({ href, label }) => {
              const active =
                pathname === href ||
                (href === "/portfolio" && pathname.startsWith("/portfolio"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    active
                      ? "text-link underline underline-offset-4"
                      : "text-black hover:text-link"
                  }
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="text-base leading-relaxed">{children}</main>
      </div>
    </div>
  );
}
