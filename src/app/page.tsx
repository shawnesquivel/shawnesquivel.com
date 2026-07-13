import type { Metadata } from "next";
import SiteShell from "@/components/site/SiteShell";
import LinkText from "@/components/site/LinkText";

export const metadata: Metadata = {
  title: "Shawn Esquivel",
  description:
    "Member of Technical Staff at Composio, the execution layer for AI agents.",
};

export default function Home() {
  return (
    <SiteShell>
      <div className="space-y-10">
        <div className="space-y-6">
          <p>
            I&apos;m a Member of Technical Staff at{" "}
            <LinkText href="https://composio.dev">Composio</LinkText>, the
            execution layer for AI agents. I enjoy building apps that explore how
            we can use{" "}
            <LinkText href="https://apps.apple.com/us/app/matchya-wellness-companion/id6752518461">
              AI for wellness
            </LinkText>
            .
          </p>
          <p>
            I helped to design a novel hydrogen pyrolysis system of which I hold a{" "}
            <LinkText href="https://patents.google.com/patent/US12157669B2/">
              patent
            </LinkText>
            . I studied Chemical Engineering at the University of British
            Columbia.
          </p>
        </div>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Featured videos</h2>
            <p className="text-sm text-neutral-400">
              Recent videos and social posts featuring Composio.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube.com/embed/hIh2O9OL69o"
                  title="freeCodeCamp Composio video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white p-4">
                <blockquote className="twitter-tweet">
                  <a href="https://x.com/AlexanderTw33ts/status/2032550830042394979">
                    https://x.com/AlexanderTw33ts/status/2032550830042394979
                  </a>
                </blockquote>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white p-4">
                <blockquote className="twitter-tweet">
                  <a href="https://x.com/shawnbuilds/status/2032870632971710651?s=20">
                    https://x.com/shawnbuilds/status/2032870632971710651?s=20
                  </a>
                </blockquote>
              </div>
            </div>
          </div>

          <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8" />
        </section>
      </div>
    </SiteShell>
  );
}
