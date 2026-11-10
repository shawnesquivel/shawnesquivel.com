import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GUIDES, guideBySlug } from "@/lib/boggled/guides";
import { SITE_NAME, SITE_URL } from "@/lib/boggled/site";
import GuideTracker from "./GuideTracker";

export type Faq = { q: string; a: string };

export function guideMetadata(slug: string, title: string, description: string, keywords: string[], image = "/boggled/guide/lobby.jpg"): Metadata {
  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: `/${slug}` },
    openGraph: { type: "article", url: `/${slug}`, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const json = (v: unknown) => ({ __html: JSON.stringify(v).replace(/</g, "\\u003c") });

// Links are relative so they work at wordbrawl.app/<slug> and shawnesquivel.com/boggled/<slug>.
export function PlayCta({ children = "Play free with friends →", target = "play" }: { children?: ReactNode; target?: string }) {
  return (
    <a href="./" className="bg-btn bg-btn-primary bg-guide-cta" data-cta={target}>
      {children}
    </a>
  );
}

export function CtaBox({ title, body }: { title: string; body: string }) {
  return (
    <aside className="bg-guide-pick">
      <span className="bg-guide-badge">⭐ {SITE_NAME}</span>
      <h2>{title}</h2>
      <p>{body}</p>
      <PlayCta />
    </aside>
  );
}

export default function GuideShell({
  slug,
  h1,
  intro,
  faq = [],
  schema = [],
  children,
}: {
  slug: string;
  h1: string;
  intro: ReactNode;
  faq?: Faq[];
  schema?: object[];
  children: ReactNode;
}) {
  const g = guideBySlug(slug)!;
  const url = `${SITE_URL}/${slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: h1,
        url,
        image: `${SITE_URL}/boggled/guide/lobby.jpg`,
        dateModified: g.updated,
        author: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
        publisher: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: g.title, item: url },
        ],
      },
      ...(faq.length
        ? [{ "@type": "FAQPage", mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }]
        : []),
      ...schema,
    ],
  };
  return (
    <article className="bg-seo bg-guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={json(ld)} />
      <GuideTracker slug={slug} />
      <nav className="bg-guide-nav" aria-label="Breadcrumb">
        <a href="./" data-cta="nav">
          ← {SITE_NAME}
        </a>
      </nav>
      <header>
        <h1 className="bg-title">{h1}</h1>
        <div className="mt-2">{intro}</div>
      </header>

      {children}

      {faq.length > 0 && (
        <section aria-labelledby="faq">
          <h2 id="faq">Questions</h2>
          {faq.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      )}

      <section aria-labelledby="more">
        <h2 id="more">More Boggle guides</h2>
        <ul className="bg-guide-related">
          {GUIDES.filter((x) => x.slug !== slug).map((x) => (
            <li key={x.slug}>
              <a href={x.slug} data-cta={`guide:${x.slug}`}>
                <span className="text-2xl">{x.emoji}</span>
                <span>
                  <b>{x.title}</b>
                  <small>{x.short}</small>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer>
        Updated {g.updated}. {SITE_NAME} is an independent game, not affiliated with Netflix or Hasbro. Boggle is a trademark of Hasbro.
      </footer>
    </article>
  );
}
