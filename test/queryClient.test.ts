import { describe, it, expect, vi, beforeEach } from "vitest";

// Keep ApiRequestError real (instanceof must work in the cache handler) while
// spying on the CSRF seam so we can assert it is wiped centrally.
vi.mock("@/shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/client")>();
  return { ...actual, setCsrfToken: vi.fn(actual.setCsrfToken) };
});

import { ApiRequestError, setCsrfToken } from "@/shared/api/client";
import { queryClient } from "@/shared/api/queryClient";
import { authKeys } from "@/features/auth/api/authApi";
import { useUiStore } from "@/shared/stores/uiStore";

const mockSetCsrfToken = vi.mocked(setCsrfToken);

function unauthorized(): ApiRequestError {
  return new ApiRequestError(401, {
    code: "UNAUTHENTICATED",
    message: "raw backend detail",
    traceId: "t",
  });
}

function serverError(): ApiRequestError {
  return new ApiRequestError(500, {
    code: "UNKNOWN",
    message: "boom",
    traceId: "t",
  });
}

async function runFailingMutation(error: unknown): Promise<void> {
  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationFn: () => Promise.reject(error),
    retry: false,
  });
  await mutation.execute(undefined).catch(() => {});
}

/** Re-authenticate so the module-level session-loss guard is cleared. */
async function simulateReauth(): Promise<void> {
  const q = queryClient.getQueryCache().build(queryClient, {
    queryKey: authKeys.me,
    queryFn: () => Promise.resolve({ id: "u1", role: "STUDENT" }),
  });
  await q.fetch();
}

describe("queryClient centralized 401 handling", () => {
  beforeEach(async () => {
    mockSetCsrfToken.mockClear();
    await simulateReauth(); // clear the guard from any prior test
    mockSetCsrfToken.mockClear();
    useUiStore.getState().setSelectedSemesterId("sem-prev");
    useUiStore.getState().toggleDraftGroup("g-prev");
    queryClient.setQueryData(authKeys.me, { id: "u1", role: "STUDENT" });
  });

  it("wipes the CSRF token, resets the UI session and removes /me on a mutation 401", async () => {
    const resetSpy = vi.spyOn(useUiStore.getState(), "resetSession");

    await runFailingMutation(unauthorized());

    expect(mockSetCsrfToken).toHaveBeenCalledWith(null);
    expect(useUiStore.getState().draftGroupIds).toEqual([]);
    expect(useUiStore.getState().selectedSemesterId).toBe("");
    // Removing /me is what forces RequireAuth to re-run and redirect to /login.
    expect(queryClient.getQueryData(authKeys.me)).toBeUndefined();
    expect(resetSpy).toHaveBeenCalledTimes(1);

    resetSpy.mockRestore();
  });

  it("runs the centralized cleanup exactly once even if a follow-up 401 fires", async () => {
    await runFailingMutation(unauthorized());
    mockSetCsrfToken.mockClear();

    // The /me refetch that RequireAuth triggers will also 401; the guard must
    // swallow it so we do not loop with RequireAuth's own handledRef cleanup.
    await runFailingMutation(unauthorized());

    expect(mockSetCsrfToken).not.toHaveBeenCalled();
  });

  it("ignores non-401 errors (a 500 must not clear the session)", async () => {
    await runFailingMutation(serverError());

    expect(mockSetCsrfToken).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(authKeys.me)).toEqual({
      id: "u1",
      role: "STUDENT",
    });
  });
});
