import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | Build with Cursor",
  description: "Public site analytics for shawnesquivel.com",
};

const pages = [
  {
    path: "/",
    name: "Home — Course Landing Page",
    description: "Main sales page for Build Apps with Cursor",
    color: "bg-yellow",
  },
  {
    path: "/course",
    name: "Cursor Crash Course",
    description: "Free YouTube course curriculum (101 / 201 / 301)",
    color: "bg-blue",
  },
  {
    path: "/workshops",
    name: "Workshops",
    description: "In-person Vancouver workshop info + enrollment",
    color: "bg-green",
  },
  {
    path: "/hackathon-vancouver",
    name: "Hackathon Vancouver",
    description: "Hackathon guest dashboard + attendance tracker",
    color: "bg-pink",
  },
  {
    path: "/analytics",
    name: "Analytics (this page)",
    description: "Public analytics overview",
    color: "bg-purple",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b-3 border-foreground bg-yellow">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <a
            href="/"
            className="text-lg font-black uppercase tracking-tight hover:underline decoration-3 underline-offset-4"
          >
            Build with Cursor
          </a>
          <span className="text-sm font-bold uppercase text-muted">
            Analytics
          </span>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pt-28 pb-20">
        <h1 className="mb-4 text-3xl font-black uppercase tracking-tight sm:text-5xl">
          Site Analytics
        </h1>
        <p className="mb-2 text-base font-medium text-muted">
          Tracking powered by{" "}
          <a
            href="https://vercel.com/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline decoration-2 underline-offset-2 hover:bg-foreground hover:text-surface"
          >
            Vercel Web Analytics
          </a>
          . Privacy-first, no cookies, GDPR compliant.
        </p>
        <p className="mb-12 text-sm font-medium text-muted">
          Full dashboard:{" "}
          <a
            href="https://vercel.com/shawnesquivels-projects/shawn-ai-builds/analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline decoration-2 underline-offset-2 hover:bg-foreground hover:text-surface"
          >
            Vercel Dashboard →
          </a>
        </p>

        {/* Pages tracked */}
        <h2 className="mb-6 text-xl font-black uppercase">Pages Tracked</h2>
        <div className="space-y-4">
          {pages.map((page) => (
            <a
              key={page.path}
              href={page.path}
              className="block neo-shadow neo-hover p-5 group"
            >
              <div className={`${page.color} inline-block neo-shadow-sm px-2 py-0.5 text-xs font-black uppercase mb-2`}>
                {page.path}
              </div>
              <h3 className="text-base font-black uppercase tracking-tight">
                {page.name}
              </h3>
              <p className="text-sm font-medium text-muted mt-1">
                {page.description}
              </p>
            </a>
          ))}
        </div>

        {/* What's tracked */}
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-black uppercase">
            What&apos;s Tracked
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Page Views",
                desc: "Total visits per page",
                color: "bg-green",
              },
              {
                title: "Unique Visitors",
                desc: "De-duplicated by session",
                color: "bg-blue",
              },
              {
                title: "Referrers",
                desc: "Where traffic comes from",
                color: "bg-yellow",
              },
              {
                title: "Top Pages",
                desc: "Most visited routes",
                color: "bg-pink",
              },
              {
                title: "Countries",
                desc: "Visitor geography",
                color: "bg-purple",
              },
              {
                title: "Devices",
                desc: "Desktop vs mobile vs tablet",
                color: "bg-orange",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`neo-shadow ${item.color} p-4`}
              >
                <h4 className="text-sm font-black uppercase">{item.title}</h4>
                <p className="text-xs font-medium text-muted mt-1">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <div className="mt-16 neo-shadow bg-surface p-6">
          <h3 className="text-sm font-black uppercase mb-2">
            Privacy
          </h3>
          <p className="text-sm font-medium leading-relaxed text-muted">
            This site uses Vercel Web Analytics which is privacy-friendly by
            default. No cookies. No personal data collected. No cross-site
            tracking. Compliant with GDPR, CCPA, and PECR.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t-3 border-foreground bg-foreground py-10 text-sm text-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <p className="font-black uppercase">
            &copy; {new Date().getFullYear()} Amihan Ventures Inc.
          </p>
          <a
            href="/"
            className="underline decoration-2 underline-offset-2 hover:text-yellow"
          >
            Back to home
          </a>
        </div>
      </footer>
    </div>
  );
}
