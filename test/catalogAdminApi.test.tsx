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

// FR-002 scenario 3: this file's 6 call sites must route through the
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
  useCreateElective,
  useCreatePrerequisite,
  useAdjustCapacity,
} from "@/features/admin-catalog/api/catalogAdminApi";

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

describe("useCreateElective", () => {
  it("calls notify.success on success", async () => {
    mockFetch.mockResolvedValueOnce({ id: "e1", name: "Databases" });

    const { result } = renderHook(() => useCreateElective(), { wrapper });
    result.current.mutate({ name: "Databases", area: "CS", description: "d" });

    await waitFor(() =>
      expect(mockNotify.success).toHaveBeenCalledWith("Elective “Databases” created."),
    );
  });

  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateElective(), { wrapper });
    result.current.mutate({ name: "Databases", area: "CS", description: "d" });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});

describe("useCreatePrerequisite", () => {
  it("calls notify.success on success", async () => {
    mockFetch.mockResolvedValueOnce({ id: "p1" });

    const { result } = renderHook(() => useCreatePrerequisite("e1"), { wrapper });
    result.current.mutate({ name: "Calc I", description: "d" });

    await waitFor(() =>
      expect(mockNotify.success).toHaveBeenCalledWith("Prerequisite added."),
    );
  });

  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreatePrerequisite("e1"), { wrapper });
    result.current.mutate({ name: "Calc I", description: "d" });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});

describe("useAdjustCapacity", () => {
  it("calls notify.success on success", async () => {
    mockFetch.mockResolvedValueOnce({ id: "g1", capacity: 30 });

    const { result } = renderHook(() => useAdjustCapacity("sem-1"), { wrapper });
    result.current.mutate({ groupId: "g1", newCapacity: 30, reason: "demand" });

    await waitFor(() =>
      expect(mockNotify.success).toHaveBeenCalledWith("Capacity updated."),
    );
  });

  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useAdjustCapacity("sem-1"), { wrapper });
    result.current.mutate({ groupId: "g1", newCapacity: 30, reason: "demand" });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});
