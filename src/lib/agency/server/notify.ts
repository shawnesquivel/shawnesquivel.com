import type { DevRelRequest } from "@/lib/agency/requests";
import type { Client } from "@/lib/agency/server/store";

export type NewRequestEvent = { client: Client; request: DevRelRequest };
export type Notifier = (event: NewRequestEvent) => Promise<void>;

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export function formatSlackMessage({ client, request }: NewRequestEvent): { text: string } {
  const lines = [
    `*New ${request.type} request from ${client.name}*${request.priority === "rush" ? " (rush)" : ""}`,
    `>${request.title}`,
    request.brief ? request.brief : null,
    request.links.length ? `Links: ${request.links.join(" ")}` : null,
    `Audience: ${request.audience} · Priority: ${request.priority} · Due: ${request.estimated_delivery.slice(0, 10)}`,
    `ID: \`${request.id}\``,
  ];
  return { text: lines.filter(Boolean).join("\n") };
}

export function createSlackNotifier(webhookUrl: string | undefined, fetchImpl: FetchLike = fetch): Notifier {
  return async (event) => {
    if (!webhookUrl) return;
    const res = await fetchImpl(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formatSlackMessage(event)),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Slack webhook responded ${res.status}`);
  };
}
