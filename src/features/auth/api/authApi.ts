import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClient, setCsrfToken } from "@/shared/api/client";
import type {
  AuthSession,
  CurrentUser,
  StartLoginResponse,
  VerifyLoginRequest,
} from "@/shared/api/types";
import { notify } from "@/shared/lib/notify";
import { useUiStore } from "@/shared/stores/uiStore";
import { authSessionSchema } from "./authSchemas";

export const authKeys = {
  me: ["auth", "me"] as const,
};

/**
 * Begin passwordless login. Sends a one-time code to the institutional email.
 * The backend returns 202 with `{ delivery, expiresInSeconds }`.
 */
export function startLogin(email: string): Promise<StartLoginResponse> {
  return fetchClient<StartLoginResponse>("/auth/login/start", {
    method: "POST",
    body: { email },
  });
}

/**
 * Verify the one-time code. On success the backend issues the session cookie
 * (Set-Cookie) and returns the authenticated user.
 */
export function verifyLogin(input: VerifyLoginRequest): Promise<AuthSession> {
  return fetchClient<AuthSession>("/auth/login/verify", {
    method: "POST",
    body: input,
  });
}

function logout(): Promise<void> {
  return fetchClient<void>("/auth/logout", { method: "POST" });
}

function fetchCurrentUser(): Promise<CurrentUser> {
  // GET /me returns the envelope { user, csrfToken } (same shape as login-verify),
  // so unwrap to the user. The top-level csrfToken is still auto-captured by the
  // fetch client before we unwrap. Returning the envelope verbatim here would
  // leave user.role / user.fullName undefined on every cache-miss refetch.
  return fetchClient<{ user: CurrentUser; csrfToken?: string }>("/me", {
    schema: authSessionSchema,
  }).then((res) => res.user);
}

/**
 * Resolved identity from the session cookie. A 401 surfaces as `isError`, which
 * the route guard treats as "not signed in". Server state, so it lives in the
 * query cache (never the Zustand store).
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Drop the cached identity and any per-session data from the previous user.
      setCsrfToken(null);
      qc.setQueryData(authKeys.me, null);
      qc.clear();
      // Also wipe the Zustand UI store (enrollment draft, selected semester) so
      // a previous user's in-progress selections never bleed into the next
      // person's session on a shared device.
      useUiStore.getState().resetSession();
    },
    onError: (error) => notify.error(error),
  });
}
