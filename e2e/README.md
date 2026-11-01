# End-to-end tests

Playwright drives the real UI against the real API. The interface is in Indonesian, so the specs
select elements by their Indonesian labels ("Masuk", "Impor Data", "Terapkan", ...).

## Never use a real WhatsApp provider

End-to-end runs must use `WA_PROVIDER=fake` (the backend records messages in memory). Never start
`kampusping-wa-gateway` and never set `WA_PROVIDER=gateway` for these tests: no spec may ever
reach a real phone. The specs also never turn on "Pengiriman otomatis"; the settings spec opens
the confirmation dialog and cancels it, so auto-send stays off in the database.

## Specs

| File              | Covers                                                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.spec.ts`     | Sign-in and redirects (`?next=`, unsafe targets), wrong credentials, session restore after a reload, sign-out, home page landing, roles and users pages, dark mode                                                                                                                                      |
| `billing.spec.ts` | Import flow (upload, preview counts and row error, Terapkan, rows in Mahasiswa and Tagihan, re-import, paid is sticky), dashboard totals, seeded template and H-7..H+7 rules, a `pimpinan` user limited to the dashboard (no-access page on `/students`), WhatsApp panel and the auto-send confirmation |
| `helpers.ts`      | Shared sign-in, API login, in-memory CSV builder and API import (not a spec)                                                                                                                                                                                                                            |

Specs share one database and do not depend on each other or on their order: every run builds its own
NIMs, invoice codes and e-mail addresses from a unique id. The import CSV is generated in memory
(`toCsv` in `helpers.ts`) and uploaded with `setInputFiles`, so no fixture file is committed.

## Run

1. Start the backend with a throwaway database, the fake WhatsApp provider and an administrator,
   and allow this app's origin. The commands below use the web port 3100 and API port 8100 (ports
   3000/8000 are often taken). Run them in the backend repo; point `DATABASE_URL` at a file
   outside the repository (`.env` may point to a real database, and environment variables win):

   ```bash
   export DATABASE_ENGINE=sqlite DATABASE_URL=sqlite+aiosqlite:///C:/tmp/kampusping-e2e.db
   export BACKEND_CORS_ORIGINS=http://localhost:3100
   export LOGIN_RATE_LIMIT=1000/minute LOGIN_MAX_ATTEMPTS=1000
   export INITIAL_ADMIN_EMAIL=admin@example.com INITIAL_ADMIN_PASSWORD=ChangeMe-12345
   export WA_PROVIDER=fake
   alembic upgrade head
   python -m app.cli create-admin   # also creates the default template and rules
   python -m app.cli seed           # idempotent: permissions, system roles, defaults
   uvicorn app.main:app --port 8100 --host localhost
   ```

2. Install the browser once, then run the tests in the frontend repo. Point the web app at the API
   (the value is baked in when the app is built, so build with it too when you use `CI=1`):

   ```bash
   npx playwright install chromium
   export E2E_BASE_URL=http://localhost:3100
   export NEXT_PUBLIC_API_BASE_URL=http://localhost:8100/api/v1
   npm run test:e2e
   ```

   Locally the web app is started for you with `next dev` on the port of `E2E_BASE_URL` (Next.js
   refuses a second dev server in the same folder, so stop any `npm run dev` you have running
   first). With `CI=1` it is served with `npm run start`, so run `npm run build` first.

3. Stop the backend and the web server when you are done, and delete the throwaway database.

To check the worker without Playwright, run `python -m app.cli run-worker --once` in the backend
with the same environment: with auto-send off it must report that nothing was sent.

## Configuration

| Variable                   | Default                        | Purpose                                                    |
| -------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `E2E_BASE_URL`             | `http://localhost:3000`        | Where the web app runs (its port is also used to start it) |
| `E2E_ADMIN_EMAIL`          | `admin@example.com`            | Administrator used to sign in                              |
| `E2E_ADMIN_PASSWORD`       | `ChangeMe-12345`               | Its password                                               |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api/v1` | API the web app calls (the specs also call it directly)    |

Use `localhost` (not `127.0.0.1`) for both the web app and the API so the refresh cookie counts as
same-site, and make the backend's `BACKEND_CORS_ORIGINS` match the web origin.
