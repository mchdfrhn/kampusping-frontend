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
import Typography from '@mui/material/Typography';
import type { GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppDataGrid } from '@/components/base/AppDataGrid';
import { AppDialog, AppDialogTextField } from '@/components/base/AppDialog';
import { useDebounce } from '@/core/hooks/useDebounce';
import { PageTitle } from '@/core/layout/PageData';
import {
  createMenuMapping,
  deleteMenuMapping,
  listMenuMappings,
  updateMenuMapping,
  type MenuMappingRow,
} from '@/core/iam/iam.service';
import { gridActionButtonSx } from '@/components/base/styles/gridActionButtonStyles';

import { SettingsFormDialogActions } from './SettingsFormDialogActions';
import { refreshButtonSx } from './settingsToolbarStyles';

type FormState = {
  menu_id: string;
  slug: string;
};

const emptyForm: FormState = { menu_id: '', slug: '' };

export const MenuMappingPage = () => {
  const [rows, setRows] = useState<MenuMappingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuMappingRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuMappingRow | null>(null);
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const effectiveSearch = debouncedSearch.length >= 3 ? debouncedSearch.toLowerCase() : '';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listMenuMappings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu mappings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    if (!effectiveSearch) return rows;
    return rows.filter(
      (row) =>
        String(row.menu_id).includes(effectiveSearch) ||
        row.slug.toLowerCase().includes(effectiveSearch),
    );
  }, [rows, effectiveSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: MenuMappingRow) => {
    setEditing(row);
    setForm({ menu_id: String(row.menu_id), slug: row.slug });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (saving) return;
    const menuId = Number(form.menu_id);
    if (!Number.isFinite(menuId) || menuId <= 0 || !form.slug.trim()) return;

    try {
      setSaving(true);
      if (editing) {
        await updateMenuMapping(editing.id, { menu_id: menuId, slug: form.slug.trim() });
      } else {
        await createMenuMapping({ menu_id: menuId, slug: form.slug.trim() });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu mapping');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || saving) return;
    try {
      await deleteMenuMapping(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu mapping');
    }
  };

  const columns: GridColDef<MenuMappingRow>[] = [
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
    { field: 'menu_id', headerName: 'Menu ID', flex: 0.35, minWidth: 110 },
    { field: 'slug', headerName: 'Slug', flex: 1, minWidth: 120 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <PageTitle
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard', isActive: false },
          { title: 'Menu Mapping', path: '/settings/menu-mapping', isActive: true },
        ]}
      >
        Menu Mapping
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
                Add Mapping
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
        title={editing ? 'Edit Menu Mapping' : 'Add Menu Mapping'}
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
            label="Menu ID"
            type="number"
            value={form.menu_id}
            onChange={(e) => setForm((prev) => ({ ...prev, menu_id: e.target.value }))}
          />
          <AppDialogTextField
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          />
        </Stack>
      </AppDialog>

      <AppConfirmDialog
        open={Boolean(deleteTarget)}
        title="Confirm Delete"
        message={`Delete mapping for menu_id ${deleteTarget?.menu_id ?? ''}?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
};
