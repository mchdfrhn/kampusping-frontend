import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Page from '@/app/(app)/templates/page';
import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { templatesService } from '../services/templates.service';
import type { TemplateRecord } from '../types';
import { TemplatesListPage } from './TemplatesListPage';

vi.mock('../services/templates.service', () => ({
  templatesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    preview: vi.fn(),
  },
}));

const service = vi.mocked(templatesService);

const LONG_BODY =
  'Yth. {{nama}} ({{nim}}), kami mengingatkan bahwa tagihan uang kuliah semester {{semester}} sebesar Rp{{nominal}} akan jatuh tempo pada {{tanggal_jatuh_tempo}}.';

const makeTemplate = (overrides: Partial<TemplateRecord> = {}): TemplateRecord => ({
  id: 1,
  name: 'Pengingat sebelum jatuh tempo',
  body: LONG_BODY,
  is_active: true,
  created_at: '2026-11-01T01:00:00Z',
  updated_at: '2026-11-02T03:30:00Z',
  ...overrides,
});

const rows = [
  makeTemplate(),
  makeTemplate({
    id: 2,
    name: 'Tunggakan setelah jatuh tempo',
    body: 'Yth. {{nama}}, tagihan Anda belum lunas.',
    is_active: false,
  }),
];

const pageOf = <Item,>(items: Item[]) => ({ items, total: items.length, page: 1, page_size: 20 });

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, permissions } as unknown as AuthUser,
  });

const ALL = ['templates:read', 'templates:create', 'templates:update', 'templates:delete'];

const renderPage = () =>
  render(
    <NotifyProvider>
      <TemplatesListPage />
    </NotifyProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  signIn(ALL);
  service.list.mockResolvedValue(pageOf(rows));
  service.preview.mockResolvedValue({ rendered: 'x', unknown_variables: [] });
});

describe('TemplatesListPage', () => {
  it('renders Indonesian headers, names, status chips and the default name sort', async () => {
    renderPage();

    expect(await screen.findByText('Tunggakan setelah jatuh tempo')).toBeInTheDocument();
    for (const header of ['Nama', 'Status', 'Isi', 'Diperbarui']) {
      expect(
        screen.getByRole('columnheader', { name: new RegExp(`^${header}`) }),
      ).toBeInTheDocument();
    }
    const grid = screen.getByRole('grid');
    expect(within(grid).getByText('Aktif')).toBeInTheDocument();
    expect(within(grid).getByText('Nonaktif')).toBeInTheDocument();
    expect(screen.getAllByText(/0[23] Nov 2026, \d{2}:\d{2}/).length).toBeGreaterThan(0);

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'name', sort_order: 'asc' }),
    );
  });

  it('shows only the first 80 characters of the body, with the full text as a tooltip', async () => {
    renderPage();
    await screen.findByText('Tunggakan setelah jatuh tempo');

    const excerpt = `${LONG_BODY.slice(0, 80).trimEnd()}…`;
    expect(screen.getByText(excerpt)).toBeInTheDocument();
    expect(screen.getByLabelText(LONG_BODY)).toBeInTheDocument();
    // a short body is shown whole, without an ellipsis
    expect(screen.getByText('Yth. {{nama}}, tagihan Anda belum lunas.')).toBeInTheDocument();
  });

  it('keeps the body on one line even when it contains line breaks', async () => {
    service.list.mockResolvedValue(pageOf([makeTemplate({ body: 'Baris satu\n\nBaris dua' })]));
    renderPage();

    expect(await screen.findByText('Baris satu Baris dua')).toBeInTheDocument();
  });

  it('searches by name through the service', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tunggakan setelah jatuh tempo');

    await user.type(screen.getByPlaceholderText('Cari nama template'), 'tunggakan');

    await waitFor(() =>
      expect(service.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'tunggakan' }),
      ),
    );
  });

  it('opens an empty form from Tambah template and creates the template', async () => {
    service.create.mockResolvedValue(makeTemplate({ id: 3 }));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tunggakan setelah jatuh tempo');

    await user.click(screen.getByRole('button', { name: 'Tambah template' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Nama/), 'Template baru');
    await user.type(within(dialog).getByLabelText(/^Isi pesan/), 'Halo');
    await user.click(within(dialog).getByRole('button', { name: 'Tambah' }));

    await waitFor(() =>
      expect(service.create).toHaveBeenCalledWith({
        name: 'Template baru',
        body: 'Halo',
        is_active: true,
      }),
    );
    expect(await screen.findByText('Template berhasil ditambahkan.')).toBeInTheDocument();
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2));
  });

  it('edits a template with Ubah', async () => {
    service.update.mockResolvedValue(makeTemplate());
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tunggakan setelah jatuh tempo');

    await user.click(screen.getByRole('button', { name: 'Ubah Tunggakan setelah jatuh tempo' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByDisplayValue('Tunggakan setelah jatuh tempo')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Simpan perubahan' }));

    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith(2, {
        name: 'Tunggakan setelah jatuh tempo',
        body: 'Yth. {{nama}}, tagihan Anda belum lunas.',
        is_active: false,
      }),
    );
    expect(await screen.findByText('Template berhasil diperbarui.')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting and deletes after confirming', async () => {
    service.remove.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tunggakan setelah jatuh tempo');

    await user.click(screen.getByRole('button', { name: 'Hapus Tunggakan setelah jatuh tempo' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Tunggakan setelah jatuh tempo/)).toBeInTheDocument();
    expect(service.remove).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Hapus' }));

    await waitFor(() => expect(service.remove).toHaveBeenCalledWith(2));
    expect(await screen.findByText('Template berhasil dihapus.')).toBeInTheDocument();
    await waitFor(() => expect(service.list).toHaveBeenCalledTimes(2));
  });

  it('does not delete when the confirmation is dismissed', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tunggakan setelah jatuh tempo');

    await user.click(screen.getByRole('button', { name: 'Hapus Tunggakan setelah jatuh tempo' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Batal' }));

    expect(service.remove).not.toHaveBeenCalled();
  });

  it('shows the server message when the template is still used by a schedule rule (409)', async () => {
    service.remove.mockRejectedValue(
      new ApiError('Template masih dipakai oleh aturan jadwal.', 409, 'conflict'),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tunggakan setelah jatuh tempo');

    await user.click(screen.getByRole('button', { name: 'Hapus Tunggakan setelah jatuh tempo' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Hapus' }));

    expect(
      await screen.findByText('Template masih dipakai oleh aturan jadwal.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('hides Tambah, Ubah and Hapus without the matching permissions', async () => {
    signIn(['templates:read']);
    renderPage();

    expect(await screen.findByText('Tunggakan setelah jatuh tempo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tambah template' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Ubah/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Hapus /i })).not.toBeInTheDocument();
  });

  it('shows Ubah but not Hapus with templates:update only', async () => {
    signIn(['templates:read', 'templates:update']);
    renderPage();

    expect(await screen.findByText('Tunggakan setelah jatuh tempo')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Ubah/ })).toHaveLength(rows.length);
    expect(screen.queryByRole('button', { name: /^Hapus /i })).not.toBeInTheDocument();
  });
});

describe('templates page guard', () => {
  it('shows the no-access state without templates:read', () => {
    signIn(['schedules:read']);
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    expect(service.list).not.toHaveBeenCalled();
  });

  it('renders the list with templates:read', async () => {
    signIn(['templates:read']);
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Template Pesan' })).toBeInTheDocument();
  });
});
