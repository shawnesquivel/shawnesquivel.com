import type { NextConfig } from "next";

// Word Brawl's own domains serve the game at the root.
const GAME_HOST = "(www\\.)?wordbrawl\\.(app|vercel\\.app)";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", has: [{ type: "host", value: GAME_HOST }], destination: "/boggled" }],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**", search: "" }],
  },
};

export default nextConfig;
