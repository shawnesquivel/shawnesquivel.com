"use client";

import { useEffect } from "react";
import { initAnalytics, setScreen, track } from "@/lib/boggled/analytics";

// Guide pages: a view, a "read" once 75% is scrolled past, and clicks on [data-cta] links (Play buttons, related guides).
export default function GuideTracker({ slug }: { slug: string }) {
  useEffect(() => {
    initAnalytics();
    setScreen("article");
    track("article_view", { slug });
    let read = false;
    const onScroll = () => {
      if (read) return;
      const seen = (scrollY + innerHeight) / document.documentElement.scrollHeight;
      if (seen >= 0.75) {
        read = true;
        track("article_read", { slug });
      }
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLElement>("[data-cta]");
      if (a) track("article_cta", { slug, target: a.dataset.cta });
    };
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, [slug]);
  return null;
}
