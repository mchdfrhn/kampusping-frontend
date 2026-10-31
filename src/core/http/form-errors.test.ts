import { describe, expect, it, vi } from 'vitest';

import { ApiError } from './api-error';
import { handleFormApiError } from './form-errors';

const FIELDS = ['email', 'name'] as const;

describe('handleFormApiError', () => {
  it('maps validation messages onto their fields', () => {
    const setError = vi.fn();
    const error = new ApiError('Request validation failed.', 422, 'validation_error', [
      { loc: ['body', 'email'], message: 'Enter a valid email', type: 'value_error' },
    ]);

    handleFormApiError(error, setError, FIELDS);

    expect(setError).toHaveBeenCalledOnce();
    expect(setError).toHaveBeenCalledWith('email', { message: 'Enter a valid email' });
  });

  it('puts a conflict on the configured field', () => {
    const setError = vi.fn();

    handleFormApiError(new ApiError('Email already exists.', 409, 'conflict'), setError, FIELDS, {
      conflictField: 'email',
    });

    expect(setError).toHaveBeenCalledWith('email', { message: 'Email already exists.' });
  });

  it('shows everything else as a form-level error', () => {
    const setError = vi.fn();

    handleFormApiError(new ApiError('Boom', 500, 'internal_server_error'), setError, FIELDS);
    handleFormApiError(new Error('offline'), setError, FIELDS);

    expect(setError).toHaveBeenNthCalledWith(1, 'root.server', { message: 'Boom' });
    expect(setError).toHaveBeenNthCalledWith(2, 'root.server', { message: 'offline' });
  });

  it('uses an Indonesian fallback when the error carries no message', () => {
    const setError = vi.fn();

    handleFormApiError('boom', setError, FIELDS);

    expect(setError).toHaveBeenCalledWith('root.server', {
      message: 'Terjadi kesalahan. Silakan coba lagi.',
    });
  });

  it('ignores validation errors for unknown fields', () => {
    const setError = vi.fn();
    const error = new ApiError('Invalid', 422, 'validation_error', [
      { loc: ['body', 'unknown'], message: 'nope' },
    ]);

    handleFormApiError(error, setError, FIELDS);

    expect(setError).toHaveBeenCalledWith('root.server', { message: 'Invalid' });
  });
});
