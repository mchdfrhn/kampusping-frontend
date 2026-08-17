import { envConfig } from '@/core/config/env.config';
import { storageKeys } from '@/core/constants/storage.constant';
import { storage } from '@/core/utils/storage.util';

import { ApiError } from './api-error';
import type { ApiClientResponse } from './api-response';

type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  token?: string | null;
};

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

const pendingGetRequests = new Map<string, Promise<ApiClientResponse<unknown>>>();

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${envConfig.apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return undefined as T;
  return (await response.json()) as T;
};

const request = async <T>(method: string, path: string, body?: JsonBody, options?: RequestOptions) => {
  const token = options?.token ?? storage.get(storageKeys.accessToken);
  const headers = new Headers(options?.headers);
  headers.set('Accept', 'application/json');
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(buildUrl(path), {
    ...options,
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await parseResponse<T>(response);

  if (!response.ok) {
    const detail =
      typeof data === 'object' && data !== null && 'detail' in data
        ? String(data.detail)
        : null;
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String(data.message)
        : detail ?? 'API request failed';
    throw new ApiError(message, response.status, data);
  }

  return { data, status: response.status, headers: response.headers } satisfies ApiClientResponse<T>;
};

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => {
    const token = options?.token ?? storage.get(storageKeys.accessToken) ?? '';
    const cacheKey = `${buildUrl(path)}::${token}`;
    const pending = pendingGetRequests.get(cacheKey);
    if (pending) return pending as Promise<ApiClientResponse<T>>;

    const promise = request<T>('GET', path, undefined, options).finally(() => {
      pendingGetRequests.delete(cacheKey);
    });
    pendingGetRequests.set(cacheKey, promise as Promise<ApiClientResponse<unknown>>);
    return promise;
  },
  post: <T>(path: string, body?: JsonBody, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: JsonBody, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: JsonBody, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};
