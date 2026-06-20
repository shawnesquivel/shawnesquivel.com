import type { Metadata } from "next";
import SiteShell from "@/components/site/SiteShell";
import LinkText from "@/components/site/LinkText";

export const metadata: Metadata = {
  title: "Portfolio — Shawn Esquivel",
  description: "Patent, devrel work, courses, and content.",
};

export default function PortfolioPage() {
  return (
    <SiteShell>
      <div className="space-y-10">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Patent</h2>
          <p>
            <LinkText href="https://patents.google.com/patent/US12157669B2/">
              Methods of producing hydrogen and nitrogen using a feedstock gas
              reactor
            </LinkText>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Developer Relations</h2>
          <ul className="space-y-2">
            <li>
              <LinkText href="https://www.youtube.com/@shawn.builds">
                YouTube (26K subscribers)
              </LinkText>
            </li>
            <li>
              <LinkText href="https://www.udemy.com/course/langchain-develop-ai-web-apps-with-javascript-and-langchain/">
                LangChain course
              </LinkText>
            </li>
            <li>
              <LinkText href="https://www.udemy.com/course/cursor-ai-mcp-nextjs-supabase/">
                Cursor course
              </LinkText>
            </li>
          </ul>

          <div className="mt-6">
            <p className="mb-3 text-sm text-neutral-600">freeCodeCamp (latest)</p>
            <div className="aspect-video w-full max-w-md overflow-hidden rounded-sm">
              <iframe
                src="https://www.youtube.com/embed/hIh2O9OL69o"
                title="freeCodeCamp — latest video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
