# Profundiza UQ — Frontend (SIPP-UQ)

Student enrollment system for professional electives at Universidad del Quindío.
This is the **frontend foundation**: a running, design-faithful app with mocked
data so the backend can be wired in as a clean swap.

Built with the "Dia" design system (frosted glass, monochrome surface + a single
spectrum gradient as ambient glow, ABC Oracle at weight 300, 30px radii, neutral
gray buttons — no bold, no saturated fills).

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query · Zustand ·
React Hook Form + Zod · React Router v7 · Radix (Dialog) · Vitest + Testing
Library.

## Run

```bash
pnpm install      # esbuild's build script is pre-approved in pnpm-workspace.yaml
pnpm dev          # http://localhost:5173
pnpm build        # type-check (tsc -b) + production bundle
pnpm test         # Vitest
```

### Environment

| Variable       | Default    | Purpose                                  |
| -------------- | ---------- | ---------------------------------------- |
| `VITE_API_URL` | `/api/v1`  | Backend base URL (same-origin by default) |

By default the Vite dev server **proxies** `/api` → `http://localhost:8080`
(see `vite.config.ts`), so the session cookie stays same-origin (no CORS) and
`VITE_API_URL` can remain `/api/v1`. Override only if the backend lives
elsewhere: copy `.env.example` to `.env` and set
`VITE_API_URL=https://api.example.com/api/v1`.

### Try it

- Run the backend (`cd ../ && docker compose up -d`, serves `:8080`).
- Open `/login`. Enter an institutional email → **Send code** → type the code
  emailed to you → **Verify**. The **JUMP STRAIGHT IN** shortcuts pre-fill a dev
  email and request a code; you still finish with the emailed code (real auth
  applies — no bypass).
- Student view: `/app/offerings` (catalog + plan draft) and `/app/requests`.
- Admin view: switch the sidebar role to **Admin** → `/app/review` (Review Queue).

## Structure (feature-first)

```
src/
  app/                  # App root, router, auth guard
  styles/               # theme.css (design tokens) + global.css
  shared/
    api/                # types (from OpenAPI), fetchClient, queryClient,
                        #   semestersApi, notificationsApi
    components/
      ui/               # Button, Card, Badge, Input, Spinner, Dialog, FilterPill, Toaster
      layout/           # AppShell, TopBar, Sidebar, Logo
    config/             # navigation per role
    lib/                # cn(), apiErrors (error → friendly copy)
    stores/             # uiStore (UI/draft), toastStore (transient notifications)
  features/
    auth/               # login (email + OTP + shortcuts)
    catalog/            # available offerings, prerequisites, plan draft
    enrollment/         # my requests + cancel
    admin-review/       # review queue grouped by priority + decision dialog
test/                   # Vitest component/store tests
```

Each feature owns `api/` (query hooks), `components/`, and `pages/`. Shared,
cross-feature code lives under `src/shared`. Container/presentational split is
used where it helps (e.g. `OfferingsPage` owns filter state; `OfferingCard` is
presentational).

## Design system

- Tokens are copied into `src/styles/theme.css` as a Tailwind v4 `@theme` block
  and imported by `global.css`. The body uses `--color-canvas` and the ABC
  Oracle font stack (the real font file is unavailable, so it falls back to the
  system sans — expected).
- The spectrum gradient appears **only** as ambient glow (`.ambient-glow`,
  `.ambient-backdrop`) and as the small logo mark / accent dots — never as a
  button or badge fill, per DESIGN.md.
- Status badges stay monochrome; a spectrum stop is used only as a tiny leading
  dot or a 1px border accent.

## What's real vs. still mocked

Every screen now calls the **real backend** through `fetchClient`
(`src/shared/api/client.ts` — cookie auth via `credentials: 'include'`, base URL
from `VITE_API_URL`, `{code,message,details,traceId}` envelope parsing). The
fixtures module was removed; there is no mock data path left.

| Hook / function             | File                                       | Real endpoint                                                  |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `startLogin`                | `features/auth/api/authApi.ts`             | `POST /auth/login/start`                                      |
| `verifyLogin`               | `features/auth/api/authApi.ts`             | `POST /auth/login/verify` (Set-Cookie)                        |
| `useCurrentUser`            | `features/auth/api/authApi.ts`             | `GET /me`                                                     |
| `useLogout`                 | `features/auth/api/authApi.ts`             | `POST /auth/logout`                                           |
| `useSemesters` / active     | `shared/api/semestersApi.ts`               | `GET /semesters` (active = `status === "ACTIVE"`)            |
| `useNotifications`          | `shared/api/notificationsApi.ts`           | `GET /notifications`                                          |
| `useOfferings`              | `features/catalog/api/offeringsApi.ts`     | `GET /offerings?semesterId=` → `{items}` (summaries)         |
| `useOfferingPrerequisites`  | `features/catalog/api/offeringsApi.ts`     | `GET /offerings/{id}/prerequisites` (lazy, on dialog open)    |
| `useSubmitEnrollmentBatch`  | `features/enrollment/api/requestsApi.ts`   | `POST /enrollment-requests/batch` + `Idempotency-Key`        |
| `useMyRequests`             | `features/enrollment/api/requestsApi.ts`   | `GET /enrollment-requests?semesterId=`                       |
| `useCancelRequest`          | `features/enrollment/api/requestsApi.ts`   | `POST /enrollment-requests/{id}/cancel`                      |
| `useReviewQueue`            | `features/admin-review/api/reviewApi.ts`   | `GET /admin/review-queues?semesterId=`                       |
| `useSubmitDecision`         | `features/admin-review/api/reviewApi.ts`   | `POST /admin/enrollment-requests/{id}/decisions`            |

**Not yet wired (degrade gracefully):**

- **Enrollment-window countdown** — the TopBar countdown is hidden because the
  windows endpoint may not be populated yet. Wire `GET /enrollment-windows` and
  restore the countdown when the backend serves windows.
- **Remaining nav destinations** (Home, Catalog, Students, Reports, Admins,
  Settings) still alias to the nearest implemented page in `config/navigation.ts`.

## Auth flow

- Identity is **server state**: `useCurrentUser` (`GET /me`) is the single source
  of truth, cached in TanStack Query (the old `authStore` was removed —
  server data does not belong in Zustand).
- `RequireAuth` shows a spinner while `/me` resolves, then redirects to `/login`
  on a 401/error. After `verifyLogin` succeeds the cookie is set and the page
  seeds the `/me` cache so the guard resolves instantly.
- `useLogout` calls `POST /auth/logout`, clears the cached user, and wipes the
  query cache so no previous-session data leaks.
- `ApiRequestError` codes are mapped to friendly copy in `shared/lib/apiErrors.ts`
  and surfaced through a lightweight toast (`shared/components/ui/Toast.tsx`)
  from the mutation `onError` handlers.

## Tests

- `test/Button.test.tsx` — variant classes (neutral / ghost / danger never a
  saturated fill) and disabled state.
- `test/Badge.test.tsx` — status → label/tone mapping is total over every
  `EnrollmentRequestStatus`.
- `test/uiStore.test.ts` — draft selection enforces the max-4 rule and still
  allows removals at the limit.
