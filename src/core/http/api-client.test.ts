import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient, registerAuthBridge, toQueryString } from './api-client';
import { ApiError } from './api-error';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fetchMock = vi.fn<typeof fetch>();

const authHeader = (callIndex: number) =>
  new Headers(fetchMock.mock.calls[callIndex]?.[1]?.headers).get('Authorization');

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  registerAuthBridge(null);
  vi.unstubAllGlobals();
});

describe('toQueryString', () => {
  it('skips empty values and encodes the rest', () => {
    expect(
      toQueryString({ page: 2, search: 'a b', status: undefined, empty: '', none: null }),
    ).toBe('?page=2&search=a+b');
    expect(toQueryString({})).toBe('');
  });
});

describe('apiClient', () => {
  it('sends the bearer token and parses JSON', async () => {
    registerAuthBridge({
      getAccessToken: () => 'token-1',
      refresh: vi.fn(),
      onAuthFailure: vi.fn(),
    });
    fetchMock.mockResolvedValueOnce(json({ ok: true }));

    await expect(apiClient.get('/things')).resolves.toEqual({ ok: true });
    expect(authHeader(0)).toBe('Bearer token-1');
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://localhost:8000/api/v1/things');
  });

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiClient.delete('/things/1')).resolves.toBeUndefined();
  });

  it('turns the backend error envelope into an ApiError', async () => {
    fetchMock.mockResolvedValueOnce(
      json(
        {
          error: {
            code: 'validation_error',
            message: 'Request validation failed.',
            details: [{ loc: ['body', 'email'], message: 'Invalid email', type: 'x' }],
          },
        },
        422,
      ),
    );

    const error = await apiClient.post('/things', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(422);
    expect(apiError.code).toBe('validation_error');
    expect(apiError.fieldErrors).toEqual({ email: 'Invalid email' });
  });

  it('falls back to a generic message for non-JSON errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>Bad gateway</html>', { status: 502 }));

    await expect(apiClient.get('/things')).rejects.toMatchObject({
      status: 502,
      message: 'Permintaan gagal (502)',
    });
  });

  describe('on 401', () => {
    it('refreshes once and retries with the new token', async () => {
      let token = 'old';
      const refresh = vi.fn(async () => {
        token = 'new';
        return true;
      });
      registerAuthBridge({ getAccessToken: () => token, refresh, onAuthFailure: vi.fn() });
      fetchMock
        .mockResolvedValueOnce(json({ error: { code: 'unauthorized', message: 'expired' } }, 401))
        .mockResolvedValueOnce(json({ data: 1 }));

      await expect(apiClient.get('/things')).resolves.toEqual({ data: 1 });

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(authHeader(0)).toBe('Bearer old');
      expect(authHeader(1)).toBe('Bearer new');
    });

    it('signs the user out when the session cannot be renewed', async () => {
      const onAuthFailure = vi.fn();
      registerAuthBridge({
        getAccessToken: () => 'old',
        refresh: async () => false,
        onAuthFailure,
      });
      fetchMock.mockResolvedValueOnce(
        json({ error: { code: 'unauthorized', message: 'expired' } }, 401),
      );

      await expect(apiClient.get('/things')).rejects.toMatchObject({ status: 401 });

      expect(onAuthFailure).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not loop when the retry is rejected as well', async () => {
      const refresh = vi.fn(async () => true);
      const onAuthFailure = vi.fn();
      registerAuthBridge({ getAccessToken: () => 't', refresh, onAuthFailure });
      fetchMock.mockResolvedValue(json({ error: { code: 'unauthorized', message: 'no' } }, 401));

      await expect(apiClient.get('/things')).rejects.toMatchObject({ status: 401 });

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(onAuthFailure).toHaveBeenCalledTimes(1);
    });

    it('does not try to refresh when no token was sent or auth is skipped', async () => {
      const refresh = vi.fn(async () => true);
      registerAuthBridge({ getAccessToken: () => null, refresh, onAuthFailure: vi.fn() });
      fetchMock.mockResolvedValue(json({ error: { code: 'unauthorized', message: 'no' } }, 401));

      await expect(apiClient.get('/things')).rejects.toMatchObject({ status: 401 });
      await expect(apiClient.post('/auth/login', {}, { skipAuth: true })).rejects.toMatchObject({
        status: 401,
      });

      expect(refresh).not.toHaveBeenCalled();
    });
  });

  it('only sends cookies when asked to', async () => {
    fetchMock.mockImplementation(async () => json({})); // a fresh Response per call

    await apiClient.get('/plain');
    await apiClient.post('/auth/refresh', undefined, { withCredentials: true });

    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('omit');
    expect(fetchMock.mock.calls[1]?.[1]?.credentials).toBe('include');
  });

  it('downloads files with the server file name', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('a,b', {
        status: 200,
        headers: { 'content-disposition': 'attachment; filename="users.csv"' },
      }),
    );

    const { blob, filename } = await apiClient.download('/users/export');

    expect(filename).toBe('users.csv');
    expect(blob.size).toBe(3); // 'a,b'
  });
});
