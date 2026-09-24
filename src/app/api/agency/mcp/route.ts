import { getDevRelService, readLimitedText, tooLarge } from "@/lib/agency/server";
import { createMcpRoute } from "@/lib/agency/server/mcp";

let route: ((req: Request) => Promise<Response>) | null = null;

async function handler(req: Request): Promise<Response> {
  const service = getDevRelService();
  if (!service) {
    return Response.json({ error: "The MCP server is not configured yet." }, { status: 503 });
  }

  let forwarded = req;
  if (req.method === "POST") {
    const body = await readLimitedText(req);
    if (body === null) return tooLarge();
    forwarded = new Request(req.url, { method: req.method, headers: req.headers, body });
  }

  route ??= createMcpRoute(service);
  return route(forwarded);
}

export { handler as GET, handler as POST, handler as DELETE };
