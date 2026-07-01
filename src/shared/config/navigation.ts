import type { UserRole } from "@/shared/api/types";

/** Live counts the Sidebar can attach to a nav item by its `badgeKey`. */
export type NavBadgeKey = "requests" | "notifications";

export interface NavItem {
  label: string;
  to: string;
  /**
   * Which live count (if any) this item displays. The count itself is resolved
   * at render time from the data hooks, not hardcoded here.
   */
  badgeKey?: NavBadgeKey;
}

/** Sidebar navigation per authenticated role. Keyed by the real user role from
 *  `GET /me`; route access is independently enforced by `RequireRole`. */
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  STUDENT: [
    { label: "Home", to: "/app/home" },
    { label: "Offerings", to: "/app/offerings" },
    { label: "My Requests", to: "/app/requests", badgeKey: "requests" },
    {
      label: "Notifications",
      to: "/app/notifications",
      badgeKey: "notifications",
    },
  ],
  ADMIN: [
    { label: "Review Queue", to: "/app/review" },
    { label: "Catalog", to: "/app/catalog" },
    { label: "Students", to: "/app/students" },
    { label: "Reports", to: "/app/reports" },
    { label: "Notifications", to: "/app/notifications", badgeKey: "notifications" },
  ],
  SUPER_ADMIN: [
    { label: "Review Queue", to: "/app/review" },
    { label: "Catalog", to: "/app/catalog" },
    { label: "Students", to: "/app/students" },
    { label: "Admins", to: "/app/admins" },
    { label: "Reports", to: "/app/reports" },
    { label: "Settings", to: "/app/settings" },
    { label: "Notifications", to: "/app/notifications", badgeKey: "notifications" },
  ],
};

/** Post-login landing route per role. */
export const ROLE_LANDING: Record<UserRole, string> = {
  STUDENT: "/app/home",
  ADMIN: "/app/review",
  SUPER_ADMIN: "/app/review",
};
