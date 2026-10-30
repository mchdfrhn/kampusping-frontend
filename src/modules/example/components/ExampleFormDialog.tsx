'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AppDialog } from '@/components/base/AppDialog';
import {
  AppDialogCancelButton,
  AppDialogConfirmButton,
} from '@/components/base/AppDialog/AppDialogActions';
import { FormProvider } from '@/components/form/FormProvider';
import { RHFTextField } from '@/components/form/RHFTextField';
import { handleFormApiError } from '@/core/http/form-errors';

import { EXAMPLE_STATUSES, type ExampleItem, type ExampleUpsertPayload } from '../types';

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(50, 'At most 50 characters')
    .regex(/^[A-Za-z0-9._-]+$/, 'Use letters, digits, dot, dash or underscore'),
  name: z.string().trim().min(1, 'Name is required').max(150, 'At most 150 characters'),
  status: z.enum(['draft', 'active', 'inactive']),
});

const FIELDS = ['code', 'name', 'status'] as const;
const emptyForm: ExampleUpsertPayload = { code: '', name: '', status: 'draft' };

type Props = {
  open: boolean;
  item?: ExampleItem | null;
  onClose: () => void;
  /** Persist the item. Reject to keep the dialog open and show the error. */
  onSubmit: (payload: ExampleUpsertPayload) => Promise<void>;
};

export const ExampleFormDialog = ({ open, item, onClose, onSubmit }: Props) => {
  const methods = useForm<ExampleUpsertPayload>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm,
  });
  const {
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset(item ? { code: item.code, name: item.name, status: item.status } : emptyForm);
    }
  }, [open, item, reset]);

  const submit = handleSubmit(async (values) => {
    clearErrors('root.server');
    try {
      await onSubmit(values);
    } catch (error) {
      handleFormApiError(error, setError, FIELDS, { conflictField: 'code' });
    }
  });

  return (
    <AppDialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      title={item ? 'Edit item' : 'Create item'}
      actions={
        <>
          <AppDialogCancelButton
            disabled={isSubmitting}
            label="Cancel"
            onClick={onClose}
            variant="outlined"
          />
          <AppDialogConfirmButton
            label={item ? 'Save changes' : 'Create'}
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
          <RHFTextField<ExampleUpsertPayload> name="code" label="Code" required autoFocus />
          <RHFTextField<ExampleUpsertPayload> name="name" label="Name" required />
          <RHFTextField<ExampleUpsertPayload> name="status" label="Status" select>
            {EXAMPLE_STATUSES.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </RHFTextField>
        </Stack>
      </FormProvider>
    </AppDialog>
  );
};
