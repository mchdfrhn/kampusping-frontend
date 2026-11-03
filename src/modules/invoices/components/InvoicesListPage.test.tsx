import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { invoicesService } from '../services/invoices.service';
import type { InvoiceRecord } from '../types';
import { InvoicesListPage } from './InvoicesListPage';

vi.mock('../services/invoices.service', () => ({
  invoicesService: { list: vi.fn(), setStatus: vi.fn() },
}));

const service = vi.mocked(invoicesService);

const makeInvoice = (overrides: Partial<InvoiceRecord> = {}): InvoiceRecord => ({
  id: 1,
  invoice_code: 'INV-2026-001',
  student: { id: 10, nim: '2201001', name: 'Budi Santoso' },
  semester: '2026/1',
  amount: 1250000,
  due_date: '2026-11-15',
  status: 'unpaid',
  paid_at: null,
  paid_via: null,
  source: 'siakad',
  exempt_reason: null,
  exempt_until: null,
  escalated_at: null,
  created_at: '2026-10-01T01:00:00Z',
  updated_at: '2026-10-30T01:00:00Z',
  ...overrides,
});

const paidInvoice = makeInvoice({
  id: 2,
  invoice_code: 'INV-2026-002',
  student: { id: 11, nim: '2201002', name: 'Siti Aminah' },
  amount: 0,
  status: 'paid',
  paid_at: '2026-11-02',
  paid_via: 'sipema',
  source: 'sipema',
});

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
        <InvoicesListPage />
      </NotifyProvider>
    </LocalizationProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  signIn(['invoices:read', 'invoices:update']);
  service.list.mockResolvedValue(pageOf([makeInvoice(), paidInvoice]));
});

describe('InvoicesListPage', () => {
  it('renders Indonesian headers, rupiah amounts and status chips', async () => {
    renderPage();

    expect(await screen.findByText('INV-2026-001')).toBeInTheDocument();
    for (const header of [
      'Kode tagihan',
      'NIM',
      'Nama',
      'Semester',
      'Nominal',
      'Jatuh tempo',
      'Status',
      'Dibayar pada',
      'Kanal bayar',
      'Sumber',
    ]) {
      expect(
        screen.getByRole('columnheader', { name: new RegExp(`^${header}`) }),
      ).toBeInTheDocument();
    }
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Rp1.250.000')).toBeInTheDocument();
    expect(screen.getByText('Rp0')).toBeInTheDocument();
    expect(screen.getByText('Belum lunas')).toBeInTheDocument();
    expect(screen.getByText('Lunas')).toBeInTheDocument();
    expect(screen.getAllByText('15 Nov 2026')).toHaveLength(2);
    expect(screen.getByText('02 Nov 2026')).toBeInTheDocument();
    // paid through SIPEMA; the unpaid row has no channel
    expect(screen.getAllByText('SIPEMA')).toHaveLength(2); // Kanal bayar + Sumber of the paid row
    expect(screen.getByText('SIAKAD/Civitas')).toBeInTheDocument(); // Sumber of the unpaid row
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'due_date', sort_order: 'desc' }),
    );
  });

  it('sends the status and due date filters to the service and has no semester filter', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('INV-2026-001');

    expect(screen.queryByLabelText('Semester')).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Lunas' }));
    fireEvent.change(screen.getByLabelText('Jatuh tempo dari', { selector: 'input' }), {
      target: { value: '01 Nov 2026' },
    });
    fireEvent.change(screen.getByLabelText('Jatuh tempo sampai', { selector: 'input' }), {
      target: { value: '30 Nov 2026' },
    });

    await waitFor(() =>
      expect(service.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'paid',
          due_from: '2026-11-01',
          due_to: '2026-11-30',
        }),
      ),
    );
  });

  it('flips the action label by status', async () => {
    renderPage();
    await screen.findByText('INV-2026-001');

    expect(screen.getByRole('button', { name: 'Tandai lunas INV-2026-001' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Tandai belum lunas INV-2026-002' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Tandai belum lunas INV-2026-001' }),
    ).not.toBeInTheDocument();
  });

  it('asks for confirmation before marking unpaid and calls the service only after confirming', async () => {
    service.setStatus.mockResolvedValue({ ...paidInvoice, status: 'unpaid' });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('INV-2026-002');

    await user.click(screen.getByRole('button', { name: 'Tandai belum lunas INV-2026-002' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/kembali menerima pengingat/i)).toBeInTheDocument();
    expect(service.setStatus).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Tandai belum lunas' }));

    await waitFor(() => expect(service.setStatus).toHaveBeenCalledWith(2, 'unpaid'));
    expect(await screen.findByText('Status tagihan diperbarui.')).toBeInTheDocument();
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2));
  });

  it('does not change anything when the confirmation is dismissed', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('INV-2026-002');

    await user.click(screen.getByRole('button', { name: 'Tandai belum lunas INV-2026-002' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Batal' }));

    expect(service.setStatus).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('marks an unpaid invoice paid after confirming, explaining that reminders stop', async () => {
    service.setStatus.mockResolvedValue({ ...makeInvoice(), status: 'paid' });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('INV-2026-001');

    await user.click(screen.getByRole('button', { name: 'Tandai lunas INV-2026-001' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/akan dihentikan/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Tandai lunas' }));

    await waitFor(() => expect(service.setStatus).toHaveBeenCalledWith(1, 'paid'));
  });

  it('shows the server message and reloads when the change is refused', async () => {
    service.setStatus.mockRejectedValue(new ApiError('Tagihan tidak ditemukan.', 404, 'not_found'));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('INV-2026-001');

    await user.click(screen.getByRole('button', { name: 'Tandai lunas INV-2026-001' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Tandai lunas' }));

    expect(await screen.findByText('Tagihan tidak ditemukan.')).toBeInTheDocument();
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2));
  });

  it('hides the action without invoices:update', async () => {
    signIn(['invoices:read']);
    renderPage();

    expect(await screen.findByText('INV-2026-001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tandai/ })).not.toBeInTheDocument();
  });
});
