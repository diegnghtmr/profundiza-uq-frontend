import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "@/shared/components/ui";
import { useCurrentUser } from "@/features/auth/api/authApi";

/**
 * Gates the authenticated app on the resolved `GET /me` user. While the session
 * resolves we show a loading state; a 401 (or any error) redirects to /login.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="ambient-backdrop flex min-h-screen items-center justify-center">
        <Spinner label="Loading your session" />
      </div>
    );
  }

  if (isError || !user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
