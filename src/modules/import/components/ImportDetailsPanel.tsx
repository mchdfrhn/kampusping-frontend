'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';

import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppEmptyState } from '@/components/base/AppEmptyState';
import { AppTabs } from '@/components/base/AppTabs';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatRupiah } from '@/core/utils/format.util';

import { importService } from '../services/import.service';
import type {
  ImportBatch,
  ImportDetailCategory,
  ImportDetailChanged,
  ImportDetailItem,
  ImportDetailNew,
  ImportDetailSuspectedPaid,
  ImportRowError,
} from '../types';

type TabValue = ImportDetailCategory | 'errors';

type Props = {
  batch: ImportBatch;
  /** Invoice ids ticked in the suspected-paid list; owned by the preview so it survives tabs. */
  selectedIds: Set<number>;
  /** Every suspected-paid invoice id, also those on pages not loaded (for "Pilih semua"). */
  allIds: number[];
  disabled: boolean;
  onSelectedChange: (ids: Set<number>) => void;
};

const DEFAULT_SORT = { field: 'row_number', order: 'asc' } as const;
const NO_SORT = { field: 'nim', order: 'asc' } as const;

const rupiah = (value: unknown) =>
  typeof value === 'number' ? formatRupiah(value) : String(value);

const FIELD_LABELS: Record<string, string> = {
  amount: 'Nominal',
  due_date: 'Jatuh tempo',
  semester: 'Semester',
  source: 'Sumber',
  status: 'Status',
  restored: 'Dipulihkan dari data terhapus',
};

const describeChange = ([field, [before, after]]: [string, [unknown, unknown]]) => {
  const label = FIELD_LABELS[field] ?? field;
  if (field === 'restored') return label;
  const show = field === 'amount' ? rupiah : String;
  return `${label}: ${show(before)} → ${show(after)}`;
};

const NEW_COLUMNS: GridColDef<ImportDetailNew>[] = [
  { field: 'nim', headerName: 'NIM', width: 150, sortable: false },
  { field: 'name', headerName: 'Nama', minWidth: 200, flex: 1, sortable: false },
  { field: 'semester', headerName: 'Semester', width: 170, sortable: false },
  {
    field: 'amount',
    headerName: 'Nominal',
    width: 140,
    sortable: false,
    valueFormatter: (value: number) => formatRupiah(value),
  },
  { field: 'invoice_code', headerName: 'Kode tagihan', width: 200, sortable: false },
];

const CHANGED_COLUMNS: GridColDef<ImportDetailChanged>[] = [
  { field: 'nim', headerName: 'NIM', width: 150, sortable: false },
  { field: 'name', headerName: 'Nama', minWidth: 200, flex: 1, sortable: false },
  { field: 'invoice_code', headerName: 'Kode tagihan', width: 200, sortable: false },
  {
    field: 'fields',
    headerName: 'Perubahan',
    minWidth: 260,
    flex: 1,
    sortable: false,
    valueGetter: (_value, row) => Object.entries(row.fields).map(describeChange).join('; '),
  },
];

const SUSPECTED_COLUMNS: GridColDef<ImportDetailSuspectedPaid>[] = [
  { field: 'nim', headerName: 'NIM', width: 150, sortable: false },
  { field: 'name', headerName: 'Nama', minWidth: 200, flex: 1, sortable: false },
  { field: 'study_program', headerName: 'Program studi', width: 200, sortable: false },
  { field: 'semester', headerName: 'Semester', width: 170, sortable: false },
  {
    field: 'amount',
    headerName: 'Nominal',
    width: 140,
    sortable: false,
    valueFormatter: (value: number) => formatRupiah(value),
  },
];

const ERROR_COLUMNS: GridColDef<ImportRowError & { id: string }>[] = [
  { field: 'row_number', headerName: 'Baris', width: 100, type: 'number', headerAlign: 'left' },
  { field: 'field', headerName: 'Kolom', width: 160 },
  { field: 'message', headerName: 'Masalah', minWidth: 240, flex: 1, sortable: false },
];

const EMPTY: Record<TabValue, { title: string; description: string }> = {
  new: { title: 'Tidak ada tagihan baru', description: 'Semua tagihan di berkas sudah ada.' },
  changed: {
    title: 'Tidak ada nominal yang berubah',
    description: 'Tagihan yang sudah ada tidak berbeda dari berkas.',
  },
  suspected_paid: {
    title: 'Tidak ada tagihan yang diduga lunas',
    description: 'Semua tagihan terbuka masih ada di berkas.',
  },
  errors: { title: 'Tidak ada baris bermasalah', description: 'Semua baris berkas valid.' },
};

type DetailGridProps<C extends ImportDetailCategory> = {
  batchId: number;
  category: C;
  columns: GridColDef<ImportDetailItem<C>>[];
  getRowId: (row: ImportDetailItem<C>) => string | number;
  selection?: {
    selectedIds: Set<number>;
    allIds: number[];
    disabled: boolean;
    onChange: (ids: Set<number>) => void;
  };
};

const DetailGrid = <C extends ImportDetailCategory>({
  batchId,
  category,
  columns,
  getRowId,
  selection,
}: DetailGridProps<C>) => {
  const notify = useNotify();
  const grid = useServerGrid<ImportDetailItem<C>>({
    fetcher: (query) => importService.details(batchId, category, query),
    defaultSort: NO_SORT,
    onError: notify.error,
  });

  if (!grid.loading && grid.total === 0) {
    return <AppEmptyState {...EMPTY[category]} />;
  }

  const selectionProps = selection
    ? {
        checkboxSelection: true,
        keepNonExistentRowsSelected: true,
        isRowSelectable: () => !selection.disabled,
        rowSelectionModel: { type: 'include', ids: selection.selectedIds } as GridRowSelectionModel,
        onRowSelectionModelChange: (model: GridRowSelectionModel) => {
          const ids =
            model.type === 'include'
              ? new Set([...model.ids].map(Number))
              : new Set(selection.allIds.filter((id) => !model.ids.has(id)));
          selection.onChange(ids);
        },
      }
    : {};

  return (
    <AppDataGrid
      columns={columns}
      fillWidth
      getRowId={getRowId}
      pageSizeOptions={[20, 50, 100]}
      {...grid.gridProps}
      {...selectionProps}
    />
  );
};

const ErrorsGrid = ({ batchId }: { batchId: number }) => {
  const notify = useNotify();
  const grid = useServerGrid<ImportRowError & { id: string }, { batch_id: number }>({
    fetcher: async ({ batch_id, ...query }) => {
      const result = await importService.errors(batch_id, query);
      return {
        ...result,
        items: result.items.map((item, index) => ({ ...item, id: `${result.page}-${index}` })),
      };
    },
    defaultSort: DEFAULT_SORT,
    filters: { batch_id: batchId },
    onError: notify.error,
  });

  if (!grid.loading && grid.total === 0) return <AppEmptyState {...EMPTY.errors} />;

  return (
    <AppDataGrid
      columns={ERROR_COLUMNS}
      fillWidth
      getRowId={(row: ImportRowError & { id: string }) => row.id}
      pageSizeOptions={[20, 50, 100]}
      {...grid.gridProps}
    />
  );
};

const firstTab = (batch: ImportBatch): TabValue => {
  const { summary } = batch;
  if (summary.rows_error > 0) return 'errors';
  if (batch.kind === 'rekap' && (summary.paid_suspected ?? 0) > 0) return 'suspected_paid';
  if (summary.invoices_new > 0) return 'new';
  if (summary.invoices_updated > 0) return 'changed';
  return 'errors';
};

export const ImportDetailsPanel = ({
  batch,
  selectedIds,
  allIds,
  disabled,
  onSelectedChange,
}: Props) => {
  const [tab, setTab] = useState<TabValue>(() => firstTab(batch));
  const { summary } = batch;

  const items = useMemo(
    () => [
      { value: 'new', label: `Tagihan baru (${summary.invoices_new})` },
      { value: 'changed', label: `Nominal berubah (${summary.invoices_updated})` },
      ...(batch.kind === 'rekap'
        ? [{ value: 'suspected_paid', label: `Diduga lunas (${summary.paid_suspected ?? 0})` }]
        : []),
      { value: 'errors', label: `Masalah (${summary.rows_error})` },
    ],
    [batch.kind, summary],
  );

  return (
    <Box>
      <AppTabs
        items={items}
        value={tab}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(_event, value: TabValue) => setTab(value)}
      />
      <Box sx={{ minHeight: 260, my: 2 }}>
        {tab === 'new' ? (
          <Box sx={{ height: 340 }}>
            <DetailGrid
              batchId={batch.id}
              category="new"
              columns={NEW_COLUMNS}
              getRowId={(row) => row.invoice_code}
            />
          </Box>
        ) : null}
        {tab === 'changed' ? (
          <Box sx={{ height: 340 }}>
            <DetailGrid
              batchId={batch.id}
              category="changed"
              columns={CHANGED_COLUMNS}
              getRowId={(row) => row.invoice_id}
            />
          </Box>
        ) : null}
        {tab === 'suspected_paid' ? (
          <>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography color="text.secondary" variant="body2">
                {`Dipilih ${selectedIds.size} dari ${allIds.length}`}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled={disabled}
                  onClick={() => onSelectedChange(new Set(allIds))}
                >
                  Pilih semua
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled={disabled}
                  onClick={() => onSelectedChange(new Set())}
                >
                  Kosongkan
                </Button>
              </Stack>
            </Stack>
            <Box sx={{ height: 340 }}>
              <DetailGrid
                batchId={batch.id}
                category="suspected_paid"
                columns={SUSPECTED_COLUMNS}
                getRowId={(row) => row.invoice_id}
                selection={{ selectedIds, allIds, disabled, onChange: onSelectedChange }}
              />
            </Box>
          </>
        ) : null}
        {tab === 'errors' ? (
          <Box sx={{ height: 340 }}>
            <ErrorsGrid batchId={batch.id} />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
