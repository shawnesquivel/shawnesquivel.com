import { randomUUID } from "node:crypto";
import type { Client, NewRequestRecord, RequestRecord, RequestStatus, Store } from "@/lib/agency/server/store";

export class MemoryStore implements Store {
  clients: (Client & { apiKeyHash: string })[] = [];
  requests: RequestRecord[] = [];

  async createClient(input: { name: string; apiKeyHash: string; apiKeyPrefix: string; dailyRequestLimit?: number | null }) {
    const client = {
      id: randomUUID(),
      name: input.name,
      dailyRequestLimit: input.dailyRequestLimit ?? null,
      revokedAt: null,
      apiKeyHash: input.apiKeyHash,
    };
    this.clients.push(client);
    return strip(client);
  }

  async findClientByKeyHash(hash: string) {
    const client = this.clients.find((c) => c.apiKeyHash === hash);
    return client ? strip(client) : null;
  }

  async countRequestsSince(clientId: string, since: Date) {
    return this.requests.filter((r) => r.clientId === clientId && new Date(r.createdAt) >= since).length;
  }

  async insertRequest(record: NewRequestRecord) {
    const row: RequestRecord = { ...record, status: "queued", deliverableUrl: null };
    this.requests.push(row);
    return row;
  }

  async listRequests(clientId: string, opts: { status?: RequestStatus; limit: number }) {
    return this.requests
      .filter((r) => r.clientId === clientId && (!opts.status || r.status === opts.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, opts.limit);
  }

  async getRequest(clientId: string, id: string) {
    return this.requests.find((r) => r.clientId === clientId && r.id === id) ?? null;
  }

  revoke(clientId: string) {
    const client = this.clients.find((c) => c.id === clientId);
    if (client) client.revokedAt = new Date().toISOString();
  }
}

function strip(client: Client & { apiKeyHash: string }): Client {
  return { id: client.id, name: client.name, dailyRequestLimit: client.dailyRequestLimit, revokedAt: client.revokedAt };
}
