import { envConfig } from '@/core/config/env.config';

import { ApiError, type ApiErrorBody } from './api-error';

/**
 * The HTTP client knows nothing about the auth store; the store plugs itself in through this
 * bridge. That keeps the dependency one-way (auth -> http) and the client easy to test.
 */
export type AuthBridge = {
  getAccessToken: () => string | null;
  /** Obtain a new access token. Resolves true when the session was renewed. */
  refresh: () => Promise<boolean>;
  /** Called when a request failed with 401 and the session could not be renewed. */
  onAuthFailure: () => void;
};

let bridge: AuthBridge | null = null;

export const registerAuthBridge = (next: AuthBridge | null) => {
  bridge = next;
};

export type RequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
  /** Send and accept cookies (needed for the cookie-based /auth endpoints). */
  withCredentials?: boolean;
  /** Do not attach the access token or try to refresh on 401. */
  skipAuth?: boolean;
};

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

export const buildUrl = (path: string) =>
  /^https?:\/\//i.test(path) ? path : `${envConfig.apiBaseUrl}/${path.replace(/^\//, '')}`;

export const toQueryString = (query: object): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
};

const buildError = async (response: Response): Promise<ApiError> => {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // Non-JSON error (gateway page, network proxy...): fall through to the generic message.
  }
  const error = body?.error;
  return new ApiError(
    error?.message ?? `Permintaan gagal (${response.status})`,
    response.status,
    error?.code,
    error?.details,
  );
};

const send = (
  method: string,
  path: string,
  body: JsonBody | undefined,
  options: RequestOptions,
  token: string | null,
) => {
  const headers = new Headers(options.headers);
  headers.set('Accept', headers.get('Accept') ?? 'application/json');
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(buildUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options.signal,
    credentials: options.withCredentials ? 'include' : 'omit',
  });
};

const execute = async (
  method: string,
  path: string,
  body: JsonBody | undefined,
  options: RequestOptions,
): Promise<Response> => {
  const token = options.skipAuth ? null : (bridge?.getAccessToken() ?? null);
  let response = await send(method, path, body, options, token);

  if (response.status === 401 && token && bridge && !options.skipAuth) {
    const renewed = await bridge.refresh();
    if (renewed) {
      response = await send(method, path, body, options, bridge.getAccessToken());
    }
    if (response.status === 401) {
      bridge.onAuthFailure();
    }
  }

  if (!response.ok) throw await buildError(response);
  return response;
};

const requestJson = async <T>(
  method: string,
  path: string,
  body?: JsonBody,
  options: RequestOptions = {},
): Promise<T> => {
  const response = await execute(method, path, body, options);
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json')
    ? ((await response.json()) as T)
    : (undefined as T);
};

const parseFilename = (header: string | null): string | null => {
  if (!header) return null;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded?.[1]) return decodeURIComponent(encoded[1]);
  return /filename="?([^";]+)"?/i.exec(header)?.[1] ?? null;
};

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    requestJson<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: JsonBody, options?: RequestOptions) =>
    requestJson<T>('POST', path, body, options),
  put: <T>(path: string, body?: JsonBody, options?: RequestOptions) =>
    requestJson<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: JsonBody, options?: RequestOptions) =>
    requestJson<T>('PATCH', path, body, options),
  delete: <T = void>(path: string, options?: RequestOptions) =>
    requestJson<T>('DELETE', path, undefined, options),

  /** Authenticated file download. Resolves with the blob and the server-provided file name. */
  download: async (
    path: string,
    options?: RequestOptions,
  ): Promise<{ blob: Blob; filename: string | null }> => {
    const response = await execute('GET', path, undefined, {
      ...options,
      headers: { Accept: '*/*', ...(options?.headers as Record<string, string> | undefined) },
    });
    return {
      blob: await response.blob(),
      filename: parseFilename(response.headers.get('content-disposition')),
    };
  },
};
