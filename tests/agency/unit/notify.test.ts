import { describe, expect, it, vi } from "vitest";
import { createSlackNotifier, formatSlackMessage, type NewRequestEvent } from "@/lib/agency/server/notify";

const event: NewRequestEvent = {
  client: { id: "c1", name: "Acme", dailyRequestLimit: null, revokedAt: null },
  request: {
    id: "req_0123456789abcdef",
    object: "request",
    livemode: true,
    status: "queued",
    type: "cookbook",
    title: "GitHub triage agent",
    brief: "Use the latest SDK",
    audience: "intermediate",
    priority: "rush",
    links: ["https://docs.acme.dev"],
    deliverables: ["GitHub repo or notebook"],
    deliverable_url: null,
    estimated_delivery: "2026-03-04T12:00:00.000Z",
    created_at: "2026-03-01T12:00:00.000Z",
  },
};

describe("formatSlackMessage", () => {
  it("includes who asked, what, and how to find it", () => {
    const { text } = formatSlackMessage(event);
    for (const part of ["Acme", "cookbook", "rush", "GitHub triage agent", "Use the latest SDK", "req_0123456789abcdef", "https://docs.acme.dev"]) {
      expect(text).toContain(part);
    }
  });
});

describe("createSlackNotifier", () => {
  it("posts the message to the webhook", async () => {
    const fetchImpl = vi.fn(async () => new Response("ok"));
    await createSlackNotifier("https://hooks.slack.test/abc", fetchImpl)(event);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://hooks.slack.test/abc",
      expect.objectContaining({ method: "POST", body: JSON.stringify(formatSlackMessage(event)) }),
    );
  });

  it("throws when Slack rejects the message", async () => {
    const fetchImpl = vi.fn(async () => new Response("no", { status: 500 }));
    await expect(createSlackNotifier("https://hooks.slack.test/abc", fetchImpl)(event)).rejects.toThrow();
  });

  it("does nothing without a webhook url", async () => {
    const fetchImpl = vi.fn();
    await createSlackNotifier(undefined, fetchImpl)(event);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
