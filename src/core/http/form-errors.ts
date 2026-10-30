import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError, getErrorMessage } from './api-error';

/** Message shown in a form-level alert (`errors.root.server`). */
export const SERVER_ERROR_KEY = 'root.server' as const;

type Options = {
  /** Field that a 409 Conflict refers to (e.g. a duplicate code or email). */
  conflictField?: string;
};

/**
 * Put an API error where the user can see it: validation messages (422) on the matching inputs,
 * a conflict (409) on `conflictField`, anything else in a form-level alert.
 */
export const handleFormApiError = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly string[],
  { conflictField }: Options = {},
): void => {
  if (error instanceof ApiError) {
    let mapped = false;
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      if (fields.includes(field)) {
        setError(field as Path<T>, { message });
        mapped = true;
      }
    }
    if (mapped) return;
    if (error.status === 409 && conflictField && fields.includes(conflictField)) {
      setError(conflictField as Path<T>, { message: error.message });
      return;
    }
  }
  setError(SERVER_ERROR_KEY as Path<T>, {
    message: getErrorMessage(error, 'Something went wrong. Please try again.'),
  });
};
