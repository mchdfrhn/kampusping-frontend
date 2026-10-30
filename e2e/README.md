# End-to-end tests

Playwright drives the real UI against the real API: sign-in, protected routes, session restore after
a reload, sign-out, safe redirects, example-item CRUD and dark mode.

## Run

1. Start the backend with a throwaway database and an administrator, and allow this app's origin:

   ```bash
   # in the backend repo
   export DATABASE_ENGINE=sqlite DATABASE_URL=sqlite+aiosqlite:///./e2e.db
   export BACKEND_CORS_ORIGINS=http://localhost:3000 LOGIN_RATE_LIMIT=200/minute
   export INITIAL_ADMIN_EMAIL=admin@example.com INITIAL_ADMIN_PASSWORD=ChangeMe-12345
   alembic upgrade head && python -m app.cli create-admin
   uvicorn app.main:app --port 8000
   ```

2. Install the browser once, then run the tests (the web app is started for you):

   ```bash
   npx playwright install chromium
   npm run test:e2e
   ```

## Configuration

| Variable                   | Default                        | Purpose                                                    |
| -------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `E2E_BASE_URL`             | `http://localhost:3000`        | Where the web app runs (its port is also used to start it) |
| `E2E_ADMIN_EMAIL`          | `admin@example.com`            | Administrator used to sign in                              |
| `E2E_ADMIN_PASSWORD`       | `ChangeMe-12345`               | Its password                                               |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | API the web app calls                                      |

If ports 3000/8000 are busy, pick others: set `E2E_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, and the
backend's `BACKEND_CORS_ORIGINS` to match. Use `localhost` (not `127.0.0.1`) for both so the refresh
cookie counts as same-site.

In CI the app is served with `npm run start`, so run `npm run build` first.
