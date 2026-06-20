import type { Metadata } from "next";
import SiteShell from "@/components/site/SiteShell";
import LinkText from "@/components/site/LinkText";

export const metadata: Metadata = {
  title: "Contact — Shawn Esquivel",
  description: "Get in touch with Shawn Esquivel.",
};

export default function ContactPage() {
  return (
    <SiteShell>
      <div className="space-y-6">
        <p>
          email{" "}
          <a
            href="mailto:shawn@amihanventures.ca"
            className="text-link underline underline-offset-2 hover:opacity-80"
          >
            shawn@amihanventures[dot]ca
          </a>
        </p>
        <p>
          Connect on{" "}
          <LinkText href="https://github.com/shawnesquivel">github</LinkText>,{" "}
          <LinkText href="https://x.com/shawnesquivel">x</LinkText>,{" "}
          <LinkText href="https://www.linkedin.com/in/shawnesquivel/">
            linkedin
          </LinkText>
          , or{" "}
          <LinkText href="https://www.youtube.com/@shawn.builds">youtube</LinkText>
          .
        </p>
      </div>
    </SiteShell>
  );
}
