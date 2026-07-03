import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createElement } from "react";

// Mock the single network seam, same convention as requestsApi.test.tsx.
vi.mock("@/shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/client")>();
  return { ...actual, fetchClient: vi.fn() };
});

// FR-002 scenario 3: this file's 4 call sites must route through the
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
  useCreateAdmin,
  useUpdateAdmin,
} from "@/features/admin-users/api/adminUsersApi";

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

describe("useCreateAdmin", () => {
  it("calls notify.success on success", async () => {
    mockFetch.mockResolvedValueOnce({ id: "a1", fullName: "Ada Lovelace" });

    const { result } = renderHook(() => useCreateAdmin(), { wrapper });
    result.current.mutate({
      institutionalEmail: "ada@uni.edu",
      fullName: "Ada Lovelace",
      role: "ADMIN",
    });

    await waitFor(() =>
      expect(mockNotify.success).toHaveBeenCalledWith("Ada Lovelace was added."),
    );
  });

  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateAdmin(), { wrapper });
    result.current.mutate({
      institutionalEmail: "ada@uni.edu",
      fullName: "Ada Lovelace",
      role: "ADMIN",
    });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});

describe("useUpdateAdmin", () => {
  it("calls notify.success on success", async () => {
    mockFetch.mockResolvedValueOnce({ id: "a1", fullName: "Ada Lovelace" });

    const { result } = renderHook(() => useUpdateAdmin(), { wrapper });
    result.current.mutate({ id: "a1", patch: { fullName: "Ada Lovelace" } });

    await waitFor(() =>
      expect(mockNotify.success).toHaveBeenCalledWith("Ada Lovelace was updated."),
    );
  });

  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useUpdateAdmin(), { wrapper });
    result.current.mutate({ id: "a1", patch: { fullName: "Ada Lovelace" } });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});
