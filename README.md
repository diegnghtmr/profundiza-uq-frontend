# Profundiza UQ — Frontend (SIPP-UQ)

Web client for the professional-electives enrollment system at Universidad del
Quindío. Every screen talks to the real backend — there is no mock data path.
Built on the **Dia** design system: frosted glass, a monochrome surface with a
single spectrum gradient used only as ambient glow, generous radii, and neutral
(non-saturated) buttons and badges.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query · Zustand ·
React Hook Form + Zod · React Router v7 · Radix (Dialog) · Vitest + Testing
Library.

## Run

```bash
pnpm install
pnpm dev          # http://localhost:5173, proxies /api → :8080
pnpm build        # type-check (tsc -b) + production bundle
pnpm test         # Vitest
```

Or run the whole stack (frontend, backend, postgres, mailpit) from the project
root with `docker compose up --build` — the frontend image serves the production
build through nginx and reverse-proxies `/api` to the backend.

### Environment

| Variable       | Default   | Purpose                                    |
| -------------- | --------- | ------------------------------------------ |
| `VITE_API_URL` | `/api/v1` | Backend base URL (same-origin by default). |

The Vite dev server proxies `/api` → `http://localhost:8080` (see
`vite.config.ts`), so the session cookie stays same-origin (no CORS) and
`VITE_API_URL` can remain `/api/v1`. Override only if the backend lives
elsewhere: copy `.env.example` to `.env` and set a full URL.

### Try it

1. Start the backend (`cd .. && docker compose up -d`, serves `:8080`).
2. Open `/login`, enter an institutional email → **Send code** → enter the code
   emailed to you (Mailpit UI at `:8025` locally) → **Verify**. Auth is
   passwordless OTP; there are no dev shortcuts — the emailed code is required.
3. The navigation you see is driven by your **real role** (from `GET /me`):
   students get Home / Offerings / My Requests / Notifications; admins get the
   Review Queue, Catalog, Students, Reports, and (super-admins) Admins /
   Settings. Route access is independently enforced by `RequireRole`.

## Structure (feature-first)

```
src/
  app/                  # App root, router (lazy routes), RequireAuth / RequireRole guards
  styles/               # theme.css (Tailwind v4 @theme tokens) + global.css
  shared/
    api/                # OpenAPI types, fetchClient, queryClient, cross-feature hooks
    components/
      ui/               # Button, Card, Badge/StatusBadge, Input, Select, Textarea,
                        #   Spinner, Dialog, FilterPill, SegmentedControl, Toaster
      layout/           # AppShell, TopBar, Sidebar, Logo
    config/             # navigation per role
    lib/                # cn(), apiErrors, requestStats, countdown
    stores/             # uiStore (selected semester + plan draft), toastStore
  features/
    auth/               # passwordless OTP login
    dashboard/          # Home (greeting, live window countdown, stats, recent requests)
    catalog/            # available offerings, prerequisites, plan draft + submit
    enrollment/         # My Requests + cancel
    notifications/      # notifications list + mark read
    admin-review/       # group-scoped Review Queue with capacity header + decisions
    admin-catalog/      # electives, offerings, groups, prerequisites, capacity
    admin-students/     # students list, add, bulk import, academic records
    admin-users/        # administrators (super-admin)
    admin-reports/      # async report requests + downloads
    admin-settings/     # global settings (super-admin)
test/                   # Vitest component/store/page smoke tests
```

Each feature owns its `api/` (query hooks), `components/`, and `pages/`.
Cross-feature code lives under `src/shared`. A container/presentational split is
used where it helps (e.g. `OfferingsPage` owns filter state; `OfferingCard` is
presentational).

## Conventions

- **Server state lives in TanStack Query, never Zustand.** Identity is
  `useCurrentUser` (`GET /me`) — the single source of truth. `uiStore` holds only
  client state (selected semester, enrollment-plan draft).
- **Auth & RBAC.** `RequireAuth` gates the app on the resolved `/me` user;
  `RequireRole` guards admin routes; the sidebar renders navigation from the real
  user role. There is no client-side role switching.
- **Forms** use React Hook Form + Zod (`zodResolver`) inside a real `<form>`
  (Enter submits), with the shared accessible primitives `Input` / `Select` /
  `Textarea` (label association, `aria-invalid` + `aria-describedby`, red error
  text). Mutations disable the submit while pending and surface API errors via a
  toast from `onError`.
- **Code splitting** is route-level: every page is lazy-loaded and vendored
  libraries are split into cacheable chunks, so the initial entry stays small.

## Design system

- Tokens live in `src/styles/theme.css` as a Tailwind v4 `@theme` block, imported
  by `global.css`. The rendered typeface is **DM Sans** (loaded from Google Fonts
  in `index.html`); it stands in for the licensed ABC Oracle brand face.
- The spectrum gradient appears **only** as ambient glow (`.ambient-glow`,
  `.ambient-backdrop`) and small accents (the logo mark, badge dots) — never as a
  button or badge fill, per DESIGN.md.
- Status badges stay monochrome (neutral / muted / solid surfaces); colour is
  carried only by a small leading dot or a subtle 1px border accent.

## Tests

Component, store, and page smoke tests run under Vitest + Testing Library
(`pnpm test`) — e.g. button variants never use a saturated fill, the status →
badge mapping is total over every `EnrollmentRequestStatus`, the draft store
enforces the max-4 rule, and each admin page renders its data and empty states.
