// Coarse visitor location for analytics, from Vercel's edge geolocation headers.
// The IP address itself is never returned or stored, and coordinates are rounded to ~10 km.
export const dynamic = "force-dynamic";

function coord(v: string | null) {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : undefined;
}

export function GET(request: Request) {
  const h = request.headers;
  const city = h.get("x-vercel-ip-city");
  return Response.json(
    {
      country: h.get("x-vercel-ip-country") ?? undefined,
      region: h.get("x-vercel-ip-country-region") ?? undefined,
      city: city ? decodeURIComponent(city) : undefined,
      lat: coord(h.get("x-vercel-ip-latitude")),
      lon: coord(h.get("x-vercel-ip-longitude")),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
