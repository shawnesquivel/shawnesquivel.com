import type { Metadata } from "next";
import { Tweet } from "react-tweet";
import SiteShell from "@/components/site/SiteShell";
import LinkText from "@/components/site/LinkText";

export const metadata: Metadata = {
  title: "Shawn Esquivel — Portfolio",
  description:
    "Previous Developer Relations Engineer at Composio. Open to video, writing, growth, and DevRel opportunities.",
};

const TWEETS = [
  { id: "2032550830042394979", caption: "90K+ views" },
  { id: "2076653097338724843", caption: "10K+ views" },
  {
    id: "2075271401263476808",
    caption: "I built and shipped this Cursor plugin. 5K+ views",
  },
];

export default function Home() {
  return (
    <SiteShell>
      <div className="space-y-8">
        <p>
          I&apos;m Shawn, previous Developer Relations Engineer at{" "}
          <LinkText href="https://composio.dev">Composio</LinkText>. I&apos;m
          open to video, writing, growth, and DevRel opportunities.
        </p>

        <div className="space-y-6">
          <section>
            <h3 className="mb-2 font-semibold">Growth experience</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Build an AI agent with Vercel, Composio and Cursor on{" "}
                <LinkText href="https://www.youtube.com/watch?v=hIh2O9OL69o">
                  FreeCodeCamp (8.5M subs)
                </LinkText>
              </li>
              <li>
                <LinkText href="https://www.udemy.com/course/langchain-develop-ai-web-apps-with-javascript-and-langchain/">
                  LangChain / Cursor AI courses on Udemy
                </LinkText>{" "}
                with 4K+ students
              </li>
              <li>
                26K subs on{" "}
                <LinkText href="https://www.youtube.com/@shawn.builds">
                  YouTube
                </LinkText>
              </li>
              <li>
                180K+ views on{" "}
                <LinkText href="https://www.instagram.com/reels/DNM8aS6y3dh/">
                  Instagram
                </LinkText>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">Technical Writing</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Writing for AEO for{" "}
                <LinkText href="https://composio.dev/blog">
                  Composio&apos;s blog
                </LinkText>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">Community</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Hosted IRL events for Cursor, Codex, and OpenClaw -{" "}
                <LinkText href="https://luma.com/user/usr-aAbNymCdKuliJCa">
                  Luma
                </LinkText>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">Full Stack experience</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Shipped{" "}
                <LinkText href="https://github.com/ComposioHQ/composio-mcp-plugin">
                  Claude / ChatGPT App / OpenClaw / Cursor plugins
                </LinkText>
              </li>
              <li>
                Built{" "}
                <LinkText href="https://apps.apple.com/ca/app/matchya-wellness-companion/id6752518461">
                  mobile apps like this
                </LinkText>
              </li>
              <li>Tech stack: TypeScript / Python / React Native</li>
            </ul>
          </section>
        </div>

        <section className="border-t border-black/10 pt-10">
          <h2 className="mb-6 text-lg font-semibold">Videos &amp; posts</h2>
          <div className="flex flex-col items-center gap-10" data-theme="light">
            <figure className="mx-auto w-full max-w-100">
              <iframe
                className="h-150 w-full"
                src="https://www.instagram.com/reel/DNM8aS6y3dh/embed"
                title="Instagram reel"
                scrolling="no"
                allowFullScreen
              />
              <figcaption className="mt-2 text-center text-sm text-neutral-500">
                180K+ views
              </figcaption>
            </figure>

            {TWEETS.map(({ id, caption }) => (
              <figure key={id} className="w-full max-w-100">
                <Tweet id={id} />
                <figcaption className="mt-2 text-center text-sm text-neutral-500">
                  {caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
