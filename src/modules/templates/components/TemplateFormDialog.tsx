'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { AppDialog } from '@/components/base/AppDialog';
import {
  AppDialogCancelButton,
  AppDialogConfirmButton,
} from '@/components/base/AppDialog/AppDialogActions';
import { AppSwitch } from '@/components/base/AppSwitch';
import { AppTextField } from '@/components/base/AppTextField';
import { FormProvider } from '@/components/form/FormProvider';
import { RHFTextField } from '@/components/form/RHFTextField';
import { useDebounce } from '@/core/hooks/useDebounce';
import { ApiError } from '@/core/http/api-error';
import { handleFormApiError } from '@/core/http/form-errors';

import {
  OPT_OUT_FOOTER_NOTE,
  PREVIEW_DEBOUNCE_MS,
  TEMPLATE_BODY_MAX_LENGTH,
  TEMPLATE_NAME_MAX_LENGTH,
  TEMPLATE_VARIABLES,
} from '../constants';
import { findMalformedPlaceholders } from '../placeholders';
import { templatesService } from '../services/templates.service';
import type { TemplatePayload, TemplatePreview, TemplateRecord } from '../types';

type FormValues = TemplatePayload;

const FIELDS = ['name', 'body', 'is_active'] as const;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama wajib diisi')
    .max(TEMPLATE_NAME_MAX_LENGTH, `Maksimal ${TEMPLATE_NAME_MAX_LENGTH} karakter`),
  body: z
    .string()
    .trim()
    .min(1, 'Isi pesan wajib diisi')
    .max(TEMPLATE_BODY_MAX_LENGTH, `Maksimal ${TEMPLATE_BODY_MAX_LENGTH} karakter`),
  is_active: z.boolean(),
});

const emptyForm: FormValues = { name: '', body: '', is_active: true };

/** Multiline fields must not inherit the fixed 44px height that dialogs give single-line inputs. */
const bodyFieldSx = {
  '&& .MuiOutlinedInput-root': { alignItems: 'flex-start', height: 'auto', py: 1.25 },
  '&& .MuiInputBase-input': { display: 'block', height: 'auto', py: 0 },
} as const;

type PreviewResult = { key: string; data: TemplatePreview | null };

type Props = {
  open: boolean;
  /** The template being edited; `null` creates a new one. */
  template?: TemplateRecord | null;
  onClose: () => void;
  /** A rejection is shown inside the dialog, which then stays open. */
  onSubmit: (payload: TemplatePayload) => Promise<void>;
};

export const TemplateFormDialog = ({ open, template, onClose, onSubmit }: Props) => {
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
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    if (!open) return;
    reset(
      template
        ? { name: template.name, body: template.body, is_active: template.is_active }
        : emptyForm,
    );
  }, [open, template, reset]);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  /** Where the caret goes once the inserted placeholder has been rendered. */
  const pendingCaret = useRef<number | null>(null);
  const body = useWatch({ control, name: 'body' }) ?? '';

  useEffect(() => {
    const caret = pendingCaret.current;
    const element = bodyRef.current;
    if (caret === null || !element) return;
    pendingCaret.current = null;
    element.focus();
    element.setSelectionRange(caret, caret);
  }, [body]);

  const insertVariable = (name: string) => {
    const element = bodyRef.current;
    const current = getValues('body');
    const placeholder = `{{${name}}}`;
    // The textarea keeps its selection after losing focus to the chip.
    const start = element?.selectionStart ?? current.length;
    const end = element?.selectionEnd ?? current.length;
    pendingCaret.current = start + placeholder.length;
    setValue('body', `${current.slice(0, start)}${placeholder}${current.slice(end)}`, {
      shouldDirty: true,
      shouldValidate: Boolean(errors.body),
    });
  };

  // Live preview. Only a response for the text that is currently settled is ever shown: a slow
  // response for an older text finds `cancelled` set (or a different key) and is dropped.
  const trimmedBody = body.trim();
  const settledBody = useDebounce(trimmedBody, PREVIEW_DEBOUNCE_MS);
  const previewKey =
    open &&
    settledBody === trimmedBody &&
    trimmedBody.length > 0 &&
    trimmedBody.length <= TEMPLATE_BODY_MAX_LENGTH
      ? trimmedBody
      : null;
  const [result, setResult] = useState<PreviewResult | null>(null);

  useEffect(() => {
    if (previewKey === null) return;
    let cancelled = false;
    templatesService
      .preview(previewKey)
      .then((data) => {
        if (!cancelled) setResult({ key: previewKey, data });
      })
      .catch(() => {
        if (!cancelled) setResult({ key: previewKey, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [previewKey]);

  const current = previewKey !== null && result?.key === previewKey ? result : null;
  const preview = current?.data ?? null;
  const unknownVariables = preview?.unknown_variables ?? [];
  const malformed = findMalformedPlaceholders(body);
  const tooLong = trimmedBody.length > TEMPLATE_BODY_MAX_LENGTH;

  const submit = handleSubmit(async (values) => {
    clearErrors('root.server');
    try {
      await onSubmit(values);
    } catch (error) {
      const unmapped =
        error instanceof ApiError &&
        error.status === 422 &&
        !Object.keys(error.fieldErrors).some((field) => FIELDS.some((known) => known === field));
      if (unmapped) {
        // Unknown variables come back as a plain message with no field location.
        setError('body', { message: error.message });
        return;
      }
      handleFormApiError(error, setError, FIELDS, { conflictField: 'name' });
    }
  });

  const renderPreview = () => {
    if (trimmedBody.length === 0) {
      return (
        <Typography color="text.secondary" variant="body2">
          Pratinjau tampil di sini setelah Anda menulis isi pesan.
        </Typography>
      );
    }
    if (tooLong) {
      return (
        <Typography color="text.secondary" variant="body2">
          Pratinjau tidak tersedia karena isi pesan terlalu panjang.
        </Typography>
      );
    }
    if (!current) {
      return (
        <Typography color="text.secondary" variant="body2">
          Memuat pratinjau...
        </Typography>
      );
    }
    if (!preview) {
      return (
        <Typography color="error" variant="body2">
          Pratinjau tidak dapat dimuat. Coba ubah teks sedikit atau muat ulang halaman.
        </Typography>
      );
    }
    return (
      <Box
        component="pre"
        aria-label="Pratinjau pesan"
        sx={{
          bgcolor: 'action.hover',
          borderRadius: 1,
          fontFamily: 'inherit',
          fontSize: 14,
          m: 0,
          maxHeight: 320,
          overflow: 'auto',
          overflowWrap: 'anywhere',
          p: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {preview.rendered}
      </Box>
    );
  };

  return (
    <AppDialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      title={template ? 'Ubah template' : 'Tambah template'}
      maxWidth="md"
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
            disabled={unknownVariables.length > 0}
            label={template ? 'Simpan perubahan' : 'Tambah'}
            loading={isSubmitting}
            onClick={() => void submit()}
            showCheckIcon
          />
        </>
      }
    >
      <FormProvider methods={methods} onSubmit={submit}>
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
          }}
        >
          <Stack spacing={2}>
            {errors.root?.server ? (
              <Alert severity="error">{errors.root.server.message}</Alert>
            ) : null}
            <RHFTextField<FormValues> name="name" label="Nama" required autoComplete="off" />

            <Box>
              <Typography color="text.secondary" sx={{ mb: 0.75 }} variant="caption">
                Klik variabel untuk menyisipkannya di posisi kursor
              </Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                {TEMPLATE_VARIABLES.map((name) => (
                  <Chip
                    key={name}
                    label={`{{${name}}}`}
                    size="small"
                    variant="outlined"
                    onClick={() => insertVariable(name)}
                    // keep the caret in the text field instead of moving focus to the chip
                    onMouseDown={(event) => event.preventDefault()}
                    sx={{ fontFamily: 'monospace' }}
                  />
                ))}
              </Stack>
              <Controller
                control={control}
                name="body"
                render={({ field, fieldState }) => (
                  <AppTextField
                    {...field}
                    inputRef={(element: HTMLTextAreaElement | null) => {
                      field.ref(element);
                      bodyRef.current = element;
                    }}
                    label="Isi pesan"
                    required
                    multiline
                    rows={9}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    sx={bodyFieldSx}
                  />
                )}
              />
              <Typography
                color={tooLong ? 'error' : 'text.secondary'}
                sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}
                variant="caption"
              >
                {`${body.length}/${TEMPLATE_BODY_MAX_LENGTH}`}
              </Typography>
              {malformed.length > 0 ? (
                <Typography color="warning.main" sx={{ display: 'block' }} variant="caption">
                  {`Ada tanda kurung ganda yang tidak lengkap atau tidak dikenal: ${malformed.join(', ')}`}
                </Typography>
              ) : null}
            </Box>

            <Typography color="text.secondary" variant="body2">
              {OPT_OUT_FOOTER_NOTE}
            </Typography>

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

          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
              Pratinjau
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Memakai data contoh. Kalimat berhenti berlangganan sudah termasuk.
            </Typography>
            {unknownVariables.length > 0 ? (
              <Alert severity="warning">
                {`Variabel tidak dikenal: ${unknownVariables.map((name) => `{{${name}}}`).join(', ')}. Ganti dengan variabel yang tersedia.`}
              </Alert>
            ) : null}
            {renderPreview()}
          </Stack>
        </Box>
      </FormProvider>
    </AppDialog>
  );
};
