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
import { useMemo, useState } from 'react';

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

import { BODY_EXCERPT_LENGTH } from '../constants';
import { templatesService } from '../services/templates.service';
import type { TemplatePayload, TemplateRecord } from '../types';
import { TemplateFormDialog } from './TemplateFormDialog';

const DEFAULT_SORT = { field: 'name', order: 'asc' } as const;

/** One line of the body: line breaks collapse to spaces and long text is cut with an ellipsis. */
const toExcerpt = (body: string): string => {
  const line = body.replace(/\s+/g, ' ').trim();
  return line.length > BODY_EXCERPT_LENGTH
    ? `${line.slice(0, BODY_EXCERPT_LENGTH).trimEnd()}…`
    : line;
};

export const TemplatesListPage = () => {
  const notify = useNotify();
  const canUpdate = usePermission(permissions.templatesUpdate);
  const canDelete = usePermission(permissions.templatesDelete);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateRecord | null>(null);

  const grid = useServerGrid<TemplateRecord>({
    fetcher: templatesService.list,
    defaultSort: DEFAULT_SORT,
    onError: notify.error,
  });

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: TemplatePayload) => {
    if (editing) {
      await templatesService.update(editing.id, payload);
      notify.success('Template berhasil diperbarui.');
    } else {
      await templatesService.create(payload);
      notify.success('Template berhasil ditambahkan.');
    }
    closeForm();
    await grid.reload();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await templatesService.remove(deleteTarget.id);
      notify.success('Template berhasil dihapus.');
      await grid.reload();
    } catch (error) {
      // 409: still used by a schedule rule; the server explains it.
      notify.error(getErrorMessage(error, 'Gagal menghapus template.'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = useMemo<GridColDef<TemplateRecord>[]>(() => {
    const base: GridColDef<TemplateRecord>[] = [
      { field: 'name', headerName: 'Nama', minWidth: 220, flex: 0.9 },
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
        field: 'body',
        headerName: 'Isi',
        minWidth: 280,
        flex: 1.6,
        sortable: false,
        renderCell: ({ row }) => (
          <Tooltip title={row.body}>
            <Typography noWrap sx={{ width: '100%' }} variant="body2">
              {toExcerpt(row.body)}
            </Typography>
          </Tooltip>
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
  }, [canUpdate, canDelete]);

  return (
    <>
      <PageHeader
        title="Template Pesan"
        description="Kelola isi pesan WhatsApp yang dipakai aturan jadwal pengiriman."
        breadcrumbs={[{ label: 'Dasbor', href: routes.dashboard }, { label: 'Template Pesan' }]}
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
            <Can permission={permissions.templatesCreate}>
              <Button
                startIcon={<AddOutlinedIcon />}
                variant="contained"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Tambah template
              </Button>
            </Can>
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
            value={grid.search}
            onChange={grid.setSearch}
            placeholder="Cari nama template"
          />
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
          <AppDataGrid
            columns={columns}
            fillWidth
            rowHeight={52}
            getRowId={(row: TemplateRecord) => row.id}
            {...grid.gridProps}
          />
        </Box>
      </Card>

      <TemplateFormDialog
        open={formOpen}
        template={editing}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus template"
        message={`Hapus template "${deleteTarget?.name ?? ''}"? Template yang masih dipakai aturan jadwal tidak dapat dihapus.`}
        confirmText="Hapus"
        confirmColor="error"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
