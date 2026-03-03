import { notFound } from "next/navigation";
import Link from "next/link";
import { Marked, marked, type Tokens } from "marked";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | Shawn Esquivel`,
    description: post.description,
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[`~!@#$%^&*()+=<>?,./:;"'|{}[\]\\]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(text: string, seen: Map<string, number>): string {
  const base = slugify(text) || "section";
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function getToc(content: string): TocHeading[] {
  const tokens = marked.lexer(content);
  const seen = new Map<string, number>();
  const toc: TocHeading[] = [];

  for (const token of tokens) {
    if (token.type !== "heading") continue;
    const heading = token as Tokens.Heading;
    if (heading.depth !== 2 && heading.depth !== 3) continue;

    toc.push({
      id: uniqueSlug(heading.text, seen),
      text: heading.text,
      level: heading.depth,
    });
  }

  return toc;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const toc = getToc(post.content);
  const headingSlugSeen = new Map<string, number>();
  const parser = new Marked({
    gfm: true,
  });

  parser.use({
    renderer: {
      heading(token) {
        const id = uniqueSlug(token.text, headingSlugSeen);
        return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}</h${token.depth}>`;
      },
    },
  });

  const htmlContent = (await parser.parse(post.content)) as string;

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
              href="/#pricing"
              className="rounded-full border-2 border-foreground bg-accent px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[2px_2px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#1a1a1a]"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        {/* NeoBrutalist post header */}
        <div className="border-b-3 border-foreground bg-yellow px-6 py-14">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-foreground/70">
              <Link href="/" className="hover:underline decoration-2 underline-offset-4">
                Home
              </Link>
              <span>/</span>
              <Link
                href="/blog"
                className="hover:underline decoration-2 underline-offset-4"
              >
                Blog
              </Link>
              <span>/</span>
              <span className="max-w-[16rem] truncate">{post.title}</span>
            </div>
            <Link
              href="/blog"
              className="mb-6 inline-block text-sm font-black uppercase hover:underline decoration-2 underline-offset-4"
            >
              ← Back to Blog
            </Link>
            <h1 className="text-4xl font-black uppercase tracking-tight leading-tight md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-base font-bold uppercase text-foreground/60">
              {formatDate(post.date)}
            </p>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Clean readable article body */}
          <article className="min-w-0 max-w-2xl">
            <div
              className="prose-blog"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </article>

          {toc.length > 0 ? (
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border-2 border-foreground bg-surface p-5">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-foreground/70">
                  On This Page
                </p>
                <nav aria-label="Table of contents">
                  <ul className="space-y-2">
                    {toc.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          className={`blog-toc-link ${heading.level === 3 ? "pl-3" : ""}`}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          ) : null}
        </div>

        {/* CTA */}
        <div className="mx-auto max-w-2xl px-6 pb-20">
          <div className="neo-shadow bg-accent p-8 text-center text-white">
            <p className="mb-2 text-sm font-black uppercase tracking-wide opacity-80">
              Want to actually build with AI?
            </p>
            <h2 className="mb-4 text-2xl font-black uppercase tracking-tight md:text-3xl">
              Learn to Build Apps with Cursor
            </h2>
            <p className="mb-6 font-medium leading-relaxed opacity-90">
              Go from idea to deployed app in one weekend. Hands-on training, prompt
              libraries, and templates — no prior coding experience required.
            </p>
            <Link
              href="/"
              className="inline-block rounded-full border-3 border-white bg-white px-8 py-3 text-sm font-black uppercase tracking-wide text-accent shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
            >
              Check It Out →
            </Link>
          </div>
        </div>
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
