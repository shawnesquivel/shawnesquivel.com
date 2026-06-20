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
    </SiteShell>
  );
}
