import Link from "next/link";
import { SITE } from "@/lib/agency/site";

export default function Logo() {
  return (
    <Link href="/agency" className="flex items-center gap-2.5 whitespace-nowrap font-semibold tracking-tight">
      <span className="relative grid size-7 place-items-center rounded-lg bg-accent text-black">
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M3 5l3 3-3 3M8 11h5" />
        </svg>
      </span>
      <span>{SITE.name}</span>
    </Link>
  );
}
