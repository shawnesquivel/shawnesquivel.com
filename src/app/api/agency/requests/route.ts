import { AUDIENCES, PRIORITIES, REQUEST_TYPES, buildSandboxRequest, validateCreateRequest } from "@/lib/agency/requests";
import { getDevRelService, readLimitedText, tooLarge } from "@/lib/agency/server";
import { parseBearer } from "@/lib/agency/server/api-keys";
import { QuotaExceededError, ValidationError } from "@/lib/agency/server/service";

export function GET() {
  return Response.json({
    object: "list",
    endpoint: "POST /api/agency/requests",
    auth: "Authorization: Bearer <API key>. Without a key, requests are sandboxed and not stored.",
    request_types: Object.entries(REQUEST_TYPES).map(([type, spec]) => ({
      type,
      label: spec.label,
      description: spec.description,
      deliverables: spec.deliverables,
      turnaround_days: spec.turnaroundDays,
    })),
    fields: {
      type: { required: true, enum: Object.keys(REQUEST_TYPES) },
      title: { required: true, type: "string", max: 140 },
      brief: { required: false, type: "string", max: 2000 },
      audience: { required: false, enum: AUDIENCES, default: "intermediate" },
      priority: { required: false, enum: PRIORITIES, default: "normal" },
      links: { required: false, type: "string[]", max: 10 },
    },
  });
}

export async function POST(request: Request) {
  const text = await readLimitedText(request);
  if (text === null) return tooLarge();

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return error(400, "invalid_request", ["Body must be valid JSON."]);
  }

  const apiKey = parseBearer(request.headers.get("authorization"));
  if (!apiKey) {
    const result = validateCreateRequest(body);
    if (!result.ok) return error(422, "invalid_request", result.errors);
    return Response.json(buildSandboxRequest(result.data), { status: 201 });
  }

  const service = getDevRelService();
  if (!service) return error(503, "unavailable", ["Live requests are not configured yet."]);

  const client = await service.authenticate(apiKey);
  if (!client) return error(401, "unauthorized", ["Invalid or revoked API key."]);

  try {
    return Response.json(await service.createRequest(client, body), { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) return error(422, "invalid_request", e.issues);
    if (e instanceof QuotaExceededError) return error(429, "rate_limited", [e.message]);
    throw e;
  }
}

function error(status: number, type: string, messages: string[]) {
  return Response.json({ error: { type, messages } }, { status });
}
