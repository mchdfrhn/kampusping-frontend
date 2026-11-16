import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { importService } from '../services/import.service';
import type { ImportBatch, ImportDetailSuspectedPaid } from '../types';
import { ImportDetailsPanel } from './ImportDetailsPanel';

vi.mock('../services/import.service', () => ({
  importService: { details: vi.fn(), detailIds: vi.fn(), errors: vi.fn() },
}));

const service = vi.mocked(importService);

const makeBatch = (overrides: Partial<ImportBatch> = {}): ImportBatch => ({
  id: 5,
  source: 'siakad',
  file_name: 'Rekap.xlsx',
  semester: null,
  status: 'preview',
  kind: 'rekap',
  summary: {
    rows_total: 207,
    rows_valid: 207,
    rows_error: 0,
    students_new: 1,
    students_updated: 206,
    invoices_new: 4,
    invoices_updated: 53,
    invoices_unchanged: 150,
    invoices_skipped: 0,
    paid_suspected: 23,
    incomplete_warning: 0,
  },
  created_at: '2026-11-16T01:00:00Z',
  created_by: 'staf@kampus.ac.id',
  applied_at: null,
  has_change_log: true,
  rolled_back_at: null,
  rollback_block: null,
  ...overrides,
});

const suspect = (id: number): ImportDetailSuspectedPaid => ({
  invoice_id: id,
  invoice_code: `TGK-${id}-20261`,
  nim: `${id}`,
  name: `MAHASISWA ${id}`,
  study_program: 'Teknik Sipil',
  semester: '2026/2027 Ganjil',
  amount: 1_500_000,
});

const pageOf = <Item,>(items: Item[]) => ({ items, total: items.length, page: 1, page_size: 20 });

type HarnessProps = {
  batch: ImportBatch;
  initial?: number[];
  allIds?: number[];
  onChange?: (ids: Set<number>) => void;
};

const Harness = ({ batch, initial = [], allIds = [101, 102, 103], onChange }: HarnessProps) => {
  const [selected, setSelected] = useState(new Set(initial));
  return (
    <NotifyProvider>
      <ImportDetailsPanel
        batch={batch}
        selectedIds={selected}
        allIds={allIds}
        disabled={false}
        onSelectedChange={(ids) => {
          setSelected(ids);
          onChange?.(ids);
        }}
      />
    </NotifyProvider>
  );
};

beforeEach(() => {
  vi.resetAllMocks();
  service.errors.mockResolvedValue(pageOf([]));
  service.details.mockResolvedValue(pageOf([]));
});

describe('ImportDetailsPanel', () => {
  it('shows a tab per list with the counts of the summary', () => {
    render(<Harness batch={makeBatch()} />);

    expect(screen.getByRole('tab', { name: 'Tagihan baru (4)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Nominal berubah (53)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Diduga lunas (23)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Masalah (0)' })).toBeInTheDocument();
  });

  it('has no suspected-paid tab for a standard file', () => {
    render(<Harness batch={makeBatch({ kind: 'standard' })} />);

    expect(screen.queryByRole('tab', { name: /Diduga lunas/ })).not.toBeInTheDocument();
  });

  it('opens on the problems tab when the file has problems, otherwise on suspected paid', async () => {
    const withProblems = makeBatch({ summary: { ...makeBatch().summary, rows_error: 2 } });
    const { unmount } = render(<Harness batch={withProblems} />);
    expect(screen.getByRole('tab', { name: 'Masalah (2)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    unmount();

    render(<Harness batch={makeBatch()} />);
    expect(screen.getByRole('tab', { name: 'Diduga lunas (23)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it.each([
    ['Tagihan baru (4)', 'Tidak ada tagihan baru'],
    ['Nominal berubah (53)', 'Tidak ada nominal yang berubah'],
    ['Diduga lunas (23)', 'Tidak ada tagihan yang diduga lunas'],
    ['Masalah (0)', 'Tidak ada baris bermasalah'],
  ])('shows an explicit empty state on the %s tab', async (tab, message) => {
    const user = userEvent.setup();
    render(<Harness batch={makeBatch()} />);

    await user.click(screen.getByRole('tab', { name: tab }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('lists the suspected invoices and loads them from the details endpoint', async () => {
    service.details.mockResolvedValue(pageOf([suspect(101), suspect(102)]));
    render(<Harness batch={makeBatch()} />);

    expect(await screen.findByText('MAHASISWA 101')).toBeInTheDocument();
    expect(service.details).toHaveBeenCalledWith(
      5,
      'suspected_paid',
      expect.objectContaining({ page: 1 }),
    );
  });

  it('Pilih semua selects every id, also those on other pages, and Kosongkan clears them', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    service.details.mockResolvedValue(pageOf([suspect(101)]));
    render(
      <Harness batch={makeBatch()} allIds={[101, 102, 103]} initial={[101]} onChange={onChange} />,
    );
    expect(await screen.findByText('Dipilih 1 dari 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pilih semua' }));
    expect(onChange).toHaveBeenLastCalledWith(new Set([101, 102, 103]));
    expect(await screen.findByText('Dipilih 3 dari 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Kosongkan' }));
    expect(onChange).toHaveBeenLastCalledWith(new Set());
    expect(await screen.findByText('Dipilih 0 dari 3')).toBeInTheDocument();
  });

  it('ticking a row adds its invoice id to the selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    service.details.mockResolvedValue(pageOf([suspect(101), suspect(102)]));
    render(<Harness batch={makeBatch()} initial={[]} onChange={onChange} />);
    const row = (await screen.findByText('MAHASISWA 102')).closest('[role="row"]') as HTMLElement;

    await user.click(within(row).getByRole('checkbox'));

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(new Set([102])));
  });

  it('keeps the selection when switching tabs and back', async () => {
    const user = userEvent.setup();
    service.details.mockResolvedValue(pageOf([suspect(101)]));
    render(<Harness batch={makeBatch()} initial={[101, 102]} />);
    expect(await screen.findByText('Dipilih 2 dari 3')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Tagihan baru (4)' }));
    await user.click(screen.getByRole('tab', { name: 'Diduga lunas (23)' }));

    expect(await screen.findByText('Dipilih 2 dari 3')).toBeInTheDocument();
  });
});
