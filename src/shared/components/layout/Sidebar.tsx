import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { useUiStore } from "@/shared/stores/uiStore";
import { useCurrentUser, useLogout } from "@/features/auth/api/authApi";
import { useMyRequests } from "@/features/enrollment/api/requestsApi";
import { useNotifications } from "@/shared/api/notificationsApi";
import { NAV_BY_ROLE, type NavBadgeKey } from "@/shared/config/navigation";
import { computeRequestStats } from "@/shared/lib/requestStats";
import { Button } from "@/shared/components/ui";
import type { UserRole } from "@/shared/api/types";

/** Left navigation: role-scoped nav items and the signed-in user card. Nav is
 *  driven by the authenticated user's real role — the single source of truth. */
export function Sidebar() {
  const navigate = useNavigate();
  const semesterId = useUiStore((s) => s.selectedSemesterId);
  const { data: user } = useCurrentUser();
  // /enrollment-requests is student-only; don't query it (403) when an admin is
  // signed in. Notifications exist for every role, so that query is unconditional.
  const { data: requests } = useMyRequests(semesterId, user?.role === "STUDENT");
  const { data: notifications } = useNotifications();
  const logout = useLogout();

  const items = user ? NAV_BY_ROLE[user.role] : [];
  const badgeCounts: Record<NavBadgeKey, number> = {
    requests: computeRequestStats(requests).active,
    notifications: notifications?.unread ?? 0,
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-ink-black/[0.06] px-5 py-6">
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const count = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
          const isAlert = item.badgeKey === "notifications";
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-body-sm transition-colors duration-200 ease-out",
                  isActive
                    ? "bg-ink-black/[0.05] text-ink-black"
                    : "text-graphite hover:bg-ink-black/[0.03] hover:text-ink-black",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full",
                      isActive ? "bg-ink-black" : "bg-steel",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-caption font-medium",
                        isAlert
                          ? "bg-spectrum-gradient text-snow"
                          : "bg-ink-black/[0.06] text-graphite",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto">
        {user ? (
          <UserCard
            name={user.fullName}
            role={roleSubtitle(user.role)}
            onSignOut={() =>
              logout.mutate(undefined, {
                onSuccess: () => navigate("/login"),
              })
            }
          />
        ) : null}
      </div>
    </aside>
  );
}

function UserCard({
  name,
  role,
  onSignOut,
}: {
  name: string;
  role: string;
  onSignOut: () => void;
}) {
  return (
    <div className="surface-frosted flex flex-col gap-4 rounded-[20px] p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-ink-black/[0.06] text-body-sm font-medium text-graphite">
          {initials(name)}
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-body-sm font-medium text-ink-black">
            {name}
          </span>
          <span className="truncate text-caption text-slate">{role}</span>
        </span>
      </div>
      <Button variant="soft" size="sm" onClick={onSignOut} className="w-full">
        Sign out
      </Button>
    </div>
  );
}

/** Human subtitle for the signed-in user's role. */
function roleSubtitle(role: UserRole): string {
  switch (role) {
    case "STUDENT":
      return "Student";
    case "ADMIN":
      return "Program administrator";
    case "SUPER_ADMIN":
      return "Super administrator";
  }
}

/** Up to two uppercase initials. Tolerates missing/empty names — a presentational
 *  helper must never throw while the /me query is still settling. */
function initials(name: string | null | undefined): string {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
