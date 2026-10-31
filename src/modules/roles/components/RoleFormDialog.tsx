'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { AppDialog } from '@/components/base/AppDialog';
import {
  AppDialogCancelButton,
  AppDialogConfirmButton,
} from '@/components/base/AppDialog/AppDialogActions';
import { FormProvider } from '@/components/form/FormProvider';
import { RHFTextField } from '@/components/form/RHFTextField';
import { handleFormApiError } from '@/core/http/form-errors';

import type { Permission, Role, RoleUpsertPayload } from '../types';

const schema = z.object({
  name: z.string().trim().min(2, 'Minimal 2 karakter').max(50, 'Maksimal 50 karakter'),
  description: z.string().trim().max(255, 'Maksimal 255 karakter'),
  permissions: z.array(z.string()),
});

/** Display names for permission groups (the part of the code before the colon). */
const RESOURCE_LABELS: Record<string, string> = {
  users: 'Pengguna',
  roles: 'Peran',
  dashboard: 'Dasbor',
  imports: 'Impor tagihan',
  students: 'Mahasiswa',
  invoices: 'Tagihan',
  templates: 'Templat pesan',
  schedules: 'Jadwal pengingat',
  messages: 'Riwayat pesan',
  settings: 'Pengaturan',
  audit: 'Jejak audit',
};

const FIELDS = ['name', 'description', 'permissions'] as const;
const emptyForm: RoleUpsertPayload = { name: '', description: '', permissions: [] };

/** Group "users:read" style codes by resource so the checklist stays scannable. */
const groupByResource = (permissions: Permission[]) => {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const resource = permission.code.split(':')[0] ?? permission.code;
    groups.set(resource, [...(groups.get(resource) ?? []), permission]);
  }
  return [...groups.entries()];
};

type Props = {
  open: boolean;
  role?: Role | null;
  permissions: Permission[];
  onClose: () => void;
  onSubmit: (payload: RoleUpsertPayload) => Promise<void>;
};

export const RoleFormDialog = ({ open, role, permissions, onClose, onSubmit }: Props) => {
  const methods = useForm<RoleUpsertPayload>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm,
  });
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = methods;

  // The built-in admin role always holds every permission, so its checklist is read-only.
  const locked = Boolean(role?.is_system && role.name === 'admin');
  const groups = useMemo(() => groupByResource(permissions), [permissions]);

  useEffect(() => {
    if (open) {
      reset(
        role
          ? { name: role.name, description: role.description, permissions: role.permissions }
          : emptyForm,
      );
    }
  }, [open, role, reset]);

  const submit = handleSubmit(async (values) => {
    clearErrors('root.server');
    try {
      await onSubmit(values);
    } catch (error) {
      handleFormApiError(error, setError, FIELDS, { conflictField: 'name' });
    }
  });

  return (
    <AppDialog
      open={open}
      maxWidth="md"
      onClose={isSubmitting ? undefined : onClose}
      title={role ? `Ubah peran: ${role.name}` : 'Tambah peran'}
      actions={
        <>
          <AppDialogCancelButton
            disabled={isSubmitting}
            label="Batal"
            onClick={onClose}
            variant="outlined"
          />
          <AppDialogConfirmButton
            disabled={locked}
            label={role ? 'Simpan perubahan' : 'Tambah'}
            loading={isSubmitting}
            onClick={() => void submit()}
            showCheckIcon
          />
        </>
      }
    >
      <FormProvider methods={methods} onSubmit={submit}>
        <Stack spacing={2.5}>
          {errors.root?.server ? (
            <Alert severity="error">{errors.root.server.message}</Alert>
          ) : null}
          {locked ? (
            <Alert severity="info">
              Peran admin selalu memiliki seluruh izin dan tidak dapat diubah.
            </Alert>
          ) : null}
          <RHFTextField<RoleUpsertPayload>
            name="name"
            label="Nama"
            required
            disabled={Boolean(role?.is_system)}
          />
          <RHFTextField<RoleUpsertPayload> name="description" label="Deskripsi" />

          <Controller
            control={control}
            name="permissions"
            render={({ field }) => (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }} variant="subtitle2">
                  Izin
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  }}
                >
                  {groups.map(([resource, items]) => (
                    <Box
                      key={resource}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}
                    >
                      <Typography
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                        variant="caption"
                      >
                        {RESOURCE_LABELS[resource] ?? resource}
                      </Typography>
                      <Stack>
                        {items.map((permission) => (
                          <FormControlLabel
                            key={permission.code}
                            label={permission.description || permission.code}
                            control={
                              <Checkbox
                                size="small"
                                disabled={locked}
                                checked={locked || field.value.includes(permission.code)}
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.checked
                                      ? [...field.value, permission.code]
                                      : field.value.filter((code) => code !== permission.code),
                                  )
                                }
                              />
                            }
                          />
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          />
        </Stack>
      </FormProvider>
    </AppDialog>
  );
};
