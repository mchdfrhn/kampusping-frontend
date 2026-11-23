'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
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
  PREVIEW_DEBOUNCE_MS,
  TEMPLATE_BODY_MAX_LENGTH,
  TEMPLATE_NAME_MAX_LENGTH,
  TEMPLATE_VARIABLE_HINTS,
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? 'grey.900' : '#E5DDD5',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            bgcolor: isDark ? '#1F2C34' : '#075E54',
            color: '#FFFFFF',
            px: 1.75,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <WhatsAppIcon sx={{ fontSize: 22 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: '#FFFFFF', display: 'block' }}
            >
              Simulasi Penerima WhatsApp
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)', fontSize: 11 }}>
              Data contoh mahasiswa
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 1.75, maxHeight: 320, overflowY: 'auto' }}>
          <Box
            sx={{
              maxWidth: '94%',
              p: 1.5,
              borderRadius: '0px 10px 10px 10px',
              bgcolor: isDark ? '#005C4B' : '#FFFFFF',
              color: isDark ? '#E9EDEF' : '#111B21',
              boxShadow: '0 1px 2px rgba(0,0,0,0.14)',
            }}
          >
            <Box
              component="pre"
              aria-label="Pratinjau pesan"
              sx={{
                fontFamily: 'inherit',
                fontSize: 13.5,
                lineHeight: 1.55,
                m: 0,
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
              }}
            >
              {preview.rendered}
            </Box>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, opacity: 0.72 }}
            >
              <Typography variant="caption" sx={{ fontSize: 10.5 }}>
                09.00
              </Typography>
              <DoneAllOutlinedIcon sx={{ fontSize: 14, color: isDark ? '#53BDEB' : '#34B7F1' }} />
            </Stack>
          </Box>
        </Box>
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
                    title={TEMPLATE_VARIABLE_HINTS[name]}
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
              Memakai data contoh.
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
