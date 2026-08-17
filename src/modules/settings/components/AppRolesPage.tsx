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
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppDialog, AppDialogTextField } from '@/components/base/AppDialog';
import { useDebounce } from '@/core/hooks/useDebounce';
import { PageTitle } from '@/core/layout/PageData';
import {
  createAppRole,
  deleteAppRole,
  listAppRoles,
  updateAppRole,
  type AppAllowedRole,
} from '@/core/iam/iam.service';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';

import { SettingsFormDialogActions } from './SettingsFormDialogActions';
import { refreshButtonSx } from './settingsToolbarStyles';

type FormState = {
  iam_role_id: string;
  display_name: string;
  auth_slug: string;
  role_type: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  iam_role_id: '',
  display_name: '',
  auth_slug: '',
  role_type: 'admin',
  sort_order: '0',
  is_active: true,
};

export const AppRolesPage = () => {
  const [rows, setRows] = useState<AppAllowedRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppAllowedRole | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppAllowedRole | null>(null);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const effectiveSearch = debouncedSearch.length >= 3 ? debouncedSearch.toLowerCase() : '';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAppRoles());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load app roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    if (!effectiveSearch) return rows;
    return rows.filter((row) => {
      const haystack = [
        String(row.iam_role_id),
        row.display_name,
        row.auth_slug ?? '',
        row.role_type,
        String(row.sort_order),
        row.is_active ? 'active' : 'inactive',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(effectiveSearch);
    });
  }, [rows, effectiveSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: AppAllowedRole) => {
    setEditing(row);
    setForm({
      iam_role_id: String(row.iam_role_id),
      display_name: row.display_name,
      auth_slug: row.auth_slug ?? '',
      role_type: row.role_type || 'admin',
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (saving) return;
    const iamRoleId = Number(form.iam_role_id);
    const sortOrder = Number(form.sort_order);
    if (!Number.isFinite(iamRoleId) || iamRoleId <= 0 || !form.display_name.trim()) return;

    const payload = {
      iam_role_id: iamRoleId,
      display_name: form.display_name.trim(),
      auth_slug: form.auth_slug.trim() || null,
      role_type: form.role_type.trim() || 'admin',
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      is_active: form.is_active,
    };

    try {
      setSaving(true);
      if (editing) {
        await updateAppRole(editing.id, payload);
      } else {
        await createAppRole(payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save app role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || saving) return;
    try {
      await deleteAppRole(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete app role');
    }
  };

  const columns: GridColDef<AppAllowedRole>[] = [
    {
      field: '__actions__',
      headerName: 'Action',
      width: 132,
      minWidth: 132,
      flex: 0,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'center', py: 0.25, width: '100%' }}
        >
          <Tooltip title="Edit">
            <IconButton size="small" sx={gridActionButtonSx.edit} onClick={() => openEdit(row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" sx={gridActionButtonSx.delete} onClick={() => setDeleteTarget(row)}>
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    { field: 'iam_role_id', headerName: 'IAM Role ID', flex: 0.25, minWidth: 110 },
    { field: 'display_name', headerName: 'Display Name', flex: 1, minWidth: 140 },
    { field: 'auth_slug', headerName: 'Auth Slug', flex: 0.8, minWidth: 140 },
    { field: 'role_type', headerName: 'Role Type', flex: 0.6, minWidth: 130 },
    { field: 'sort_order', headerName: 'Sort', flex: 0.2, minWidth: 80 },
    {
      field: 'is_active',
      headerName: 'Active',
      flex: 0.2,
      minWidth: 80,
      valueGetter: (_, row) => (row.is_active ? 'Yes' : 'No'),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <PageTitle
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard', isActive: false },
          { title: 'Role Access', path: '/settings/app-roles', isActive: true },
        ]}
      >
        Role Access
      </PageTitle>

      <Card sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
        <CardHeader
          disableTypography
          title={
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                gap: 1,
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={() => void load()} sx={refreshButtonSx}>
                  Refresh
                </Button>
                <TextField
                  label="Search"
                  size="small"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
                  }}
                  slotProps={{
                    input: {
                      endAdornment: search ? (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="Clear search"
                            edge="end"
                            onClick={() => {
                              setSearch('');
                              setPagination((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
                            }}
                            size="small"
                          >
                            <CloseOutlinedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                  helperText={search.trim().length > 0 && search.trim().length < 3 ? 'Min. 3 characters' : ' '}
                  sx={{
                    width: 320,
                    '& .MuiFormHelperText-root': {
                      lineHeight: 1,
                      mb: -1.5,
                      mt: 0.25,
                    },
                  }}
                />
              </Stack>
              <Button variant="contained" color="success" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
                Add Role
              </Button>
            </Box>
          }
          sx={{ p: '16px 16px 0px 16px', '& .MuiCardHeader-content': { overflow: 'visible' } }}
        />

        {error ? (
          <Typography color="error" sx={{ px: 2, pt: 1 }} variant="body2">
            {error}
          </Typography>
        ) : null}

        <CardContent
          sx={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            p: '20px 0px 0px 0px',
            '&:last-child': { pb: 0 },
          }}
        >
          <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, px: 2, pb: 2, width: '100%' }}>
            <AppDataGrid
              fillWidth
              rows={filteredRows}
              columns={columns}
              loading={loading}
              paginationModel={pagination}
              onPaginationModelChange={setPagination}
              rowHeight={44}
              sx={{ flex: 1, height: '100%', minHeight: 0 }}
            />
          </Box>
        </CardContent>
      </Card>

      <AppDialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        title={editing ? 'Edit Role Access' : 'Add Role Access'}
        actions={
          <SettingsFormDialogActions
            saving={saving}
            onCancel={() => setDialogOpen(false)}
            onSave={() => void handleSave()}
          />
        }
      >
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <AppDialogTextField
            label="IAM Role ID"
            type="number"
            value={form.iam_role_id}
            onChange={(e) => setForm((prev) => ({ ...prev, iam_role_id: e.target.value }))}
          />
          <AppDialogTextField
            label="Display Name"
            value={form.display_name}
            onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
          />
          <AppDialogTextField
            label="Auth Slug"
            value={form.auth_slug}
            onChange={(e) => setForm((prev) => ({ ...prev, auth_slug: e.target.value }))}
            helperText="Optional backend permission slug"
          />
          <AppDialogTextField
            label="Role Type"
            value={form.role_type}
            onChange={(e) => setForm((prev) => ({ ...prev, role_type: e.target.value }))}
            helperText="super_admin, admin, dealer, employee, workflow_approver"
          />
          <AppDialogTextField
            label="Sort Order"
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
            }
            label="Active"
          />
        </Stack>
      </AppDialog>

      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title="Confirm Delete"
        message={`Delete role mapping for IAM role ${deleteTarget?.iam_role_id ?? ''}?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
};
