import { NextResponse, type NextRequest } from "next/server";

const LEGACY_PATH_PREFIXES = [
  "/analytics",
  "/archive",
  "/blog",
  "/course",
  "/hackathon-vancouver",
  "/workshops",
];

const STATS_PATHS = ["/stats", "/boggled/stats"];

// The analytics dashboard sits behind HTTP Basic auth (any username, password = STATS_PASSWORD).
// Without a password configured it stays locked in production.
function statsAuthorized(request: NextRequest) {
  const password = process.env.STATS_PASSWORD;
  if (!password) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    return decoded.slice(decoded.indexOf(":") + 1) === password;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATS_PATHS.includes(pathname)) {
    if (statsAuthorized(request)) return NextResponse.next();
    return new NextResponse("Word Brawl stats are private.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Word Brawl stats", charset="UTF-8"', "Cache-Control": "no-store" },
    });
  }

  if (
    LEGACY_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return NextResponse.redirect(new URL("/portfolio", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/stats",
    "/boggled/stats",
    "/analytics/:path*",
    "/archive/:path*",
    "/blog/:path*",
    "/course/:path*",
    "/hackathon-vancouver/:path*",
    "/workshops/:path*",
  ],
};
