import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Page from '@/app/(app)/audit/page';
import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { auditService } from '../services/audit.service';
import type { AuditEventRecord } from '../types';
import { AuditLogPage } from './AuditLogPage';

vi.mock('../services/audit.service', () => ({
  auditService: { list: vi.fn() },
}));

const service = vi.mocked(auditService);

const makeEvent = (overrides: Partial<AuditEventRecord> = {}): AuditEventRecord => ({
  id: 1,
  actor: 'staf@kampus.ac.id',
  action: 'import.applied',
  entity: 'import_batch',
  entity_id: '12',
  detail: { created: 30, updated: 5, file: 'siakad.xlsx' },
  at: '2026-11-02T03:30:00Z',
  ...overrides,
});

const rows = [
  makeEvent(),
  makeEvent({
    id: 2,
    actor: 'admin@kampus.ac.id',
    action: 'template.updated',
    entity: 'template',
    entity_id: '3',
    detail: { changed: ['body'] },
  }),
  makeEvent({
    id: 3,
    action: 'settings.updated',
    entity: 'app_settings',
    entity_id: null,
    detail: null,
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
    <NotifyProvider>
      <AuditLogPage />
    </NotifyProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  signIn(['audit:read']);
  service.list.mockResolvedValue(pageOf(rows));
});

describe('AuditLogPage', () => {
  it('renders Indonesian headers and the event rows', async () => {
    renderPage();

    expect(await screen.findByText('admin@kampus.ac.id')).toBeInTheDocument();
    for (const header of ['Waktu', 'Pelaku', 'Aksi', 'Entitas', 'ID entitas', 'Detail']) {
      expect(
        screen.getByRole('columnheader', { name: new RegExp(`^${header}`) }),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByText('staf@kampus.ac.id').length).toBeGreaterThan(0);
    expect(screen.getByText('template.updated')).toBeInTheDocument();
    expect(screen.getByText('template')).toBeInTheDocument();
    expect(screen.getAllByText(/0[23] Nov 2026, \d{2}:\d{2}/).length).toBeGreaterThan(0);
  });

  it('shows the action as its raw code and a dash for a missing entity id', async () => {
    renderPage();

    expect(await screen.findByText('import.applied')).toBeInTheDocument();
    expect(screen.getByText('settings.updated')).toBeInTheDocument();
    const row = screen.getByText('settings.updated').closest('[role="row"]') as HTMLElement;
    expect(within(row).getByText('-')).toBeInTheDocument();
  });

  it('lists the newest events first and sorts by time only', async () => {
    renderPage();
    await screen.findByText('admin@kampus.ac.id');

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: 'at', sort_order: 'desc' }),
    );
    expect(screen.getByRole('columnheader', { name: /^Waktu/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it.each(['Pelaku', 'Aksi', 'Entitas', 'ID entitas'])(
    'does not sort by the %s column (the server only sorts by time)',
    async (header) => {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('admin@kampus.ac.id');
      const callsBefore = service.list.mock.calls.length;

      await user.click(screen.getByRole('columnheader', { name: new RegExp(`^${header}`) }));

      expect(service.list.mock.calls).toHaveLength(callsBefore);
      expect(service.list.mock.calls.every(([query]) => query.sort_by === 'at')).toBe(true);
    },
  );

  it('opens the detail dialog with the pretty-printed JSON', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('admin@kampus.ac.id');

    await user.click(screen.getByRole('button', { name: 'Lihat detail template.updated #2' }));

    const dialog = await screen.findByRole('dialog');
    const block = within(dialog).getByLabelText('Detail JSON');
    expect(block).toHaveTextContent(/"changed": \[\s*"body"\s*\]/);
    expect(block.textContent).toBe(JSON.stringify({ changed: ['body'] }, null, 2));
    expect(within(dialog).getByText('template.updated')).toBeInTheDocument();
    expect(within(dialog).getByText('admin@kampus.ac.id')).toBeInTheDocument();

    await user.click(within(dialog).getAllByRole('button', { name: 'Tutup' }).at(-1)!);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('says so when an event has no detail', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('admin@kampus.ac.id');

    await user.click(screen.getByRole('button', { name: 'Lihat detail settings.updated #3' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Tidak ada detail untuk peristiwa ini.')).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Detail JSON')).not.toBeInTheDocument();
  });

  it('sends the action and entity filters to the service', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('admin@kampus.ac.id');

    await user.type(screen.getByRole('textbox', { name: 'Aksi' }), 'import.applied');
    await user.type(screen.getByRole('textbox', { name: 'Entitas' }), 'import_batch');

    await waitFor(() =>
      expect(service.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ action: 'import.applied', entity: 'import_batch' }),
      ),
    );
  });

  it('does not send empty filters', async () => {
    renderPage();
    await screen.findByText('admin@kampus.ac.id');

    const [query] = service.list.mock.calls[0];
    expect(query.action).toBeUndefined();
    expect(query.entity).toBeUndefined();
    expect('search' in query && query.search).toBeFalsy();
  });

  it('has no create, edit or delete actions', async () => {
    signIn(['audit:read', 'audit:create', 'users:delete']);
    renderPage();
    await screen.findByText('admin@kampus.ac.id');

    expect(screen.queryByRole('button', { name: /^(Tambah|Ubah|Hapus)/ })).not.toBeInTheDocument();
  });
});

describe('audit page guard', () => {
  it('shows the no-access state without audit:read', () => {
    signIn(['messages:read']);
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    expect(service.list).not.toHaveBeenCalled();
  });

  it('renders the log with audit:read', async () => {
    render(
      <NotifyProvider>
        <Page />
      </NotifyProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Log Audit' })).toBeInTheDocument();
  });
});
