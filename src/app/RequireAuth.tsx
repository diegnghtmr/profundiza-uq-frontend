import { type ReactNode, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/shared/components/ui";
import { useCurrentUser } from "@/features/auth/api/authApi";
import { setCsrfToken } from "@/shared/api/client";
import { useUiStore } from "@/shared/stores/uiStore";

/**
 * Gates the authenticated app on the resolved `GET /me` user. While the session
 * resolves we show a loading state; a 401 (or any error) redirects to /login.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser();
  const qc = useQueryClient();
  const sessionLost = !isLoading && (isError || !user);
  // `qc.clear()` removes the /me query, which the useCurrentUser observer in
  // THIS SAME component then rebuilds on the next render — triggering a real
  // refetch. If that refetch fails again, `sessionLost` flips
  // true -> false -> true before <Navigate> unmounts us. Guard so the
  // cleanup (cache clear, uiStore reset, CSRF wipe) runs exactly once per
  // logical session-loss event, not once per toggle.
  const handledRef = useRef(false);

  useEffect(() => {
    if (!sessionLost || handledRef.current) return;
    handledRef.current = true;
    // Implicit session loss (expired cookie, 401 on /me, or a stale tab left
    // open after someone else signs in) must wipe the previous user's cached
    // requests/notifications, their enrollment draft, AND the in-memory CSRF
    // token, exactly like an explicit logout — otherwise a shared university
    // computer leaks state to the next student.
    qc.clear();
    useUiStore.getState().resetSession();
    setCsrfToken(null);
  }, [sessionLost, qc]);

  if (isLoading) {
    return (
      <div className="ambient-backdrop flex min-h-screen items-center justify-center">
        <Spinner label="Loading your session" />
      </div>
    );
  }

  if (sessionLost) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
