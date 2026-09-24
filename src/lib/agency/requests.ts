import { z } from "zod";
import {
  AUDIENCES,
  PRIORITIES,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  TYPE_KEYS,
  type Audience,
  type Priority,
  type RequestStatus,
  type RequestType,
} from "@/lib/agency/request-types";

export * from "@/lib/agency/request-types";

export const createRequestSchema = z
  .object({
    type: z.enum(TYPE_KEYS).describe("What to produce."),
    title: z.string().trim().min(3).max(140).describe("Working title for the piece."),
    brief: z.string().trim().max(2000).optional().describe("Goals, key points, product details, audience context."),
    audience: z.enum(AUDIENCES).default("intermediate"),
    priority: z.enum(PRIORITIES).default("normal").describe("rush halves the turnaround."),
    links: z
      .array(z.url({ protocol: /^https?$/ }))
      .max(10)
      .default([])
      .describe("Docs, repos, or references (http/https only)."),
  })
  .strict();

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const listRequestsSchema = z
  .object({
    status: z.enum(REQUEST_STATUSES).optional().describe("Only return requests with this status."),
    limit: z.number().int().min(1).max(50).default(20),
  })
  .strict();

export type ListRequestsInput = z.infer<typeof listRequestsSchema>;

export type DevRelRequest = {
  id: string;
  object: "request";
  livemode: boolean;
  status: RequestStatus;
  type: RequestType;
  title: string;
  brief: string | null;
  audience: Audience;
  priority: Priority;
  links: string[];
  deliverables: readonly string[];
  deliverable_url: string | null;
  estimated_delivery: string;
  created_at: string;
};

export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message));
}

export function validateCreateRequest(
  body: unknown,
): { ok: true; data: CreateRequestInput } | { ok: false; errors: string[] } {
  const result = createRequestSchema.safeParse(body);
  return result.success ? { ok: true, data: result.data } : { ok: false, errors: formatIssues(result.error) };
}

export function estimateDelivery(type: RequestType, priority: Priority, now: Date): Date {
  const base = REQUEST_TYPES[type].turnaroundDays;
  const days = priority === "rush" ? Math.max(1, Math.ceil(base / 2)) : base;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export function newRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function buildSandboxRequest(input: CreateRequestInput, now = new Date()): DevRelRequest {
  return {
    id: newRequestId(),
    object: "request",
    livemode: false,
    status: "queued",
    type: input.type,
    title: input.title,
    brief: input.brief || null,
    audience: input.audience,
    priority: input.priority,
    links: input.links,
    deliverables: REQUEST_TYPES[input.type].deliverables,
    deliverable_url: null,
    estimated_delivery: estimateDelivery(input.type, input.priority, now).toISOString(),
    created_at: now.toISOString(),
  };
}
