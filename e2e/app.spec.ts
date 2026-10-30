import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe-12345';

const signIn = async (page: Page, email = EMAIL, password = PASSWORD) => {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
};

// A code that is unique per run so repeated runs do not collide with soft-deleted rows.
const uniqueCode = () => `E2E-${Date.now().toString(36).toUpperCase()}`;

test.describe('authentication', () => {
  test('anonymous visitors are sent to the login page and back after signing in', async ({
    page,
  }) => {
    await page.goto('/users');
    await expect(page).toHaveURL(/\/login\?next=%2Fusers/);

    await signIn(page);

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible();
  });

  test('rejects wrong credentials without revealing which part was wrong', async ({ page }) => {
    await page.goto('/login');

    await signIn(page, EMAIL, 'Wrong-password-1');

    // Next.js has its own route-announcer alert, so match ours by text.
    await expect(
      page.getByRole('alert').filter({ hasText: 'Invalid email or password.' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('keeps the session across a reload and ends it on sign out', async ({ page }) => {
    await page.goto('/login');
    await signIn(page);
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();

    // The access token lives in memory; a reload recovers the session via the refresh cookie.
    await page.reload();
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();

    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login/);

    // The refresh cookie is gone, so protected pages bounce to login again.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('does not follow an external redirect target', async ({ page }) => {
    await page.goto('/login?next=https%3A%2F%2Fevil.example');
    const { origin } = new URL(page.url());

    await signIn(page);

    // Lands on the app's own dashboard, not on the attacker's site.
    await expect(page).toHaveURL(`${origin}/dashboard`);
  });
});

test.describe('example items (CRUD)', () => {
  test('create, search, edit and delete an item', async ({ page }) => {
    const code = uniqueCode();
    const dialog = page.getByRole('dialog');

    await page.goto('/login?next=%2Fexample');
    await signIn(page);
    await expect(page.getByRole('heading', { name: 'Example items', level: 1 })).toBeVisible();

    // Create
    await page.getByRole('button', { name: 'New item' }).click();
    await dialog.getByLabel('Code').fill(code);
    await dialog.getByLabel('Name').fill('Playwright item');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('Item created.')).toBeVisible();

    // Search finds it
    await page.getByPlaceholder(/Search code or name/).fill(code);
    const row = page.getByRole('row', { name: new RegExp(code) });
    await expect(row).toBeVisible();

    // Duplicate code is rejected inline
    await page.getByRole('button', { name: 'New item' }).click();
    await dialog.getByLabel('Code').fill(code);
    await dialog.getByLabel('Name').fill('Duplicate');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('An item with this code already exists.')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Edit
    await page.getByRole('button', { name: `Edit ${code}` }).click();
    await dialog.getByLabel('Name').fill('Renamed by Playwright');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Item updated.')).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'Renamed by Playwright' })).toBeVisible();

    // Delete
    await page.getByRole('button', { name: `Delete ${code}` }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Item deleted.')).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(code) })).toHaveCount(0);
  });
});

test.describe('administration', () => {
  test('lists roles with their permissions', async ({ page }) => {
    await page.goto('/login?next=%2Froles');
    await signIn(page);

    await expect(page.getByRole('heading', { name: 'Roles', level: 1 })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'admin' }).first()).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'member' }).first()).toBeVisible();
  });

  test('toggles dark mode', async ({ page }) => {
    await page.goto('/login');
    await signIn(page);
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();

    const html = page.locator('html');
    const before = await html.getAttribute('class');
    await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click();

    await expect.poll(async () => html.getAttribute('class')).not.toBe(before);
  });
});
