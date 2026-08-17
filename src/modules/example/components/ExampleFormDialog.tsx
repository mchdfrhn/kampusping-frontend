'use client';

import { AppDialog, AppDialogTextField } from '@/components/base/AppDialog';
import {
  AppDialogCancelButton,
  AppDialogConfirmButton,
} from '@/components/base/AppDialog/AppDialogActions';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';

import type { ExampleItem, ExampleItemStatus, ExampleUpsertPayload } from '../types';

type Props = {
  open: boolean;
  item?: ExampleItem | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (payload: ExampleUpsertPayload) => Promise<void> | void;
};

const emptyForm: ExampleUpsertPayload = {
  code: '',
  name: '',
  status: 'active',
};

export const ExampleFormDialog = ({ open, item, saving = false, onClose, onSubmit }: Props) => {
  const [form, setForm] = useState<ExampleUpsertPayload>(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      item
        ? { code: item.code, name: item.name, status: item.status }
        : emptyForm,
    );
  }, [open, item]);

  const canSave = form.code.trim().length > 0 && form.name.trim().length > 0 && !saving;

  return (
    <AppDialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      title={item ? 'Edit Example Item' : 'Create Example Item'}
      actions={
        <>
          <AppDialogCancelButton disabled={saving} label="Cancel" onClick={onClose} variant="outlined" />
          <AppDialogConfirmButton
            disabled={!canSave}
            label={item ? 'Save' : 'Create'}
            loading={saving}
            onClick={() => void onSubmit(form)}
            showCheckIcon
          />
        </>
      }
    >
      <Stack spacing={2.5}>
        <AppDialogTextField
          label="Code"
          required
          value={form.code}
          onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
        />
        <AppDialogTextField
          label="Name"
          required
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <AppDialogTextField
          select
          label="Status"
          value={form.status}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, status: event.target.value as ExampleItemStatus }))
          }
        >
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </AppDialogTextField>
      </Stack>
    </AppDialog>
  );
};
