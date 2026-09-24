import Logo from "@/components/agency/Logo";
import { SITE, SOCIALS } from "@/lib/agency/site";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-subtle">
            © {new Date().getFullYear()} {SITE.founder}. DevRel, shipped on demand.
          </p>
        </div>
        <ul className="flex flex-wrap gap-5">
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-fg">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
