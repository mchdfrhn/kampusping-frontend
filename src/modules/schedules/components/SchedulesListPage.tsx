'use client';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { GridColDef } from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppSearchField } from '@/components/base/AppSearchField';
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { Can } from '@/components/layout/RequirePermission';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';
import { templatesService } from '@/modules/templates/services/templates.service';
import type { TemplateRecord } from '@/modules/templates/types';

import { describeOffset, formatOffsetLabel } from '../offset';
import { schedulesService } from '../services/schedules.service';
import type { ScheduleRulePayload, ScheduleRuleRecord } from '../types';
import { ScheduleFormDialog } from './ScheduleFormDialog';

const DEFAULT_SORT = { field: 'offset_days', order: 'asc' } as const;

export const SchedulesListPage = () => {
  const notify = useNotify();
  const canUpdate = usePermission(permissions.schedulesUpdate);
  const canDelete = usePermission(permissions.schedulesDelete);
  const canReadTemplates = usePermission(permissions.templatesRead);

  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleRuleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleRuleRecord | null>(null);

  const grid = useServerGrid<ScheduleRuleRecord>({
    fetcher: schedulesService.list,
    defaultSort: DEFAULT_SORT,
    onError: notify.error,
  });

  // The rule only embeds the template's id and name, so the template list tells which ones are
  // inactive (the worker skips those) and feeds the form's select. It needs `templates:read`.
  useEffect(() => {
    if (!canReadTemplates) return;
    templatesService
      .list({ page_size: 100, sort_by: 'name', sort_order: 'asc' })
      .then((page) => setTemplates(page.items))
      .catch((error) => notify.error(getErrorMessage(error, 'Gagal memuat template.')));
  }, [canReadTemplates, notify]);

  const inactiveTemplateIds = useMemo(
    () => new Set(templates.filter((template) => !template.is_active).map((item) => item.id)),
    [templates],
  );

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: ScheduleRulePayload) => {
    if (editing) {
      await schedulesService.update(editing.id, payload);
      notify.success('Aturan jadwal berhasil diperbarui.');
    } else {
      await schedulesService.create(payload);
      notify.success('Aturan jadwal berhasil ditambahkan.');
    }
    closeForm();
    await grid.reload();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await schedulesService.remove(deleteTarget.id);
      notify.success('Aturan jadwal berhasil dihapus.');
      await grid.reload();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Gagal menghapus aturan jadwal.'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = useMemo<GridColDef<ScheduleRuleRecord>[]>(() => {
    const base: GridColDef<ScheduleRuleRecord>[] = [
      { field: 'name', headerName: 'Nama', minWidth: 180, flex: 0.9 },
      {
        field: 'offset_days',
        headerName: 'Waktu kirim',
        minWidth: 130,
        flex: 0.4,
        renderCell: ({ row }) => (
          <Tooltip title={describeOffset(row.offset_days)}>
            <Typography component="span" sx={{ fontWeight: 600 }} variant="body2">
              {formatOffsetLabel(row.offset_days)}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: 'template',
        headerName: 'Template',
        minWidth: 280,
        flex: 1.3,
        sortable: false,
        valueGetter: (_value, row) => row.template.name,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Typography noWrap variant="body2">
              {row.template.name}
            </Typography>
            {inactiveTemplateIds.has(row.template.id) ? (
              <Tooltip title="Template ini nonaktif, jadi pesan untuk aturan ini tidak dikirim.">
                <span>
                  <AppStatusChip status="warning" label="Template nonaktif" />
                </span>
              </Tooltip>
            ) : null}
          </Stack>
        ),
      },
      {
        field: 'is_active',
        headerName: 'Status',
        minWidth: 110,
        flex: 0.35,
        renderCell: ({ row }) => (
          <AppStatusChip
            status={row.is_active ? 'success' : 'default'}
            label={row.is_active ? 'Aktif' : 'Nonaktif'}
          />
        ),
      },
      {
        field: 'updated_at',
        headerName: 'Diperbarui',
        minWidth: 170,
        flex: 0.6,
        valueFormatter: (value) => formatDisplayDateTime(value ? String(value) : null),
      },
    ];
    if (!canUpdate && !canDelete) return base;

    return [
      ...base,
      {
        field: '__actions__',
        headerName: 'Aksi',
        sortable: false,
        filterable: false,
        width: getActionColumnWidth(Number(canUpdate) + Number(canDelete)),
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', height: '100%' }}>
            {canUpdate ? (
              <Tooltip title="Ubah">
                <IconButton
                  aria-label={`Ubah ${row.name}`}
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
              <Tooltip title="Hapus">
                <IconButton
                  aria-label={`Hapus ${row.name}`}
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
  }, [canUpdate, canDelete, inactiveTemplateIds]);

  return (
    <>
      <PageHeader
        title="Jadwal Pengiriman"
        description="Atur kapan pengingat dikirim terhadap tanggal jatuh tempo, dan template mana yang dipakai."
        breadcrumbs={[{ label: 'Dasbor', href: routes.dashboard }, { label: 'Jadwal Pengiriman' }]}
        actions={
          <Can permission={permissions.schedulesCreate}>
            <Button
              startIcon={<AddOutlinedIcon />}
              variant="contained"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Tambah aturan
            </Button>
          </Can>
        }
      />

      <Card sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, p: 2 }}>
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <AppSearchField
            value={grid.search}
            onChange={grid.setSearch}
            placeholder="Cari nama aturan"
          />
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => void grid.reload()}
            sx={{ borderColor: 'divider', ml: { md: 'auto' } }}
          >
            Muat ulang
          </Button>
        </Box>
        <Box sx={{ flex: 1, minHeight: 360 }}>
          <AppDataGrid
            columns={columns}
            fillWidth
            rowHeight={52}
            getRowId={(row: ScheduleRuleRecord) => row.id}
            {...grid.gridProps}
          />
        </Box>
      </Card>

      <ScheduleFormDialog
        open={formOpen}
        rule={editing}
        templates={templates}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus aturan jadwal"
        message={`Hapus aturan "${deleteTarget?.name ?? ''}"? Pengingat pada waktu ini tidak akan dikirim lagi.`}
        confirmText="Hapus"
        confirmColor="error"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
