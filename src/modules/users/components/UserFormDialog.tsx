'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
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
import { optionalPasswordSchema, passwordSchema } from '@/core/validation/password';
import type { Role } from '@/modules/roles/types';

import type { UserCreatePayload, UserRecord, UserUpdatePayload } from '../types';

type FormValues = {
  email: string;
  full_name: string;
  password: string;
  is_active: boolean;
  role_ids: number[];
};

const FIELDS = ['email', 'full_name', 'password', 'is_active', 'role_ids'] as const;

const baseShape = {
  full_name: z.string().trim().min(1, 'Nama wajib diisi').max(150, 'Maksimal 150 karakter'),
  is_active: z.boolean(),
  role_ids: z.array(z.number()),
};
const createSchema = z.object({
  ...baseShape,
  email: z.email('Format email tidak valid'),
  password: passwordSchema,
});
const editSchema = z.object({
  ...baseShape,
  email: z.string(),
  password: optionalPasswordSchema,
});

const emptyForm: FormValues = {
  email: '',
  full_name: '',
  password: '',
  is_active: true,
  role_ids: [],
};

type Props = {
  open: boolean;
  user?: UserRecord | null;
  roles: Role[];
  /** The signed-in user cannot deactivate themselves. */
  isSelf?: boolean;
  onClose: () => void;
  onCreate: (payload: UserCreatePayload) => Promise<void>;
  onUpdate: (id: number, payload: UserUpdatePayload) => Promise<void>;
};

export const UserFormDialog = ({
  open,
  user,
  roles,
  isSelf,
  onClose,
  onCreate,
  onUpdate,
}: Props) => {
  const editing = Boolean(user);
  const methods = useForm<FormValues>({
    resolver: zodResolver(editing ? editSchema : createSchema),
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

  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? {
            email: user.email,
            full_name: user.full_name,
            password: '',
            is_active: user.is_active,
            role_ids: user.roles.map((role) => role.id),
          }
        : emptyForm,
    );
  }, [open, user, reset]);

  const submit = handleSubmit(async (values) => {
    clearErrors('root.server');
    try {
      if (user) {
        await onUpdate(user.id, {
          full_name: values.full_name,
          is_active: values.is_active,
          role_ids: values.role_ids,
          ...(values.password ? { password: values.password } : {}),
        });
      } else {
        await onCreate({
          email: values.email,
          full_name: values.full_name,
          password: values.password,
          is_active: values.is_active,
          role_ids: values.role_ids,
        });
      }
    } catch (error) {
      handleFormApiError(error, setError, FIELDS, { conflictField: 'email' });
    }
  });

  return (
    <AppDialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      title={user ? 'Ubah pengguna' : 'Tambah pengguna'}
      actions={
        <>
          <AppDialogCancelButton
            disabled={isSubmitting}
            label="Batal"
            onClick={onClose}
            variant="outlined"
          />
          <AppDialogConfirmButton
            label={user ? 'Simpan perubahan' : 'Tambah'}
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
          <RHFTextField<FormValues>
            name="email"
            label="Email"
            type="email"
            required
            disabled={editing}
            autoComplete="off"
          />
          <RHFTextField<FormValues> name="full_name" label="Nama lengkap" required />
          <RHFTextField<FormValues>
            name="password"
            label={editing ? 'Kata sandi baru' : 'Kata sandi'}
            type="password"
            required={!editing}
            autoComplete="new-password"
            helperText={editing ? 'Kosongkan jika tidak ingin mengubah kata sandi.' : undefined}
          />

          <Controller
            control={control}
            name="role_ids"
            render={({ field }) => (
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={roles}
                getOptionLabel={(role) => role.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={field.value
                  .map((id) => roleById.get(id))
                  .filter((role): role is Role => !!role)}
                onChange={(_, selected) => field.onChange(selected.map((role) => role.id))}
                renderValue={(selected, getItemProps) =>
                  selected.map((role, index) => {
                    const { key, ...itemProps } = getItemProps({ index });
                    return <Chip key={key} label={role.name} size="small" {...itemProps} />;
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Peran"
                    helperText={
                      roles.length === 0 ? 'Tidak ada peran yang dapat diberikan.' : undefined
                    }
                  />
                )}
              />
            )}
          />

          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <FormControlLabel
                label={isSelf ? 'Aktif (Anda tidak dapat menonaktifkan diri sendiri)' : 'Aktif'}
                control={
                  <Switch
                    checked={field.value}
                    disabled={isSelf}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                }
              />
            )}
          />
        </Stack>
      </FormProvider>
    </AppDialog>
  );
};
