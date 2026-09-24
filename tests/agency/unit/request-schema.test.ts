import { describe, expect, it } from "vitest";
import { estimateDelivery, validateCreateRequest } from "@/lib/agency/requests";

const valid = { type: "cookbook", title: "GitHub triage agent" };

describe("validateCreateRequest", () => {
  it("accepts a minimal request and applies defaults", () => {
    const result = validateCreateRequest(valid);
    expect(result).toEqual({
      ok: true,
      data: { ...valid, audience: "intermediate", priority: "normal", links: [] },
    });
  });

  it("accepts every optional field", () => {
    const result = validateCreateRequest({
      ...valid,
      brief: "Use the latest SDK",
      audience: "advanced",
      priority: "rush",
      links: ["https://docs.example.com"],
    });
    expect(result.ok).toBe(true);
  });

  it.each([
    [{ ...valid, type: "podcast" }, "type"],
    [{ ...valid, title: "hi" }, "title"],
    [{ ...valid, title: "x".repeat(141) }, "title"],
    [{ ...valid, brief: "x".repeat(2001) }, "brief"],
    [{ ...valid, audience: "expert" }, "audience"],
    [{ ...valid, priority: "asap" }, "priority"],
    [{ ...valid, links: ["not a url"] }, "links"],
    [{ ...valid, links: ["javascript:alert(1)"] }, "links"],
    [{ ...valid, links: Array.from({ length: 11 }, (_, i) => `https://e.com/${i}`) }, "links"],
    [{ ...valid, client_id: "someone-else" }, "client_id"],
  ])("rejects %o (%s)", (input, field) => {
    const result = validateCreateRequest(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toContain(field);
  });

  it("rejects non-objects", () => {
    expect(validateCreateRequest(null).ok).toBe(false);
    expect(validateCreateRequest("cookbook").ok).toBe(false);
  });
});

describe("estimateDelivery", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("uses the turnaround for the request type", () => {
    expect(estimateDelivery("longform", "normal", now).toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });

  it("halves the turnaround for rush requests, rounding up, minimum one day", () => {
    expect(estimateDelivery("longform", "rush", now).toISOString()).toBe("2026-01-05T00:00:00.000Z");
    expect(estimateDelivery("thread", "rush", now).toISOString()).toBe("2026-01-02T00:00:00.000Z");
  });
});
