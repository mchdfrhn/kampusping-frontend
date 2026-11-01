'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { AppCheckbox } from '@/components/base/AppCheckbox';
import { AppConfirmDialog } from '@/components/base/AppConfirmDialog';
import { AppSwitch } from '@/components/base/AppSwitch';
import { FormProvider } from '@/components/form/FormProvider';
import { RHFTextField } from '@/components/form/RHFTextField';
import { handleFormApiError } from '@/core/http/form-errors';

import {
  AUTO_SEND_CONFIRM_LABEL,
  AUTO_SEND_CONFIRM_MESSAGE,
  AUTO_SEND_CONFIRM_TITLE,
  MAX_ATTEMPTS_MAX,
  MAX_ATTEMPTS_MIN,
  WEEKDAYS,
} from '../constants';
import type { SettingsPayload, SettingsRecord } from '../types';
import {
  SETTINGS_FIELDS,
  type SettingsFormValues,
  settingsSchema,
  toFormValues,
  toPayload,
} from '../validation';

type Props = {
  /** The last saved settings; the form starts from (and resets to) these values. */
  settings: SettingsRecord;
  canUpdate: boolean;
  /** A rejection is shown on the matching fields (422) or in a form-level alert. */
  onSave: (payload: SettingsPayload) => Promise<void>;
};

const numberInputProps = (min: number, max?: number) => ({
  htmlInput: { min, max, step: 1, inputMode: 'numeric' as const },
});

export const SettingsForm = ({ settings, canUpdate, onSave }: Props) => {
  const methods = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(settings),
  });
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = methods;
  const [confirmingAutoSend, setConfirmingAutoSend] = useState(false);

  // A new baseline (first load, or after a save) replaces whatever is in the form.
  useEffect(() => {
    reset(toFormValues(settings));
  }, [settings, reset]);

  const readOnly = !canUpdate;
  const busy = isSubmitting;

  const submit = handleSubmit(async (values) => {
    clearErrors('root.server');
    try {
      await onSave(toPayload(values));
    } catch (error) {
      handleFormApiError(error, setError, SETTINGS_FIELDS);
    }
  });

  return (
    <>
      <FormProvider methods={methods} onSubmit={submit}>
        <Stack spacing={3}>
          {errors.root?.server ? (
            <Alert severity="error">{errors.root.server.message}</Alert>
          ) : null}

          <Card>
            <CardHeader
              title="Identitas"
              subheader="Ditampilkan di pesan penagihan lewat variabel template."
            />
            <CardContent>
              <Stack spacing={2.5}>
                <RHFTextField<SettingsFormValues>
                  name="campus_name"
                  label="Nama kampus"
                  autoComplete="off"
                  disabled={readOnly || busy}
                  fullWidth
                />
                <RHFTextField<SettingsFormValues>
                  name="finance_contact"
                  label="Kontak keuangan"
                  autoComplete="off"
                  disabled={readOnly || busy}
                  helperText="Nomor telepon atau email Bagian Keuangan yang boleh dihubungi mahasiswa."
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Pembayaran"
              subheader="Cara membayar yang dicantumkan di pesan penagihan."
            />
            <CardContent>
              <Stack spacing={2.5}>
                <RHFTextField<SettingsFormValues>
                  name="payment_link_siakad"
                  label="Tautan pembayaran SIAKAD/Civitas"
                  autoComplete="off"
                  disabled={readOnly || busy}
                  helperText="Mengisi variabel {{link_pembayaran}} pada pesan."
                  fullWidth
                />
                <RHFTextField<SettingsFormValues>
                  name="payment_guide_sipema"
                  label="Panduan pembayaran SIPEMA"
                  multiline
                  minRows={3}
                  disabled={readOnly || busy}
                  helperText="Mengisi variabel {{cara_bayar}} pada pesan."
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Jendela kirim"
              subheader="Pesan otomatis hanya dikirim pada hari dan jam ini (waktu setempat kampus)."
            />
            <CardContent>
              <Stack spacing={2.5}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2.5,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  }}
                >
                  <RHFTextField<SettingsFormValues>
                    name="window_start"
                    label="Jam mulai"
                    type="time"
                    disabled={readOnly || busy}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <RHFTextField<SettingsFormValues>
                    name="window_end"
                    label="Jam selesai"
                    type="time"
                    disabled={readOnly || busy}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
                <Controller
                  control={control}
                  name="working_days"
                  render={({ field, fieldState }) => (
                    <FormControl component="fieldset" error={Boolean(fieldState.error)}>
                      <FormLabel component="legend">Hari kerja</FormLabel>
                      <FormGroup row>
                        {WEEKDAYS.map((day) => (
                          <AppCheckbox
                            key={day.value}
                            label={day.label}
                            checked={field.value.includes(day.value)}
                            disabled={readOnly || busy}
                            onChange={(_, checked) =>
                              field.onChange(
                                checked
                                  ? [...field.value, day.value].sort((a, b) => a - b)
                                  : field.value.filter((value) => value !== day.value),
                              )
                            }
                          />
                        ))}
                      </FormGroup>
                      {fieldState.error ? (
                        <FormHelperText>{fieldState.error.message}</FormHelperText>
                      ) : null}
                    </FormControl>
                  )}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Pengaman pengiriman"
              subheader="Batas yang menjaga nomor WhatsApp tetap aman dan pesan tidak berlebihan."
            />
            <CardContent>
              <Stack spacing={2.5}>
                <Controller
                  control={control}
                  name="auto_send_enabled"
                  render={({ field }) => (
                    <Box>
                      <AppSwitch
                        label="Pengiriman otomatis"
                        checked={field.value}
                        disabled={readOnly || busy}
                        onChange={(event) => {
                          const next = event.target.checked;
                          // Turning sending on is the risky direction: it needs an explicit yes.
                          // Going back to the saved "on" state, or turning it off, does not.
                          if (next && !settings.auto_send_enabled) {
                            setConfirmingAutoSend(true);
                            return;
                          }
                          field.onChange(next);
                        }}
                      />
                      <FormHelperText sx={{ ml: 0 }}>
                        Jika mati, tidak ada pesan penagihan yang dikirim otomatis.
                      </FormHelperText>
                    </Box>
                  )}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2.5,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  }}
                >
                  <RHFTextField<SettingsFormValues>
                    name="daily_cap"
                    label="Batas harian (pesan per hari)"
                    type="number"
                    disabled={readOnly || busy}
                    slotProps={numberInputProps(1)}
                  />
                  <RHFTextField<SettingsFormValues>
                    name="max_attempts"
                    label="Maksimum percobaan"
                    type="number"
                    disabled={readOnly || busy}
                    helperText="Berapa kali satu pesan dicoba kirim ulang bila gagal."
                    slotProps={numberInputProps(MAX_ATTEMPTS_MIN, MAX_ATTEMPTS_MAX)}
                  />
                  <RHFTextField<SettingsFormValues>
                    name="throttle_min_s"
                    label="Jeda minimum (detik)"
                    type="number"
                    disabled={readOnly || busy}
                    slotProps={numberInputProps(0)}
                  />
                  <RHFTextField<SettingsFormValues>
                    name="throttle_max_s"
                    label="Jeda maksimum (detik)"
                    type="number"
                    disabled={readOnly || busy}
                    helperText="Jeda antar pesan diacak di antara jeda minimum dan maksimum."
                    slotProps={numberInputProps(0)}
                  />
                  <RHFTextField<SettingsFormValues>
                    name="consecutive_failure_limit"
                    label="Batas kegagalan beruntun"
                    type="number"
                    disabled={readOnly || busy}
                    helperText="Pengiriman otomatis berhenti sementara bila gagal sebanyak ini berturut-turut."
                    slotProps={numberInputProps(1)}
                  />
                  <RHFTextField<SettingsFormValues>
                    name="escalation_offset_days"
                    label="Batas eskalasi (hari setelah jatuh tempo)"
                    type="number"
                    disabled={readOnly || busy}
                    helperText="Setelah ini pesan otomatis berhenti dan staf menangani langsung."
                    slotProps={numberInputProps(1)}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {canUpdate ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                disabled={busy}
                startIcon={
                  busy ? <CircularProgress color="inherit" size={18} /> : <SaveOutlinedIcon />
                }
                type="submit"
                variant="contained"
              >
                Simpan pengaturan
              </Button>
            </Box>
          ) : null}
        </Stack>
      </FormProvider>

      <AppConfirmDialog
        open={confirmingAutoSend}
        title={AUTO_SEND_CONFIRM_TITLE}
        message={AUTO_SEND_CONFIRM_MESSAGE}
        confirmText={AUTO_SEND_CONFIRM_LABEL}
        onClose={() => setConfirmingAutoSend(false)}
        onConfirm={() => {
          methods.setValue('auto_send_enabled', true, { shouldDirty: true });
          setConfirmingAutoSend(false);
        }}
      />
    </>
  );
};
