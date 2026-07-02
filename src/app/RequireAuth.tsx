import { type ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/shared/components/ui";
import { useCurrentUser } from "@/features/auth/api/authApi";
import { useUiStore } from "@/shared/stores/uiStore";

/**
 * Gates the authenticated app on the resolved `GET /me` user. While the session
 * resolves we show a loading state; a 401 (or any error) redirects to /login.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser();
  const qc = useQueryClient();
  const sessionLost = !isLoading && (isError || !user);

  useEffect(() => {
    if (!sessionLost) return;
    // Implicit session loss (expired cookie, 401 on /me, or a stale tab left
    // open after someone else signs in) must wipe the previous user's cached
    // requests/notifications AND their enrollment draft, exactly like an
    // explicit logout — otherwise a shared university computer leaks state
    // to the next student.
    qc.clear();
    useUiStore.getState().resetSession();
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
