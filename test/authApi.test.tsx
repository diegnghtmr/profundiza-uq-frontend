import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createElement } from "react";

// Mock the single network seam, same convention as adminUsersApi.test.tsx.
vi.mock("@/shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/client")>();
  return { ...actual, fetchClient: vi.fn(), setCsrfToken: vi.fn() };
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

import { fetchClient, setCsrfToken } from "@/shared/api/client";
import { notify } from "@/shared/lib/notify";
import { useLogout } from "@/features/auth/api/authApi";
import { useUiStore } from "@/shared/stores/uiStore";

const mockFetch = vi.mocked(fetchClient);
const mockNotify = vi.mocked(notify);
const mockSetCsrfToken = vi.mocked(setCsrfToken);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.clearAllMocks();
  useUiStore.getState().resetSession();
});

describe("useLogout", () => {
  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useLogout(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });

  it("resets the uiStore draft on success, so the next user on the device starts clean", async () => {
    mockFetch.mockResolvedValueOnce(undefined);
    useUiStore.getState().toggleDraftGroup("prev-user-group");
    useUiStore.getState().setSelectedSemesterId("sem-prev-user");

    const { result } = renderHook(() => useLogout(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useUiStore.getState().draftGroupIds).toEqual([]);
    expect(useUiStore.getState().selectedSemesterId).toBe("");
    expect(mockSetCsrfToken).toHaveBeenCalledWith(null);
  });
});
