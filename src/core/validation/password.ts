import { z } from 'zod';

/** Mirrors the backend password policy (`check_password_strength`). The API is authoritative. */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Minimal ${PASSWORD_MIN_LENGTH} karakter`)
  .max(PASSWORD_MAX_LENGTH, `Maksimal ${PASSWORD_MAX_LENGTH} karakter`)
  .regex(/[A-Za-z]/, 'Harus mengandung minimal satu huruf')
  .regex(/\d/, 'Harus mengandung minimal satu angka');

/** Optional password: an empty string means "leave unchanged". */
export const optionalPasswordSchema = z.union([z.literal(''), passwordSchema]);
