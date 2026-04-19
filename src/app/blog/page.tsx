import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Shawn Esquivel",
  description:
    "Writing on AI tools, building with Cursor, and getting the most out of the latest tech.",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const CARD_COLORS = [
  "bg-yellow",
  "bg-blue",
  "bg-pink",
  "bg-green",
  "bg-purple",
  "bg-orange",
];

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b-3 border-foreground bg-yellow">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-black uppercase tracking-tight">
            Build with Cursor
          </Link>
          <div className="flex items-center gap-5 text-sm font-bold uppercase">
            <Link
              href="/blog"
              className="hover:underline decoration-3 underline-offset-4"
            >
              Blog
            </Link>
            <Link
              href="/portfolio"
              className="hover:underline decoration-3 underline-offset-4"
            >
              Portfolio
            </Link>
            <Link
              href="/#pricing"
              className="rounded-full border-2 border-foreground bg-accent px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[2px_2px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#1a1a1a]"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black uppercase tracking-tight md:text-6xl">
            Blog
          </h1>
          <p className="mt-3 text-lg font-medium text-muted">
            AI tools, building with Cursor, and getting more out of tech.
          </p>
        </div>

        {/* Post list */}
        {posts.length === 0 ? (
          <p className="font-bold text-muted">No posts yet. Check back soon.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={`neo-shadow neo-hover block p-6 md:p-8 ${CARD_COLORS[i % CARD_COLORS.length]}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-black uppercase tracking-tight md:text-2xl">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm font-medium leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold uppercase opacity-60 sm:ml-6 sm:mt-1">
                    {formatDate(post.date)}
                  </span>
                </div>
                <span className="mt-4 inline-block text-sm font-black uppercase underline decoration-2 underline-offset-4">
                  Read →
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-foreground bg-foreground py-8 text-center">
        <p className="text-sm font-bold uppercase text-background">
          © {new Date().getFullYear()} Shawn Esquivel
        </p>
      </footer>
    </div>
  );
}
