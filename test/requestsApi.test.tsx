import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createElement } from "react";

// Mock the single network seam. The wiring under test is "which path/method/body
// does the hook hand to fetchClient", not the transport itself.
vi.mock("@/shared/api/client", () => ({
  fetchClient: vi.fn(),
}));

// FR-002 scenario 3: this file's 2 call sites must route through the
// `notify` facade, not the legacy `toast` store or sonner directly.
vi.mock("@/shared/lib/notify", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { fetchClient } from "@/shared/api/client";
import { notify } from "@/shared/lib/notify";
import {
  useCancelRequest,
  useSubmitEnrollmentBatch,
} from "@/features/enrollment/api/requestsApi";

const mockFetch = vi.mocked(fetchClient);
const mockNotify = vi.mocked(notify);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.clearAllMocks();
});

describe("useSubmitEnrollmentBatch", () => {
  it("posts the batch with mapped items and an Idempotency-Key header", async () => {
    mockFetch.mockResolvedValueOnce({ items: [] });

    const { result } = renderHook(() => useSubmitEnrollmentBatch(), { wrapper });

    await result.current.mutateAsync({
      semesterId: "sem-1",
      offeringGroupIds: ["g1", "g2"],
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const [path, options] = mockFetch.mock.calls[0];
    expect(path).toBe("/enrollment-requests/batch");
    expect(options?.method).toBe("POST");
    expect(options?.body).toEqual({
      semesterId: "sem-1",
      items: [{ offeringGroupId: "g1" }, { offeringGroupId: "g2" }],
    });
    const headers = options?.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toMatch(/[0-9a-f-]{36}/);
  });

  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSubmitEnrollmentBatch(), { wrapper });
    result.current.mutate({ semesterId: "sem-1", offeringGroupIds: ["g1"] });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});

describe("useCancelRequest", () => {
  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCancelRequest(), { wrapper });
    result.current.mutate("req-1");

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});
