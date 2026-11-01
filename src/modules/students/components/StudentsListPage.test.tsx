import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { studentsService } from '../services/students.service';
import type { StudentRecord } from '../types';
import { PhoneDialog } from './PhoneDialog';
import { StudentsListPage } from './StudentsListPage';

vi.mock('../services/students.service', () => ({
  studentsService: { list: vi.fn(), updatePhone: vi.fn() },
}));

const service = vi.mocked(studentsService);

const makeStudent = (overrides: Partial<StudentRecord> = {}): StudentRecord => ({
  id: 1,
  nim: '2201001',
  name: 'Budi Santoso',
  study_program: 'Teknik Informatika',
  cohort: '2022',
  phone: '+6281234567890',
  phone_status: 'valid',
  opted_out_at: null,
  opted_out_reason: null,
  created_at: '2026-10-01T01:00:00Z',
  updated_at: '2026-10-30T01:00:00Z',
  ...overrides,
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
    <NotifyProvider>
      <StudentsListPage />
    </NotifyProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  signIn(['students:read', 'students:update']);
  service.list.mockResolvedValue(
    pageOf([
      makeStudent(),
      makeStudent({ id: 2, nim: '2201002', name: 'Siti', phone: '12345', phone_status: 'invalid' }),
      makeStudent({
        id: 3,
        nim: '2201003',
        name: 'Andi',
        phone: null,
        phone_status: 'missing',
        opted_out_at: '2026-10-20T03:00:00Z',
        opted_out_reason: 'STOP',
      }),
    ]),
  );
});

describe('StudentsListPage', () => {
  it('renders Indonesian headers, rows and phone status chips', async () => {
    renderPage();

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument();
    for (const header of [
      'NIM',
      'Nama',
      'Prodi',
      'Angkatan',
      'No. WhatsApp',
      'Status nomor',
      'Opt-out',
      'Diperbarui',
    ]) {
      expect(screen.getByRole('columnheader', { name: new RegExp(header) })).toBeInTheDocument();
    }
    expect(screen.getByText('+6281234567890')).toBeInTheDocument();
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Tidak valid')).toBeInTheDocument();
    expect(screen.getByText('Kosong')).toBeInTheDocument();
    // the opted-out student shows "Ya" with the date; the others "Tidak"
    expect(screen.getByText(/^Ya/)).toHaveTextContent(/20 Okt 2026/);
    expect(screen.getAllByText('Tidak')).toHaveLength(2);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'updated_at', sort_order: 'desc' }),
    );
  });

  it('sends the status filter to the service', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Budi Santoso');

    await user.click(screen.getByRole('combobox', { name: 'Status nomor' }));
    await user.click(await screen.findByRole('option', { name: 'Tidak valid' }));

    await waitFor(() =>
      expect(service.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ phone_status: 'invalid', page: 1 }),
      ),
    );
  });

  it('sends the text filters (prodi, angkatan) after typing', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Budi Santoso');

    await user.type(screen.getByLabelText('Prodi'), 'Hukum');
    await user.type(screen.getByLabelText('Angkatan'), '2023');

    await waitFor(() =>
      expect(service.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ study_program: 'Hukum', cohort: '2023' }),
      ),
    );
  });

  it('updates the phone number from the dialog and reloads the list', async () => {
    service.updatePhone.mockResolvedValue(makeStudent({ phone: '+6281111111111' }));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Budi Santoso');

    await user.click(screen.getByRole('button', { name: 'Ubah nomor 2201001' }));
    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText('No. WhatsApp');
    expect(input).toHaveValue('+6281234567890');
    await user.clear(input);
    await user.type(input, '0811-1111-1111');
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(service.updatePhone).toHaveBeenCalledWith(1, '0811-1111-1111'));
    expect(await screen.findByText('Nomor WhatsApp diperbarui.')).toBeInTheDocument();
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('hides the edit action without students:update', async () => {
    signIn(['students:read']);
    renderPage();

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ubah nomor/ })).not.toBeInTheDocument();
  });
});

describe('PhoneDialog', () => {
  it('shows the server 422 message under the field and stays open', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError('Nomor telepon tidak valid.', 422, 'validation_error'));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PhoneDialog open student={makeStudent()} onClose={onClose} onSubmit={onSubmit} />);

    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText('No. WhatsApp');
    await user.clear(input);
    await user.type(input, '12345');
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }));

    expect(await within(dialog).findByText('Nomor telepon tidak valid.')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('allows an empty value, which clears the number', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PhoneDialog open student={makeStudent()} onClose={vi.fn()} onSubmit={onSubmit} />);

    const dialog = await screen.findByRole('dialog');
    await user.clear(within(dialog).getByLabelText('No. WhatsApp'));
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(''));
  });
});
