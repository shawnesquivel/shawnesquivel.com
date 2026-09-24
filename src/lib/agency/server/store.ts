import type { SupabaseClient } from "@supabase/supabase-js";
import type { Audience, Priority, RequestStatus, RequestType } from "@/lib/agency/request-types";

export type { RequestStatus };

export type Client = {
  id: string;
  name: string;
  dailyRequestLimit: number | null;
  revokedAt: string | null;
};

export type RequestRecord = {
  id: string;
  clientId: string;
  type: RequestType;
  title: string;
  brief: string | null;
  audience: Audience;
  priority: Priority;
  links: string[];
  status: RequestStatus;
  deliverableUrl: string | null;
  estimatedDelivery: string;
  createdAt: string;
};

export type NewRequestRecord = Omit<RequestRecord, "status" | "deliverableUrl">;

export interface Store {
  createClient(input: {
    name: string;
    apiKeyHash: string;
    apiKeyPrefix: string;
    dailyRequestLimit?: number | null;
  }): Promise<Client>;
  findClientByKeyHash(hash: string): Promise<Client | null>;
  countRequestsSince(clientId: string, since: Date): Promise<number>;
  insertRequest(record: NewRequestRecord): Promise<RequestRecord>;
  listRequests(clientId: string, opts: { status?: RequestStatus; limit: number }): Promise<RequestRecord[]>;
  getRequest(clientId: string, id: string): Promise<RequestRecord | null>;
}

type ClientRow = { id: string; name: string; daily_request_limit: number | null; revoked_at: string | null };

type RequestRow = {
  id: string;
  client_id: string;
  type: RequestType;
  title: string;
  brief: string | null;
  audience: Audience;
  priority: Priority;
  links: string[];
  status: RequestStatus;
  deliverable_url: string | null;
  estimated_delivery: string;
  created_at: string;
};

const CLIENT_COLUMNS = "id, name, daily_request_limit, revoked_at";
const REQUEST_COLUMNS =
  "id, client_id, type, title, brief, audience, priority, links, status, deliverable_url, estimated_delivery, created_at";

export class SupabaseStore implements Store {
  constructor(private readonly db: SupabaseClient) {}

  async createClient(input: { name: string; apiKeyHash: string; apiKeyPrefix: string; dailyRequestLimit?: number | null }) {
    const { data, error } = await this.db
      .from("clients")
      .insert({
        name: input.name,
        api_key_hash: input.apiKeyHash,
        api_key_prefix: input.apiKeyPrefix,
        daily_request_limit: input.dailyRequestLimit ?? null,
      })
      .select(CLIENT_COLUMNS)
      .single<ClientRow>();
    if (error) throw error;
    return toClient(data);
  }

  async findClientByKeyHash(hash: string) {
    const { data, error } = await this.db
      .from("clients")
      .select(CLIENT_COLUMNS)
      .eq("api_key_hash", hash)
      .maybeSingle<ClientRow>();
    if (error) throw error;
    return data ? toClient(data) : null;
  }

  async countRequestsSince(clientId: string, since: Date) {
    const { count, error } = await this.db
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .gte("created_at", since.toISOString());
    if (error) throw error;
    return count ?? 0;
  }

  async insertRequest(record: NewRequestRecord) {
    const { data, error } = await this.db
      .from("requests")
      .insert({
        id: record.id,
        client_id: record.clientId,
        type: record.type,
        title: record.title,
        brief: record.brief,
        audience: record.audience,
        priority: record.priority,
        links: record.links,
        estimated_delivery: record.estimatedDelivery,
        created_at: record.createdAt,
      })
      .select(REQUEST_COLUMNS)
      .single<RequestRow>();
    if (error) throw error;
    return toRequest(data);
  }

  async listRequests(clientId: string, opts: { status?: RequestStatus; limit: number }) {
    let query = this.db
      .from("requests")
      .select(REQUEST_COLUMNS)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(opts.limit);
    if (opts.status) query = query.eq("status", opts.status);
    const { data, error } = await query.returns<RequestRow[]>();
    if (error) throw error;
    return data.map(toRequest);
  }

  async getRequest(clientId: string, id: string) {
    const { data, error } = await this.db
      .from("requests")
      .select(REQUEST_COLUMNS)
      .eq("client_id", clientId)
      .eq("id", id)
      .maybeSingle<RequestRow>();
    if (error) throw error;
    return data ? toRequest(data) : null;
  }
}

function toClient(row: ClientRow): Client {
  return { id: row.id, name: row.name, dailyRequestLimit: row.daily_request_limit, revokedAt: row.revoked_at };
}

function toRequest(row: RequestRow): RequestRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    type: row.type,
    title: row.title,
    brief: row.brief,
    audience: row.audience,
    priority: row.priority,
    links: row.links,
    status: row.status,
    deliverableUrl: row.deliverable_url,
    estimatedDelivery: new Date(row.estimated_delivery).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  };
}
