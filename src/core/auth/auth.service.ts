import { apiClient } from '@/core/http/api-client';

import type { AuthUser, LoginCredentials, TokenResponse } from './auth.type';

/**
 * The refresh cookie is sent only to `/auth/*`, and these two endpoints additionally require this
 * header. A cross-site form or image request cannot set it, which is the CSRF protection.
 */
const CSRF_HEADERS = { 'X-Requested-With': 'XMLHttpRequest' };

export const authService = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<TokenResponse>('/auth/login', credentials, {
      skipAuth: true,
      withCredentials: true,
    }),

  /** Exchange the HttpOnly refresh cookie for a new access token (rotating the cookie). */
  refresh: () =>
    apiClient.post<TokenResponse>('/auth/refresh', undefined, {
      skipAuth: true,
      withCredentials: true,
      headers: CSRF_HEADERS,
    }),

  logout: () =>
    apiClient.post<void>('/auth/logout', undefined, {
      skipAuth: true,
      withCredentials: true,
      headers: CSRF_HEADERS,
    }),

  me: () => apiClient.get<AuthUser>('/auth/me'),

  updateProfile: (payload: { full_name: string }) => apiClient.patch<AuthUser>('/auth/me', payload),

  changePassword: (payload: { current_password: string; new_password: string }) =>
    apiClient.post<void>('/auth/change-password', payload),
};
