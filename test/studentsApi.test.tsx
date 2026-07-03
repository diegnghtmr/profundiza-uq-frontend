import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createElement } from "react";

// Mock the single network seam, same convention as requestsApi.test.tsx.
// `ApiRequestError` is kept real (via importOriginal) because `errorMessage()`
// does an `instanceof` check on it.
vi.mock("@/shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/client")>();
  return { ...actual, fetchClient: vi.fn() };
});

// FR-002 scenario 3: feature modules must route feedback through the
// `notify` facade, never the legacy `toast` store or sonner directly. Mocking
// `@/shared/lib/notify` here (and never touching `toastStore`/`sonner`) is
// what proves the migration for this file's 7 call sites.
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
  useCreateStudent,
  useCreateRecord,
  useImportStudents,
} from "@/features/admin-students/api/studentsApi";

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

describe("useCreateStudent", () => {
  it("calls notify.success on success", async () => {
    mockFetch.mockResolvedValueOnce({ id: "s1", fullName: "Ada Lovelace" });

    const { result } = renderHook(() => useCreateStudent(), { wrapper });
    result.current.mutate({
      institutionalEmail: "ada@uni.edu",
      documentNumber: "1000000001",
      fullName: "Ada Lovelace",
      academicShift: "DAY",
      completedProfessionalElectivesCount: 0,
    });

    await waitFor(() =>
      expect(mockNotify.success).toHaveBeenCalledWith("Ada Lovelace was added."),
    );
    expect(mockNotify.error).not.toHaveBeenCalled();
  });

  it("calls notify.error with the raw error on failure (facade does the conversion)", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateStudent(), { wrapper });
    result.current.mutate({
      institutionalEmail: "ada@uni.edu",
      documentNumber: "1000000001",
      fullName: "Ada Lovelace",
      academicShift: "DAY",
      completedProfessionalElectivesCount: 0,
    });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
    expect(mockNotify.success).not.toHaveBeenCalled();
  });
});

describe("useCreateRecord", () => {
  it("calls notify.success on success", async () => {
    mockFetch.mockResolvedValueOnce({ id: "r1" });

    const { result } = renderHook(() => useCreateRecord("s1"), { wrapper });
    result.current.mutate({ semesterId: "sem-1", notes: "n", source: "manual" });

    await waitFor(() =>
      expect(mockNotify.success).toHaveBeenCalledWith("Academic record added."),
    );
  });

  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateRecord("s1"), { wrapper });
    result.current.mutate({ semesterId: "sem-1", notes: "n", source: "manual" });

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});

describe("useImportStudents", () => {
  it("calls notify.success when nothing was rejected", async () => {
    mockFetch.mockResolvedValueOnce({ acceptedRows: 3, rejectedRows: 0, errors: [] });

    const { result } = renderHook(() => useImportStudents(), { wrapper });
    result.current.mutate([]);

    await waitFor(() =>
      expect(mockNotify.success).toHaveBeenCalledWith("Imported 3 students."),
    );
    expect(mockNotify.info).not.toHaveBeenCalled();
  });

  it("calls notify.info when some rows were rejected (import-warning path)", async () => {
    mockFetch.mockResolvedValueOnce({ acceptedRows: 2, rejectedRows: 1, errors: ["bad row"] });

    const { result } = renderHook(() => useImportStudents(), { wrapper });
    result.current.mutate([]);

    await waitFor(() =>
      expect(mockNotify.info).toHaveBeenCalledWith("Imported 2, rejected 1."),
    );
    expect(mockNotify.success).not.toHaveBeenCalled();
  });

  it("calls notify.error with the raw error on failure", async () => {
    const error = new Error("boom");
    mockFetch.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useImportStudents(), { wrapper });
    result.current.mutate([]);

    await waitFor(() => expect(mockNotify.error).toHaveBeenCalledWith(error));
  });
});
