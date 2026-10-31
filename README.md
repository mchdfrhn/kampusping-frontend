# KampusPing Frontend

A clean, modern Next.js starter for business web applications: sign-in with cookie-based sessions,
permission-aware navigation, light/dark themes, and reusable data-grid, dialog and form building
blocks. It talks to the companion [FastAPI backend](../kampusping-backend/README.md).

**Stack:** Next.js 16 (App Router), React 19, TypeScript, MUI 9 (+ Data Grid, Date Pickers, Charts),
React Hook Form + Zod, Zustand, Vitest, Playwright.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000
```

Start the backend first (see its README), create an administrator, and sign in at `/login`.
`NEXT_PUBLIC_API_BASE_URL` must point at the API (default `http://localhost:8000/api/v1`), and the
API's `BACKEND_CORS_ORIGINS` must include this app's origin.

## What is included

| Area           | Details                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Auth           | Login page, in-memory access token, HttpOnly refresh cookie, automatic refresh on 401, safe `?next=` redirects                 |
| Access control | Sidebar and pages filtered by permission (`usePermission`, `<Can>`, `<RequirePermission>`); the API enforces the real checks   |
| Modules        | Dashboard (welcome card), Users, Roles and permissions, Profile and password                                                   |
| UI kit         | `AppDataGrid`, `AppDialog`, `AppConfirmDialog`, `AppDatePicker`, `AppStatusChip`, `ExportDataButton`, React Hook Form wrappers |
| Theming        | Light, dark and system modes via CSS variables, no flash on load; brand color from one env variable                            |
| Quality        | ESLint (Next + React Hooks rules), Prettier, strict TypeScript, unit tests, e2e tests                                          |

## Project layout

```text
src/
├── app/                  # routing only
│   ├── layout.tsx        # fonts, theme, providers
│   ├── (auth)/login/     # public pages
│   └── (app)/            # signed-in area: AuthGuard + AppShell, then dashboard, users, roles, profile
├── components/
│   ├── base/             # reusable UI kit (App* components)
│   ├── form/             # React Hook Form wrappers
│   └── layout/           # AppShell, sidebar, header, PageHeader, guards
├── core/
│   ├── auth/             # auth store, service, permissions, hooks
│   ├── http/             # api client (refresh + retry), errors, form error mapping
│   ├── config/           # app, env, routes, sidebar menu
│   ├── hooks/            # useServerGrid, useDebounce, ...
│   └── notify/           # toast notifications
├── design-system/        # theme (palette, typography, components) and tokens
├── modules/              # feature modules: components, services, types
└── store/                # UI state (sidebar)
e2e/                      # Playwright tests
deploy/                   # PM2 + Nginx
```

## Authentication model

```text
POST /auth/login    -> access token (kept in memory) + refresh cookie (HttpOnly, set by the API)
any API call        -> Authorization: Bearer <access token>
401                 -> one shared POST /auth/refresh -> retry once; still 401 -> back to /login
page reload         -> access token is gone; /auth/refresh restores it from the cookie
```

- No token is ever written to `localStorage` or `sessionStorage`.
- Refreshes are serialised across browser tabs (Web Locks), because refresh tokens rotate.
- Route protection is client-side navigation convenience. **Authorization happens on the server**;
  hiding a button never grants or removes access.

## Add a module

1. `src/modules/<name>/` with `types.ts`, `services/<name>.service.ts`, `components/<Name>ListPage.tsx`.
   Copy `modules/users/` and use `useServerGrid` for pagination, sorting and search.
2. A route: `src/app/(app)/<name>/page.tsx`, wrapping the page in `<RequirePermission>`.
3. A menu entry in `src/core/config/menu.config.ts`, with the permission that should reveal it.
4. Permission codes mirrored in `src/core/auth/permissions.ts` (the backend defines them).

## Conventions

- Use the `App*` components for grids, dialogs and confirmations instead of raw MUI ones, so the
  look and behavior stay consistent.
- Colors come from the theme (`primary.main`, `divider`, `mixToken(...)`), never hex literals.
- Lists follow the API contract: `page` (1-based), `page_size` 20/50/100, `search` (3+ characters),
  `sort_by`, `sort_order`, plus module filters.
- Forms use React Hook Form + Zod. Map API validation errors onto fields with `handleFormApiError`.
- Toasts: `const notify = useNotify(); notify.success('Saved')`.

## Scripts

| Command                           | Purpose                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `npm run dev` / `build` / `start` | Develop, build, serve                                        |
| `npm run check`                   | Lint, typecheck, format check and unit tests                 |
| `npm test`                        | Vitest unit and component tests                              |
| `npm run test:e2e`                | Playwright end-to-end tests ([e2e/README.md](e2e/README.md)) |
| `npm run format`                  | Prettier                                                     |

## Configuration

`NEXT_PUBLIC_*` variables are inlined at build time and visible in the browser: never put secrets
in them. See `.env.example`.

| Variable                                                                      | Purpose                                                   |
| ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`                                                    | Backend API base URL including `/api/v1`                  |
| `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_DESCRIPTION`, `NEXT_PUBLIC_APP_LOGO` | Branding (logo is optional; a monogram is used otherwise) |
| `NEXT_PUBLIC_PRIMARY_COLOR`                                                   | Brand color; dark mode derives a lighter variant          |
| `NEXT_PUBLIC_DEFAULT_THEME_MODE`                                              | `light`, `dark` or `system`                               |
| `NEXT_PUBLIC_LOCALE`                                                          | Date/number locale (`en` or `id` bundled)                 |

## Deploy

PM2 + Nginx scripts: [`deploy/`](deploy/README.md). A multi-stage `Dockerfile` is included and the
repository root has a `docker-compose.yml` that runs the whole stack.

## License

[MIT](LICENSE)
