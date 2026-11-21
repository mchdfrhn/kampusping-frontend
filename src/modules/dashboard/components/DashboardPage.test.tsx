import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Page from '@/app/(app)/dashboard/page';
import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';
import { whatsappService } from '@/modules/settings/services/whatsapp.service';
import type { WhatsAppStatus } from '@/modules/settings/types';

import { dashboardService } from '../services/dashboard.service';
import type { DashboardSummary } from '../types';
import { DashboardPage } from './DashboardPage';

vi.mock('../services/dashboard.service', () => ({
  dashboardService: { summary: vi.fn() },
}));
vi.mock('@/modules/settings/services/whatsapp.service', () => ({
  whatsappService: { status: vi.fn(), logout: vi.fn() },
}));

const summaryApi = vi.mocked(dashboardService.summary);
const whatsappApi = vi.mocked(whatsappService.status);

const makeSummary = (overrides: Partial<DashboardSummary> = {}): DashboardSummary => ({
  invoices: {
    total: 120,
    total_amount: 480_000_000,
    paid: 70,
    paid_amount: 280_000_000,
    unpaid: 50,
    unpaid_amount: 200_000_000,
    overdue: 20,
    overdue_amount: 80_000_000,
  },
  messages: {
    queued: 3,
    sending: 1,
    sent: 10,
    delivered: 30,
    read: 60,
    failed: 7,
    cancelled: 2,
  },
  warnings: { paused_reason: null, auto_send_enabled: true },
  semester: null,
  generated_at: '2026-11-02T03:30:00Z',
  ...overrides,
});

const whatsapp = (state: WhatsAppStatus['state']): WhatsAppStatus => ({
  state,
  qr: null,
  paused_reason: null,
});

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, permissions } as unknown as AuthUser,
  });

const ALL = ['dashboard:read', 'settings:read'];

const renderPage = () =>
  render(
    <NotifyProvider>
      <DashboardPage />
    </NotifyProvider>,
  );

/** The stat card with this label (cards carry `data-stat`). */
const card = (label: string) => {
  const element = screen.getByText(label).closest('[data-stat]');
  if (!element) throw new Error(`No stat card for ${label}`);
  return element as HTMLElement;
};

beforeEach(() => {
  vi.resetAllMocks();
  signIn(ALL);
  summaryApi.mockResolvedValue(makeSummary());
  whatsappApi.mockResolvedValue(whatsapp('connected'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DashboardPage', () => {
  it('shows how much has been paid out of the total', async () => {
    renderPage();
    await screen.findByText('Total tagihan');

    expect(screen.getByRole('heading', { name: 'Pelunasan tagihan' })).toBeInTheDocument();
    expect(screen.getByText('sudah dibayar dari Rp480.000.000')).toBeInTheDocument();
    expect(within(card('Total tagihan')).getByText('120')).toBeInTheDocument();
    // 280 / 480 = 58%
    expect(screen.getByText('58%')).toBeInTheDocument();
  });

  it('splits the invoices into paid, not yet due and overdue, with counts and rupiah', async () => {
    renderPage();
    await screen.findByText('Total tagihan');

    expect(within(card('Lunas')).getByText('70')).toBeInTheDocument();
    expect(within(card('Lunas')).getByText('Rp280.000.000')).toBeInTheDocument();
    // unpaid 50 - overdue 20, Rp200 jt - Rp80 jt
    expect(within(card('Belum jatuh tempo')).getByText('30')).toBeInTheDocument();
    expect(within(card('Belum jatuh tempo')).getByText('Rp120.000.000')).toBeInTheDocument();
    expect(within(card('Tunggakan')).getByText('20')).toBeInTheDocument();
    expect(within(card('Tunggakan')).getByText('Rp80.000.000')).toBeInTheDocument();
  });

  it('names the semester when the summary has one', async () => {
    summaryApi.mockResolvedValue(makeSummary({ semester: '20261' }));
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Pelunasan tagihan semester 20261' }),
    ).toBeInTheDocument();
  });

  it('invites an import when there are no invoices yet', async () => {
    summaryApi.mockResolvedValue(
      makeSummary({
        invoices: {
          total: 0,
          total_amount: 0,
          paid: 0,
          paid_amount: 0,
          unpaid: 0,
          unpaid_amount: 0,
          overdue: 0,
          overdue_amount: 0,
        },
      }),
    );
    renderPage();

    expect(await screen.findByText(/Belum ada tagihan\. Impor data/)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Status tagihan/ })).not.toBeInTheDocument();
  });

  it('renders the delivery funnel from the summary', async () => {
    renderPage();
    await screen.findByText('Terkirim');

    // sent + delivered + read = 100
    expect(within(card('Terkirim')).getByText('100')).toBeInTheDocument();
    // (delivered + read) / 100 = 90%, read / 100 = 60%
    expect(within(card('Diterima')).getByText('90%')).toBeInTheDocument();
    expect(within(card('Diterima')).getByText('90 pesan')).toBeInTheDocument();
    expect(within(card('Dibaca')).getByText('60%')).toBeInTheDocument();
    expect(within(card('Dibaca')).getByText('60 pesan')).toBeInTheDocument();
  });

  it('notes the BRD target and whether it is met', async () => {
    const { unmount } = renderPage();
    await screen.findByText('Diterima');

    expect(screen.getByText('Target ≥ 95% diterima')).toBeInTheDocument();
    expect(screen.getByText('Belum tercapai')).toBeInTheDocument();
    unmount();

    summaryApi.mockResolvedValue(
      makeSummary({
        messages: {
          queued: 0,
          sending: 0,
          sent: 2,
          delivered: 18,
          read: 80,
          failed: 0,
          cancelled: 0,
        },
      }),
    );
    renderPage();
    expect(await screen.findByText('Tercapai')).toBeInTheDocument();
  });

  it('shows a dash instead of a percentage when nothing was sent', async () => {
    summaryApi.mockResolvedValue(
      makeSummary({
        messages: {
          queued: 2,
          sending: 0,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 1,
          cancelled: 0,
        },
      }),
    );
    renderPage();
    await screen.findByText('Diterima');

    expect(within(card('Diterima')).getByText('-')).toBeInTheDocument();
    expect(within(card('Dibaca')).getByText('-')).toBeInTheDocument();
    expect(within(card('Terkirim')).getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('Tercapai')).not.toBeInTheDocument();
    expect(screen.queryByText('Belum tercapai')).not.toBeInTheDocument();
  });

  it('lists the follow-ups: failed, overdue and queued', async () => {
    renderPage();
    await screen.findByText('Pesan gagal');

    expect(within(card('Pesan gagal')).getByText('7')).toBeInTheDocument();
    expect(within(card('Tagihan menunggak')).getByText('20')).toBeInTheDocument();
    // queued + sending
    expect(within(card('Dalam antrean')).getByText('4')).toBeInTheDocument();
  });

  it('highlights Tunggakan and failed messages only when there are any', async () => {
    const { unmount } = renderPage();
    await screen.findByText('Tunggakan');
    expect(card('Tunggakan')).toHaveAttribute('data-tone', 'error');
    expect(card('Pesan gagal')).toHaveAttribute('data-tone', 'error');
    expect(card('Lunas')).not.toHaveAttribute('data-tone', 'error');
    expect(card('Dalam antrean')).not.toHaveAttribute('data-tone', 'error');
    unmount();

    summaryApi.mockResolvedValue(
      makeSummary({
        invoices: { ...makeSummary().invoices, overdue: 0, overdue_amount: 0 },
        messages: { ...makeSummary().messages, failed: 0 },
      }),
    );
    renderPage();
    await waitFor(() => expect(within(card('Tunggakan')).getByText('0')).toBeInTheDocument());
    expect(card('Tunggakan')).not.toHaveAttribute('data-tone', 'error');
    expect(card('Pesan gagal')).not.toHaveAttribute('data-tone', 'error');
  });

  it('links the follow-ups only to screens the user may open', async () => {
    signIn([...ALL, 'messages:read', 'invoices:read']);
    const { unmount } = renderPage();
    await screen.findByText('Pesan gagal');

    expect(screen.getByRole('link', { name: 'Buka log pengiriman' })).toHaveAttribute(
      'href',
      '/messages',
    );
    expect(screen.getByRole('link', { name: 'Buka daftar tagihan' })).toHaveAttribute(
      'href',
      '/invoices',
    );
    unmount();

    signIn(['dashboard:read']);
    renderPage();
    await screen.findByText('Pesan gagal');
    expect(screen.queryByRole('link', { name: 'Buka log pengiriman' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Buka daftar tagihan' })).not.toBeInTheDocument();
  });

  it('draws the invoice bar with an accessible summary of the three parts', async () => {
    renderPage();
    await screen.findByText('Total tagihan');

    const chart = screen.getByRole('img', { name: /Status tagihan/ });
    expect(chart).toHaveAccessibleName(/Lunas 70 tagihan/);
    expect(chart).toHaveAccessibleName(/Belum jatuh tempo 30 tagihan/);
    expect(chart).toHaveAccessibleName(/Tunggakan 20 tagihan/);
  });

  it('shows when the numbers were generated', async () => {
    renderPage();

    expect(
      await screen.findByText(/^Diperbarui \d{2} \w{3} 2026, \d{2}:\d{2}$/),
    ).toBeInTheDocument();
  });

  it('shows skeletons while loading and no figures yet', () => {
    summaryApi.mockReturnValue(new Promise(() => {}));
    whatsappApi.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByLabelText('Memuat ringkasan')).toBeInTheDocument();
    expect(screen.queryByText('Total tagihan')).not.toBeInTheDocument();
  });

  it('shows an error with a retry that loads again', async () => {
    summaryApi.mockRejectedValueOnce(new ApiError('Gagal memuat ringkasan.', 500));
    renderPage();

    expect(await screen.findByText('Gagal memuat ringkasan.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByText('Total tagihan')).toBeInTheDocument();
    expect(summaryApi).toHaveBeenCalledTimes(2);
  });

  it('contains no personal data, only aggregates', async () => {
    renderPage();
    await screen.findByText('Total tagihan');

    expect(screen.queryByText(/NIM/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+?62\d{8,}/)).not.toBeInTheDocument();
  });
});

describe('DashboardPage semester filter', () => {
  it('does not render a semester filter input', async () => {
    renderPage();
    await screen.findByText('Total tagihan');
    expect(screen.queryByLabelText('Semester')).not.toBeInTheDocument();
  });
});

describe('DashboardPage warnings', () => {
  it('warns that sending is paused, with the reason and a link to Pengaturan', async () => {
    summaryApi.mockResolvedValue(
      makeSummary({ warnings: { paused_reason: 'circuit_breaker', auto_send_enabled: true } }),
    );
    renderPage();

    const alert = await screen.findByText(
      /Pengiriman otomatis dijeda \(terlalu banyak kegagalan beruntun\)\. Buka Pengaturan untuk melanjutkan\./,
    );
    expect(alert).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buka Pengaturan' })).toHaveAttribute(
      'href',
      '/settings',
    );
  });

  it('shows no link to Pengaturan without settings:read', async () => {
    signIn(['dashboard:read']);
    summaryApi.mockResolvedValue(
      makeSummary({ warnings: { paused_reason: 'circuit_breaker', auto_send_enabled: true } }),
    );
    renderPage();

    await screen.findByText(/Pengiriman otomatis dijeda/);
    expect(screen.queryByRole('link', { name: 'Buka Pengaturan' })).not.toBeInTheDocument();
  });

  it('says automatic sending is not switched on yet', async () => {
    summaryApi.mockResolvedValue(
      makeSummary({ warnings: { paused_reason: null, auto_send_enabled: false } }),
    );
    renderPage();

    expect(
      await screen.findByText(
        'Pengiriman otomatis belum diaktifkan. Pesan tidak akan dikirim sampai diaktifkan di Pengaturan.',
      ),
    ).toBeInTheDocument();
  });

  it('shows neither warning when sending is on and healthy', async () => {
    renderPage();
    await screen.findByText('Total tagihan');

    expect(screen.queryByText(/Pengiriman otomatis dijeda/)).not.toBeInTheDocument();
    expect(screen.queryByText(/belum diaktifkan/)).not.toBeInTheDocument();
  });

  it.each([
    ['disconnected', 'terputus'],
    ['connecting', 'menyambungkan'],
    ['qr', 'menunggu pemindaian kode QR'],
  ] as const)('warns when WhatsApp is %s', async (state, label) => {
    whatsappApi.mockResolvedValue(whatsapp(state));
    renderPage();

    expect(await screen.findByText(`WhatsApp belum terhubung (${label}).`)).toBeInTheDocument();
    expect(whatsappApi).toHaveBeenCalledTimes(1);
  });

  it('shows no WhatsApp warning when it is connected', async () => {
    renderPage();
    await screen.findByText('Total tagihan');
    await waitFor(() => expect(whatsappApi).toHaveBeenCalled());

    expect(screen.queryByText(/WhatsApp belum terhubung/)).not.toBeInTheDocument();
  });

  it('shows nothing when the WhatsApp status call fails', async () => {
    whatsappApi.mockRejectedValue(new ApiError('Gateway tidak tersedia.', 502));
    renderPage();
    await screen.findByText('Total tagihan');
    await waitFor(() => expect(whatsappApi).toHaveBeenCalled());

    expect(screen.queryByText(/WhatsApp belum terhubung/)).not.toBeInTheDocument();
    expect(screen.queryByText('Gateway tidak tersedia.')).not.toBeInTheDocument();
  });

  it('does not even ask for the WhatsApp status without settings:read', async () => {
    signIn(['dashboard:read']);
    whatsappApi.mockResolvedValue(whatsapp('disconnected'));
    renderPage();
    await screen.findByText('Total tagihan');

    expect(whatsappApi).not.toHaveBeenCalled();
    expect(screen.queryByText(/WhatsApp belum terhubung/)).not.toBeInTheDocument();
  });

  it('warns when the worker heartbeat is offline', async () => {
    summaryApi.mockResolvedValue(
      makeSummary({
        warnings: {
          paused_reason: null,
          auto_send_enabled: true,
          worker_alive: false,
          worker_last_seen_at: '2026-11-02T03:00:00Z',
        },
      }),
    );
    renderPage();

    expect(await screen.findByText(/Worker pengirim pesan sedang tidak aktif/)).toBeInTheDocument();
  });
});

describe('dashboard page guard', () => {
  it('shows the no-access state without dashboard:read', () => {
    signIn(['students:read']);
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    expect(summaryApi).not.toHaveBeenCalled();
    expect(whatsappApi).not.toHaveBeenCalled();
  });

  it('renders the dashboard with dashboard:read', async () => {
    signIn(['dashboard:read']);
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Dasbor' })).toBeInTheDocument();
  });
});
