import type { Metadata } from "next";
import { Tweet } from "react-tweet";
import SiteShell from "@/components/site/SiteShell";
import LinkText from "@/components/site/LinkText";

export const metadata: Metadata = {
  title: "Shawn Esquivel — Portfolio",
  description:
    "Previous Developer Relations Engineer at Composio. Open to video, writing, growth, and DevRel opportunities.",
};

const TWEET_IDS = [
  "2075271401263476808",
  "2076653097338724843",
  "2032550830042394979",
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

        <ul className="space-y-3">
          <li>Growth experience: Helped grow Composio to 10M+ daily tool calls</li>
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
          <li>
            <LinkText href="https://www.youtube.com/watch?v=hIh2O9OL69o">
              FreeCodeCamp tutorial
            </LinkText>
          </li>
          <li>
            Technical Writing: Writing for AEO for{" "}
            <LinkText href="https://composio.dev/blog">
              Composio&apos;s blog
            </LinkText>
          </li>
          <li>
            Community: Hosted IRL events for Cursor, Codex, and OpenClaw -{" "}
            <LinkText href="https://luma.com/user/usr-aAbNymCdKuliJCa">
              Luma
            </LinkText>
          </li>
          <li>Full Stack experience</li>
          <li>
            Engineering: Shipped{" "}
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

        <section className="border-t border-black/10 pt-10">
          <h2 className="mb-6 text-lg font-semibold">Videos &amp; posts</h2>
          <div className="flex flex-col gap-8">
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/hIh2O9OL69o"
                title="FreeCodeCamp tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>

            <div className="mx-auto w-full max-w-100">
              <iframe
                className="h-150 w-full"
                src="https://www.instagram.com/reel/DNM8aS6y3dh/embed"
                title="Instagram reel"
                scrolling="no"
                allowFullScreen
              />
            </div>

            <div data-theme="light" className="flex flex-col items-center gap-6">
              {TWEET_IDS.map((id) => (
                <Tweet key={id} id={id} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
