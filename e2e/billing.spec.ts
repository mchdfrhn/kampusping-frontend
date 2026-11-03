import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  API_BASE_URL,
  FAKE_PROVIDER_CONFIRMED,
  apiLogin,
  bearer,
  createUserWithRole,
  deleteUsers,
  getSettings,
  importViaApi,
  signIn,
  signInAt,
  toCsv,
  uniqueRunId,
  type ImportRow,
} from './helpers';

/** Four rows for one run: two unpaid, one paid and one with an invalid amount. */
const buildRows = (run: string): ImportRow[] => {
  const base = {
    program: 'Teknik Informatika',
    cohort: '2022',
    semester: '2026/1',
    due: '2026-12-15',
  };
  const digits = run.replace(/\D/g, '').padEnd(7, '1').slice(0, 7);
  return [
    {
      ...base,
      nim: `E${run}1`,
      name: `Budi Satu ${run}`,
      phone: `+62812${digits}`,
      code: `INV-${run}-1`,
      amount: '1500000',
      status: 'Belum lunas',
    },
    {
      ...base,
      nim: `E${run}2`,
      name: `Sari Dua ${run}`,
      phone: `0813${digits}`,
      code: `INV-${run}-2`,
      amount: 'Rp 2.750.000',
      due: '2026-12-20',
      status: 'Belum lunas',
    },
    {
      ...base,
      nim: `E${run}3`,
      name: `Andi Tiga ${run}`,
      phone: `0814${digits}`,
      code: `INV-${run}-3`,
      amount: '3000000',
      status: 'Lunas',
    },
    {
      ...base,
      nim: `E${run}4`,
      name: `Dewi Empat ${run}`,
      phone: `0815${digits}`,
      code: `INV-${run}-4`,
      amount: 'abc',
      status: 'Belum lunas',
    },
  ];
};

const csvFile = (name: string, rows: ImportRow[]) => ({
  name,
  mimeType: 'text/csv',
  buffer: Buffer.from(toCsv(rows), 'utf-8'),
});

const openFromSidebar = async (page: Page, label: string, heading: string) => {
  await page
    .getByRole('navigation', { name: 'Navigasi utama' })
    .getByRole('link', { name: label, exact: true })
    .click();
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
};

const upload = async (page: Page, file: ReturnType<typeof csvFile>) => {
  const uploadButton = page.getByRole('button', { name: 'Unggah berkas' });
  if (await uploadButton.isVisible()) {
    await uploadButton.click();
  }
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole('button', { name: 'Unggah dan pratinjau' }).click();
  const preview = page.getByRole('region', { name: 'Pratinjau impor' });
  await expect(preview).toBeVisible();
  return preview;
};

/** The figure shown under a label such as "Baris valid" in the preview summary. */
const figure = (preview: Locator, label: string) =>
  preview
    .locator('dt', { hasText: new RegExp(`^${label}$`) })
    .locator('xpath=following-sibling::dd[1]');

const expectCounts = async (preview: Locator, expected: Record<string, string>) => {
  for (const [label, value] of Object.entries(expected)) {
    await expect(figure(preview, label), label).toHaveText(value);
  }
};

const searchGrid = async (page: Page, placeholder: string, text: string) => {
  await page.getByPlaceholder(placeholder).fill(text);
};

test.describe('import flow', () => {
  test('previews, applies and re-imports a SIAKAD file', async ({ page }) => {
    const run = uniqueRunId();
    const rows = buildRows(run);
    const [unpaidOne, unpaidTwo, paid] = rows;

    await signInAt(page, '/import');
    await expect(page.getByRole('heading', { name: 'Impor Data', level: 1 })).toBeVisible();

    // Preview: nothing is saved yet, and the invalid row is reported with its message.
    let preview = await upload(page, csvFile(`siakad-${run}.csv`, rows));
    await expectCounts(preview, {
      'Baris dibaca': '4',
      'Baris valid': '3',
      'Baris bermasalah': '1',
      'Mahasiswa baru': '3',
      'Mahasiswa diperbarui': '0',
      'Tagihan baru': '3',
      'Tagihan diperbarui': '0',
      'Tagihan dilewati': '0',
    });
    await expect(preview.getByRole('gridcell', { name: 'Nominal tidak valid.' })).toBeVisible();
    await expect(preview.getByRole('gridcell', { name: '5', exact: true })).toBeVisible();

    // Apply.
    await preview.getByRole('button', { name: 'Terapkan' }).click();
    await expect(
      page.getByRole('alert').filter({
        hasText:
          'Impor diterapkan: 3 mahasiswa baru, 0 mahasiswa diperbarui, 3 tagihan baru, 0 tagihan diperbarui, 0 tagihan dilewati.',
      }),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'Pratinjau impor' })).toHaveCount(0);

    // Students.
    await openFromSidebar(page, 'Mahasiswa', 'Mahasiswa');
    await searchGrid(page, 'Cari NIM atau nama', run);
    for (const row of [unpaidOne, unpaidTwo, paid]) {
      const gridRow = page.getByRole('row').filter({ hasText: row.nim });
      await expect(gridRow).toHaveCount(1);
      await expect(gridRow.getByRole('gridcell', { name: row.name, exact: true })).toBeVisible();
      await expect(gridRow.getByText('Teknik Informatika')).toBeVisible();
      await expect(gridRow.getByText('Valid', { exact: true })).toBeVisible();
    }
    // The +62 and 08 formats are both stored in the international form.
    await expect(page.getByRole('row').filter({ hasText: unpaidOne.nim })).toContainText(
      unpaidOne.phone,
    );
    await expect(page.getByRole('row').filter({ hasText: unpaidTwo.nim })).toContainText(
      `+62${unpaidTwo.phone.slice(1)}`,
    );
    // The invalid row was not imported.
    await expect(page.getByRole('row').filter({ hasText: rows[3].nim })).toHaveCount(0);

    // Invoices.
    await openFromSidebar(page, 'Tagihan', 'Tagihan');
    await searchGrid(page, 'Cari kode tagihan, NIM, atau nama', run);
    const invoiceRow = (code: string) => page.getByRole('row').filter({ hasText: code });
    await expect(invoiceRow(unpaidOne.code)).toContainText('Rp1.500.000');
    await expect(
      invoiceRow(unpaidOne.code).getByText('Belum lunas', { exact: true }),
    ).toBeVisible();
    await expect(invoiceRow(unpaidTwo.code)).toContainText('Rp2.750.000');
    await expect(
      invoiceRow(unpaidTwo.code).getByText('Belum lunas', { exact: true }),
    ).toBeVisible();
    await expect(invoiceRow(paid.code)).toContainText('Rp3.000.000');
    await expect(invoiceRow(paid.code).getByText('Lunas', { exact: true })).toBeVisible();
    await expect(invoiceRow(rows[3].code)).toHaveCount(0);

    // Importing the same file again changes nothing new: every valid row is an update.
    await openFromSidebar(page, 'Impor Data', 'Impor Data');
    preview = await upload(page, csvFile(`siakad-${run}-ulang.csv`, rows));
    await expectCounts(preview, {
      'Baris valid': '3',
      'Baris bermasalah': '1',
      'Mahasiswa baru': '0',
      'Mahasiswa diperbarui': '3',
      'Tagihan baru': '0',
      'Tagihan diperbarui': '3',
      'Tagihan dilewati': '0',
    });
    await preview.getByRole('button', { name: 'Batalkan' }).click();
    await page.getByRole('button', { name: 'Ya, batalkan' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Impor dibatalkan.' })).toBeVisible();

    // Paid is sticky: a file that says the paid invoice is unpaid is skipped for that invoice.
    const regressed = rows.map((row) =>
      row.code === paid.code ? { ...row, status: 'Belum lunas' } : row,
    );
    preview = await upload(page, csvFile(`siakad-${run}-mundur.csv`, regressed));
    await expectCounts(preview, {
      'Tagihan baru': '0',
      'Tagihan diperbarui': '2',
      'Tagihan dilewati': '1',
    });
    await preview.getByRole('button', { name: 'Terapkan' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: '2 tagihan diperbarui, 1 tagihan dilewati.' }),
    ).toBeVisible();

    await openFromSidebar(page, 'Tagihan', 'Tagihan');
    await searchGrid(page, 'Cari kode tagihan, NIM, atau nama', paid.code);
    await expect(invoiceRow(paid.code).getByText('Lunas', { exact: true })).toBeVisible();
  });

  test('shows the dashboard totals after data has been imported', async ({ page, request }) => {
    const run = uniqueRunId();
    const token = await apiLogin(request);
    await importViaApi(request, token, toCsv(buildRows(run)), `dasbor-${run}.csv`);

    await signInAt(page, '/dashboard');
    await expect(page.getByRole('heading', { name: 'Dasbor', level: 1 })).toBeVisible();

    const card = (label: string) =>
      page.locator('[data-stat]').filter({ has: page.getByText(label, { exact: true }) });
    const total = card('Total tagihan');
    await expect(total).toBeVisible();
    // The shared database may hold more invoices from other specs, but never fewer than ours.
    await expect
      .poll(async () => Number((await total.getByText(/^[\d.]+$/).innerText()).replace(/\D/g, '')))
      .toBeGreaterThanOrEqual(3);
    await expect(total).toContainText('Rp');
    for (const label of ['Lunas', 'Belum lunas', 'Tunggakan', 'Pesan terkirim', 'Antre']) {
      await expect(card(label)).toBeVisible();
    }
    // No error banner; the notice about auto-send is informational only.
    await expect(
      page.getByRole('alert').filter({ hasText: 'Gagal memuat ringkasan.' }),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Coba lagi' })).toHaveCount(0);
  });
});

const createdUserIds: number[] = [];

test.afterAll(async ({ playwright }) => {
  const request = await playwright.request.newContext();
  try {
    await deleteUsers(request, createdUserIds);
  } finally {
    await request.dispose();
  }
});

test.describe('defaults and permissions', () => {
  test('shows the seeded template and the H-7 to H+7 schedule rules', async ({ page }) => {
    await signInAt(page, '/templates');
    await expect(page.getByRole('heading', { name: 'Template Pesan', level: 1 })).toBeVisible();
    await expect(
      page.getByRole('gridcell', { name: 'Pengingat sebelum jatuh tempo', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('gridcell', { name: 'Tunggakan setelah jatuh tempo', exact: true }),
    ).toBeVisible();

    await openFromSidebar(page, 'Jadwal', 'Jadwal Pengiriman');
    // Every default rule shows its own offset label and the right template.
    const rules: [string, string][] = [
      ['H-7', 'Pengingat sebelum jatuh tempo'],
      ['H-3', 'Pengingat sebelum jatuh tempo'],
      ['H-1', 'Pengingat sebelum jatuh tempo'],
      ['H', 'Pengingat sebelum jatuh tempo'],
      ['H+3', 'Tunggakan setelah jatuh tempo'],
      ['H+7', 'Tunggakan setelah jatuh tempo'],
    ];
    for (const [label, template] of rules) {
      // The rule is named after its offset; the "Waktu kirim" column must show the same label.
      const row = page
        .getByRole('row')
        .filter({ has: page.locator('[data-field="name"]').getByText(label, { exact: true }) })
        .first();
      await expect(row, label).toBeVisible();
      await expect(row.locator('[data-field="offset_days"]'), label).toHaveText(label);
      await expect(row.locator('[data-field="template"]'), label).toContainText(template);
    }
  });

  test('limits a pimpinan to the dashboard', async ({ page, request }) => {
    const run = uniqueRunId();
    const email = `pimpinan-${run.toLowerCase()}@example.com`;
    const password = 'Pimpinan-E2e-12345';
    const token = await apiLogin(request);
    createdUserIds.push(
      await createUserWithRole(request, token, {
        email,
        fullName: `Pimpinan ${run}`,
        password,
        role: 'pimpinan',
      }),
    );

    await page.goto('/login');
    await signIn(page, email, password);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dasbor', level: 1 })).toBeVisible();

    // The sidebar holds nothing but the dashboard.
    const links = page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link');
    await expect(links).toHaveCount(1);
    await expect(links.first()).toHaveText('Dasbor');
    // The profile stays reachable from the user menu.
    await page.getByRole('button', { name: 'Buka menu pengguna' }).click();
    await expect(page.getByRole('menuitem', { name: 'Profil' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Pages without permission show the no-access state (the API enforces it as well).
    await page.goto('/students');
    await expect(
      page.getByRole('heading', { name: 'Anda tidak memiliki akses ke halaman ini' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Kembali ke halaman utama' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // The API enforces the same limits: the pimpinan token is refused outside the dashboard.
    const pimpinanToken = await apiLogin(request, email, password);
    for (const path of ['/students', '/settings']) {
      const response = await request.get(`${API_BASE_URL}${path}`, {
        headers: bearer(pimpinanToken),
      });
      expect(response.status(), `GET ${path} as pimpinan`).toBe(403);
    }
  });
});

test.describe('settings', () => {
  test('shows the WhatsApp state and keeps auto-send off unless confirmed', async ({
    page,
    request,
  }) => {
    // The API cannot tell a fake provider from a real gateway, so this spec runs only when the
    // person who started the backend states that it uses WA_PROVIDER=fake.
    test.skip(
      !FAKE_PROVIDER_CONFIRMED,
      'Set E2E_FAKE_PROVIDER=1 (backend started with WA_PROVIDER=fake) to run the settings spec.',
    );

    const token = await apiLogin(request);
    const savedAutoSend = async () => (await getSettings(request, token)).auto_send_enabled;
    const status = await request.get(`${API_BASE_URL}/whatsapp/status`, { headers: bearer(token) });
    expect(status.ok()).toBe(true);
    // The fake provider is always connected and has no pairing code.
    expect(await status.json()).toMatchObject({ state: 'connected', qr: null });
    expect(await savedAutoSend(), 'auto-send is off before the test').toBe(false);

    await signInAt(page, '/settings');
    await expect(page.getByRole('heading', { name: 'Pengaturan', level: 1 })).toBeVisible();

    // The fake provider reports a connected session; the panel must not crash either way.
    await expect(page.getByText('Koneksi WhatsApp')).toBeVisible();
    await expect(page.getByText('Terhubung', { exact: true })).toBeVisible();
    await expect(page.getByText('WhatsApp tersambung dan siap mengirim pesan.')).toBeVisible();
    await expect(page.getByText('Tidak dapat memuat status WhatsApp.')).toHaveCount(0);

    // The form renders only after the settings loaded; wait for that before asserting "off".
    const loaded = async () => {
      await expect(page.getByLabel('Batas harian (pesan per hari)')).not.toHaveValue('');
      await expect(page.getByRole('button', { name: 'Simpan pengaturan' })).toBeEnabled();
    };
    await loaded();
    const autoSend = page.getByRole('switch', { name: 'Pengiriman otomatis' });
    await expect(autoSend).toBeEnabled();
    await expect(autoSend).not.toBeChecked();

    // Turning it on asks first; cancelling leaves it off. The final confirm is never clicked.
    await autoSend.click();
    const dialog = page.getByRole('dialog', { name: 'Aktifkan pengiriman otomatis?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await expect(dialog).toBeHidden();
    await expect(autoSend).not.toBeChecked();
    expect(await savedAutoSend(), 'auto-send is still off after Batal').toBe(false);

    // Reloading shows the saved value: still off, in the UI and in the database.
    await page.reload();
    await loaded();
    await expect(page.getByRole('switch', { name: 'Pengiriman otomatis' })).not.toBeChecked();
    expect(await savedAutoSend(), 'auto-send is still off after a reload').toBe(false);
  });
});
