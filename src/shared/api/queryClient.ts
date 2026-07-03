import {
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { ApiRequestError, ApiSchemaError, setCsrfToken } from "./client";
import { authKeys } from "@/features/auth/api/authApi";
import { useUiStore } from "@/shared/stores/uiStore";

/**
 * Guards the session-loss cleanup so it runs exactly once per logical
 * expiry event. A single 401 removes the cached `/me`, which makes RequireAuth
 * refetch it; that refetch 401s too, and every other in-flight request may 401
 * as well. Without this flag each of those errors would re-run the cleanup and
 * fight RequireAuth's own `handledRef`. It resets when a fresh `/me` succeeds
 * (a new sign-in), so the next expiry is handled again.
 */
let sessionExpiryHandled = false;

/**
 * Re-arm the session-expiry guard so the NEXT 401 runs the cleanup again.
 *
 * `QueryCache.onSuccess` only re-arms on a real `/me` network fetch, but login
 * seeds the identity via `queryClient.setQueryData(authKeys.me, user)`, which
 * never fires that callback. Without an explicit re-arm here, a second session
 * expiry after re-login would be swallowed (no CSRF wipe, no redirect). Call
 * this wherever a session is established without a `/me` fetch.
 */
export function armSessionExpiry(): void {
  sessionExpiryHandled = false;
}

/** True when this query key is the cached identity (`GET /me`). */
function isMeQuery(query: { queryKey: readonly unknown[] }): boolean {
  return query.queryKey[0] === authKeys.me[0] && query.queryKey[1] === authKeys.me[1];
}

/**
 * Central reaction to an expired session. A 401 on ANY request (not just `/me`)
 * means the session cookie is gone, so we mirror an explicit logout: drop the
 * in-memory CSRF token, wipe per-session UI state, and remove the cached `/me`
 * so RequireAuth re-runs and redirects to /login. Previously a 401 on a
 * mutation only showed a toast, leaving the user on a logged-in-looking page
 * where every subsequent write failed.
 */
function handleApiError(error: unknown): void {
  if (!(error instanceof ApiRequestError) || error.status !== 401) return;
  if (sessionExpiryHandled) return;
  sessionExpiryHandled = true;
  setCsrfToken(null);
  useUiStore.getState().resetSession();
  queryClient.removeQueries({ queryKey: authKeys.me });
}

/**
 * Shared TanStack Query client. Server data lives here exclusively; UI-only state
 * belongs in the Zustand store. Do not retry client errors (4xx) — they are
 * deterministic and a retry just delays the user-facing error.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
    onSuccess: (_data, query) => {
      // A fresh identity means the user re-authenticated; re-arm the guard so
      // the next session expiry is handled.
      if (isMeQuery(query)) armSessionExpiry();
    },
  }),
  mutationCache: new MutationCache({ onError: handleApiError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiRequestError && error.status < 500) return false;
        // A schema mismatch is deterministic: the backend contract drifted, so
        // retrying just replays the same failure. Fail fast at the first attempt.
        if (error instanceof ApiSchemaError) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
