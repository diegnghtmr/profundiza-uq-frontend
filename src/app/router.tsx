import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { FullPageFallback } from "./FullPageFallback";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";

// Route-level code splitting: each page ships in its own chunk, loaded on demand.
// App pages resolve under AppShell's own Suspense boundary; the login route,
// which renders outside the shell, wraps its own fallback.
const LoginPage = lazyPage(
  () => import("@/features/auth/pages/LoginPage"),
  (m) => m.LoginPage,
);
const HomePage = lazyPage(
  () => import("@/features/dashboard/pages/HomePage"),
  (m) => m.HomePage,
);
const OfferingsPage = lazyPage(
  () => import("@/features/catalog/pages/OfferingsPage"),
  (m) => m.OfferingsPage,
);
const RequestsPage = lazyPage(
  () => import("@/features/enrollment/pages/RequestsPage"),
  (m) => m.RequestsPage,
);
const NotificationsPage = lazyPage(
  () => import("@/features/notifications/pages/NotificationsPage"),
  (m) => m.NotificationsPage,
);
const ReviewQueuePage = lazyPage(
  () => import("@/features/admin-review/pages/ReviewQueuePage"),
  (m) => m.ReviewQueuePage,
);
const CatalogPage = lazyPage(
  () => import("@/features/admin-catalog/pages/CatalogPage"),
  (m) => m.CatalogPage,
);
const StudentsPage = lazyPage(
  () => import("@/features/admin-students/pages/StudentsPage"),
  (m) => m.StudentsPage,
);
const ReportsPage = lazyPage(
  () => import("@/features/admin-reports/pages/ReportsPage"),
  (m) => m.ReportsPage,
);
const AdminsPage = lazyPage(
  () => import("@/features/admin-users/pages/AdminsPage"),
  (m) => m.AdminsPage,
);
const SettingsPage = lazyPage(
  () => import("@/features/admin-settings/pages/SettingsPage"),
  (m) => m.SettingsPage,
);

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  {
    path: "/login",
    element: (
      <Suspense fallback={<FullPageFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: "home", element: <HomePage /> },
      { path: "offerings", element: <OfferingsPage /> },
      { path: "requests", element: <RequestsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      {
        path: "review",
        element: (
          <RequireRole allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <ReviewQueuePage />
          </RequireRole>
        ),
      },
      {
        path: "catalog",
        element: (
          <RequireRole allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <CatalogPage />
          </RequireRole>
        ),
      },
      {
        path: "students",
        element: (
          <RequireRole allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <StudentsPage />
          </RequireRole>
        ),
      },
      {
        path: "reports",
        element: (
          <RequireRole allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <ReportsPage />
          </RequireRole>
        ),
      },
      {
        path: "admins",
        element: (
          <RequireRole allowedRoles={["SUPER_ADMIN"]}>
            <AdminsPage />
          </RequireRole>
        ),
      },
      {
        path: "settings",
        element: (
          <RequireRole allowedRoles={["SUPER_ADMIN"]}>
            <SettingsPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

/** React.lazy for a module that exports the page as a *named* export. */
function lazyPage<M, C extends React.ComponentType<unknown>>(
  load: () => Promise<M>,
  pick: (module: M) => C,
) {
  return lazy(() => load().then((m) => ({ default: pick(m) })));
}
