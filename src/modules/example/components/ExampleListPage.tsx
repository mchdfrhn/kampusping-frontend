'use client';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import type { GridColDef } from '@mui/x-data-grid';
import type { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppDatePicker } from '@/components/base/AppDatePicker';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { ExportDataButton } from '@/components/base/ExportDataButton';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { Can } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { DATE_API_FORMAT, formatDisplayDateTime } from '@/core/utils/date.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';

import { exampleService } from '../services/example.service';
import {
  EXAMPLE_STATUSES,
  type ExampleFilters,
  type ExampleItem,
  type ExampleItemStatus,
  type ExampleUpsertPayload,
} from '../types';
import { ExampleFormDialog } from './ExampleFormDialog';

const DEFAULT_SORT = { field: 'updated_at', order: 'desc' } as const;

const statusTone = (status: ExampleItemStatus) =>
  status === 'active' ? 'success' : status === 'draft' ? 'warning' : 'default';

export const ExampleListPage = () => {
  const notify = useNotify();
  const canUpdate = usePermission(permissions.examplesUpdate);
  const canDelete = usePermission(permissions.examplesDelete);

  const [status, setStatus] = useState<ExampleItemStatus | ''>('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExampleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExampleItem | null>(null);

  const filters = useMemo<ExampleFilters>(
    () => ({
      status: status || undefined,
      date_from: dateFrom?.isValid() ? dateFrom.format(DATE_API_FORMAT) : undefined,
      date_to: dateTo?.isValid() ? dateTo.format(DATE_API_FORMAT) : undefined,
    }),
    [status, dateFrom, dateTo],
  );

  const grid = useServerGrid<ExampleItem, ExampleFilters>({
    fetcher: exampleService.list,
    defaultSort: DEFAULT_SORT,
    filters,
    onError: notify.error,
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (payload: ExampleUpsertPayload) => {
    if (editing) {
      await exampleService.update(editing.id, payload);
      notify.success('Item updated.');
    } else {
      await exampleService.create(payload);
      notify.success('Item created.');
    }
    setFormOpen(false);
    setEditing(null);
    await grid.reload();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await exampleService.remove(deleteTarget.id);
      notify.success('Item deleted.');
      setDeleteTarget(null);
      await grid.reload();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Delete failed.'));
      setDeleteTarget(null);
    }
  };

  const handleExport = async () => {
    try {
      await exampleService.exportCsv({
        search: grid.effectiveSearch || undefined,
        ...filters,
      });
      notify.success('Export downloaded.');
    } catch (error) {
      notify.error(getErrorMessage(error, 'Export failed.'));
    }
  };

  const columns = useMemo<GridColDef<ExampleItem>[]>(() => {
    const base: GridColDef<ExampleItem>[] = [
      { field: 'code', headerName: 'Code', minWidth: 140, flex: 0.6 },
      { field: 'name', headerName: 'Name', minWidth: 220, flex: 1.2 },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        flex: 0.5,
        renderCell: ({ row }) => (
          <AppStatusChip status={statusTone(row.status)} label={row.status} />
        ),
      },
      {
        field: 'updated_at',
        headerName: 'Updated',
        minWidth: 180,
        flex: 0.8,
        valueFormatter: (value) => formatDisplayDateTime(String(value ?? '')),
      },
    ];
    if (!canUpdate && !canDelete) return base;

    const buttons = Number(canUpdate) + Number(canDelete);
    return [
      ...base,
      {
        field: '__actions__',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        width: getActionColumnWidth(buttons),
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75}>
            {canUpdate ? (
              <Tooltip title="Edit">
                <IconButton
                  aria-label={`Edit ${row.code}`}
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
            ) : null}
            {canDelete ? (
              <Tooltip title="Delete">
                <IconButton
                  aria-label={`Delete ${row.code}`}
                  size="small"
                  sx={gridActionButtonSx.delete}
                  onClick={() => setDeleteTarget(row)}
                >
                  <DeleteOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
    ];
  }, [canUpdate, canDelete]);

  return (
    <>
      <PageHeader
        title="Example items"
        description="Reference list page: server pagination, search, filters, CSV export, create, edit and delete."
        breadcrumbs={[{ label: 'Dashboard', href: routes.dashboard }, { label: 'Example items' }]}
        actions={
          <Can permission={permissions.examplesCreate}>
            <Button startIcon={<AddOutlinedIcon />} variant="contained" onClick={openCreate}>
              New item
            </Button>
          </Can>
        }
      />

      <Card sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, p: 2 }}>
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <TextField
            placeholder="Search code or name"
            aria-label="Search"
            value={grid.search}
            onChange={(event) => grid.setSearch(event.target.value)}
            sx={{ minWidth: 300 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: grid.search ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Clear search"
                      size="small"
                      onClick={() => grid.setSearch('')}
                    >
                      <CloseOutlinedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ExampleItemStatus | '')}
            sx={{ minWidth: 150 }}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          >
            <MenuItem value="">All</MenuItem>
            {EXAMPLE_STATUSES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <AppDatePicker label="Updated from" value={dateFrom} onChange={setDateFrom} />
          <AppDatePicker label="Updated to" value={dateTo} onChange={setDateTo} />
          <Box sx={{ display: 'flex', gap: 1, ml: { md: 'auto' } }}>
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => void grid.reload()}
              sx={{ borderColor: 'divider' }}
            >
              Refresh
            </Button>
            <ExportDataButton onExport={handleExport} />
          </Box>
        </Box>

        <Box sx={{ flex: 1, minHeight: 420 }}>
          <AppDataGrid
            columns={columns}
            fillWidth
            rowHeight={48}
            getRowId={(row: ExampleItem) => row.id}
            {...grid.gridProps}
          />
        </Box>
      </Card>

      <ExampleFormDialog
        open={formOpen}
        item={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete item"
        message={`Delete ${deleteTarget?.code ?? ''}? It will be removed from all lists.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
