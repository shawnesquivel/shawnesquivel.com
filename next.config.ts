import type { NextConfig } from "next";

// Word Brawl's own domains serve the game at the root.
const GAME_HOST = "(www\\.)?wordbrawl\\.(app|vercel\\.app)";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: [{ type: "host", value: GAME_HOST }], destination: "/boggled" },
        { source: "/test", has: [{ type: "host", value: GAME_HOST }], destination: "/boggled" },
        { source: "/boggled/test", destination: "/boggled" },
        { source: "/stats", has: [{ type: "host", value: GAME_HOST }], destination: "/boggled/stats" },
        { source: "/how-to-play-boggle-party", has: [{ type: "host", value: GAME_HOST }], destination: "/boggled/how-to-play-boggle-party" },
        { source: "/robots.txt", has: [{ type: "host", value: GAME_HOST }], destination: "/boggled/robots.txt" },
        { source: "/sitemap.xml", has: [{ type: "host", value: GAME_HOST }], destination: "/boggled/sitemap.xml" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**", search: "" }],
  },
};

export default nextConfig;
