import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { importService } from '../services/import.service';
import type { ImportBatch, ImportRowError, RollbackPreview } from '../types';
import { ImportPage } from './ImportPage';

vi.mock('../services/import.service', () => ({
  importService: {
    preview: vi.fn(),
    apply: vi.fn(),
    discard: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    errors: vi.fn(),
    rollbackPreview: vi.fn(),
    rollback: vi.fn(),
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
  has_change_log: true,
  rolled_back_at: null,
  rollback_block: null,
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

const openUploadDialog = async (user: User) => {
  const input = screen.queryByLabelText('Berkas impor');
  if (!input) {
    const uploadBtn = screen.getByRole('button', { name: 'Unggah berkas' });
    await user.click(uploadBtn);
  }
};

const pickFile = async (user: User, file: File) => {
  await openUploadDialog(user);
  return user.upload(screen.getByLabelText('Berkas impor'), file);
};

const submitUpload = async (user: User) => {
  await openUploadDialog(user);
  return user.click(screen.getByRole('button', { name: 'Unggah dan pratinjau' }));
};

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

  it('closes the preview of the very first import (batch id equal to the history counter)', async () => {
    // The first upload on an empty database is batch 1, and the history has been refreshed once
    // by then: equal sibling keys used to leave the applied preview on screen.
    service.apply.mockResolvedValue(makeBatch({ id: 1, status: 'applied' }));
    const { user, region } = await upload(makeBatch({ id: 1 }));

    await user.click(within(region).getByRole('button', { name: 'Terapkan' }));

    await screen.findByRole('alert');
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Pratinjau impor' })).not.toBeInTheDocument(),
    );
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

  it('deletes a preview import directly from the history table after confirmation', async () => {
    service.list.mockResolvedValue(
      pageOf([makeBatch({ id: 5, file_name: 'tagihan-ganjil.csv', status: 'preview' })]),
    );
    service.delete.mockResolvedValue();
    const user = newUser();
    renderPage();

    expect(await screen.findByText('tagihan-ganjil.csv')).toBeInTheDocument();
    const deleteBtn = screen.getByRole('button', { name: 'Hapus pratinjau tagihan-ganjil.csv' });
    expect(deleteBtn).toBeInTheDocument();

    await user.click(deleteBtn);
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Hapus pratinjau impor' }),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Hapus' }));
    expect(service.delete).toHaveBeenCalledWith(5, false);
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

const rollbackPreviewOf = (overrides: Partial<RollbackPreview> = {}): RollbackPreview => ({
  students_deleted: 2,
  invoices_deleted: 6,
  students_reverted: 1,
  invoices_reverted: 2,
  queued_messages_cancelled: 3,
  sent_messages: 0,
  conflicts: [],
  conflicts_total: 0,
  ...overrides,
});

const applied = (overrides: Partial<ImportBatch> = {}) =>
  makeBatch({ id: 9, file_name: 'terbaru.csv', status: 'applied', ...overrides });

// The grid renders slowly under a parallel test run, hence the generous timeout on the role query.
const rollbackButton = (fileName: string) =>
  screen.findByRole('button', { name: `Batalkan impor ${fileName}` }, { timeout: 8000 });

describe('ImportPage rollback', () => {
  beforeEach(() => {
    signIn(['imports:read', 'imports:create', 'imports:rollback']);
    service.rollbackPreview.mockResolvedValue(rollbackPreviewOf());
  });

  it('shows no rollback button without imports:rollback', async () => {
    signIn(['imports:read', 'imports:create']);
    service.list.mockResolvedValue(pageOf([applied()]));
    renderPage();

    expect(await screen.findByText('terbaru.csv')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Batalkan impor/ })).not.toBeInTheDocument();
  });

  it('offers rollback only for applied imports and explains a blocked one', async () => {
    service.list.mockResolvedValue(
      pageOf([
        applied(),
        applied({ id: 8, file_name: 'lama.csv', rollback_block: 'not_latest' }),
        applied({ id: 7, file_name: 'tanpa-log.csv', rollback_block: 'no_change_log' }),
        makeBatch({ id: 6, file_name: 'pratinjau.csv', status: 'preview' }),
        makeBatch({ id: 5, file_name: 'selesai.csv', status: 'rolled_back' }),
      ]),
    );
    const user = newUser();
    renderPage();

    expect(await rollbackButton('terbaru.csv')).toBeEnabled();
    const blocked = screen.getByRole('button', { name: 'Batalkan impor lama.csv' });
    expect(blocked).toBeDisabled();
    await user.hover(blocked.parentElement as HTMLElement);
    expect(
      await screen.findByText('Batalkan impor yang lebih baru lebih dulu.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Batalkan impor tanpa-log.csv' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Batalkan impor pratinjau.csv' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Batalkan impor selesai.csv' })).toBeNull();
    expect(screen.getByText('Dikembalikan')).toBeInTheDocument();
  });

  it('shows the impact before asking for confirmation', async () => {
    service.list.mockResolvedValue(pageOf([applied()]));
    service.rollbackPreview.mockResolvedValue(rollbackPreviewOf({ sent_messages: 4 }));
    const user = newUser();
    renderPage();

    await user.click(await rollbackButton('terbaru.csv'));

    const dialog = await screen.findByRole('dialog');
    expect(service.rollbackPreview).toHaveBeenCalledWith(9);
    expect(await within(dialog).findByText(/2 mahasiswa baru dihapus/)).toBeInTheDocument();
    expect(within(dialog).getByText(/6 tagihan baru dihapus/)).toBeInTheDocument();
    expect(within(dialog).getByText(/1 mahasiswa dikembalikan/)).toBeInTheDocument();
    expect(within(dialog).getByText(/2 tagihan dikembalikan/)).toBeInTheDocument();
    expect(within(dialog).getByText(/3 pesan antre dibatalkan/)).toBeInTheDocument();
    expect(within(dialog).getByText(/4 pesan sudah terkirim/)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Pesan WhatsApp yang sudah terkirim tidak dapat ditarik kembali/),
    ).toBeInTheDocument();
    expect(service.rollback).not.toHaveBeenCalled();
  });

  it('rolls back on confirmation and reloads the history', async () => {
    service.list.mockResolvedValue(pageOf([applied()]));
    service.rollback.mockResolvedValue(applied({ status: 'rolled_back' }));
    const user = newUser();
    renderPage();
    await user.click(await rollbackButton('terbaru.csv'));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText(/2 mahasiswa baru dihapus/);
    const listCalls = service.list.mock.calls.length;

    await user.click(within(dialog).getByRole('button', { name: 'Batalkan impor' }));

    await waitFor(() => expect(service.rollback).toHaveBeenCalledWith(9));
    expect(await screen.findByText('Impor dikembalikan.')).toBeInTheDocument();
    await waitFor(() => expect(service.list.mock.calls.length).toBeGreaterThan(listCalls));
  });

  it('lists conflicts and blocks the confirmation', async () => {
    service.list.mockResolvedValue(pageOf([applied()]));
    service.rollbackPreview.mockResolvedValue(
      rollbackPreviewOf({
        conflicts: [{ entity: 'invoice', label: 'INV-1', fields: ['status', 'paid_at'] }],
        conflicts_total: 3,
      }),
    );
    const user = newUser();
    renderPage();

    await user.click(await rollbackButton('terbaru.csv'));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText(/INV-1/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Status, Tanggal bayar/)).toBeInTheDocument();
    expect(within(dialog).getByText(/dan 2 lainnya/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Batalkan impor' })).toBeDisabled();
  });

  it('shows the server message and closes when the rollback is refused (409)', async () => {
    service.list.mockResolvedValue(pageOf([applied()]));
    service.rollback.mockRejectedValue(
      new ApiError('Batalkan impor yang lebih baru lebih dulu.', 409, 'conflict'),
    );
    const user = newUser();
    renderPage();
    await user.click(await rollbackButton('terbaru.csv'));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText(/2 mahasiswa baru dihapus/);

    await user.click(within(dialog).getByRole('button', { name: 'Batalkan impor' }));

    expect(await screen.findByText('Batalkan impor yang lebih baru lebih dulu.')).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the dialog with the server message when the preview is refused', async () => {
    service.list.mockResolvedValue(pageOf([applied()]));
    service.rollbackPreview.mockRejectedValue(
      new ApiError('Hanya impor berstatus Diterapkan yang dapat dibatalkan.', 409, 'conflict'),
    );
    const user = newUser();
    renderPage();

    await user.click(await rollbackButton('terbaru.csv'));

    expect(
      await screen.findByText('Hanya impor berstatus Diterapkan yang dapat dibatalkan.'),
    ).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
