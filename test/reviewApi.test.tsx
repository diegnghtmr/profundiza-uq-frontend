import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createElement } from "react";

// Mock the single network seam, same convention as adminUsersApi.test.tsx.
vi.mock("@/shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/client")>();
  return { ...actual, fetchClient: vi.fn() };
});

// FR-002 scenario 3: this file's 1 call site must route through the
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
import { useSubmitDecision } from "@/features/admin-review/api/reviewApi";

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

describe("useSubmitDecision", () => {
  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSubmitDecision(), { wrapper });
    result.current.mutate({
      requestId: "req-1",
      semesterId: "sem-1",
      decisionType: "ACCEPT",
      reason: "Capacity available",
    });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });

  it("sends targetGroupId in the body for a CREATE_GROUP_ACCEPTANCE decision", async () => {
    mockFetch.mockResolvedValueOnce({});

    const { result } = renderHook(() => useSubmitDecision(), { wrapper });
    result.current.mutate({
      requestId: "req-1",
      semesterId: "sem-1",
      decisionType: "CREATE_GROUP_ACCEPTANCE",
      reason: "Seat opened in the day group",
      targetGroupId: "group-2",
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockFetch).toHaveBeenCalledWith(
      "/admin/enrollment-requests/req-1/decisions",
      expect.objectContaining({
        method: "POST",
        body: {
          decisionType: "CREATE_GROUP_ACCEPTANCE",
          reason: "Seat opened in the day group",
          targetGroupId: "group-2",
        },
      }),
    );
  });

  it("omits targetGroupId from the body for a plain ACCEPT decision", async () => {
    mockFetch.mockResolvedValueOnce({});

    const { result } = renderHook(() => useSubmitDecision(), { wrapper });
    result.current.mutate({
      requestId: "req-1",
      semesterId: "sem-1",
      decisionType: "ACCEPT",
      reason: "Capacity available",
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockFetch).toHaveBeenCalledWith(
      "/admin/enrollment-requests/req-1/decisions",
      expect.objectContaining({
        body: { decisionType: "ACCEPT", reason: "Capacity available" },
      }),
    );
  });
});
