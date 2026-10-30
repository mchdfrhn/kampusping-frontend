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
import { AppStatusChip } from '@/components/base/AppStatusChip';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { Can } from '@/components/layout/RequirePermission';
import { useAuthStore } from '@/core/auth/auth.store';
import { permissions } from '@/core/auth/permissions';
import { usePermission } from '@/core/auth/useAuth';
import { routes } from '@/core/config/route.config';
import { useServerGrid } from '@/core/hooks/useServerGrid';
import { getErrorMessage } from '@/core/http/api-error';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { getActionColumnWidth } from '@/core/utils/grid-action-column.util';
import { rolesService } from '@/modules/roles/services/roles.service';
import type { Role } from '@/modules/roles/types';

import { usersService } from '../services/users.service';
import type { UserCreatePayload, UserRecord, UserUpdatePayload } from '../types';
import { UserFormDialog } from './UserFormDialog';

const DEFAULT_SORT = { field: 'created_at', order: 'desc' } as const;

export const UsersListPage = () => {
  const notify = useNotify();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const canUpdate = usePermission(permissions.usersUpdate);
  const canDelete = usePermission(permissions.usersDelete);
  const canReadRoles = usePermission(permissions.rolesRead);

  const [roles, setRoles] = useState<Role[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  const grid = useServerGrid<UserRecord>({
    fetcher: usersService.list,
    defaultSort: DEFAULT_SORT,
    onError: notify.error,
  });

  // Listing roles needs `roles:read`; without it the role picker is simply empty.
  useEffect(() => {
    if (!canReadRoles) return;
    rolesService
      .list({ page_size: 100, sort_by: 'name', sort_order: 'asc' })
      .then((page) => setRoles(page.items))
      .catch((error) => notify.error(getErrorMessage(error, 'Failed to load roles.')));
  }, [canReadRoles, notify]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleCreate = async (payload: UserCreatePayload) => {
    await usersService.create(payload);
    notify.success('User created.');
    closeForm();
    await grid.reload();
  };

  const handleUpdate = async (id: number, payload: UserUpdatePayload) => {
    await usersService.update(id, payload);
    notify.success('User updated.');
    closeForm();
    await grid.reload();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersService.remove(deleteTarget.id);
      notify.success('User deleted.');
      await grid.reload();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Delete failed.'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = useMemo<GridColDef<UserRecord>[]>(() => {
    const base: GridColDef<UserRecord>[] = [
      { field: 'full_name', headerName: 'Name', minWidth: 180, flex: 0.9 },
      { field: 'email', headerName: 'Email', minWidth: 220, flex: 1.2 },
      {
        field: 'roles',
        headerName: 'Roles',
        minWidth: 200,
        flex: 1,
        sortable: false,
        renderCell: ({ row }) =>
          row.roles.length === 0 ? (
            '-'
          ) : (
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {row.roles.map((role) => (
                <Chip key={role.id} label={role.name} size="small" variant="outlined" />
              ))}
            </Stack>
          ),
      },
      {
        field: 'is_active',
        headerName: 'Status',
        minWidth: 110,
        flex: 0.4,
        sortable: false,
        renderCell: ({ row }) => (
          <AppStatusChip
            status={row.is_active ? 'success' : 'default'}
            label={row.is_active ? 'Active' : 'Inactive'}
          />
        ),
      },
      {
        field: 'last_login_at',
        headerName: 'Last sign-in',
        minWidth: 170,
        flex: 0.7,
        valueFormatter: (value) => formatDisplayDateTime(value ? String(value) : null, 'Never'),
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
              <Tooltip title="Edit">
                <IconButton
                  aria-label={`Edit ${row.email}`}
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
              <Tooltip title={row.id === currentUserId ? 'You cannot delete yourself' : 'Delete'}>
                <span>
                  <IconButton
                    aria-label={`Delete ${row.email}`}
                    disabled={row.id === currentUserId}
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
  }, [canUpdate, canDelete, currentUserId]);

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage who can sign in and what they are allowed to do."
        breadcrumbs={[{ label: 'Dashboard', href: routes.dashboard }, { label: 'Users' }]}
        actions={
          <Can permission={permissions.usersCreate}>
            <Button
              startIcon={<AddOutlinedIcon />}
              variant="contained"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New user
            </Button>
          </Can>
        }
      />

      <Card sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, p: 2 }}>
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <TextField
            placeholder="Search name or email"
            aria-label="Search"
            value={grid.search}
            onChange={(event) => grid.setSearch(event.target.value)}
            sx={{ minWidth: 320 }}
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
            rowHeight={52}
            getRowId={(row: UserRecord) => row.id}
            {...grid.gridProps}
          />
        </Box>
      </Card>

      <UserFormDialog
        open={formOpen}
        user={editing}
        roles={roles}
        isSelf={editing?.id === currentUserId}
        onClose={closeForm}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        message={`Delete ${deleteTarget?.email ?? ''}? They will be signed out and lose access immediately.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};
