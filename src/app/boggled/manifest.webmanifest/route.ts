import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/boggled/site";

export function GET() {
  return Response.json(
    {
      name: SITE_NAME,
      short_name: SITE_NAME,
      description: SITE_DESCRIPTION,
      start_url: "/boggled?utm_source=homescreen",
      scope: "/boggled",
      display: "standalone",
      orientation: "portrait",
      background_color: "#2b1680",
      theme_color: "#2b1680",
      categories: ["games", "entertainment"],
      icons: [
        { src: "/boggled/icon", sizes: "64x64", type: "image/png" },
        { src: "/boggled/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
