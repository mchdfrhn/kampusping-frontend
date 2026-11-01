import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { messagesService } from '../services/messages.service';
import type { MessageRecord } from '../types';
import { MessagesListPage } from './MessagesListPage';

vi.mock('../services/messages.service', () => ({
  messagesService: { list: vi.fn(), cancel: vi.fn() },
}));

const service = vi.mocked(messagesService);

const BODY =
  'Yth. Budi Santoso,\nTagihan Anda Rp1.250.000 jatuh tempo 15 Nov.\n\nBalas STOP untuk berhenti.';

const makeMessage = (overrides: Partial<MessageRecord> = {}): MessageRecord => ({
  id: 1,
  student: { id: 10, nim: '2201001', name: 'Budi Santoso' },
  phone_masked: '+62812****7890',
  invoice_id: 101,
  rule_id: 3,
  kind: 'auto',
  scheduled_date: '2026-11-08',
  body: BODY,
  status: 'queued',
  cancel_reason: null,
  attempts: 0,
  error: null,
  queued_at: '2026-11-01T01:00:00Z',
  sent_at: null,
  delivered_at: null,
  read_at: null,
  created_at: '2026-11-01T01:00:00Z',
  ...overrides,
});

const rows = [
  makeMessage(),
  makeMessage({
    id: 2,
    student: { id: 11, nim: '2201002', name: 'Siti Aminah' },
    invoice_id: 102,
    status: 'failed',
    attempts: 3,
    error: 'Nomor tidak terdaftar di WhatsApp.',
  }),
  makeMessage({
    id: 3,
    student: { id: 12, nim: '2201003', name: 'Andi Wijaya' },
    invoice_id: 103,
    status: 'cancelled',
    cancel_reason: 'paid',
  }),
  makeMessage({
    id: 4,
    student: { id: 13, nim: '2201004', name: 'Dewi Lestari' },
    invoice_id: 104,
    status: 'read',
    attempts: 1,
    sent_at: '2026-11-02T02:00:00Z',
    delivered_at: '2026-11-02T02:01:00Z',
    read_at: '2026-11-02T03:30:00Z',
  }),
  makeMessage({ id: 5, invoice_id: 105, status: 'sending', attempts: 1 }),
  makeMessage({
    id: 6,
    invoice_id: 106,
    status: 'sent',
    attempts: 1,
    sent_at: '2026-11-02T02:00:00Z',
  }),
  makeMessage({
    id: 7,
    invoice_id: 107,
    status: 'delivered',
    attempts: 1,
    sent_at: '2026-11-02T02:00:00Z',
    delivered_at: '2026-11-02T02:01:00Z',
  }),
];

const pageOf = <Item,>(items: Item[]) => ({ items, total: items.length, page: 1, page_size: 20 });

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, permissions } as unknown as AuthUser,
  });

const renderPage = () =>
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="id">
      <NotifyProvider>
        <MessagesListPage />
      </NotifyProvider>
    </LocalizationProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  signIn(['messages:read', 'messages:cancel']);
  service.list.mockResolvedValue(pageOf(rows));
});

describe('MessagesListPage', () => {
  it('renders Indonesian headers, recipients, masked phone and status chips', async () => {
    renderPage();

    expect(await screen.findByText('Siti Aminah')).toBeInTheDocument();
    for (const header of [
      'Waktu antre',
      'Penerima',
      'Tagihan',
      'Jadwal',
      'Status',
      'Alasan',
      'Percobaan',
      'Dikirim',
      'Diterima',
      'Dibaca',
    ]) {
      expect(
        screen.getByRole('columnheader', { name: new RegExp(`^${header}`) }),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByText(/2201001/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('+62812****7890').length).toBeGreaterThan(0);
    expect(screen.getByText('#102')).toBeInTheDocument();
    expect(screen.getAllByText('08 Nov 2026').length).toBeGreaterThan(0);

    const chips = ['Antre', 'Mengirim', 'Terkirim', 'Gagal', 'Dibatalkan'];
    for (const label of chips) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    // "Diterima" and "Dibaca" are also column headers; the chips are inside the cells
    const grid = screen.getByRole('grid');
    expect(within(grid).getAllByRole('gridcell', { name: 'Diterima' }).length).toBe(1);
    expect(within(grid).getAllByRole('gridcell', { name: 'Dibaca' }).length).toBe(1);

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'queued_at', sort_order: 'desc' }),
    );
  });

  it('shows the Indonesian cancel reason and the error of failed rows as a tooltip', async () => {
    renderPage();

    expect(await screen.findByText('Sudah lunas')).toBeInTheDocument();
    expect(screen.getByLabelText('Nomor tidak terdaftar di WhatsApp.')).toBeInTheDocument();
  });

  it('sends the status and scheduled date filters to the service', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Siti Aminah');

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Gagal' }));
    fireEvent.change(screen.getByLabelText('Jadwal dari', { selector: 'input' }), {
      target: { value: '01 Nov 2026' },
    });
    fireEvent.change(screen.getByLabelText('Jadwal sampai', { selector: 'input' }), {
      target: { value: '30 Nov 2026' },
    });

    await waitFor(() =>
      expect(service.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'failed',
          date_from: '2026-11-01',
          date_to: '2026-11-30',
        }),
      ),
    );
  });

  it('offers all seven statuses in the filter', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Siti Aminah');

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getAllByRole('option')).toHaveLength(8); // "Semua" + 7 statuses
  });

  it('shows Batalkan only on queued rows', async () => {
    renderPage();
    await screen.findByText('Siti Aminah');

    // only message 1 is queued; the failed, cancelled, read, sending, sent and delivered rows are not
    expect(screen.getAllByRole('button', { name: /^Batalkan pesan/ })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Batalkan pesan Budi Santoso' })).toBeInTheDocument();
  });

  it('hides Batalkan without messages:cancel but keeps Lihat pesan', async () => {
    signIn(['messages:read']);
    renderPage();

    expect(await screen.findByText('Siti Aminah')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Batalkan/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Lihat pesan/ })).toHaveLength(rows.length);
  });

  it('shows the rendered body and timestamps in the Lihat pesan dialog', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Siti Aminah');

    await user.click(screen.getByRole('button', { name: 'Lihat pesan Dewi Lestari' }));

    const dialog = await screen.findByRole('dialog');
    const body = within(dialog).getByLabelText('Isi pesan');
    expect(body).toHaveTextContent('Tagihan Anda Rp1.250.000 jatuh tempo 15 Nov.');
    expect(body).toHaveTextContent('Balas STOP untuk berhenti.');
    expect(within(dialog).getByText(/Dewi Lestari/)).toBeInTheDocument();
    expect(within(dialog).getByText('Waktu antre', { selector: 'dt' })).toBeInTheDocument();
    expect(
      within(dialog).getByText('Dikirim', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent(/02 Nov 2026/);
    expect(
      within(dialog).getByText('Diterima', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent(/02 Nov 2026/);
    expect(
      within(dialog).getByText('Dibaca', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent(/02 Nov 2026/);
  });

  it('asks for confirmation before cancelling and calls the service only after confirming', async () => {
    service.cancel.mockResolvedValue(makeMessage({ status: 'cancelled', cancel_reason: 'manual' }));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Siti Aminah');

    await user.click(screen.getAllByRole('button', { name: /^Batalkan pesan/ })[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Pesan tidak akan dikirim/)).toBeInTheDocument();
    expect(service.cancel).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Batalkan pesan' }));

    await waitFor(() => expect(service.cancel).toHaveBeenCalledWith(1));
    expect(await screen.findByText('Pesan dibatalkan.')).toBeInTheDocument();
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2));
  });

  it('shows the server message and reloads when the message is no longer queued (409)', async () => {
    service.cancel.mockRejectedValue(
      new ApiError('Hanya pesan berstatus antre yang dapat dibatalkan.', 409, 'conflict'),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Siti Aminah');

    await user.click(screen.getAllByRole('button', { name: /^Batalkan pesan/ })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Batalkan pesan' }));

    expect(
      await screen.findByText('Hanya pesan berstatus antre yang dapat dibatalkan.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('does not cancel when the confirmation is dismissed', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Siti Aminah');

    await user.click(screen.getAllByRole('button', { name: /^Batalkan pesan/ })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Kembali' }));

    expect(service.cancel).not.toHaveBeenCalled();
  });
});
