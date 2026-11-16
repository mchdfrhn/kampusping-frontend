import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  API_BASE_URL,
  FAKE_PROVIDER_CONFIRMED,
  apiLogin,
  bearer,
  importViaApi,
  signInAt,
  toCsv,
  uniqueRunId,
  type ImportRow,
} from './helpers';

const BACKEND_DIR =
  process.env.E2E_BACKEND_DIR ?? path.resolve(__dirname, '../../kampusping-backend');
const BACKEND_PYTHON =
  process.env.E2E_BACKEND_PYTHON ??
  (process.platform === 'win32'
    ? path.join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe')
    : path.join(BACKEND_DIR, '.venv', 'bin', 'python'));
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? '';
const E2E_DATABASE_ENGINE = process.env.E2E_DATABASE_ENGINE ?? 'sqlite';
const E2E_WA_WEBHOOK_SECRET = process.env.E2E_WA_WEBHOOK_SECRET ?? '';

type SettingsSnapshot = {
  campus_name: string;
  finance_contact: string;
  payment_link_siakad: string;
  payment_guide_sipema: string;
  window_start: string;
  window_end: string;
  working_days: number[];
  auto_send_enabled: boolean;
  daily_cap: number;
  throttle_min_s: number;
  throttle_max_s: number;
  max_attempts: number;
  consecutive_failure_limit: number;
  escalation_offset_days: number;
};

/** Returns `YYYY-MM-DD` shifted by `days` relative to today in `Asia/Jakarta`. */
const jakartaDateOffset = (days: number): string => {
  const jakartaToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
    new Date(),
  );
  const base = new Date(`${jakartaToday}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
};

const runWorkerOnce = () => {
  if (!E2E_DATABASE_URL) {
    throw new Error('E2E_DATABASE_URL is required to execute run-worker --once.');
  }
  return execFileSync(BACKEND_PYTHON, ['-m', 'app.cli', 'run-worker', '--once'], {
    cwd: BACKEND_DIR,
    encoding: 'utf-8',
    env: {
      ...process.env,
      DATABASE_ENGINE: E2E_DATABASE_ENGINE,
      DATABASE_URL: E2E_DATABASE_URL,
      WA_PROVIDER: 'fake',
    },
  }).trim();
};

const readProviderMessageId = (invoiceCode: string): string | null => {
  if (!E2E_DATABASE_URL) return null;
  const script = `
import asyncio, sys
from sqlalchemy import select
from app.db.session import get_session_factory
from app.modules.invoices.model import Invoice
from app.modules.messages.model import Message

async def main():
    async with get_session_factory()() as db:
        msg = await db.scalar(
            select(Message)
            .join(Invoice, Invoice.id == Message.invoice_id)
            .where(Invoice.invoice_code == sys.argv[1], Message.deleted_at.is_(None))
            .order_by(Message.id.desc())
        )
        print(msg.provider_message_id if msg and msg.provider_message_id else "")

asyncio.run(main())
`;
  const out = execFileSync(BACKEND_PYTHON, ['-c', script, invoiceCode], {
    cwd: BACKEND_DIR,
    encoding: 'utf-8',
    env: {
      ...process.env,
      DATABASE_ENGINE: E2E_DATABASE_ENGINE,
      DATABASE_URL: E2E_DATABASE_URL,
      WA_PROVIDER: 'fake',
    },
  }).trim();
  return out || null;
};

const sendSignedWebhook = async (
  request: APIRequestContext,
  providerMessageId: string,
  state: 'delivered' | 'read',
) => {
  const rawBody = JSON.stringify({
    type: 'status',
    provider_message_id: providerMessageId,
    state,
  });
  const signature =
    'sha256=' +
    crypto.createHmac('sha256', E2E_WA_WEBHOOK_SECRET).update(rawBody, 'utf8').digest('hex');
  const response = await request.post(`${API_BASE_URL}/webhooks/whatsapp`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
    },
    data: rawBody,
  });
  expect(response.status(), `webhook ${state} failed`).toBe(202);
};

const findFreeRuleOffset = async (request: APIRequestContext, token: string): Promise<number> => {
  const response = await request.get(`${API_BASE_URL}/schedule-rules?page_size=100`, {
    headers: bearer(token),
  });
  expect(response.ok()).toBe(true);
  const { items } = (await response.json()) as { items: { offset_days: number }[] };
  const used = new Set(items.map((item) => item.offset_days));
  // Values 11..13 avoid seeded rules (-7..7 + 3-day planning window) and stay below default escalation (14).
  for (const candidate of [11, 12, 13, 10, 9, 8, 6, 5, 4, 2, 1]) {
    if (!used.has(candidate)) return candidate;
  }
  return 15;
};

const buildStudentRow = (
  run: string,
  suffix: string,
  phoneTail: string,
  dueDate: string,
): ImportRow => {
  const digits = run.replace(/\D/g, '').padEnd(6, '4').slice(0, 6);
  return {
    nim: `M${run}${suffix}`,
    name: `Pesan ${suffix} ${run}`,
    program: 'Teknik Informatika',
    cohort: '2023',
    phone: `0812${digits}${phoneTail}`,
    code: `INV-MSG-${run}-${suffix}`,
    semester: '2026/1',
    amount: '1750000',
    due: dueDate,
    status: 'Belum lunas',
  };
};

test.describe('messaging, queue and scheduler end-to-end', () => {
  test('manages scheduler rules, queues manual & scheduled messages, cancels queued items, and sends via worker with fake provider', async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    const run = uniqueRunId();
    const token = await apiLogin(request);

    const offset = await findFreeRuleOffset(request, token);
    const ruleName = `E2E Jadwal ${run}`;
    const updatedRuleName = `E2E Jadwal Edit ${run}`;
    let createdRuleId: number | null = null;

    const settingsRes = await request.get(`${API_BASE_URL}/settings`, { headers: bearer(token) });
    expect(settingsRes.ok()).toBe(true);
    const originalSettings = (await settingsRes.json()) as SettingsSnapshot;

    const autoRow = buildStudentRow(run, 'A', '1', jakartaDateOffset(-offset));
    const manualRow = buildStudentRow(run, 'B', '2', jakartaDateOffset(30));

    try {
      // 1. Scheduler UI: create and edit an active schedule rule on /schedules.
      await signInAt(page, '/schedules');
      await expect(
        page.getByRole('heading', { name: 'Jadwal Pengiriman', level: 1 }),
      ).toBeVisible();

      await page.getByRole('button', { name: 'Tambah aturan' }).click();
      const createDialog = page.getByRole('dialog', { name: 'Tambah aturan jadwal' });
      await expect(createDialog).toBeVisible();
      await createDialog.getByLabel(/Nama/).fill(ruleName);
      await createDialog.getByLabel(/Offset hari/).fill(String(offset));
      await createDialog.getByRole('combobox', { name: /Template/ }).click();
      await page.getByRole('option', { name: 'Pengingat sebelum jatuh tempo' }).click();
      await createDialog.getByRole('button', { name: 'Tambah', exact: true }).click();
      await expect(
        page.getByRole('alert').filter({ hasText: 'Aturan jadwal berhasil ditambahkan.' }),
      ).toBeVisible();

      // Lookup the rule id for guaranteed cleanup, then verify & edit it through the UI.
      const rulesAfterCreate = await request.get(
        `${API_BASE_URL}/schedule-rules?search=${encodeURIComponent(ruleName)}`,
        { headers: bearer(token) },
      );
      expect(rulesAfterCreate.ok()).toBe(true);
      const createdList = (await rulesAfterCreate.json()) as {
        items: { id: number; name: string }[];
      };
      createdRuleId = createdList.items.find((item) => item.name === ruleName)?.id ?? null;
      expect(createdRuleId).not.toBeNull();

      await page.getByPlaceholder('Cari nama aturan').fill(ruleName);
      const ruleRow = page.getByRole('row').filter({ hasText: ruleName });
      await expect(ruleRow).toBeVisible();
      await expect(ruleRow).toContainText('Aktif');

      await page.getByRole('button', { name: `Ubah ${ruleName}` }).click();
      const editDialog = page.getByRole('dialog', { name: 'Ubah aturan jadwal' });
      await expect(editDialog).toBeVisible();
      await editDialog.getByLabel(/Nama/).fill(updatedRuleName);
      await editDialog.getByRole('button', { name: 'Simpan perubahan' }).click();
      await expect(
        page.getByRole('alert').filter({ hasText: 'Aturan jadwal berhasil diperbarui.' }),
      ).toBeVisible();
      await page.getByPlaceholder('Cari nama aturan').fill(updatedRuleName);
      await expect(page.getByRole('row').filter({ hasText: updatedRuleName })).toBeVisible();

      // 2. Import two unpaid invoices: one matching the scheduler offset today, one far in future for manual send.
      await importViaApi(request, token, toCsv([autoRow, manualRow]), `messaging-e2e-${run}.csv`);

      // 3. Manual Send UI (/messages/manual): preview, enqueue, view in queue, and cancel one queued item.
      await page.goto('/messages/manual');
      await expect(
        page.getByRole('heading', { name: 'Kirim Pesan Manual', level: 1 }),
      ).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Pilih Templat Pesan' })).not.toHaveText('');
      await page.getByLabel('Pencarian Mahasiswa').fill(manualRow.nim);
      await page.getByRole('button', { name: 'Tampilkan Pratinjau' }).click();

      await expect(page.getByText('Siap Dikirim (Memenuhi Syarat)')).toBeVisible();
      await expect(page.getByRole('gridcell', { name: manualRow.name, exact: true })).toBeVisible();
      await expect(page.getByText('Pratinjau Pesan WhatsApp')).toBeVisible();

      await page.getByRole('button', { name: 'Eksekusi Pengiriman (1)' }).click();
      const confirmManual = page.getByRole('dialog', {
        name: 'Konfirmasi Pengiriman Pesan Manual',
      });
      await expect(confirmManual).toBeVisible();
      await confirmManual.getByRole('button', { name: 'Kirim Sekarang' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Berhasil menjadwalkan 1 pesan manual ke antrean' }),
      ).toBeVisible();

      // Navigate to the queue (/messages) and inspect & cancel the manual queued message.
      await page.getByRole('link', { name: 'Lihat Log Pengiriman' }).click();
      await expect(page).toHaveURL(/\/messages$/);
      await expect(page.getByRole('heading', { name: 'Pengiriman', level: 1 })).toBeVisible();

      const manualQueueRow = page.getByRole('row').filter({ hasText: manualRow.nim }).first();
      await expect(manualQueueRow).toBeVisible();
      await expect(manualQueueRow).toContainText('Antre');

      // Inspect body dialog.
      await page
        .getByRole('button', { name: `Lihat pesan ${manualRow.name}` })
        .first()
        .click();
      const bodyDialog = page.getByRole('dialog', { name: 'Isi pesan' });
      await expect(bodyDialog).toBeVisible();
      await expect(bodyDialog.locator('pre')).toContainText(manualRow.name);
      await bodyDialog.getByRole('button', { name: 'Tutup' }).first().click();
      await expect(bodyDialog).toBeHidden();

      // Cancel queued message via UI.
      await page
        .getByRole('button', { name: `Batalkan pesan ${manualRow.name}` })
        .first()
        .click();
      const cancelDialog = page.getByRole('dialog', { name: 'Batalkan pesan' });
      await expect(cancelDialog).toBeVisible();
      await cancelDialog.getByRole('button', { name: 'Batalkan pesan' }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'Pesan dibatalkan.' })).toBeVisible();
      await expect(manualQueueRow).toContainText('Dibatalkan');
      await expect(manualQueueRow).toContainText('Dibatalkan staf');

      // Queue the manual message a second time so the worker sends both scheduled (auto) & manual items.
      await page.goto('/messages/manual');
      await page.getByLabel('Pencarian Mahasiswa').fill(manualRow.nim);
      await page.getByRole('button', { name: 'Tampilkan Pratinjau' }).click();
      await expect(page.getByRole('gridcell', { name: manualRow.name, exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Eksekusi Pengiriman (1)' }).click();
      await page.getByRole('button', { name: 'Kirim Sekarang' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Berhasil menjadwalkan 1 pesan manual ke antrean' }),
      ).toBeVisible();

      // 4. Worker planner & sender end-to-end (only when fake provider & worker DB are configured).
      if (FAKE_PROVIDER_CONFIRMED && E2E_DATABASE_URL && fs.existsSync(BACKEND_PYTHON)) {
        // 4a. Open operational window via API while keeping auto_send_enabled = false.
        const openWindowRes = await request.put(`${API_BASE_URL}/settings`, {
          headers: bearer(token),
          data: {
            campus_name: originalSettings.campus_name,
            finance_contact: originalSettings.finance_contact,
            payment_link_siakad: originalSettings.payment_link_siakad,
            payment_guide_sipema: originalSettings.payment_guide_sipema,
            window_start: '00:00:00',
            window_end: '23:59:59',
            working_days: [1, 2, 3, 4, 5, 6, 7],
            auto_send_enabled: false,
            daily_cap: originalSettings.daily_cap,
            throttle_min_s: 0,
            throttle_max_s: 0,
            max_attempts: originalSettings.max_attempts,
            consecutive_failure_limit: originalSettings.consecutive_failure_limit,
            escalation_offset_days: originalSettings.escalation_offset_days,
          },
        });
        expect(openWindowRes.ok()).toBe(true);

        // With auto_send_enabled = false, planner queues the scheduled message (>= 1), manual sends, and auto waits.
        const firstTick = runWorkerOnce();
        expect(firstTick).toMatch(/created=[1-9]\d*/);
        expect(firstTick).toMatch(/handled=[1-9]\d*/);

        await page.goto('/messages');
        await expect(page.getByText(/Pengiriman otomatis terjadwal masih mati/)).toBeVisible();
        await expect(
          page.getByRole('row').filter({ hasText: manualRow.nim }).first(),
        ).toContainText('Terkirim');
        const autoQueueRow = page.getByRole('row').filter({ hasText: autoRow.nim }).first();
        await expect(autoQueueRow).toBeVisible();
        await expect(autoQueueRow).toContainText('Antre');

        // 4b. Turn auto_send on through /settings UI.
        await page.goto('/settings');
        await expect(page.getByLabel('Batas harian (pesan per hari)')).not.toHaveValue('');
        await page.getByRole('switch', { name: 'Pengiriman otomatis' }).click();
        const autoSendDialog = page.getByRole('dialog', { name: 'Aktifkan pengiriman otomatis?' });
        await expect(autoSendDialog).toBeVisible();
        await autoSendDialog.getByRole('button', { name: 'Aktifkan pengiriman otomatis' }).click();
        await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
        await expect(
          page.getByRole('alert').filter({ hasText: 'Pengaturan disimpan.' }),
        ).toBeVisible();

        // 4c. Worker tick now sends the scheduled auto message via FakeProvider.
        const secondTick = runWorkerOnce();
        expect(secondTick).toContain('created=0');
        expect(secondTick).toMatch(/handled=[1-9]\d*/);

        await page.goto('/messages');
        await expect(page.getByRole('row').filter({ hasText: autoRow.nim }).first()).toContainText(
          'Terkirim',
        );

        // 4d. Signed WhatsApp webhook receipts move status from Terkirim -> Diterima -> Dibaca.
        if (E2E_WA_WEBHOOK_SECRET) {
          const providerMessageId = readProviderMessageId(autoRow.code);
          expect(providerMessageId).toBeTruthy();

          await sendSignedWebhook(request, providerMessageId!, 'delivered');
          await page.getByRole('button', { name: 'Muat ulang' }).click();
          await expect(
            page.getByRole('row').filter({ hasText: autoRow.nim }).first(),
          ).toContainText('Diterima');

          await sendSignedWebhook(request, providerMessageId!, 'read');
          await page.getByRole('button', { name: 'Muat ulang' }).click();
          await expect(
            page.getByRole('row').filter({ hasText: autoRow.nim }).first(),
          ).toContainText('Dibaca');
        }
      }

      // 5. Delete the temporary schedule rule through /schedules UI.
      await page.goto('/schedules');
      await page.getByPlaceholder('Cari nama aturan').fill(updatedRuleName);
      await expect(page.getByRole('row').filter({ hasText: updatedRuleName })).toBeVisible();
      await page.getByRole('button', { name: `Hapus ${updatedRuleName}` }).click();
      const deleteRuleDialog = page.getByRole('dialog', { name: 'Hapus aturan jadwal' });
      await expect(deleteRuleDialog).toBeVisible();
      await deleteRuleDialog.getByRole('button', { name: 'Hapus', exact: true }).click();
      await expect(
        page.getByRole('alert').filter({ hasText: 'Aturan jadwal berhasil dihapus.' }),
      ).toBeVisible();
      createdRuleId = null;
    } finally {
      // Restore original settings (keeping auto_send_enabled = false for billing.spec.ts) and delete rule if still present.
      await request.put(`${API_BASE_URL}/settings`, {
        headers: bearer(token),
        data: {
          campus_name: originalSettings.campus_name,
          finance_contact: originalSettings.finance_contact,
          payment_link_siakad: originalSettings.payment_link_siakad,
          payment_guide_sipema: originalSettings.payment_guide_sipema,
          window_start: originalSettings.window_start,
          window_end: originalSettings.window_end,
          working_days: originalSettings.working_days,
          auto_send_enabled: originalSettings.auto_send_enabled,
          daily_cap: originalSettings.daily_cap,
          throttle_min_s: originalSettings.throttle_min_s,
          throttle_max_s: originalSettings.throttle_max_s,
          max_attempts: originalSettings.max_attempts,
          consecutive_failure_limit: originalSettings.consecutive_failure_limit,
          escalation_offset_days: originalSettings.escalation_offset_days,
        },
      });
      if (createdRuleId !== null) {
        await request.delete(`${API_BASE_URL}/schedule-rules/${createdRuleId}`, {
          headers: bearer(token),
        });
      }
    }
  });
});
