import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "@/shared/components/ui";
import { useCurrentUser } from "@/features/auth/api/authApi";
import { ROLE_LANDING } from "@/shared/config/navigation";
import type { UserRole } from "@/shared/api/types";

interface RequireRoleProps {
  /** Roles that are permitted to access the guarded content. */
  allowedRoles: ReadonlyArray<UserRole>;
  children: ReactNode;
}

/**
 * Gates a route on the current user's role. Shows a loading state while the
 * session resolves (mirroring RequireAuth), then redirects authenticated
 * users who lack the required role to their own role's landing page
 * (`ROLE_LANDING`) instead of /login — they ARE signed in, just not
 * authorized for this view.
 *
 * The fallback MUST be role-aware rather than a single hardcoded route: some
 * `/app` children (e.g. offerings, requests) are themselves role-gated to
 * STUDENT only, so redirecting every unauthorized visitor to one fixed path
 * would loop indefinitely for a non-STUDENT user landing on a STUDENT-only
 * route.
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

  if (!user) return <Navigate to="/login" replace />;

  if (!(allowedRoles as ReadonlyArray<string>).includes(user.role)) {
    return <Navigate to={ROLE_LANDING[user.role]} replace />;
  }

  return <>{children}</>;
}
