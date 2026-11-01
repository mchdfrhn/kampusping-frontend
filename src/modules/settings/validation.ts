import { z } from 'zod';

import {
  CAMPUS_NAME_MAX_LENGTH,
  FINANCE_CONTACT_MAX_LENGTH,
  INTEGER_MAX,
  MAX_ATTEMPTS_MAX,
  MAX_ATTEMPTS_MIN,
  PAYMENT_GUIDE_MAX_LENGTH,
  PAYMENT_LINK_MAX_LENGTH,
} from './constants';
import type { SettingsPayload, SettingsRecord } from './types';

/** Numbers are kept as text in the form so a field can be empty; they are converted on submit. */
export type SettingsFormValues = {
  campus_name: string;
  finance_contact: string;
  payment_link_siakad: string;
  payment_guide_sipema: string;
  window_start: string;
  window_end: string;
  working_days: number[];
  auto_send_enabled: boolean;
  daily_cap: string;
  throttle_min_s: string;
  throttle_max_s: string;
  max_attempts: string;
  consecutive_failure_limit: string;
  escalation_offset_days: string;
};

export const SETTINGS_FIELDS = [
  'campus_name',
  'finance_contact',
  'payment_link_siakad',
  'payment_guide_sipema',
  'window_start',
  'window_end',
  'working_days',
  'auto_send_enabled',
  'daily_cap',
  'throttle_min_s',
  'throttle_max_s',
  'max_attempts',
  'consecutive_failure_limit',
  'escalation_offset_days',
] as const;

const text = (label: string, max: number) =>
  z.string().trim().max(max, `${label} maksimal ${max} karakter.`);

const time = (label: string) =>
  z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, `${label} wajib diisi dengan format jam yang valid.`);

const integer = (
  label: string,
  min: number,
  minMessage: string,
  max = INTEGER_MAX,
  maxMessage = `${label} terlalu besar.`,
) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .regex(/^\d+$/, `${label} harus berupa bilangan bulat.`)
    .refine((value) => Number(value) >= min, minMessage)
    .refine((value) => Number(value) <= max, maxMessage);

/** `HH:MM` or `HH:MM:SS` to minutes since midnight (seconds are ignored). */
const toMinutes = (value: string): number => {
  const [hours, minutes] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
};

export const settingsSchema = z
  .object({
    campus_name: text('Nama kampus', CAMPUS_NAME_MAX_LENGTH),
    finance_contact: text('Kontak keuangan', FINANCE_CONTACT_MAX_LENGTH),
    payment_link_siakad: text('Tautan pembayaran', PAYMENT_LINK_MAX_LENGTH),
    payment_guide_sipema: text('Panduan pembayaran', PAYMENT_GUIDE_MAX_LENGTH),
    window_start: time('Jam mulai'),
    window_end: time('Jam selesai'),
    working_days: z.array(z.number().int().min(1).max(7)).min(1, 'Pilih minimal satu hari kerja.'),
    auto_send_enabled: z.boolean(),
    daily_cap: integer('Batas harian', 1, 'Batas harian minimal 1.'),
    throttle_min_s: integer('Jeda minimum', 0, 'Jeda minimum tidak boleh negatif.'),
    throttle_max_s: integer('Jeda maksimum', 0, 'Jeda maksimum tidak boleh negatif.'),
    max_attempts: integer(
      'Maksimum percobaan',
      MAX_ATTEMPTS_MIN,
      `Maksimum percobaan harus antara ${MAX_ATTEMPTS_MIN} dan ${MAX_ATTEMPTS_MAX}.`,
      MAX_ATTEMPTS_MAX,
      `Maksimum percobaan harus antara ${MAX_ATTEMPTS_MIN} dan ${MAX_ATTEMPTS_MAX}.`,
    ),
    consecutive_failure_limit: integer(
      'Batas kegagalan beruntun',
      1,
      'Batas kegagalan beruntun minimal 1.',
    ),
    escalation_offset_days: integer('Batas eskalasi', 1, 'Batas eskalasi minimal 1 hari.'),
  })
  .superRefine((values, ctx) => {
    // The backend checks the same two relations and reports them on the later field.
    if (toMinutes(values.window_start) >= toMinutes(values.window_end)) {
      ctx.addIssue({
        code: 'custom',
        path: ['window_end'],
        message: 'Jam mulai harus lebih awal dari jam selesai.',
      });
    }
    if (Number(values.throttle_min_s) > Number(values.throttle_max_s)) {
      ctx.addIssue({
        code: 'custom',
        path: ['throttle_max_s'],
        message: 'Jeda minimum tidak boleh lebih besar dari jeda maksimum.',
      });
    }
  });

/** The time input works with `HH:MM`; the API returns `HH:MM:SS`. */
export const toTimeInput = (value: string): string => value.slice(0, 5);

/** The API accepts `HH:MM:SS`; the time input yields `HH:MM`. */
export const toApiTime = (value: string): string => (value.length === 5 ? `${value}:00` : value);

export const toFormValues = (settings: SettingsRecord): SettingsFormValues => ({
  campus_name: settings.campus_name,
  finance_contact: settings.finance_contact,
  payment_link_siakad: settings.payment_link_siakad,
  payment_guide_sipema: settings.payment_guide_sipema,
  window_start: toTimeInput(settings.window_start),
  window_end: toTimeInput(settings.window_end),
  working_days: [...settings.working_days].sort((a, b) => a - b),
  auto_send_enabled: settings.auto_send_enabled,
  daily_cap: String(settings.daily_cap),
  throttle_min_s: String(settings.throttle_min_s),
  throttle_max_s: String(settings.throttle_max_s),
  max_attempts: String(settings.max_attempts),
  consecutive_failure_limit: String(settings.consecutive_failure_limit),
  escalation_offset_days: String(settings.escalation_offset_days),
});

export const toPayload = (values: SettingsFormValues): SettingsPayload => ({
  campus_name: values.campus_name.trim(),
  finance_contact: values.finance_contact.trim(),
  payment_link_siakad: values.payment_link_siakad.trim(),
  payment_guide_sipema: values.payment_guide_sipema.trim(),
  window_start: toApiTime(values.window_start),
  window_end: toApiTime(values.window_end),
  working_days: [...values.working_days].sort((a, b) => a - b),
  auto_send_enabled: values.auto_send_enabled,
  daily_cap: Number(values.daily_cap),
  throttle_min_s: Number(values.throttle_min_s),
  throttle_max_s: Number(values.throttle_max_s),
  max_attempts: Number(values.max_attempts),
  consecutive_failure_limit: Number(values.consecutive_failure_limit),
  escalation_offset_days: Number(values.escalation_offset_days),
});
