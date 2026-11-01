import { z } from 'zod';

import { PHONE_INPUT_MAX_LENGTH } from './constants';

/** Empty is allowed: it clears the number. The server validates the actual format. */
export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(PHONE_INPUT_MAX_LENGTH, `Maksimal ${PHONE_INPUT_MAX_LENGTH} karakter`),
});

export type PhoneFormValues = z.infer<typeof phoneSchema>;
