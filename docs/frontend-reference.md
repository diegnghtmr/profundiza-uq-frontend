# Profundiza UQ frontend reference (SIPP-UQ)

## Sources and routes

| Area | Responsibility |
| --- | --- |
| `src/app/` | App root, lazy router, `RequireAuth` and `RequireRole`. |
| `src/features/auth/` | Email and one-time-code sign-in forms. |
| `src/features/dashboard/` | Welcome view, live window countdown, summary counts, and recent requests. |
| `src/features/catalog/` | Offerings, prerequisites, and the plan draft; `OfferingsPage` owns filters and `OfferingCard` renders a result. |
| `src/features/enrollment/`, `src/features/notifications/` | Request details and cancellation, notifications and mark-as-read. |
| `src/features/admin-review/`, `src/features/admin-catalog/` | Review by group and capacity, plus electives, offerings, groups, prerequisites, and adjustments. |
| `src/features/admin-students/`, `src/features/admin-reports/` | Student records and import, background report requests and downloads. |
| `src/features/admin-users/`, `src/features/admin-settings/` | Super-administrator accounts and global settings. |
| `src/shared/` | API types/client and query setup; UI, shell/navigation, utilities, draft state and toasts. |
| `test/` | Vitest store, component, and page smoke tests. |

Features own their API query hooks, pages, and local components. The current user is read from `/me` through TanStack Query; there is no client-side role switch. Zustand holds UI state such as the selected semester and the plan draft. Dashboard and notifications are available to the signed-in user; the router independently gates student offerings/requests, administrator views, and super-administrator settings. The API remains the authority on permissions.

## Forms and design system

Forms such as sign-in and student/account creation use React Hook Form with Zod. Use a real form where applicable so Enter submits; associate labels and errors with controls. Shared inputs, selects, and textareas expose error state through `aria-invalid` and `aria-describedby`. Submission actions can disable while pending and surface API errors through toasts.

The [Tailwind theme](../src/styles/theme.css) is imported by [global.css](../src/styles/global.css). [index.html](../index.html) loads DM Sans from Google Fonts in place of the brand typeface. The interface uses frosted surfaces, generous radii, and monochrome controls. The spectrum gradient is an ambient glow or a small accent, not a saturated button fill. Status badges use neutral surfaces and small color accents.

Routes are lazy-loaded. Vite orders vendor bundles automatically; the earlier manually assigned vendor chunks were removed because a cycle could leave a production bundle blank even when the development server and Vitest passed. Review changes in a production build as well as the dev server. Component tests exercise neutral button variants, status-badge mapping, the maximum draft size, and data/empty states in administrative pages.
