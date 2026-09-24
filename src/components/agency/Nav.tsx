import Link from "next/link";
import CTAButton from "@/components/agency/CTAButton";
import Logo from "@/components/agency/Logo";

const LINKS = [
  { label: "How it works", href: "/agency#how-it-works" },
  { label: "API", href: "/agency#api" },
  { label: "MCP", href: "/agency/mcp" },
  { label: "Compare", href: "/agency#compare" },
  { label: "Work", href: "/agency/work" },
  { label: "FAQ", href: "/agency#faq" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden sm:block">
          <CTAButton />
        </div>
        <Link href="/agency/work" className="text-sm text-muted hover:text-fg sm:hidden">
          Work
        </Link>
      </div>
    </header>
  );
}
