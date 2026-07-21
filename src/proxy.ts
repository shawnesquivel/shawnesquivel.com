import { NextResponse, type NextRequest } from "next/server";

const LEGACY_PATH_PREFIXES = [
  "/analytics",
  "/archive",
  "/blog",
  "/course",
  "/hackathon-vancouver",
  "/workshops",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    "/analytics/:path*",
    "/archive/:path*",
    "/blog/:path*",
    "/course/:path*",
    "/hackathon-vancouver/:path*",
    "/workshops/:path*",
  ],
};
