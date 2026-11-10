import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  API_BASE_URL,
  apiLogin,
  bearer,
  importViaApi,
  signInAt,
  toCsv,
  uniqueRunId,
  type ImportRow,
} from './helpers';

const rowsFor = (run: string, count: number): ImportRow[] =>
  Array.from({ length: count }, (_, index) => ({
    nim: `R${run}${index + 1}`,
    name: `Mahasiswa ${index + 1} ${run}`,
    program: 'Teknik Informatika',
    cohort: '2022',
    phone: `08120${run.replace(/\D/g, '').padEnd(6, '3').slice(0, 6)}${index}`,
    code: `INV-R-${run}-${index + 1}`,
    semester: '2026/1',
    amount: '1500000',
    due: '2026-12-15',
    status: 'Belum lunas',
  }));

const rollbackViaApi = async (request: APIRequestContext, token: string, id: number) =>
  request.post(`${API_BASE_URL}/imports/${id}/rollback`, { headers: bearer(token) });

const invoiceTotal = async (request: APIRequestContext, token: string, search: string) => {
  const response = await request.get(
    `${API_BASE_URL}/invoices?search=${encodeURIComponent(search)}&page_size=5`,
    { headers: bearer(token) },
  );
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { total: number }).total;
};

test.describe('import rollback', () => {
  test('rolls back the latest applied import from the history', async ({ page, request }) => {
    const run = uniqueRunId();
    const token = await apiLogin(request);
    const fileName = `rollback-${run}.csv`;
    await importViaApi(request, token, toCsv(rowsFor(run, 2)), fileName);
    expect(await invoiceTotal(request, token, `INV-R-${run}`)).toBe(2);

    await signInAt(page, '/import');
    await page.getByRole('button', { name: `Batalkan impor ${fileName}` }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('2 mahasiswa baru dihapus')).toBeVisible();
    await expect(dialog.getByText('2 tagihan baru dihapus')).toBeVisible();
    await dialog.getByRole('button', { name: 'Batalkan impor', exact: true }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Impor dikembalikan.' })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(fileName) })).toContainText(
      'Dikembalikan',
    );
    expect(await invoiceTotal(request, token, `INV-R-${run}`)).toBe(0);
  });

  test('only the newest applied import can be rolled back', async ({ page, request }) => {
    const run = uniqueRunId();
    const token = await apiLogin(request);
    const olderName = `older-${run}.csv`;
    const newerName = `newer-${run}.csv`;
    const older = await importViaApi(request, token, toCsv(rowsFor(`${run}A`, 1)), olderName);
    const newer = await importViaApi(request, token, toCsv(rowsFor(`${run}B`, 1)), newerName);

    try {
      await signInAt(page, '/import');
      await expect(page.getByRole('button', { name: `Batalkan impor ${newerName}` })).toBeEnabled();
      await expect(
        page.getByRole('button', { name: `Batalkan impor ${olderName}` }),
      ).toBeDisabled();
    } finally {
      // Leave the shared database the way other specs expect it: newest first, then the older one.
      expect((await rollbackViaApi(request, token, newer)).ok()).toBe(true);
      expect((await rollbackViaApi(request, token, older)).ok()).toBe(true);
    }
  });
});
