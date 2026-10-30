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
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import type { GridColDef } from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
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

import { rolesService } from '../services/roles.service';
import type { Permission, Role, RoleUpsertPayload } from '../types';
import { RoleFormDialog } from './RoleFormDialog';

const DEFAULT_SORT = { field: 'name', order: 'asc' } as const;

export const RolesListPage = () => {
  const notify = useNotify();
  const canUpdate = usePermission(permissions.rolesUpdate);
  const canDelete = usePermission(permissions.rolesDelete);

  const [catalog, setCatalog] = useState<Permission[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const grid = useServerGrid<Role>({
    fetcher: rolesService.list,
    defaultSort: DEFAULT_SORT,
    onError: notify.error,
  });

  useEffect(() => {
    rolesService
      .permissions()
      .then(setCatalog)
      .catch((error) => notify.error(getErrorMessage(error, 'Failed to load permissions.')));
  }, [notify]);

  const handleSubmit = async (payload: RoleUpsertPayload) => {
    if (editing) {
      await rolesService.update(editing.id, payload);
      notify.success('Role updated.');
    } else {
      await rolesService.create(payload);
      notify.success('Role created.');
    }
    setFormOpen(false);
    setEditing(null);
    await grid.reload();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await rolesService.remove(deleteTarget.id);
      notify.success('Role deleted.');
      await grid.reload();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Delete failed.'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = useMemo<GridColDef<Role>[]>(() => {
    const base: GridColDef<Role>[] = [
      {
        field: 'name',
        headerName: 'Name',
        minWidth: 200,
        flex: 0.8,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <span>{row.name}</span>
            {row.is_system ? <Chip label="System" size="small" variant="outlined" /> : null}
          </Stack>
        ),
      },
      {
        field: 'description',
        headerName: 'Description',
        minWidth: 240,
        flex: 1.4,
        sortable: false,
      },
      {
        field: 'permissions',
        headerName: 'Permissions',
        minWidth: 130,
        flex: 0.5,
        sortable: false,
        valueGetter: (_, row) => row.permissions.length,
      },
      {
        field: 'updated_at',
        headerName: 'Updated',
        minWidth: 180,
        flex: 0.7,
        valueFormatter: (value) => formatDisplayDateTime(String(value ?? '')),
      },
    ];
    if (!canUpdate && !canDelete) return base;

    return [
      ...base,
      {
        field: '__actions__',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        width: getActionColumnWidth(Number(canUpdate) + Number(canDelete)),
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.75}>
            {canUpdate ? (
              <Tooltip title={row.name === 'admin' ? 'View' : 'Edit'}>
                <IconButton
                  aria-label={`Edit ${row.name}`}
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
              <Tooltip title={row.is_system ? 'System roles cannot be deleted' : 'Delete'}>
                <span>
                  <IconButton
                    aria-label={`Delete ${row.name}`}
                    disabled={row.is_system}
                    size="small"
                    sx={gridActionButtonSx.delete}
                    onClick={() => setDeleteTarget(row)}
                  >
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
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
        title="Roles"
        description="Roles group permissions. Assign them to users to control what they can do."
        breadcrumbs={[{ label: 'Dashboard', href: routes.dashboard }, { label: 'Roles' }]}
        actions={
          <Can permission={permissions.rolesCreate}>
            <Button
              startIcon={<AddOutlinedIcon />}
              variant="contained"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New role
            </Button>
          </Can>
        }
      />

      <Card sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, p: 2 }}>
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <TextField
            placeholder="Search roles"
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
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => void grid.reload()}
            sx={{ borderColor: 'divider', ml: { md: 'auto' } }}
          >
            Refresh
          </Button>
        </Box>
        <Box sx={{ flex: 1, minHeight: 360 }}>
          <AppDataGrid
            columns={columns}
            fillWidth
            rowHeight={48}
            getRowId={(row: Role) => row.id}
            {...grid.gridProps}
          />
        </Box>
      </Card>

      <RoleFormDialog
        open={formOpen}
        role={editing}
        permissions={catalog}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete role"
        message={`Delete the role "${deleteTarget?.name ?? ''}"? Roles assigned to users cannot be deleted.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
