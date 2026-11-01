import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { importService } from '../services/import.service';
import type { ImportBatch, ImportRowError } from '../types';
import { ImportPage } from './ImportPage';

vi.mock('../services/import.service', () => ({
  importService: {
    preview: vi.fn(),
    apply: vi.fn(),
    discard: vi.fn(),
    list: vi.fn(),
    errors: vi.fn(),
  },
}));

const service = vi.mocked(importService);

const makeBatch = (overrides: Partial<ImportBatch> = {}): ImportBatch => ({
  id: 5,
  source: 'siakad',
  file_name: 'tagihan.csv',
  semester: '2026/1',
  status: 'preview',
  summary: {
    rows_total: 12,
    rows_valid: 9,
    rows_error: 3,
    students_new: 2,
    students_updated: 4,
    invoices_new: 6,
    invoices_updated: 2,
    invoices_skipped: 1,
  },
  created_at: '2026-10-31T01:00:00Z',
  created_by: 'staf@kampus.ac.id',
  applied_at: null,
  ...overrides,
});

const rowErrors: ImportRowError[] = [
  { row_number: 4, field: 'amount', message: 'Nominal tidak valid.' },
  { row_number: 7, field: 'nim', message: 'NIM wajib diisi.' },
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
    <NotifyProvider>
      <ImportPage />
    </NotifyProvider>,
  );

const csv = (name = 'tagihan.csv') => new File(['nim,nama\n'], name, { type: 'text/csv' });

type User = ReturnType<typeof userEvent.setup>;

const pickFile = (user: User, file: File) =>
  user.upload(screen.getByLabelText('Berkas impor'), file);

const submitUpload = (user: User) =>
  user.click(screen.getByRole('button', { name: 'Unggah dan pratinjau' }));

const previewRegion = () => screen.findByRole('region', { name: 'Pratinjau impor' });

const stat = (region: HTMLElement, label: string) =>
  within(region).getByText(label).nextElementSibling;

// `applyAccept: false` lets the tests hand over files the input would normally filter out, so the
// component's own validation is what gets exercised.
const newUser = () => userEvent.setup({ applyAccept: false });

beforeEach(() => {
  vi.resetAllMocks();
  signIn(['imports:read', 'imports:create']);
  service.list.mockResolvedValue(pageOf<ImportBatch>([]));
  service.errors.mockResolvedValue(pageOf(rowErrors));
});

describe('ImportPage upload and preview', () => {
  it('shows the preview counts and first errors after upload', async () => {
    service.preview.mockResolvedValue(makeBatch());
    const user = newUser();
    renderPage();

    await pickFile(user, csv());
    await user.type(screen.getByLabelText('Semester (opsional)'), '2026/1');
    await submitUpload(user);

    const region = await previewRegion();
    expect(service.preview).toHaveBeenCalledWith(expect.any(File), 'siakad', '2026/1');
    expect(stat(region, 'Baris dibaca')).toHaveTextContent('12');
    expect(stat(region, 'Baris valid')).toHaveTextContent('9');
    expect(stat(region, 'Baris bermasalah')).toHaveTextContent('3');
    expect(stat(region, 'Mahasiswa baru')).toHaveTextContent('2');
    expect(stat(region, 'Mahasiswa diperbarui')).toHaveTextContent('4');
    expect(stat(region, 'Tagihan baru')).toHaveTextContent('6');
    expect(stat(region, 'Tagihan diperbarui')).toHaveTextContent('2');
    expect(stat(region, 'Tagihan dilewati')).toHaveTextContent('1');
    expect(within(region).getByText(/belum ada data yang disimpan/i)).toBeInTheDocument();
    expect(await within(region).findByText('Nominal tidak valid.')).toBeInTheDocument();
    expect(within(region).getByText('NIM wajib diisi.')).toBeInTheDocument();
    expect(service.errors).toHaveBeenCalledWith(5, expect.objectContaining({ page: 1 }));
  });

  it('shows the server error message when the file is rejected', async () => {
    service.preview.mockRejectedValue(
      new ApiError('Kolom wajib tidak ditemukan: nim.', 422, 'validation_error'),
    );
    const user = newUser();
    renderPage();

    await pickFile(user, csv());
    await submitUpload(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Kolom wajib tidak ditemukan: nim.');
    expect(screen.queryByRole('region', { name: 'Pratinjau impor' })).not.toBeInTheDocument();
  });

  it('rejects a wrong extension and an oversize file client-side without calling the service', async () => {
    const user = newUser();
    renderPage();

    await submitUpload(user);
    expect(await screen.findByText('Pilih berkas .csv atau .xlsx.')).toBeInTheDocument();

    await pickFile(user, csv('tagihan.txt'));
    await submitUpload(user);
    expect(
      await screen.findByText('Format berkas tidak didukung. Gunakan berkas .csv atau .xlsx.'),
    ).toBeInTheDocument();

    const big = csv('besar.xlsx');
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 });
    await pickFile(user, big);
    await submitUpload(user);
    expect(await screen.findByText('Ukuran berkas melebihi batas 5 MB.')).toBeInTheDocument();

    expect(service.preview).not.toHaveBeenCalled();
  });

  it('limits the semester field to 20 characters', async () => {
    const user = newUser();
    renderPage();

    await pickFile(user, csv());
    await user.type(
      screen.getByLabelText('Semester (opsional)'),
      '2026/2027 Ganjil Reguler Kelas A',
    );
    await submitUpload(user);

    expect(await screen.findByText('Maksimal 20 karakter')).toBeInTheDocument();
    expect(service.preview).not.toHaveBeenCalled();
  });
});

describe('ImportPage apply and discard', () => {
  const upload = async (batch: ImportBatch) => {
    service.preview.mockResolvedValue(batch);
    const user = newUser();
    renderPage();
    await pickFile(user, csv());
    await submitUpload(user);
    const region = await previewRegion();
    return { user, region };
  };

  it('Terapkan is disabled when there are no valid rows', async () => {
    const empty = makeBatch({ summary: { ...makeBatch().summary, rows_valid: 0, rows_error: 12 } });

    const { region } = await upload(empty);

    expect(within(region).getByRole('button', { name: 'Terapkan' })).toBeDisabled();
  });

  it('Terapkan is disabled for a batch that is no longer a preview', async () => {
    const { region } = await upload(makeBatch({ status: 'applied' }));

    expect(within(region).getByRole('button', { name: 'Terapkan' })).toBeDisabled();
  });

  it('Terapkan is disabled while applying, and a second click does not call apply twice', async () => {
    let finish: (batch: ImportBatch) => void = () => undefined;
    service.apply.mockReturnValue(new Promise<ImportBatch>((resolve) => (finish = resolve)));
    const { user, region } = await upload(makeBatch());
    const apply = within(region).getByRole('button', { name: 'Terapkan' });
    expect(apply).toBeEnabled();

    await user.click(apply);
    await waitFor(() => expect(apply).toBeDisabled());
    fireEvent.click(apply); // user-event refuses to click a disabled button; this forces the event

    expect(service.apply).toHaveBeenCalledTimes(1);
    expect(service.apply).toHaveBeenCalledWith(5);

    finish(makeBatch({ status: 'applied', applied_at: '2026-10-31T02:00:00Z' }));
    expect(await screen.findByText(/Impor diterapkan/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Pratinjau impor' })).not.toBeInTheDocument();
  });

  it('reports the actual summary after applying and clears the preview', async () => {
    service.apply.mockResolvedValue(
      makeBatch({
        status: 'applied',
        summary: { ...makeBatch().summary, students_new: 1, invoices_new: 5, invoices_skipped: 0 },
      }),
    );
    const { user, region } = await upload(makeBatch());

    await user.click(within(region).getByRole('button', { name: 'Terapkan' }));

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveTextContent('Impor diterapkan');
    expect(toast).toHaveTextContent('1 mahasiswa baru');
    expect(toast).toHaveTextContent('5 tagihan baru');
    expect(screen.queryByRole('region', { name: 'Pratinjau impor' })).not.toBeInTheDocument();
    // the history was reloaded
    await waitFor(() => expect(service.list.mock.calls.length).toBeGreaterThan(1));
  });

  it('shows the server message when apply is refused and keeps a 422 preview open', async () => {
    service.apply.mockRejectedValue(
      new ApiError('Tidak ada baris valid untuk diterapkan.', 422, 'validation_error'),
    );
    const { user, region } = await upload(makeBatch());

    await user.click(within(region).getByRole('button', { name: 'Terapkan' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tidak ada baris valid untuk diterapkan.',
    );
    expect(screen.getByRole('region', { name: 'Pratinjau impor' })).toBeInTheDocument();
    await waitFor(() =>
      expect(within(region).getByRole('button', { name: 'Terapkan' })).toBeEnabled(),
    );
  });

  it('closes the preview when the server says it was already processed (409)', async () => {
    service.apply.mockRejectedValue(
      new ApiError('Impor ini sudah diproses atau dibatalkan.', 409, 'conflict'),
    );
    const { user, region } = await upload(makeBatch());

    await user.click(within(region).getByRole('button', { name: 'Terapkan' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impor ini sudah diproses atau dibatalkan.',
    );
    expect(screen.queryByRole('region', { name: 'Pratinjau impor' })).not.toBeInTheDocument();
  });

  it('Batalkan asks for confirmation before discarding', async () => {
    service.discard.mockResolvedValue(makeBatch({ status: 'discarded' }));
    const { user, region } = await upload(makeBatch());

    await user.click(within(region).getByRole('button', { name: 'Batalkan' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/tidak ada data yang disimpan/i)).toBeInTheDocument();
    expect(service.discard).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: /ya, batalkan/i }));

    await waitFor(() => expect(service.discard).toHaveBeenCalledWith(5));
    expect(await screen.findByText('Impor dibatalkan.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Pratinjau impor' })).not.toBeInTheDocument();
  });

  it('does not discard when the confirmation is dismissed', async () => {
    const { user, region } = await upload(makeBatch());

    await user.click(within(region).getByRole('button', { name: 'Batalkan' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Kembali' }));

    expect(service.discard).not.toHaveBeenCalled();
    // the page is hidden from assistive tech until the dialog has finished closing
    expect(await previewRegion()).toBeInTheDocument();
  });
});

describe('ImportPage history', () => {
  it('lists past imports in Indonesian and reopens a preview when its row is clicked', async () => {
    service.list.mockResolvedValue(
      pageOf([
        makeBatch({ id: 5, file_name: 'tagihan-ganjil.csv' }),
        makeBatch({
          id: 4,
          file_name: 'sipema.xlsx',
          source: 'sipema',
          semester: null,
          status: 'applied',
        }),
        makeBatch({ id: 3, file_name: 'lama.csv', status: 'discarded' }),
      ]),
    );
    const user = newUser();
    renderPage();

    expect(await screen.findByText('tagihan-ganjil.csv')).toBeInTheDocument();
    expect(screen.getByText('Pratinjau')).toBeInTheDocument();
    expect(screen.getByText('Diterapkan')).toBeInTheDocument();
    expect(screen.getByText('Dibatalkan')).toBeInTheDocument();
    expect(screen.getByText('SIPEMA')).toBeInTheDocument();
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'created_at', sort_order: 'desc' }),
    );
    expect(screen.queryByRole('region', { name: 'Pratinjau impor' })).not.toBeInTheDocument();

    await user.click(screen.getByText('sipema.xlsx')); // applied: nothing to reopen
    expect(screen.queryByRole('region', { name: 'Pratinjau impor' })).not.toBeInTheDocument();

    await user.click(screen.getByText('tagihan-ganjil.csv'));

    const region = await previewRegion();
    expect(within(region).getByText(/tagihan-ganjil\.csv/)).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Terapkan' })).toBeEnabled();
    expect(service.errors).toHaveBeenCalledWith(5, expect.anything());
  });
});

describe('ImportPage without imports:create', () => {
  it('controls are hidden without imports:create, while the preview stays readable', async () => {
    signIn(['imports:read']);
    service.list.mockResolvedValue(pageOf([makeBatch()]));
    const user = newUser();
    renderPage();

    expect(await screen.findByText('tagihan.csv')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unggah dan pratinjau' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Berkas impor')).not.toBeInTheDocument();

    await user.click(screen.getByText('tagihan.csv'));

    const region = await previewRegion();
    expect(stat(region, 'Baris valid')).toHaveTextContent('9');
    expect(within(region).queryByRole('button', { name: 'Terapkan' })).not.toBeInTheDocument();
    expect(within(region).queryByRole('button', { name: 'Batalkan' })).not.toBeInTheDocument();
  });
});
