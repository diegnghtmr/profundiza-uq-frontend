import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { fetchClient, ApiSchemaError } from "@/shared/api/client";
import { myRequestsResponseSchema } from "@/features/enrollment/api/requestsSchemas";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const realFetch = globalThis.fetch;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("fetchClient response schema validation", () => {
  it("returns the parsed payload when it matches the schema", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "a", count: 2 }));
    const schema = z.object({ id: z.string(), count: z.number() });

    const result = await fetchClient("/thing", { schema });

    expect(result).toEqual({ id: "a", count: 2 });
  });

  it("throws an ApiSchemaError when a field is missing or renamed", async () => {
    // Backend renamed `count` -> `total`; the response no longer matches.
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "a", total: 2 }));
    const schema = z.object({ id: z.string(), count: z.number() });

    await expect(fetchClient("/thing", { schema })).rejects.toBeInstanceOf(
      ApiSchemaError,
    );
  });

  it("passes the payload through untouched when no schema is provided", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ anything: true }));

    const result = await fetchClient("/thing");

    expect(result).toEqual({ anything: true });
  });

  it("accepts a well-formed enrollment-requests payload against the wired schema", async () => {
    const wellFormed = {
      items: [
        {
          id: "r1",
          semesterId: "sem-1",
          studentId: "s1",
          offeringId: "o1",
          offeringGroupId: "g1",
          priorityGroup: "DIRECT_SAME_SHIFT",
          status: "SUBMITTED",
          arrivalSequence: 1,
          submittedAt: "2026-01-01T00:00:00Z",
        },
      ],
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(wellFormed));

    const result = await fetchClient("/enrollment-requests", {
      schema: myRequestsResponseSchema,
    });

    expect(result).toEqual(wellFormed);
  });

  it("throws at the boundary when the enrollment payload drifts (missing status)", async () => {
    const malformed = {
      items: [
        {
          id: "r1",
          semesterId: "sem-1",
          studentId: "s1",
          offeringId: "o1",
          offeringGroupId: "g1",
          priorityGroup: "DIRECT_SAME_SHIFT",
          // status is missing — contract drift
          arrivalSequence: 1,
          submittedAt: "2026-01-01T00:00:00Z",
        },
      ],
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(malformed));

    await expect(
      fetchClient("/enrollment-requests", { schema: myRequestsResponseSchema }),
    ).rejects.toBeInstanceOf(ApiSchemaError);
  });
});
