import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Page from '@/app/(app)/schedules/page';
import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';
import { templatesService } from '@/modules/templates/services/templates.service';
import type { TemplateRecord } from '@/modules/templates/types';

import { schedulesService } from '../services/schedules.service';
import type { ScheduleRuleRecord } from '../types';
import { SchedulesListPage } from './SchedulesListPage';

vi.mock('../services/schedules.service', () => ({
  schedulesService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));
vi.mock('@/modules/templates/services/templates.service', () => ({
  templatesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    preview: vi.fn(),
  },
}));

const schedules = vi.mocked(schedulesService);
const templatesApi = vi.mocked(templatesService);

const makeTemplate = (id: number, name: string, isActive = true): TemplateRecord => ({
  id,
  name,
  body: 'Halo',
  is_active: isActive,
  created_at: '2026-11-01T01:00:00Z',
  updated_at: '2026-11-01T01:00:00Z',
});

const templateRows = [
  makeTemplate(1, 'Pengingat sebelum jatuh tempo'),
  makeTemplate(2, 'Tunggakan setelah jatuh tempo', false),
];

const makeRule = (overrides: Partial<ScheduleRuleRecord> = {}): ScheduleRuleRecord => ({
  id: 1,
  name: 'Seminggu sebelum',
  offset_days: -7,
  template: { id: 1, name: 'Pengingat sebelum jatuh tempo' },
  is_active: true,
  created_at: '2026-11-01T01:00:00Z',
  updated_at: '2026-11-02T03:30:00Z',
  ...overrides,
});

const rows = [
  makeRule(),
  makeRule({
    id: 2,
    name: 'Hari jatuh tempo',
    offset_days: 0,
    template: { id: 1, name: 'Pengingat sebelum jatuh tempo' },
  }),
  makeRule({
    id: 3,
    name: 'Tiga hari sesudah',
    offset_days: 3,
    template: { id: 2, name: 'Tunggakan setelah jatuh tempo' },
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

const ALL = [
  'schedules:read',
  'schedules:create',
  'schedules:update',
  'schedules:delete',
  'templates:read',
];

const renderPage = () =>
  render(
    <NotifyProvider>
      <SchedulesListPage />
    </NotifyProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  signIn(ALL);
  schedules.list.mockResolvedValue(pageOf(rows));
  templatesApi.list.mockResolvedValue(pageOf(templateRows));
});

describe('SchedulesListPage', () => {
  it('renders Indonesian headers, offset labels and the default offset sort', async () => {
    renderPage();

    expect(await screen.findByText('Tiga hari sesudah')).toBeInTheDocument();
    for (const header of ['Nama', 'Waktu kirim', 'Template', 'Status', 'Diperbarui']) {
      expect(
        screen.getByRole('columnheader', { name: new RegExp(`^${header}`) }),
      ).toBeInTheDocument();
    }
    expect(screen.getByText('H-7')).toBeInTheDocument();
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('H+3')).toBeInTheDocument();

    expect(schedules.list).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'offset_days', sort_order: 'asc' }),
    );
  });

  it('explains each offset in words as a tooltip', async () => {
    renderPage();
    await screen.findByText('Tiga hari sesudah');

    expect(screen.getByLabelText('7 hari sebelum jatuh tempo')).toHaveTextContent('H-7');
    expect(screen.getByLabelText('pada hari jatuh tempo')).toHaveTextContent('H');
    expect(screen.getByLabelText('3 hari setelah jatuh tempo')).toHaveTextContent('H+3');
  });

  it('shows the template name and warns when the template is inactive', async () => {
    renderPage();
    await screen.findByText('Tiga hari sesudah');

    expect(screen.getAllByText('Pengingat sebelum jatuh tempo').length).toBe(2);
    expect(screen.getByText('Tunggakan setelah jatuh tempo')).toBeInTheDocument();
    // only the rule that points at the inactive template gets the warning
    await waitFor(() => expect(screen.getAllByText('Template nonaktif')).toHaveLength(1));
    const warningRow = screen.getByText('Tiga hari sesudah').closest('[role="row"]') as HTMLElement;
    expect(within(warningRow).getByText('Template nonaktif')).toBeInTheDocument();
  });

  it('shows the rule status chips', async () => {
    renderPage();
    await screen.findByText('Tiga hari sesudah');

    const grid = screen.getByRole('grid');
    expect(within(grid).getAllByText('Aktif')).toHaveLength(2);
    expect(within(grid).getByText('Nonaktif')).toBeInTheDocument();
  });

  it('still lists the rules when the templates cannot be loaded', async () => {
    templatesApi.list.mockRejectedValue(new ApiError('Gagal', 500));
    renderPage();

    expect(await screen.findByText('Tiga hari sesudah')).toBeInTheDocument();
    expect(screen.queryByText('Template nonaktif')).not.toBeInTheDocument();
  });

  it('does not ask for templates without templates:read', async () => {
    signIn(['schedules:read']);
    renderPage();

    expect(await screen.findByText('Tiga hari sesudah')).toBeInTheDocument();
    expect(templatesApi.list).not.toHaveBeenCalled();
  });

  it('creates a rule from Tambah aturan with offset_days as a number', async () => {
    schedules.create.mockResolvedValue(makeRule({ id: 4 }));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tiga hari sesudah');

    await user.click(screen.getByRole('button', { name: 'Tambah aturan' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Nama/), 'Tiga hari sebelum');
    await user.type(within(dialog).getByLabelText(/^Offset hari/), '-3');
    await user.click(within(dialog).getByRole('combobox', { name: /^Template/ }));
    await user.click(await screen.findByRole('option', { name: 'Pengingat sebelum jatuh tempo' }));
    await user.click(within(dialog).getByRole('button', { name: 'Tambah' }));

    await waitFor(() =>
      expect(schedules.create).toHaveBeenCalledWith({
        name: 'Tiga hari sebelum',
        offset_days: -3,
        template_id: 1,
        is_active: true,
      }),
    );
    expect(await screen.findByText('Aturan jadwal berhasil ditambahkan.')).toBeInTheDocument();
    await waitFor(() => expect(schedules.list).toHaveBeenCalledTimes(2));
  });

  it('keeps the dialog open and shows the 409 when the offset is already taken', async () => {
    schedules.create.mockRejectedValue(
      new ApiError('Sudah ada aturan jadwal dengan selisih hari ini.', 409, 'conflict'),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tiga hari sesudah');

    await user.click(screen.getByRole('button', { name: 'Tambah aturan' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Nama/), 'Duplikat');
    await user.type(within(dialog).getByLabelText(/^Offset hari/), '-7');
    await user.click(within(dialog).getByRole('combobox', { name: /^Template/ }));
    await user.click(await screen.findByRole('option', { name: 'Pengingat sebelum jatuh tempo' }));
    await user.click(within(dialog).getByRole('button', { name: 'Tambah' }));

    expect(
      await within(dialog).findByText('Sudah ada aturan jadwal dengan selisih hari ini.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(schedules.list).toHaveBeenCalledTimes(1);
  });

  it('edits a rule with Ubah', async () => {
    schedules.update.mockResolvedValue(makeRule());
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tiga hari sesudah');

    await user.click(screen.getByRole('button', { name: 'Ubah Seminggu sebelum' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByDisplayValue('Seminggu sebelum')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Simpan perubahan' }));

    await waitFor(() =>
      expect(schedules.update).toHaveBeenCalledWith(1, {
        name: 'Seminggu sebelum',
        offset_days: -7,
        template_id: 1,
        is_active: true,
      }),
    );
    expect(await screen.findByText('Aturan jadwal berhasil diperbarui.')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting and deletes after confirming', async () => {
    schedules.remove.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tiga hari sesudah');

    await user.click(screen.getByRole('button', { name: 'Hapus Seminggu sebelum' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Seminggu sebelum/)).toBeInTheDocument();
    expect(schedules.remove).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Hapus' }));

    await waitFor(() => expect(schedules.remove).toHaveBeenCalledWith(1));
    expect(await screen.findByText('Aturan jadwal berhasil dihapus.')).toBeInTheDocument();
    await waitFor(() => expect(schedules.list).toHaveBeenCalledTimes(2));
  });

  it('shows the server message when deleting fails', async () => {
    schedules.remove.mockRejectedValue(new ApiError('Aturan jadwal tidak ditemukan.', 404));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tiga hari sesudah');

    await user.click(screen.getByRole('button', { name: 'Hapus Seminggu sebelum' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Hapus' }));

    expect(await screen.findByText('Aturan jadwal tidak ditemukan.')).toBeInTheDocument();
  });

  it('hides Tambah, Ubah and Hapus without the matching permissions', async () => {
    signIn(['schedules:read', 'templates:read']);
    renderPage();

    expect(await screen.findByText('Tiga hari sesudah')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tambah aturan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Ubah/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Hapus /i })).not.toBeInTheDocument();
  });

  it('shows Hapus but not Ubah with schedules:delete only', async () => {
    signIn(['schedules:read', 'schedules:delete']);
    renderPage();

    expect(await screen.findByText('Tiga hari sesudah')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Hapus /i })).toHaveLength(rows.length);
    expect(screen.queryByRole('button', { name: /^Ubah/ })).not.toBeInTheDocument();
  });
});

describe('schedules page guard', () => {
  it('shows the no-access state without schedules:read', () => {
    signIn(['templates:read']);
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    expect(schedules.list).not.toHaveBeenCalled();
  });

  it('renders the list with schedules:read', async () => {
    signIn(['schedules:read']);
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Jadwal Pengiriman' })).toBeInTheDocument();
  });
});
