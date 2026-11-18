import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { API_BASE_URL, apiLogin, bearer, signInAt, uniqueRunId } from './helpers';

/**
 * A SIAKAD "Rekap Tunggakan" as CSV: preamble rows, the header, then one row per student. It
 * lists only students who still owe, so a student who paid is simply missing from a later file.
 */
const rekapCsv = (semester: string, students: { nim: string; amount: number }[]) =>
  [
    '" Kode (-) | Angkatan (Semua) | Status (Aktif) ",,,,,,,,,',
    ',,,,,,,,,',
    ',,,,,,,,,',
    ',,,,,,,,,',
    'No,PRODI,Jenis Kelas,NIM,Nama,No Hp,Tahun Akademik,Komponen Biaya,Rincian,Rekap',
    ...students.map(
      ({ nim, amount }, index) =>
        `${index + 1},22201 - Teknik Sipil,Kelas Pagi,${nim},MAHASISWA ${nim},081200${nim.slice(-5)},${semester},002 - SPP,${amount},${amount}`,
    ),
  ].join('\n');

const csvFile = (name: string, content: string) => ({
  name,
  mimeType: 'text/csv',
  buffer: Buffer.from(content, 'utf-8'),
});

const upload = async (page: Page, file: ReturnType<typeof csvFile>) => {
  const uploadButton = page.getByRole('button', { name: 'Unggah berkas' });
  await expect(uploadButton).toBeVisible(); // the history may still be loading
  await uploadButton.click();
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole('button', { name: 'Unggah dan pratinjau' }).click();
  const preview = page.getByRole('region', { name: 'Pratinjau impor' });
  await expect(preview).toBeVisible();
  return preview;
};

const invoiceStatus = async (request: APIRequestContext, token: string, code: string) => {
  const response = await request.get(
    `${API_BASE_URL}/invoices?search=${encodeURIComponent(code)}&page_size=5`,
    { headers: bearer(token) },
  );
  expect(response.ok()).toBe(true);
  const { items } = (await response.json()) as {
    items: { invoice_code: string; status: string }[];
  };
  return items.find((item) => item.invoice_code === code)?.status;
};

test.describe('rekap import review', () => {
  test('a student missing from the new file is only marked paid when staff approve it', async ({
    page,
    request,
  }) => {
    // A semester of its own keeps this run apart from every other spec sharing the database.
    const year =
      3000 + (parseInt(uniqueRunId().replace(/\D/g, '').padEnd(4, '0').slice(0, 4), 10) % 5000);
    const semester = `${year}/${year + 1} Ganjil`;
    const run = uniqueRunId().replace(/\D/g, '').padEnd(4, '7').slice(0, 4);
    // Four open invoices: one vanishing is 25%, under the 30% limit that flags a partial export.
    const stays = [`7${run}001`, `7${run}002`, `7${run}003`];
    const leaves = `7${run}004`;
    const code = (nim: string) => `TGK-${nim}-${year}1`;
    const token = await apiLogin(request);

    await signInAt(page, '/import');

    // First file: both students owe.
    let preview = await upload(
      page,
      csvFile(
        `rekap-1-${run}.csv`,
        rekapCsv(semester, [
          ...stays.map((nim) => ({ nim, amount: 100000 })),
          { nim: leaves, amount: 200000 },
        ]),
      ),
    );
    await preview.getByRole('button', { name: 'Terapkan' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Impor diterapkan' })).toBeVisible();
    expect(await invoiceStatus(request, token, code(leaves))).toBe('unpaid');

    // Second file: one student paid (is gone) and the others' amounts fell. Staff untick the suspect.
    const second = csvFile(
      `rekap-2-${run}.csv`,
      rekapCsv(
        semester,
        stays.map((nim) => ({ nim, amount: 80000 })),
      ),
    );
    preview = await upload(page, second);
    await expect(preview.getByRole('tab', { name: 'Diduga lunas (1)' })).toBeVisible();
    await expect(preview.getByText('Dipilih 1 dari 1')).toBeVisible();
    await expect(preview.getByText(`MAHASISWA ${leaves}`)).toBeVisible();
    await preview.getByRole('button', { name: 'Kosongkan' }).click();
    await expect(preview.getByText('Dipilih 0 dari 1')).toBeVisible();
    await preview.getByRole('button', { name: 'Terapkan' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Impor diterapkan' })).toBeVisible();
    expect(await invoiceStatus(request, token, code(leaves))).toBe('unpaid');

    // The same file again: this time staff keep the suggestion and confirm it.
    preview = await upload(page, second);
    await expect(preview.getByText('Dipilih 1 dari 1')).toBeVisible();
    await preview.getByRole('button', { name: 'Terapkan' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/1 tagihan akan ditandai lunas/)).toBeVisible();
    await dialog.getByRole('button', { name: 'Terapkan' }).click();
    await expect(page.getByRole('alert').filter({ hasText: '1 ditandai lunas' })).toBeVisible();

    expect(await invoiceStatus(request, token, code(leaves))).toBe('paid');
    for (const nim of stays) expect(await invoiceStatus(request, token, code(nim))).toBe('unpaid');
  });

  test('keeps the action buttons and the history reachable by scrolling', async ({ page }) => {
    const run = uniqueRunId().replace(/\D/g, '').padEnd(4, '5').slice(0, 4);
    const year = 2000 + (parseInt(run, 10) % 900);
    const students = [1, 2, 3].map((n) => ({ nim: `5${run}00${n}`, amount: 100000 * n }));

    await signInAt(page, '/import');
    const preview = await upload(
      page,
      csvFile(`rekap-scroll-${run}.csv`, rekapCsv(`${year}/${year + 1} Ganjil`, students)),
    );

    // The preview card shows all of its content: nothing is squashed to fit the viewport.
    const clipped = await preview.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(clipped).toBeLessThanOrEqual(1);

    // The page scrolls instead, down to the import history below the preview.
    const scroller = preview.locator('xpath=..');
    expect(await scroller.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeGreaterThan(0);
    await scroller.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(page.getByRole('region', { name: 'Riwayat impor' })).toBeInViewport({
      ratio: 0.9,
    });

    // And the buttons that apply or discard the preview can be brought into view.
    const apply = preview.getByRole('button', { name: 'Terapkan' });
    await apply.scrollIntoViewIfNeeded();
    await expect(apply).toBeInViewport();
    await expect(preview.getByRole('button', { name: 'Batalkan' })).toBeInViewport();
  });
});
