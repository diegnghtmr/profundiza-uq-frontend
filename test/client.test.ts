import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchClient } from "@/shared/api/client";

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

describe("fetchClient AbortSignal forwarding", () => {
  it("forwards an AbortSignal to the underlying fetch call", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    const controller = new AbortController();

    await fetchClient("/thing", { signal: controller.signal });

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).signal).toBe(controller.signal);
  });
});
