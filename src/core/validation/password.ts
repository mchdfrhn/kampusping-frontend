import { z } from 'zod';

/** Mirrors the backend password policy (`check_password_strength`). The API is authoritative. */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `At least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `At most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one digit');

/** Optional password: an empty string means "leave unchanged". */
export const optionalPasswordSchema = z.union([z.literal(''), passwordSchema]);
