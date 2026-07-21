import type { Metadata } from "next";
import SiteShell from "@/components/site/SiteShell";
import LinkText from "@/components/site/LinkText";

export const metadata: Metadata = {
  title: "Links — Shawn Esquivel",
  description: "Selected work and links by Shawn Esquivel.",
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
          <h2 className="mb-3 text-lg font-semibold">Work</h2>
          <ul className="space-y-2">
            <li>
              <LinkText href="https://composio.dev">
                Member of Technical Staff at Composio
              </LinkText>
            </li>
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
