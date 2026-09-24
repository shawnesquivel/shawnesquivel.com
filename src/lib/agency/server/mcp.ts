import type { AuthInfo } from "@modelcontextprotocol/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { REQUEST_TYPES, createRequestSchema, listRequestsSchema, type DevRelRequest } from "@/lib/agency/requests";
import { NotFoundError, QuotaExceededError, ValidationError, type DevRelService } from "@/lib/agency/server/service";
import type { Client } from "@/lib/agency/server/store";

const TYPE_GUIDE = Object.entries(REQUEST_TYPES)
  .map(([type, spec]) => `${type}: ${spec.description}`)
  .join("\n");

type ToolResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

export function createMcpRoute(service: DevRelService): (req: Request) => Promise<Response> {
  const handler = createMcpHandler(
    (server) => {
      server.registerTool(
        "create_request",
        {
          title: "Create DevRel request",
          description: `File a new request with AI Native DevRel (Shawn Esquivel). Types:\n${TYPE_GUIDE}`,
          inputSchema: createRequestSchema,
        },
        async (args, ctx) =>
          run(async () => {
            const request = await service.createRequest(clientFrom(ctx.http?.authInfo), args);
            return ok(
              `Created ${request.id}: "${request.title}" (${request.type}). Status: queued. Estimated delivery ${request.estimated_delivery.slice(0, 10)}.`,
              request,
            );
          }),
      );

      server.registerTool(
        "list_requests",
        {
          title: "List DevRel requests",
          description: "List your requests with AI Native DevRel, newest first.",
          inputSchema: listRequestsSchema,
        },
        async (args, ctx) =>
          run(async () => {
            const requests = await service.listRequests(clientFrom(ctx.http?.authInfo), args);
            const summary = requests.length
              ? requests.map((r) => `${r.id} · ${r.status} · ${r.type} · ${r.title}`).join("\n")
              : "No requests yet.";
            return ok(summary, { requests });
          }),
      );

      server.registerTool(
        "get_request",
        {
          title: "Get DevRel request",
          description: "Get the status and deliverable link for one of your requests.",
          inputSchema: z.object({ id: z.string().regex(/^req_[a-f0-9]{16}$/, "Expected an id like req_0123456789abcdef") }).strict(),
        },
        async ({ id }, ctx) =>
          run(async () => {
            const request = await service.getRequest(clientFrom(ctx.http?.authInfo), id);
            const delivered = request.deliverable_url ? ` Deliverable: ${request.deliverable_url}` : "";
            return ok(`${request.id} is ${request.status}.${delivered}`, request);
          }),
      );
    },
    {
      serverInfo: { name: "ai-native-devrel", version: "0.1.0" },
      instructions:
        "Use create_request to hand DevRel work (blogs, videos, threads, cookbooks) to Shawn Esquivel. Use list_requests and get_request to check progress.",
    },
  );

  return withMcpAuth(
    handler,
    async (_req, token) => {
      const client = await service.authenticate(token);
      return client && token ? { token, clientId: client.id, scopes: [], extra: { client } } : undefined;
    },
    { required: true },
  );
}

function clientFrom(authInfo: AuthInfo | undefined): Client {
  const client = authInfo?.extra?.client as Client | undefined;
  if (!client) throw new Error("Missing authenticated client");
  return client;
}

function ok(text: string, data: DevRelRequest | Record<string, unknown>): ToolResult {
  return { content: [{ type: "text", text }], structuredContent: data as Record<string, unknown> };
}

async function run(fn: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ValidationError || error instanceof QuotaExceededError || error instanceof NotFoundError) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    console.error("MCP tool failed", error);
    return { content: [{ type: "text", text: "Something went wrong. Please try again." }], isError: true };
  }
}
