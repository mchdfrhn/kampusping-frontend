import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Page from '@/app/(app)/settings/page';
import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { settingsService } from '../services/settings.service';
import type { SettingsRecord } from '../types';
import { SettingsPage } from './SettingsPage';

vi.mock('../services/settings.service', () => ({
  settingsService: { get: vi.fn(), update: vi.fn(), resume: vi.fn() },
}));
// The WhatsApp panel has its own tests; here it would only add network noise.
vi.mock('./WhatsAppPanel', () => ({ WhatsAppPanel: () => null }));

const service = vi.mocked(settingsService);

const makeSettings = (overrides: Partial<SettingsRecord> = {}): SettingsRecord => ({
  campus_name: 'Kampus Contoh',
  finance_contact: 'Bagian Keuangan 0812-0000-0000',
  payment_link_siakad: 'https://siakad.example.ac.id/bayar',
  payment_guide_sipema: 'Buka SIPEMA lalu pilih Pembayaran.',
  window_start: '08:00:00',
  window_end: '17:00:00',
  working_days: [1, 2, 3, 4, 5],
  auto_send_enabled: false,
  daily_cap: 200,
  throttle_min_s: 8,
  throttle_max_s: 20,
  max_attempts: 3,
  consecutive_failure_limit: 5,
  escalation_offset_days: 14,
  paused_reason: null,
  consecutive_failures: 0,
  updated_at: '2026-11-01T01:00:00Z',
  ...overrides,
});

const expectedPayload = (overrides: Record<string, unknown> = {}) => ({
  campus_name: 'Kampus Contoh',
  finance_contact: 'Bagian Keuangan 0812-0000-0000',
  payment_link_siakad: 'https://siakad.example.ac.id/bayar',
  payment_guide_sipema: 'Buka SIPEMA lalu pilih Pembayaran.',
  window_start: '08:00:00',
  window_end: '17:00:00',
  working_days: [1, 2, 3, 4, 5],
  auto_send_enabled: false,
  daily_cap: 200,
  throttle_min_s: 8,
  throttle_max_s: 20,
  max_attempts: 3,
  consecutive_failure_limit: 5,
  escalation_offset_days: 14,
  ...overrides,
});

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, permissions } as unknown as AuthUser,
  });

const renderPage = () =>
  render(
    <NotifyProvider>
      <SettingsPage />
    </NotifyProvider>,
  );

const loaded = async () => {
  renderPage();
  await screen.findByDisplayValue('Kampus Contoh');
};

const field = (name: RegExp) => screen.getByLabelText(name);

const setValue = (name: RegExp, value: string) =>
  fireEvent.change(field(name), { target: { value } });

beforeEach(() => {
  vi.resetAllMocks();
  signIn(['settings:read', 'settings:update']);
  service.get.mockResolvedValue(makeSettings());
});

describe('SettingsPage', () => {
  it('renders the sections with the stored values', async () => {
    await loaded();

    for (const title of ['Identitas', 'Pembayaran', 'Jendela kirim', 'Pengaman pengiriman']) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(field(/^Kontak keuangan/)).toHaveValue('Bagian Keuangan 0812-0000-0000');
    expect(field(/^Tautan pembayaran SIAKAD\/Civitas/)).toHaveValue(
      'https://siakad.example.ac.id/bayar',
    );
    expect(field(/^Panduan pembayaran SIPEMA/)).toHaveValue('Buka SIPEMA lalu pilih Pembayaran.');
    // the API returns HH:MM:SS, the time input shows HH:MM
    expect(field(/^Jam mulai/)).toHaveValue('08:00');
    expect(field(/^Jam selesai/)).toHaveValue('17:00');
    for (const day of ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']) {
      expect(screen.getByRole('checkbox', { name: day })).toBeChecked();
    }
    for (const day of ['Sabtu', 'Minggu']) {
      expect(screen.getByRole('checkbox', { name: day })).not.toBeChecked();
    }
    expect(screen.getByRole('switch', { name: 'Pengiriman otomatis' })).not.toBeChecked();
    expect(field(/^Batas harian/)).toHaveValue(200);
    expect(field(/^Jeda minimum/)).toHaveValue(8);
    expect(field(/^Jeda maksimum/)).toHaveValue(20);
    expect(field(/^Maksimum percobaan/)).toHaveValue(3);
    expect(field(/^Batas kegagalan beruntun/)).toHaveValue(5);
    expect(field(/^Batas eskalasi/)).toHaveValue(14);
  });

  it('explains that the payment texts fill the message placeholders', async () => {
    await loaded();

    expect(screen.getByText(/\{\{link_pembayaran\}\}/)).toBeInTheDocument();
    expect(screen.getByText(/\{\{cara_bayar\}\}/)).toBeInTheDocument();
  });

  it('asks for confirmation before enabling automatic sending and sends nothing yet', async () => {
    const user = userEvent.setup();
    await loaded();

    await user.click(screen.getByRole('switch', { name: 'Pengiriman otomatis' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/nomor WhatsApp mahasiswa/)).toBeInTheDocument();
    expect(within(dialog).getByText(/nomor WhatsApp khusus/)).toBeInTheDocument();
    expect(within(dialog).getByText(/diblokir/)).toBeInTheDocument();
    expect(within(dialog).getByText(/batas harian/)).toBeInTheDocument();
    expect(service.update).not.toHaveBeenCalled();
    // not on until confirmed (the page behind the dialog is hidden from the accessibility tree)
    expect(
      screen.getByRole('switch', { name: 'Pengiriman otomatis', hidden: true }),
    ).not.toBeChecked();
  });

  it('keeps the switch off and sends nothing when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    await loaded();

    await user.click(screen.getByRole('switch', { name: 'Pengiriman otomatis' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Batal' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('switch', { name: 'Pengiriman otomatis' })).not.toBeChecked();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('turns the switch on after confirming and saves auto_send_enabled: true only on Simpan', async () => {
    service.update.mockResolvedValue(makeSettings({ auto_send_enabled: true }));
    const user = userEvent.setup();
    await loaded();

    await user.click(screen.getByRole('switch', { name: 'Pengiriman otomatis' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Aktifkan pengiriman otomatis' }));

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Pengiriman otomatis' })).toBeChecked(),
    );
    expect(service.update).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith(expectedPayload({ auto_send_enabled: true })),
    );
    expect(await screen.findByText('Pengaturan disimpan.')).toBeInTheDocument();
  });

  it('disabling automatic sending needs no confirmation', async () => {
    service.get.mockResolvedValue(makeSettings({ auto_send_enabled: true }));
    service.update.mockResolvedValue(makeSettings({ auto_send_enabled: false }));
    const user = userEvent.setup();
    renderPage();
    await screen.findByDisplayValue('Kampus Contoh');
    expect(screen.getByRole('switch', { name: 'Pengiriman otomatis' })).toBeChecked();

    await user.click(screen.getByRole('switch', { name: 'Pengiriman otomatis' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Pengiriman otomatis' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));
    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith(expectedPayload({ auto_send_enabled: false })),
    );
  });

  it('saves edited values with numbers, HH:MM:SS times and numeric working days', async () => {
    service.update.mockResolvedValue(makeSettings());
    const user = userEvent.setup();
    await loaded();

    setValue(/^Nama kampus/, 'Universitas Baru');
    setValue(/^Jam mulai/, '09:30');
    setValue(/^Jam selesai/, '16:00');
    await user.click(screen.getByRole('checkbox', { name: 'Sabtu' }));
    await user.click(screen.getByRole('checkbox', { name: 'Senin' }));
    setValue(/^Batas harian/, '150');
    setValue(/^Jeda minimum/, '5');
    setValue(/^Jeda maksimum/, '15');
    setValue(/^Maksimum percobaan/, '4');
    setValue(/^Batas kegagalan beruntun/, '6');
    setValue(/^Batas eskalasi/, '10');
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith(
        expectedPayload({
          campus_name: 'Universitas Baru',
          window_start: '09:30:00',
          window_end: '16:00:00',
          working_days: [2, 3, 4, 5, 6],
          daily_cap: 150,
          throttle_min_s: 5,
          throttle_max_s: 15,
          max_attempts: 4,
          consecutive_failure_limit: 6,
          escalation_offset_days: 10,
        }),
      ),
    );
  });

  it('maps server validation errors onto the fields and keeps the values', async () => {
    service.update.mockRejectedValue(
      new ApiError('Data tidak valid.', 422, 'validation_error', [
        { loc: ['body', 'window_end'], message: 'Jam mulai harus lebih awal dari jam selesai.' },
        { loc: ['body', 'working_days'], message: 'Pilih minimal satu hari kerja.' },
      ]),
    );
    const user = userEvent.setup();
    await loaded();
    setValue(/^Batas harian/, '123');

    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    expect(
      await screen.findByText('Jam mulai harus lebih awal dari jam selesai.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Pilih minimal satu hari kerja.')).toBeInTheDocument();
    expect(field(/^Batas harian/)).toHaveValue(123);
    expect(screen.queryByText('Pengaturan disimpan.')).not.toBeInTheDocument();
  });

  it('shows an unmapped server error in a form-level alert', async () => {
    service.update.mockRejectedValue(new ApiError('Server sedang sibuk.', 500));
    const user = userEvent.setup();
    await loaded();

    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    expect(await screen.findByText('Server sedang sibuk.')).toBeInTheDocument();
  });

  it.each([
    [
      'start is not before end',
      () => setValue(/^Jam mulai/, '17:00'),
      'Jam mulai harus lebih awal dari jam selesai.',
    ],
    [
      'min delay is above max delay',
      () => setValue(/^Jeda minimum/, '30'),
      'Jeda minimum tidak boleh lebih besar dari jeda maksimum.',
    ],
    ['daily cap is zero', () => setValue(/^Batas harian/, '0'), 'Batas harian minimal 1.'],
    [
      'max attempts is above 10',
      () => setValue(/^Maksimum percobaan/, '11'),
      'Maksimum percobaan harus antara 1 dan 10.',
    ],
    [
      'failure limit is zero',
      () => setValue(/^Batas kegagalan beruntun/, '0'),
      'Batas kegagalan beruntun minimal 1.',
    ],
    [
      'escalation is zero',
      () => setValue(/^Batas eskalasi/, '0'),
      'Batas eskalasi minimal 1 hari.',
    ],
    ['daily cap is empty', () => setValue(/^Batas harian/, ''), 'Batas harian wajib diisi.'],
  ])('rejects the form before calling the API when %s', async (_name, change, message) => {
    const user = userEvent.setup();
    await loaded();

    change();
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('requires at least one working day', async () => {
    const user = userEvent.setup();
    await loaded();

    for (const day of ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']) {
      await user.click(screen.getByRole('checkbox', { name: day }));
    }
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    expect(await screen.findByText('Pilih minimal satu hari kerja.')).toBeInTheDocument();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('is read-only without settings:update', async () => {
    signIn(['settings:read']);
    await loaded();

    expect(field(/^Nama kampus/)).toBeDisabled();
    expect(field(/^Jam mulai/)).toBeDisabled();
    expect(field(/^Batas harian/)).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Senin' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Pengiriman otomatis' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Simpan pengaturan' })).not.toBeInTheDocument();
  });

  it('shows the pause banner with the mapped reason and resumes sending', async () => {
    service.get.mockResolvedValue(
      makeSettings({ paused_reason: 'circuit_breaker', consecutive_failures: 5 }),
    );
    service.resume.mockResolvedValue(makeSettings({ paused_reason: null }));
    const user = userEvent.setup();
    renderPage();

    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent(
      'Pengiriman otomatis dijeda: terlalu banyak kegagalan beruntun',
    );
    await user.click(within(banner).getByRole('button', { name: 'Lanjutkan pengiriman' }));

    await waitFor(() => expect(service.resume).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Pengiriman otomatis dilanjutkan.')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/Pengiriman otomatis dijeda/)).not.toBeInTheDocument(),
    );
  });

  it('shows an unknown pause reason as it is and hides Lanjutkan without settings:update', async () => {
    signIn(['settings:read']);
    service.get.mockResolvedValue(makeSettings({ paused_reason: 'manual_stop' }));
    renderPage();

    expect(await screen.findByText(/Pengiriman otomatis dijeda: manual_stop/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lanjutkan pengiriman' })).not.toBeInTheDocument();
  });

  it('keeps the banner and tells the user when resuming fails', async () => {
    service.get.mockResolvedValue(makeSettings({ paused_reason: 'circuit_breaker' }));
    service.resume.mockRejectedValue(new ApiError('Gagal melanjutkan.', 500));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Lanjutkan pengiriman' }));

    expect(await screen.findByText('Gagal melanjutkan.')).toBeInTheDocument();
    expect(screen.getByText(/Pengiriman otomatis dijeda/)).toBeInTheDocument();
  });

  it('keeps unsaved edits when sending is resumed', async () => {
    service.get.mockResolvedValue(makeSettings({ paused_reason: 'circuit_breaker' }));
    service.resume.mockResolvedValue(makeSettings({ paused_reason: null }));
    const user = userEvent.setup();
    renderPage();
    await screen.findByDisplayValue('Kampus Contoh');
    setValue(/^Batas harian/, '321');

    await user.click(screen.getByRole('button', { name: 'Lanjutkan pengiriman' }));
    await waitFor(() => expect(service.resume).toHaveBeenCalled());

    await waitFor(() =>
      expect(screen.queryByText(/Pengiriman otomatis dijeda/)).not.toBeInTheDocument(),
    );
    expect(field(/^Batas harian/)).toHaveValue(321);
  });

  it('offers a retry when the settings cannot be loaded', async () => {
    service.get.mockRejectedValueOnce(new ApiError('Gagal memuat.', 500));
    service.get.mockResolvedValue(makeSettings());
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Gagal memuat.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByDisplayValue('Kampus Contoh')).toBeInTheDocument();
  });
});

describe('settings page guard', () => {
  it('shows the no-access state without settings:read', () => {
    signIn(['messages:read']);
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    expect(service.get).not.toHaveBeenCalled();
  });

  it('renders the settings with settings:read', async () => {
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Pengaturan' })).toBeInTheDocument();
  });
});
