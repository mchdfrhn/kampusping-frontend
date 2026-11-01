'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { AppDialog } from '@/components/base/AppDialog';
import {
  AppDialogCancelButton,
  AppDialogConfirmButton,
} from '@/components/base/AppDialog/AppDialogActions';
import { FormProvider } from '@/components/form/FormProvider';
import { RHFTextField } from '@/components/form/RHFTextField';
import { ApiError } from '@/core/http/api-error';
import { handleFormApiError } from '@/core/http/form-errors';

import type { StudentRecord } from '../types';
import { phoneSchema, type PhoneFormValues } from '../validation';

const FIELDS = ['phone'] as const;

type Props = {
  open: boolean;
  student: StudentRecord | null;
  onClose: () => void;
  /** Receives the typed number (empty clears it); a rejection is shown inside the dialog. */
  onSubmit: (phone: string) => Promise<void>;
};

export const PhoneDialog = ({ open, student, onClose, onSubmit }: Props) => {
  const methods = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });
  const {
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) reset({ phone: student?.phone ?? '' });
  }, [open, student, reset]);

  const submit = handleSubmit(async (values) => {
    clearErrors('root.server');
    try {
      await onSubmit(values.phone);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && !('phone' in error.fieldErrors)) {
        // The API reports an unusable number as a plain message with no field location.
        setError('phone', { message: error.message });
        return;
      }
      handleFormApiError(error, setError, FIELDS);
    }
  });

  return (
    <AppDialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      title={student ? `Ubah nomor WhatsApp: ${student.name}` : 'Ubah nomor WhatsApp'}
      maxWidth="xs"
      fullWidth
      actions={
        <>
          <AppDialogCancelButton
            disabled={isSubmitting}
            label="Batal"
            onClick={onClose}
            variant="outlined"
          />
          <AppDialogConfirmButton
            label="Simpan"
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
          <RHFTextField<PhoneFormValues>
            name="phone"
            label="No. WhatsApp"
            autoComplete="off"
            autoFocus
            helperText="Format apa pun, misalnya 0812-3456-7890. Kosongkan untuk menghapus nomor."
          />
        </Stack>
      </FormProvider>
    </AppDialog>
  );
};
