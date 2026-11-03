'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { FormProvider } from '@/components/form/FormProvider';
import { handleFormApiError } from '@/core/http/form-errors';

import { IMPORT_ACCEPT, IMPORT_SOURCE_LABELS } from '../constants';
import { importService } from '../services/import.service';
import type { ImportBatch, ImportSource } from '../types';
import { importUploadSchema, type ImportUploadValues } from '../validation';

const FIELDS = ['source', 'semester', 'file'] as const;

const SOURCE_OPTIONS = (Object.keys(IMPORT_SOURCE_LABELS) as ImportSource[]).map((value) => ({
  value,
  label: IMPORT_SOURCE_LABELS[value],
}));

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
} as const;

type Props = {
  /** Called with the stored preview once the server accepted the file. */
  onPreviewed: (batch: ImportBatch) => void;
  inDialog?: boolean;
  onCancel?: () => void;
};

export const ImportUploadForm = ({ onPreviewed, inDialog = false, onCancel }: Props) => {
  const methods = useForm<ImportUploadValues>({
    resolver: zodResolver(importUploadSchema),
    defaultValues: { source: 'siakad', semester: '', file: null },
  });
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = methods;
  // Remounting the native input is the way to clear its selected file.
  const [inputKey, setInputKey] = useState(0);

  const submit = handleSubmit(async (values) => {
    clearErrors('root.server');
    if (!values.file) return;
    try {
      const batch = await importService.preview(values.file, values.source, values.semester);
      setValue('file', null);
      setInputKey((key) => key + 1);
      onPreviewed(batch);
    } catch (error) {
      handleFormApiError(error, setError, FIELDS);
    }
  });

  const formBody = (
    <FormProvider methods={methods} onSubmit={submit}>
      <Stack spacing={2.5} sx={{ maxWidth: inDialog ? '100%' : 560 }}>
        {errors.root?.server ? <Alert severity="error">{errors.root.server.message}</Alert> : null}

        <Controller
          control={control}
          name="source"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              select
              label="Sumber data"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            >
              {SOURCE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          control={control}
          name="semester"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Semester (opsional)"
              autoComplete="off"
              error={Boolean(fieldState.error)}
              helperText={
                fieldState.error?.message ?? 'Isi bila berkas tidak memiliki kolom semester'
              }
            />
          )}
        />

        <Controller
          control={control}
          name="file"
          render={({ field, fieldState }) => (
            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  color="inherit"
                  variant="outlined"
                  startIcon={<UploadFileOutlinedIcon />}
                  sx={{ borderColor: 'divider' }}
                >
                  Pilih berkas
                  <input
                    key={inputKey}
                    type="file"
                    accept={IMPORT_ACCEPT}
                    aria-label="Berkas impor"
                    style={visuallyHidden}
                    onChange={(event) => field.onChange(event.target.files?.[0] ?? null)}
                  />
                </Button>
                <Typography color="text.secondary" variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {field.value?.name ?? 'Belum ada berkas dipilih (.csv atau .xlsx, maks. 5 MB)'}
                </Typography>
              </Stack>
              {fieldState.error ? (
                <FormHelperText error>{fieldState.error.message}</FormHelperText>
              ) : null}
            </Box>
          )}
        />

        {inDialog ? (
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end', pt: 1 }}>
            {onCancel ? (
              <Button color="inherit" onClick={onCancel} disabled={isSubmitting}>
                Batal
              </Button>
            ) : null}
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress color="inherit" size={16} /> : undefined}
            >
              Unggah dan pratinjau
            </Button>
          </Stack>
        ) : (
          <Box>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress color="inherit" size={16} /> : undefined}
            >
              Unggah dan pratinjau
            </Button>
          </Box>
        )}
      </Stack>
    </FormProvider>
  );

  if (inDialog) {
    return (
      <Box component="section" aria-label="Unggah berkas impor">
        {formBody}
      </Box>
    );
  }

  return (
    <Card component="section" aria-label="Unggah berkas impor" sx={{ p: 2.5 }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Unggah berkas
      </Typography>
      {formBody}
    </Card>
  );
};
