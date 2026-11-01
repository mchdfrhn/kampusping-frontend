'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { AppDialog } from '@/components/base/AppDialog';
import {
  AppDialogCancelButton,
  AppDialogConfirmButton,
} from '@/components/base/AppDialog/AppDialogActions';
import { AppSwitch } from '@/components/base/AppSwitch';
import { FormProvider } from '@/components/form/FormProvider';
import { RHFTextField } from '@/components/form/RHFTextField';
import { handleFormApiError } from '@/core/http/form-errors';
import type { TemplateRecord } from '@/modules/templates/types';

import {
  OFFSET_DAYS_MAX,
  OFFSET_DAYS_MIN,
  OFFSET_HELPER_TEXT,
  RULE_NAME_MAX_LENGTH,
} from '../constants';
import type { ScheduleRulePayload, ScheduleRuleRecord } from '../types';

/** Typed as text so the field can be empty; it is converted to numbers on submit. */
type FormValues = {
  name: string;
  offset_days: string;
  template_id: string;
  is_active: boolean;
};

const FIELDS = ['name', 'offset_days', 'template_id', 'is_active'] as const;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama wajib diisi')
    .max(RULE_NAME_MAX_LENGTH, `Maksimal ${RULE_NAME_MAX_LENGTH} karakter`),
  offset_days: z
    .string()
    .trim()
    .min(1, 'Offset hari wajib diisi')
    .regex(/^[+-]?\d+$/, 'Offset harus berupa bilangan bulat')
    .refine((value) => {
      const days = Number(value);
      return days >= OFFSET_DAYS_MIN && days <= OFFSET_DAYS_MAX;
    }, `Offset harus antara ${OFFSET_DAYS_MIN} dan ${OFFSET_DAYS_MAX}`),
  template_id: z.string().min(1, 'Template wajib dipilih'),
  is_active: z.boolean(),
});

const emptyForm: FormValues = { name: '', offset_days: '', template_id: '', is_active: true };

type Props = {
  open: boolean;
  /** The rule being edited; `null` creates a new one. */
  rule?: ScheduleRuleRecord | null;
  /** All templates (active or not); inactive ones are only offered if the rule already uses them. */
  templates: TemplateRecord[];
  onClose: () => void;
  /** A rejection is shown inside the dialog, which then stays open. */
  onSubmit: (payload: ScheduleRulePayload) => Promise<void>;
};

export const ScheduleFormDialog = ({ open, rule, templates, onClose, onSubmit }: Props) => {
  const methods = useForm<FormValues>({
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

  useEffect(() => {
    if (!open) return;
    reset(
      rule
        ? {
            name: rule.name,
            offset_days: String(rule.offset_days),
            template_id: String(rule.template.id),
            is_active: rule.is_active,
          }
        : emptyForm,
    );
  }, [open, rule, reset]);

  const currentTemplateId = rule?.template.id;
  const options = useMemo(() => {
    const usable = templates
      .filter((template) => template.is_active || template.id === currentTemplateId)
      .map((template) => ({ id: template.id, name: template.name }));
    if (rule && !usable.some((option) => option.id === rule.template.id)) {
      usable.unshift({ id: rule.template.id, name: rule.template.name }); // list unavailable
    }
    return usable;
  }, [templates, rule, currentTemplateId]);

  const selectedId = useWatch({ control, name: 'template_id' });
  const selectedInactive = templates.some(
    (template) => String(template.id) === selectedId && !template.is_active,
  );

  const submit = handleSubmit(async (values) => {
    clearErrors('root.server');
    try {
      await onSubmit({
        name: values.name,
        offset_days: Number(values.offset_days),
        template_id: Number(values.template_id),
        is_active: values.is_active,
      });
    } catch (error) {
      // 409: another rule already uses this offset. 422: the template no longer exists.
      handleFormApiError(error, setError, FIELDS, { conflictField: 'offset_days' });
    }
  });

  return (
    <AppDialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      title={rule ? 'Ubah aturan jadwal' : 'Tambah aturan jadwal'}
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
            label={rule ? 'Simpan perubahan' : 'Tambah'}
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
          <RHFTextField<FormValues> name="name" label="Nama" required autoComplete="off" />
          <RHFTextField<FormValues>
            name="offset_days"
            label="Offset hari"
            type="number"
            required
            autoComplete="off"
            helperText={OFFSET_HELPER_TEXT}
            slotProps={{
              htmlInput: { min: OFFSET_DAYS_MIN, max: OFFSET_DAYS_MAX, step: 1 },
            }}
          />
          <RHFTextField<FormValues>
            name="template_id"
            label="Template"
            select
            required
            helperText={
              options.length === 0
                ? 'Belum ada template aktif. Buat template terlebih dahulu.'
                : selectedInactive
                  ? 'Template ini nonaktif, jadi pesannya tidak dikirim sampai template diaktifkan.'
                  : undefined
            }
          >
            {options.map((option) => (
              <MenuItem key={option.id} value={String(option.id)}>
                {option.name}
              </MenuItem>
            ))}
          </RHFTextField>
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <AppSwitch
                label="Aktif"
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
              />
            )}
          />
        </Stack>
      </FormProvider>
    </AppDialog>
  );
};
