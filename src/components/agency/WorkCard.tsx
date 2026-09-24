import Image from "next/image";
import type { WorkCategory, WorkItem } from "@/lib/agency/site";

const COVER: Record<WorkCategory, string> = {
  "Long-form video": "from-red-500/25 via-surface-2 to-surface",
  "Short-form": "from-violet/30 via-surface-2 to-surface",
  Writing: "from-sky-400/20 via-surface-2 to-surface",
  "Cookbooks & code": "from-accent/20 via-surface-2 to-surface",
  Courses: "from-amber-400/20 via-surface-2 to-surface",
  Community: "from-fuchsia-500/20 via-surface-2 to-surface",
};

export default function WorkCard({ item }: { item: WorkItem }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-2xl hover:shadow-black/50"
    >
      {!item.youtubeId && (
        <div
          className={`relative flex aspect-video flex-col justify-between overflow-hidden border-b border-line bg-gradient-to-br p-5 ${COVER[item.category]}`}
        >
          <div className="ag-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,#000,transparent)]" />
          <span className="relative font-mono text-[11px] uppercase tracking-wider text-white/50">
            {item.brand ?? item.category}
          </span>
          <span className="relative text-3xl font-semibold tracking-tight text-white transition-transform duration-500 group-hover:translate-x-1">
            {item.metric ?? "↗"}
          </span>
        </div>
      )}
      {item.youtubeId && (
        <div className="relative aspect-video overflow-hidden border-b border-line">
          <Image
            src={`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 grid place-items-center bg-black/20 transition-colors group-hover:bg-black/0">
            <span className="grid size-12 place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur transition-transform group-hover:scale-110">
              <svg viewBox="0 0 16 16" className="ml-0.5 size-4" fill="currentColor">
                <path d="M5 3.5v9l7-4.5z" />
              </svg>
            </span>
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-subtle">{item.category}</span>
          {item.brand && <span className="text-muted">{item.brand}</span>}
        </div>
        <h3 className="font-semibold leading-snug text-fg">{item.title}</h3>
        <p className="text-sm text-muted">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          {item.metric ? <span className="font-mono text-accent">{item.metric}</span> : <span />}
          <span className="text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg">↗</span>
        </div>
      </div>
    </a>
  );
}
