import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe-12345';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

/**
 * Set to `1` only when the backend runs with `WA_PROVIDER=fake`. The API cannot tell a fake provider
 * from a connected gateway, so specs that touch send-related controls refuse to run without it.
 */
export const FAKE_PROVIDER_CONFIRMED = process.env.E2E_FAKE_PROVIDER === '1';

/** Fills the login form; the page must already be on `/login`. */
export const signIn = async (page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) => {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
};

/** Opens `path` through the login page so the session starts fresh (and lands on `path`). */
export const signInAt = async (page: Page, path: string, email?: string, password?: string) => {
  await page.goto(`/login?next=${encodeURIComponent(path)}`);
  await signIn(page, email, password);
  await expect(page).toHaveURL(new RegExp(`${path}$`));
};

/** A short id that is unique per test run, so tests can share one database. */
export const uniqueRunId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();

export const apiLogin = async (
  request: APIRequestContext,
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD,
) => {
  const response = await request.post(`${API_BASE_URL}/auth/login`, { data: { email, password } });
  expect(response.ok(), `API sign-in failed with ${response.status()}`).toBe(true);
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
};

export type ImportRow = {
  nim: string;
  name: string;
  program: string;
  cohort: string;
  phone: string;
  code: string;
  semester: string;
  amount: string;
  due: string;
  status: string;
};

export const IMPORT_HEADER =
  'NIM,Nama,Prodi,Angkatan,No WA,Kode Tagihan,Semester,Nominal,Jatuh Tempo,Status';

/** The SIAKAD/SIPEMA export format as a UTF-8 CSV string (the fixture is built in memory). */
export const toCsv = (rows: ImportRow[]) =>
  [
    IMPORT_HEADER,
    ...rows.map((row) =>
      [
        row.nim,
        row.name,
        row.program,
        row.cohort,
        row.phone,
        row.code,
        row.semester,
        row.amount,
        row.due,
        row.status,
      ].join(','),
    ),
  ].join('\n');

/** Uploads and applies a CSV through the API (setup for tests that only need data to exist). */
export const importViaApi = async (
  request: APIRequestContext,
  token: string,
  csv: string,
  fileName: string,
) => {
  const headers = { Authorization: `Bearer ${token}` };
  const preview = await request.post(`${API_BASE_URL}/imports`, {
    headers,
    multipart: {
      source: 'siakad',
      file: { name: fileName, mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf-8') },
    },
  });
  expect(preview.ok(), `import preview failed with ${preview.status()}`).toBe(true);
  const batch = (await preview.json()) as { id: number };
  const applied = await request.post(`${API_BASE_URL}/imports/${batch.id}/apply`, { headers });
  expect(applied.ok(), `import apply failed with ${applied.status()}`).toBe(true);
};

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** The saved application settings, read straight from the API. */
export const getSettings = async (request: APIRequestContext, token: string) => {
  const response = await request.get(`${API_BASE_URL}/settings`, { headers: bearer(token) });
  expect(response.ok(), `GET /settings failed with ${response.status()}`).toBe(true);
  return (await response.json()) as { auto_send_enabled: boolean };
};

/** Creates a user with a system role through the API; returns its id for cleanup. */
export const createUserWithRole = async (
  request: APIRequestContext,
  token: string,
  user: { email: string; fullName: string; password: string; role: string },
) => {
  const roles = await request.get(`${API_BASE_URL}/roles?search=${user.role}`, {
    headers: bearer(token),
  });
  expect(roles.ok()).toBe(true);
  const { items } = (await roles.json()) as { items: { id: number; name: string }[] };
  const role = items.find((item) => item.name === user.role);
  expect(role, `the ${user.role} system role exists`).toBeTruthy();
  const created = await request.post(`${API_BASE_URL}/users`, {
    headers: bearer(token),
    data: {
      email: user.email,
      full_name: user.fullName,
      password: user.password,
      role_ids: [role!.id],
    },
  });
  expect(created.status()).toBe(201);
  return ((await created.json()) as { id: number }).id;
};

/** Soft-deletes users created by a spec so a long-lived database does not collect them. */
export const deleteUsers = async (request: APIRequestContext, ids: number[]) => {
  if (ids.length === 0) return;
  const token = await apiLogin(request);
  for (const id of ids) {
    await request.delete(`${API_BASE_URL}/users/${id}`, { headers: bearer(token) });
  }
};
