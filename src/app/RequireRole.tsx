import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "@/shared/components/ui";
import { useCurrentUser } from "@/features/auth/api/authApi";
import type { AdminRole } from "@/shared/api/types";

interface RequireRoleProps {
  /** Roles that are permitted to access the guarded content. */
  allowedRoles: ReadonlyArray<AdminRole>;
  children: ReactNode;
}

/**
 * Gates a route on the current user's role. Shows a loading state while the
 * session resolves (mirroring RequireAuth), then redirects authenticated users
 * who lack the required role to the student home (/app/offerings) instead of
 * /login — they ARE signed in, just not authorized for this view.
 *
 * Must be used inside a RequireAuth-gated subtree so the user is always
 * resolved before this guard runs.
 */
export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="ambient-backdrop flex min-h-screen items-center justify-center">
        <Spinner label="Loading your session" />
      </div>
    );
  }

  if (!user || !(allowedRoles as ReadonlyArray<string>).includes(user.role)) {
    return <Navigate to="/app/offerings" replace />;
  }

  return <>{children}</>;
}
