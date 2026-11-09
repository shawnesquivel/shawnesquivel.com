// Coarse visitor location for analytics, from Vercel's edge geolocation headers.
// The IP address itself is never returned or stored.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const h = request.headers;
  const city = h.get("x-vercel-ip-city");
  return Response.json(
    {
      country: h.get("x-vercel-ip-country") ?? undefined,
      region: h.get("x-vercel-ip-country-region") ?? undefined,
      city: city ? decodeURIComponent(city) : undefined,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
