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
import { useCreateReport } from "@/features/admin-reports/api/reportsApi";

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

describe("useCreateReport", () => {
  it("calls notify.success on success", async () => {
    mockFetch.mockResolvedValueOnce({
      id: "r1",
      semesterId: "sem-1",
      requestedByAdminUserId: "a1",
      reportType: "WAITLIST",
      format: "XLSX",
      status: "REQUESTED",
      filters: null,
      filePath: null,
      downloadUrl: null,
      failureReason: null,
      requestedAt: "2026-01-01T00:00:00Z",
      startedAt: null,
      completedAt: null,
    });

    const { result } = renderHook(() => useCreateReport("sem-1"), { wrapper });
    result.current.mutate({
      semesterId: "sem-1",
      reportType: "WAITLIST",
      format: "XLSX",
    });

    await waitFor(() =>
      expect(mockNotify.success).toHaveBeenCalledWith(
        "Report requested. It will be ready shortly.",
      ),
    );
  });

  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateReport("sem-1"), { wrapper });
    result.current.mutate({
      semesterId: "sem-1",
      reportType: "WAITLIST",
      format: "XLSX",
    });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});
