'use client';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import type { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppDatePicker } from '@/components/base/AppDatePicker';
import { AppSnackbar } from '@/components/base/AppSnackbar';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { ExportDataButton, type ExportFormat } from '@/components/base/ExportDataButton';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '@/core/constants/app.constant';
import { useDebounce } from '@/core/hooks/useDebounce';
import { PageTitle } from '@/core/layout/PageData';
import { DATE_API_FORMAT, formatDisplayDateTime } from '@/core/utils/date.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';

import { exampleService } from '../services/example.service';
import type { ExampleItem, ExampleUpsertPayload } from '../types';
import { ExampleFormDialog } from './ExampleFormDialog';

const refreshButtonSx = {
  borderColor: 'rgba(25, 118, 210, 0.5)',
  color: '#1976d2',
  '&:hover': {
    bgcolor: 'rgba(25, 118, 210, 0.04)',
    borderColor: '#1976d2',
  },
};

const DEFAULT_SORT_BY = 'updated_at';
const DEFAULT_SORT_ORDER = 'desc' as const;

const statusColor = (status: ExampleItem['status']) => {
  if (status === 'active') return 'success';
  if (status === 'draft') return 'warning';
  return 'default';
};

export const ExampleListPage = () => {
  const [rows, setRows] = useState<ExampleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(DEFAULT_SORT_ORDER);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExampleItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExampleItem | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const effectiveSearch = debouncedSearch.length >= SEARCH_MIN_CHARS ? debouncedSearch : '';

  const sortModel = useMemo<GridSortModel>(
    () => [{ field: sortBy, sort: sortOrder }],
    [sortBy, sortOrder],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await exampleService.list({
        page: pagination.page + 1,
        page_size: pagination.pageSize,
        search: effectiveSearch || undefined,
        date_from: dateFrom?.format(DATE_API_FORMAT),
        date_to: dateTo?.format(DATE_API_FORMAT),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setRows(data.items);
      setTotal(data.total);
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to load data.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination, effectiveSearch, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSortModelChange = (model: GridSortModel) => {
    if (!model.length) {
      setSortBy(DEFAULT_SORT_BY);
      setSortOrder(DEFAULT_SORT_ORDER);
    } else {
      setSortBy(model[0].field);
      setSortOrder((model[0].sort ?? DEFAULT_SORT_ORDER) as 'asc' | 'desc');
    }
    setPagination((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      await exampleService.export(format, {
        search: effectiveSearch || undefined,
        date_from: dateFrom?.format(DATE_API_FORMAT),
        date_to: dateTo?.format(DATE_API_FORMAT),
      });
      setToast({
        open: true,
        message: format === 'excel' ? 'Excel export downloaded.' : 'PDF export downloaded.',
        severity: 'success',
      });
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Export failed.',
        severity: 'error',
      });
      throw error;
    }
  };

  const handleSubmit = async (payload: ExampleUpsertPayload) => {
    setSaving(true);
    try {
      if (editing) {
        await exampleService.update(editing.id, payload);
        setToast({ open: true, message: 'Item updated.', severity: 'success' });
      } else {
        await exampleService.create(payload);
        setToast({ open: true, message: 'Item created.', severity: 'success' });
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Save failed.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await exampleService.remove(deleteTarget.id);
    setDeleteTarget(null);
    setToast({ open: true, message: 'Item deleted.', severity: 'success' });
    await load();
  };

  const columns = useMemo<GridColDef<ExampleItem>[]>(
    () => [
      { field: 'code', headerName: 'Code', minWidth: 140, flex: 0.6 },
      { field: 'name', headerName: 'Name', minWidth: 220, flex: 1.2 },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        flex: 0.5,
        renderCell: ({ row }) => (
          <AppStatusChip status={statusColor(row.status)} label={row.status} />
        ),
      },
      {
        field: 'updated_at',
        headerName: 'Updated',
        minWidth: 180,
        flex: 0.8,
        valueFormatter: (value) => formatDisplayDateTime(String(value ?? '')),
      },
      {
        field: '__actions__',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        width: getActionColumnWidth(2),
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                sx={gridActionButtonSx.edit}
                onClick={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                sx={gridActionButtonSx.delete}
                onClick={() => setDeleteTarget(row)}
              >
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageTitle
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard', isActive: false },
          { title: 'Example Master', path: '/example', isActive: true },
        ]}
      >
        Example Master
      </PageTitle>
      <Card sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
        <CardHeader
          title="Example Master"
          subheader="Template list page: search (min 3 karakter), date filter, server pagination, export, create/edit/delete."
          action={
            <Button
              color="secondary"
              startIcon={<AddOutlinedIcon />}
              variant="contained"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Create
            </Button>
          }
        />
        <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, pt: 0 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search code or name (min 3 characters)"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPagination((prev) => ({ ...prev, page: 0 }));
              }}
              sx={{ minWidth: 280 }}
              slotProps={{
                input: {
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <CloseOutlinedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
            <AppDatePicker
              label="Date from"
              value={dateFrom}
              onChange={(value) => {
                setDateFrom(value);
                setPagination((prev) => ({ ...prev, page: 0 }));
              }}
            />
            <AppDatePicker
              label="Date to"
              value={dateTo}
              onChange={(value) => {
                setDateTo(value);
                setPagination((prev) => ({ ...prev, page: 0 }));
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, ml: { md: 'auto' } }}>
              <Button
                variant="outlined"
                startIcon={<RefreshOutlinedIcon />}
                onClick={() => void load()}
                sx={refreshButtonSx}
              >
                Refresh
              </Button>
              <ExportDataButton onExport={handleExport} />
            </Box>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 360 }}>
            <AppDataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              fillWidth
              rowHeight={44}
              paginationMode="server"
              sortingMode="server"
              rowCount={total}
              paginationModel={pagination}
              onPaginationModelChange={setPagination}
              sortModel={sortModel}
              onSortModelChange={handleSortModelChange}
            />
          </Box>
        </CardContent>
      </Card>

      <ExampleFormDialog
        open={formOpen}
        item={editing}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
        onSubmit={handleSubmit}
      />

      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete item"
        message={`Delete ${deleteTarget?.code ?? ''}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <AppSnackbar
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
};
