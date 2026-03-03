import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const htmlContent = marked(post.content) as string;

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

        {/* Clean readable article body */}
        <article className="mx-auto max-w-2xl px-6 py-12">
          <div
            className="prose-blog"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>

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
