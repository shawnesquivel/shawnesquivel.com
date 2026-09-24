import {
  REQUEST_TYPES,
  createRequestSchema,
  estimateDelivery,
  formatIssues,
  listRequestsSchema,
  newRequestId,
  type DevRelRequest,
} from "@/lib/agency/requests";
import { hashApiKey, isWellFormedApiKey } from "@/lib/agency/server/api-keys";
import type { Notifier } from "@/lib/agency/server/notify";
import type { Client, RequestRecord, Store } from "@/lib/agency/server/store";

export class ValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid input: ${issues.join("; ")}`);
  }
}

export class QuotaExceededError extends Error {
  constructor(readonly limit: number) {
    super(`Daily request limit reached (${limit} per 24 hours). Try again later or ask Shawn to raise your limit.`);
  }
}

export class NotFoundError extends Error {
  constructor(id: string) {
    super(`Request ${id} not found.`);
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function createDevRelService(deps: {
  store: Store;
  notify?: Notifier;
  now?: () => Date;
  defaultDailyLimit?: number;
  log?: (message: string, error: unknown) => void;
}) {
  const { store, notify = async () => {}, now = () => new Date(), defaultDailyLimit = 10, log = console.error } = deps;

  return {
    async authenticate(apiKey: string | null | undefined): Promise<Client | null> {
      if (!apiKey || !isWellFormedApiKey(apiKey)) return null;
      const client = await store.findClientByKeyHash(hashApiKey(apiKey));
      return client && !client.revokedAt ? client : null;
    },

    async createRequest(client: Client, input: unknown): Promise<DevRelRequest> {
      const parsed = createRequestSchema.safeParse(input);
      if (!parsed.success) throw new ValidationError(formatIssues(parsed.error));

      const at = now();
      const limit = client.dailyRequestLimit ?? defaultDailyLimit;
      const recent = await store.countRequestsSince(client.id, new Date(at.getTime() - DAY_MS));
      if (recent >= limit) throw new QuotaExceededError(limit);

      const { type, title, brief, audience, priority, links } = parsed.data;
      const record = await store.insertRequest({
        id: newRequestId(),
        clientId: client.id,
        type,
        title,
        brief: brief || null,
        audience,
        priority,
        links,
        estimatedDelivery: estimateDelivery(type, priority, at).toISOString(),
        createdAt: at.toISOString(),
      });

      const request = toPublic(record);
      try {
        await notify({ client, request });
      } catch (error) {
        log(`Failed to notify about ${request.id}`, error);
      }
      return request;
    },

    async listRequests(client: Client, input: unknown): Promise<DevRelRequest[]> {
      const parsed = listRequestsSchema.safeParse(input ?? {});
      if (!parsed.success) throw new ValidationError(formatIssues(parsed.error));
      const records = await store.listRequests(client.id, parsed.data);
      return records.map(toPublic);
    },

    async getRequest(client: Client, id: string): Promise<DevRelRequest> {
      const record = await store.getRequest(client.id, id);
      if (!record) throw new NotFoundError(id);
      return toPublic(record);
    },
  };
}

export type DevRelService = ReturnType<typeof createDevRelService>;

function toPublic(record: RequestRecord): DevRelRequest {
  return {
    id: record.id,
    object: "request",
    livemode: true,
    status: record.status,
    type: record.type,
    title: record.title,
    brief: record.brief,
    audience: record.audience,
    priority: record.priority,
    links: record.links,
    deliverables: REQUEST_TYPES[record.type].deliverables,
    deliverable_url: record.deliverableUrl,
    estimated_delivery: record.estimatedDelivery,
    created_at: record.createdAt,
  };
}
