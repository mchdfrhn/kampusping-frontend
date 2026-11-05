import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';
import { saveBlob } from '@/core/utils/download.util';

import { reportsService } from '../services/reports.service';
import type { ReportPreview } from '../types';
import { ReportsPage } from './ReportsPage';

vi.mock('../services/reports.service', () => ({
  reportsService: { options: vi.fn(), preview: vi.fn(), download: vi.fn() },
}));
vi.mock('@/core/utils/download.util', () => ({ saveBlob: vi.fn() }));

const service = vi.mocked(reportsService);

const makePreview = (overrides: Partial<ReportPreview> = {}): ReportPreview => ({
  preset: 'weekly',
  semester: null,
  period_start: '2026-10-27',
  period_end: '2026-11-02',
  generated_at: '2026-11-02T03:00:00Z',
  generated_by: 'staf@example.com',
  summary: {
    invoices: {
      total: 10,
      total_amount: 10_000_000,
      paid: 4,
      paid_amount: 4_000_000,
      unpaid: 6,
      unpaid_amount: 6_000_000,
      overdue: 3,
      overdue_amount: 3_000_000,
      exempt: 1,
      exempt_amount: 1_000_000,
      paid_percent_count: 40,
      paid_percent_amount: 40,
    },
    messages: { queued: 0, sending: 0, sent: 5, delivered: 3, read: 2, failed: 1, cancelled: 0 },
    paid_after_message: 3,
    payments_in_period: { count: 2, amount: 1_500_000 },
  },
  groups: [
    {
      study_program: 'Teknik Informatika',
      cohort: '2022',
      total: 4,
      paid: 1,
      unpaid: 3,
      overdue: 2,
      overdue_amount: 3_000_000,
      paid_percent: 25,
    },
  ],
  arrears_count: 3,
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
      <ReportsPage />
    </NotifyProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  signIn(['reports:read', 'reports:export']);
  service.options.mockResolvedValue({ semesters: ['2026/2027', '2025/2026'] });
  service.preview.mockResolvedValue(makePreview());
  service.download.mockResolvedValue({ blob: new Blob(['x']), filename: 'laporan.xlsx' });
});

describe('ReportsPage', () => {
  it('loads the weekly preview by default and shows the figures', async () => {
    renderPage();

    expect(await screen.findByText('Total tagihan')).toBeInTheDocument();
    expect(service.preview).toHaveBeenCalledWith('weekly', undefined, expect.any(AbortSignal));
    expect(screen.getByText('Rp10.000.000')).toBeInTheDocument();
    expect(screen.getByText('Lewat jatuh tempo')).toBeInTheDocument();
    expect(screen.getByText('Dikecualikan')).toBeInTheDocument();
    expect(screen.getByText('Lunas setelah pesan')).toBeInTheDocument();
    expect(screen.getByText('Pembayaran 7 hari terakhir')).toBeInTheDocument();
    // The cards are grouped under headings, and every card carries a second line.
    expect(screen.getByRole('heading', { name: 'Status tagihan' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pengecualian dan aktivitas' })).toBeInTheDocument();
    expect(screen.getByText('dari 4 tagihan lunas')).toBeInTheDocument();
    expect(screen.getByText(/27 Okt 2026/)).toBeInTheDocument();
    expect(screen.getByText(/3 tagihan menunggak/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/rincian nama ada di berkas unduhan/);
    const table = screen.getByRole('table');
    expect(within(table).getByText('Teknik Informatika')).toBeInTheDocument();
    expect(within(table).getByText('25,0%')).toBeInTheDocument();
  });

  it('shows an empty-state message when no invoice exists yet', async () => {
    service.preview.mockResolvedValue(makePreview({ groups: [], arrears_count: 0 }));
    renderPage();

    expect(await screen.findByText('Belum ada data tagihan.')).toBeInTheDocument();
    expect(screen.getByText(/0 tagihan menunggak/)).toBeInTheDocument();
  });

  it('waits for a semester before loading the per-semester preview', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Total tagihan');
    service.preview.mockClear();

    await user.click(screen.getByRole('button', { name: 'Per semester' }));

    expect(await screen.findByText('Pilih semester untuk melihat laporan.')).toBeInTheDocument();
    expect(service.preview).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Unduh Excel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Unduh PDF' })).toBeDisabled();

    await user.click(screen.getByRole('combobox', { name: 'Semester' }));
    await user.click(await screen.findByRole('option', { name: '2026/2027' }));

    await waitFor(() =>
      expect(service.preview).toHaveBeenCalledWith(
        'semester',
        '2026/2027',
        expect.any(AbortSignal),
      ),
    );
  });

  it('downloads the chosen format and saves the file under the server name', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Total tagihan');

    await user.click(screen.getByRole('button', { name: 'Unduh Excel' }));

    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1));
    expect(service.download).toHaveBeenCalledWith('weekly', undefined, 'xlsx');
    expect(vi.mocked(saveBlob).mock.calls[0]?.[1]).toBe('laporan.xlsx');
  });

  it('falls back to a generic file name when the server sends none', async () => {
    service.download.mockResolvedValue({ blob: new Blob(['x']), filename: null });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Total tagihan');

    await user.click(screen.getByRole('button', { name: 'Unduh PDF' }));

    await waitFor(() => expect(saveBlob).toHaveBeenCalledTimes(1));
    expect(service.download).toHaveBeenCalledWith('weekly', undefined, 'pdf');
    expect(vi.mocked(saveBlob).mock.calls[0]?.[1]).toBe('laporan-penagihan.pdf');
  });

  it('hides the download buttons without reports:export', async () => {
    signIn(['reports:read']);
    renderPage();

    expect(await screen.findByText('Total tagihan')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unduh Excel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unduh PDF' })).not.toBeInTheDocument();
  });

  it('shows an error with a retry button when the preview fails', async () => {
    service.preview.mockRejectedValueOnce(new ApiError('Server sedang sibuk', 500));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Server sedang sibuk')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByText('Total tagihan')).toBeInTheDocument();
    expect(service.preview).toHaveBeenCalledTimes(2);
  });

  it('reports a failed download and enables the buttons again', async () => {
    service.download.mockRejectedValue(new ApiError('Tidak punya izin unduh', 403));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Total tagihan');

    await user.click(screen.getByRole('button', { name: 'Unduh Excel' }));

    expect(await screen.findByText('Tidak punya izin unduh')).toBeInTheDocument();
    expect(saveBlob).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Unduh Excel' })).toBeEnabled();
  });

  it('still opens when the semester list cannot be loaded', async () => {
    service.options.mockRejectedValue(new ApiError('boom', 500));
    renderPage();

    expect(await screen.findByText('Total tagihan')).toBeInTheDocument();
  });
});
