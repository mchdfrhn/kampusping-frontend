'use client';

import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import type { GridColDef } from '@mui/x-data-grid';
import type { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppDatePicker } from '@/components/base/AppDatePicker';
import { AppSearchField } from '@/components/base/AppSearchField';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { DATE_API_FORMAT, formatDisplayDate } from '@/core/utils/date.util';
import { formatRupiah } from '@/core/utils/format.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';

import {
  INVOICE_SOURCE_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_OPTIONS,
  INVOICE_STATUS_TONES,
  MARK_PAID_TEXT,
  MARK_UNPAID_TEXT,
} from '../constants';
import { invoicesService } from '../services/invoices.service';
import type { InvoiceFilterOptions, InvoiceFilters, InvoiceRecord, InvoiceStatus } from '../types';
import { DeleteInvoicesFileDialog } from './DeleteInvoicesFileDialog';

const DEFAULT_SORT = { field: 'due_date', order: 'desc' } as const;

/** A half-typed date is an invalid Dayjs; it must not reach the API. */
const toApiDate = (value: Dayjs | null): string | undefined =>
  value?.isValid() ? value.format(DATE_API_FORMAT) : undefined;

export const InvoicesListPage = () => {
  const notify = useNotify();
  const canUpdate = usePermission(permissions.invoicesUpdate);

  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [semester, setSemester] = useState('');
  const [dueFrom, setDueFrom] = useState<Dayjs | null>(null);
  const [dueTo, setDueTo] = useState<Dayjs | null>(null);
  const [target, setTarget] = useState<InvoiceRecord | null>(null);
  const [deleteFileOpen, setDeleteFileOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<InvoiceFilterOptions>({ semesters: [] });

  useEffect(() => {
    let cancelled = false;
    invoicesService
      .filterOptions()
      .then((options) => {
        if (!cancelled) setFilterOptions(options);
      })
      .catch(() => {
        if (!cancelled) setFilterOptions({ semesters: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dueFromParam = toApiDate(dueFrom);
  const dueToParam = toApiDate(dueTo);
  const filters = useMemo<InvoiceFilters>(
    () => ({
      status: status || undefined,
      semester: semester || undefined,
      due_from: dueFromParam,
      due_to: dueToParam,
    }),
    [status, semester, dueFromParam, dueToParam],
  );

  const grid = useServerGrid<InvoiceRecord, InvoiceFilters>({
    fetcher: invoicesService.list,
    defaultSort: DEFAULT_SORT,
    filters,
    onError: notify.error,
  });

  // The status the confirmed action sets: paid invoices go back to unpaid and vice versa.
  const nextStatus: InvoiceStatus = target?.status === 'paid' ? 'unpaid' : 'paid';
  const dialogText = nextStatus === 'unpaid' ? MARK_UNPAID_TEXT : MARK_PAID_TEXT;

  const handleConfirm = async () => {
    if (!target) return;
    try {
      await invoicesService.setStatus(target.id, nextStatus);
      notify.success('Status tagihan diperbarui.');
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal memperbarui status tagihan.'));
    } finally {
      setTarget(null);
      // Also after a failure: a 404 or a concurrent change means the row on screen is stale.
      await grid.reload();
    }
  };

  const columns = useMemo<GridColDef<InvoiceRecord>[]>(() => {
    const base: GridColDef<InvoiceRecord>[] = [
      { field: 'invoice_code', headerName: 'Kode tagihan', minWidth: 140, flex: 0.9 },
      {
        field: 'nim',
        headerName: 'NIM',
        minWidth: 95,
        flex: 0.5,
        sortable: false,
        valueGetter: (_value, row) => row.student.nim,
      },
      {
        field: 'student_name',
        headerName: 'Nama',
        minWidth: 150,
        flex: 1.1,
        sortable: false,
        valueGetter: (_value, row) => row.student.name,
      },
      { field: 'semester', headerName: 'Semester', minWidth: 80, flex: 0.4, sortable: false },
      {
        field: 'amount',
        headerName: 'Nominal',
        type: 'number',
        minWidth: 110,
        flex: 0.6,
        valueFormatter: (value) => formatRupiah(Number(value)),
      },
      {
        field: 'due_date',
        headerName: 'Jatuh tempo',
        minWidth: 110,
        flex: 0.6,
        valueFormatter: (value) => formatDisplayDate(value ? String(value) : null),
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 105,
        flex: 0.5,
        renderCell: ({ row }) => (
          <AppStatusChip
            status={INVOICE_STATUS_TONES[row.status]}
            label={INVOICE_STATUS_LABELS[row.status]}
          />
        ),
      },
      {
        field: 'paid_at',
        headerName: 'Dibayar pada',
        minWidth: 110,
        flex: 0.6,
        sortable: false,
        valueFormatter: (value) => formatDisplayDate(value ? String(value) : null),
      },
      {
        field: 'paid_via',
        headerName: 'Kanal bayar',
        minWidth: 95,
        flex: 0.5,
        sortable: false,
        valueFormatter: (value) =>
          value ? INVOICE_SOURCE_LABELS[value as keyof typeof INVOICE_SOURCE_LABELS] : '-',
      },
      {
        field: 'source',
        headerName: 'Sumber',
        minWidth: 85,
        flex: 0.4,
        sortable: false,
        valueFormatter: (value) =>
          INVOICE_SOURCE_LABELS[value as keyof typeof INVOICE_SOURCE_LABELS],
      },
    ];
    if (!canUpdate) return base;

    return [
      ...base,
      {
        field: '__actions__',
        headerName: 'Aksi',
        sortable: false,
        filterable: false,
        width: getActionColumnWidth(1),
        renderCell: ({ row }) => {
          const paid = row.status === 'paid';
          const label = paid ? MARK_UNPAID_TEXT.title : MARK_PAID_TEXT.title;
          return (
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', height: '100%' }}>
              <Tooltip title={label}>
                <IconButton
                  aria-label={`${label} ${row.invoice_code}`}
                  size="small"
                  sx={paid ? gridActionButtonSx.reject : gridActionButtonSx.approve}
                  onClick={() => setTarget(row)}
                >
                  {paid ? (
                    <UndoOutlinedIcon fontSize="small" />
                  ) : (
                    <CheckCircleOutlineOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
    ];
  }, [canUpdate]);

  return (
    <>
      <PageHeader
        title="Tagihan"
        description="Tagihan uang kuliah hasil impor. Status pembayaran mengikuti impor SIAKAD/SIPEMA; koreksi manual dicatat dalam jejak audit."
        breadcrumbs={[{ label: 'Dasbor', href: routes.dashboard }, { label: 'Tagihan' }]}
        actions={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => void grid.reload()}
              sx={{ borderColor: 'divider' }}
            >
              Muat ulang
            </Button>
            {canUpdate ? (
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineOutlinedIcon />}
                onClick={() => setDeleteFileOpen(true)}
              >
                Hapus via berkas
              </Button>
            ) : null}
          </Stack>
        }
      />

      <Card
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
          p: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <AppSearchField
            placeholder="Cari kode tagihan, NIM, atau nama"
            value={grid.search}
            onChange={grid.setSearch}
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as InvoiceStatus | '')}
            sx={{ width: 160 }}
          >
            <MenuItem value="">Semua</MenuItem>
            {INVOICE_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Semester"
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="">Semua</MenuItem>
            {filterOptions.semesters.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
          <AppDatePicker label="Jatuh tempo dari" value={dueFrom} onChange={setDueFrom} />
          <AppDatePicker label="Jatuh tempo sampai" value={dueTo} onChange={setDueTo} />
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
          <AppDataGrid
            columns={columns}
            fillWidth
            rowHeight={52}
            getRowId={(row: InvoiceRecord) => row.id}
            {...grid.gridProps}
          />
        </Box>
      </Card>

      <AppConfirmDialog
        open={Boolean(target)}
        title={dialogText.title}
        message={`${dialogText.title}: ${target?.invoice_code ?? ''} (${target?.student.name ?? ''}). ${dialogText.effect}`}
        confirmText={dialogText.confirm}
        confirmColor={nextStatus === 'paid' ? 'success' : 'primary'}
        onConfirm={handleConfirm}
        onClose={() => setTarget(null)}
      />

      <DeleteInvoicesFileDialog
        open={deleteFileOpen}
        onClose={() => setDeleteFileOpen(false)}
        onSuccess={() => void grid.reload()}
      />
    </>
  );
};
